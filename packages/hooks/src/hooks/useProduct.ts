import { useQuery } from "@tanstack/react-query";
import { supabase } from "@digihire/supabase";
import { DbProduct, Product, ProductType, CommissionModel } from "./useProducts";

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

export function useProduct(slug: string | undefined) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      if (!slug) throw new Error("No slug");
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Product not found");
      return mapProduct(data as unknown as DbProduct);
    },
    enabled: !!slug,
  });
}


