export { AuthProvider, useAuth } from "./contexts/AuthContext";
export { CartProvider, useCart } from "./contexts/CartContext";

export { useProfile, useUpdateProfile, useUploadAvatar } from "./hooks/useProfile";
export { useWallet } from "./hooks/useWallet";
export { useNotifications } from "./hooks/useNotifications";
export { useTransactions } from "./hooks/useTransactions";
export {
  useCampaigns,
  useCampaign,
  useMyCampaignMemberships,
  useCampaignMembership,
  useJoinCampaign,
  useCampaignSubmissions,
  useSubmitEntry,
  useMyCampaignEarnings,
} from "./hooks/useCampaigns";
export type {
  Campaign,
  CampaignMembership,
  CampaignSubmission,
  CampaignEarning,
} from "./hooks/useCampaigns";
export { useReferrals } from "./hooks/useReferrals";
export { useSales, useDeleteSale, useUpdateSale } from "./hooks/useSales";
export type { Sale } from "./hooks/useSales";
export {
  useCourses,
  useCourseLessons,
  useUserProgress,
  useAllProgress,
  useMarkLessonComplete,
} from "./hooks/useTraining";
export { useProducts } from "./hooks/useProducts";
export type { Product, ProductType, CommissionModel } from "./hooks/useProducts";
export { useProduct } from "./hooks/useProduct";
export { useReviews, useSubmitReview, useProductRatingStats } from "./hooks/useReviews";
export { useCountUp } from "./hooks/useCountUp";
// useToast, toast, useIsMobile live in @digihire/ui — import from there or @digihire/shared

export { formatNaira } from "./lib/utils";
export * from "./lib/shareUtils";
export * from "./lib/csvExport";
export * from "./lib/productTaxonomy";
