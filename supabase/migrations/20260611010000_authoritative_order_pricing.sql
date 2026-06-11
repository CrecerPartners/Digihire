-- Payment-tampering fix (server-side authoritative pricing).
--
-- order_items.price and order_items.commission_rate are written by the client
-- at checkout (the order_items INSERT policy is WITH CHECK (true) for guest
-- checkout). The commission trigger previously computed seller payouts from
-- those client-supplied values, so a malicious seller could inflate price /
-- commission_rate and mint arbitrary commission transactions.
--
-- This migration rewrites process_order_commissions() to derive price,
-- commission rate, and commission model from the products table — the source
-- of truth set by admins — instead of trusting order_items. All anti-fraud
-- logic (self-referral, shared IP/device) is preserved unchanged.

CREATE OR REPLACE FUNCTION public.process_order_commissions()
RETURNS TRIGGER AS $$
DECLARE
  _item RECORD;
  _seller_id UUID;
  _commission_amount NUMERIC;
  _is_fraud BOOLEAN := false;
  _fraud_reason TEXT := '';
  _lock_days INTEGER := 7;
  _seller_email TEXT;
  _seller_phone TEXT;
  _prod_price NUMERIC;
  _prod_rate NUMERIC;
  _prod_model TEXT;
BEGIN
  -- Only process if status changed to 'paid' or 'confirmed'
  IF (NEW.status IN ('paid', 'confirmed')) AND (OLD.status NOT IN ('paid', 'confirmed')) THEN

    FOR _item IN (SELECT * FROM public.order_items WHERE order_id = NEW.id) LOOP
      -- Find seller by ref_code
      SELECT user_id, email, whatsapp INTO _seller_id, _seller_email, _seller_phone
      FROM public.profiles WHERE referral_code = _item.ref_code;

      IF _seller_id IS NOT NULL THEN
        -- 1. Self-Referral Block Logic
        _is_fraud := false;
        _fraud_reason := '';

        IF _seller_id = NEW.user_id THEN
          _is_fraud := true;
          _fraud_reason := 'Self-purchase by same user ID';
        ELSIF NEW.email = _seller_email THEN
          _is_fraud := true;
          _fraud_reason := 'Buyer and Seller email match';
        ELSIF NEW.phone = _seller_phone THEN
          _is_fraud := true;
          _fraud_reason := 'Buyer and Seller phone match';
        END IF;

        -- 2. Device / IP Abuse Check
        IF NOT _is_fraud THEN
          IF EXISTS (
              SELECT 1 FROM public.orders
              WHERE (ip_address = NEW.ip_address OR device_id = NEW.device_id)
              AND email != NEW.email
              AND created_at > now() - interval '30 days'
          ) THEN
             _is_fraud := true;
             _fraud_reason := 'Shared IP/Device with another account';
          END IF;
        END IF;

        -- 3. Commission from AUTHORITATIVE product data (never from order_items)
        SELECT price, commission_rate, commission_model
          INTO _prod_price, _prod_rate, _prod_model
          FROM public.products WHERE id = _item.product_id;

        IF _prod_model = 'percentage' THEN
          _commission_amount := (COALESCE(_prod_price, 0) * _item.quantity * COALESCE(_prod_rate, 0) / 100);
        ELSE
          -- fixed / per_signup / per_install: flat amount per unit
          _commission_amount := (COALESCE(_prod_rate, 0) * _item.quantity);
        END IF;

        IF _commission_amount > 0 THEN
          -- Insert transaction with holding period
          INSERT INTO public.transactions (
            user_id,
            type,
            description,
            amount,
            status,
            related_order_id,
            date,
            withdrawable_at,
            reference_info
          ) VALUES (
            _seller_id,
            'commission',
            'Commission for ' || (SELECT name FROM products WHERE id = _item.product_id) || ' (Order: ' || SUBSTRING(NEW.id::text, 1, 8) || ')',
            _commission_amount,
            CASE WHEN _is_fraud THEN 'under_review'::text ELSE 'verified'::text END,
            NEW.id,
            CURRENT_DATE,
            now() + (_lock_days || ' days')::interval,
            jsonb_build_object(
              'buyer_email', NEW.email,
              'buyer_phone', NEW.phone,
              'buyer_ip', NEW.ip_address,
              'fraud_reason', _fraud_reason,
              'is_fraud_flagged', _is_fraud
            )
          );
        END IF;
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
