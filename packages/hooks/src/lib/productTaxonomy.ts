export type ProductType = "Physical" | "Digital";

type TaxonomyCategory = {
  category: string;
  subcategories: string[];
};

export const PRODUCT_TAXONOMY: Record<ProductType, TaxonomyCategory[]> = {
  Physical: [
    {
      category: "Fashion & Lifestyle",
      subcategories: ["Clothing", "Shoes", "Bags", "Accessories", "Jewelry", "Skincare", "Haircare"],
    },
    {
      category: "Electronics & Gadgets",
      subcategories: ["Phones", "Laptops", "Tablets", "Accessories"],
    },
  ],
  Digital: [
    {
      category: "Fintech",
      subcategories: ["Fintech App Signup", "Fintech App Install / Download"],
    },
    {
      category: "Tech Products",
      subcategories: ["Tech Product Signup", "Tech Product Install / Download"],
    },
    {
      category: "Software & Tools",
      subcategories: ["Software / Tools Signup"],
    },
    {
      category: "Subscriptions",
      subcategories: ["Subscriptions"],
    },
  ],
};

export const PRODUCT_TYPES: ProductType[] = ["Physical", "Digital"];

export function getCategoriesByType(productType: ProductType | "all"): string[] {
  if (productType === "all") {
    return PRODUCT_TYPES.flatMap((type) => PRODUCT_TAXONOMY[type].map((entry) => entry.category));
  }
  return PRODUCT_TAXONOMY[productType].map((entry) => entry.category);
}

export function getSubcategoriesByCategory(category: string): string[] {
  for (const type of PRODUCT_TYPES) {
    const found = PRODUCT_TAXONOMY[type].find((entry) => entry.category === category);
    if (found) return found.subcategories;
  }
  return [];
}

export function getAllCategories(): string[] {
  return PRODUCT_TYPES.flatMap((type) => PRODUCT_TAXONOMY[type].map((entry) => entry.category));
}

export function getProductTypeForCategory(category: string): ProductType | null {
  for (const type of PRODUCT_TYPES) {
    if (PRODUCT_TAXONOMY[type].some((entry) => entry.category === category)) {
      return type;
    }
  }
  return null;
}
