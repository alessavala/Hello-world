export type UserRole = "CREATOR" | "BRAND" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  accessToken: string;
  user: AuthUser;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type Marketplace = "AMAZON" | "MERCADO_LIBRE" | "TIKTOK_SHOP";
export type SocialPlatform = "TIKTOK" | "INSTAGRAM" | "YOUTUBE" | "FACEBOOK";
export type VerificationLevel = "REGISTERED" | "IDENTITY" | "VERIFIED_COMMERCE" | "PRO";

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  profileUrl: string;
  followers: number;
  averageViews: number;
  engagementRate: number;
}

export interface CreatorMarketplace {
  id: string;
  marketplace: Marketplace;
  verified: boolean;
  profileUrl: string | null;
}

export interface CreatorCategory {
  categoryId: string;
  category: Category;
}

export interface PortfolioItem {
  id: string;
  title: string;
  contentUrl: string;
  thumbnailUrl: string | null;
  platform: SocialPlatform;
  views: number;
}

export interface CreatorProfile {
  id: string;
  userId: string;
  displayName: string;
  bio: string | null;
  country: string;
  city: string | null;
  profilePhotoUrl: string | null;
  turnaroundDays: number;
  acceptsProduct: boolean;
  acceptsFixedFee: boolean;
  acceptsCommission: boolean;
  verificationLevel: VerificationLevel;
  reliabilityScore: number;
  campaignsCompleted: number;
  onTimeDeliveryRate: number;
  firstApprovalRate: number;
  disputeRate: number;
  brandRehireRate: number;
  avgRating: number;
  socialAccounts: SocialAccount[];
  marketplaces: CreatorMarketplace[];
  categories: CreatorCategory[];
  portfolioItems?: PortfolioItem[];
}

export interface CreatorPassport {
  creatorCommerceScore: number;
  identityVerified: boolean;
  amazonAffiliateVerified: boolean;
  mercadoLibreAffiliateVerified: boolean;
  tiktokShopCreatorVerified: boolean;
  campaignsCompleted: number;
  onTimeDeliveryRate: number;
  avgRating: number;
  brandRehireRate: number;
  firstApprovalRate: number;
  disputeRate: number;
  verificationLevel: VerificationLevel;
}

export interface BrandProfile {
  id: string;
  userId: string;
  businessName: string;
  website: string | null;
  logoUrl: string | null;
  country: string;
  description: string | null;
  verificationStatus: boolean;
}

export interface CreatorSearchParams {
  page?: number;
  pageSize?: number;
  country?: string;
  city?: string;
  category?: string;
  marketplace?: Marketplace;
  platform?: SocialPlatform;
  minFollowers?: number;
  minAverageViews?: number;
  minCreatorScore?: number;
  verificationLevel?: VerificationLevel;
  sortBy?: "reliabilityScore" | "followers" | "createdAt";
}
