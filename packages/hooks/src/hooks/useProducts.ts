import { useQuery } from "@tanstack/react-query";
import { supabase } from "@digihire/supabase";

export type ProductType = "Physical" | "Digital";
export type ProductCategory = 
  | "Fashion & Lifestyle" 
  | "Electronics & Gadgets" 
  | "Fintech" 
  | "Tech Products" 
  | "Software & Tools" 
  | "Subscriptions";

export type CommissionModel = "percentage" | "fixed" | "per_signup" | "per_install";

export interface DbProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  commission_rate: number;
  price: number;
  image: string;
  description: string;
  assets: {
    images: string[];
    videoUrl?: string;
    whatsappMessage: string;
    instagramCaption: string;
    twitterCaption: string;
    sellingTips: string[];
    fulfillment_url?: string;
  };
  slug: string;
  product_type: string;
  delivery_type?: "lead_url" | "direct_link" | "license_key" | "manual_provision";
  delivery_instructions?: string | null;
  subcategory?: string;
  commission_model: CommissionModel;
  organization: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  commissionRate: number;
  price: number;
  image: string;
  description: string;
  assets: DbProduct["assets"];
  slug: string;
  productType: ProductType;
  delivery_type: "lead_url" | "direct_link" | "license_key" | "manual_provision";
  delivery_instructions?: string | null;
  subcategory?: string;
  commissionModel: CommissionModel;
  organization: string;
}

function mapProduct(db: DbProduct): Product {
  return {
    id: db.id,
    name: db.name,
    brand: db.brand,
    category: db.category,
    commissionRate: db.commission_rate,
    price: db.price,
    image: db.image,
    description: db.description,
    assets: db.assets,
    slug: db.slug,
    productType: (db.product_type as ProductType) || "Physical",
    delivery_type: db.delivery_type || "manual_provision",
    delivery_instructions: db.delivery_instructions || null,
    subcategory: db.subcategory,
    commissionModel: (db.commission_model as CommissionModel) || "percentage",
    organization: db.organization || db.brand,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("commission_rate", { ascending: false });
      if (error) throw error;
      return (data as any[]).map(mapProduct);
    },
  });
}


