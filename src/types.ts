// Shapes of the data the backend API sends back

export type Role = 'BUYER' | 'SELLER' | 'ADMIN';
export type SellerStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
export type ProductStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface SellerSummary {
  id: number;
  storeName: string;
  slug: string;
  status: SellerStatus;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  createdAt: string;
  seller: (SellerSummary & { statusReason: string | null }) | null;
}

export interface Spec {
  label: string;
  value: string;
}

export interface Product {
  id: number;
  title: string;
  brand: string | null;
  price: number;
  mrp: number | null;
  discountPercent: number;
  description: string;
  category: string;
  image: string;
  images: string[];
  specs: Spec[] | null;
  stock: number;
  status: ProductStatus;
  rejectionReason: string | null;
  sellerId: number | null;
  seller?: SellerSummary | null;
  sellerName?: string;
  ratingAvg: number;
  ratingCount: number;
  soldCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDetail extends Product {
  seller: (SellerSummary & { description: string; createdAt: string }) | null;
  sellerRating: { average: number; count: number } | null;
}

export interface ProductPage {
  data: Product[];
  total: number;
  page: number;
  totalPages: number;
  fuzzy?: boolean;
  facets?: { brands: { name: string; count: number }[] };
}

export interface Category {
  name: string;
  count: number;
}

export interface CartItem {
  productId: number;
  quantity: number;
  savedForLater?: boolean;
  available?: boolean;
  product: Product;
}

export interface Cart {
  items: CartItem[];
  savedItems: CartItem[];
  count: number;
  subtotal: number;
  deliveryFee: number;
  total: number;
}

export interface Address {
  id: number;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export type ShippingAddress = Omit<Address, 'id' | 'label' | 'isDefault' | 'line2'> & { line2?: string | null };

export interface Coupon {
  id: number;
  code: string;
  description: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minOrderAmount: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  usageLimit?: number | null;
  usedCount?: number;
  active?: boolean;
}

export type OrderStatus = 'PENDING' | 'PAID' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type ShipmentStatus = 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'STRIPE' | 'RAZORPAY' | 'COD';
export type ReturnStatus = 'REQUESTED' | 'REFUNDED' | 'REJECTED';

export interface ReturnRequest {
  id: number;
  orderItemId: number;
  reason: string;
  comment: string | null;
  refundUpi: string | null;
  status: ReturnStatus;
  refundAmount: number;
  resolutionNote: string | null;
  createdAt: string;
}

export interface OrderItem {
  id: number;
  productId: number;
  shipmentId: number | null;
  quantity: number;
  price: number;
  discount: number;
  product: Product;
  returnRequest: ReturnRequest | null;
  canReturn?: boolean;
  returnUntil?: string | null;
}

export interface Shipment {
  id: number;
  orderId: number;
  sellerId: number | null;
  seller: SellerSummary | null;
  sellerName?: string;
  status: ShipmentStatus;
  subtotal: number;
  commissionRate: number;
  commission: number;
  sellerEarning: number;
  courier: string | null;
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  sellerRating: number | null;
  sellerFeedback: string | null;
  createdAt: string;
  nextStatuses?: ShipmentStatus[];
}

export interface Order {
  id: number;
  userId: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  totalAmount: number;
  refundedAmount: number;
  couponCode: string | null;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paidAt: string | null;
  shippingAddress: ShippingAddress | null;
  createdAt: string;
  items: OrderItem[];
  shipments: Shipment[];
  user: { id: number; name: string; email: string };
  canCancel?: boolean;
}

// A shipment as a seller sees it in their dashboard
export interface SellerShipment extends Shipment {
  items: (OrderItem & { product: Pick<Product, 'id' | 'title' | 'image' | 'category'> })[];
  order: {
    id: number;
    createdAt: string;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    paidAt: string | null;
    shippingAddress: ShippingAddress | null;
    user: { name: string };
  };
}

export interface ReturnListItem extends ReturnRequest {
  user: { name: string; email: string };
  orderItem: OrderItem & {
    product: Pick<Product, 'id' | 'title' | 'image' | 'category'>;
    order: { id: number; paymentMethod: PaymentMethod };
  };
}

export interface Review {
  id: number;
  rating: number;
  title: string | null;
  comment: string;
  helpfulCount: number;
  createdAt: string;
  author: string;
  isMine: boolean;
  votedHelpful: boolean;
}

export interface ReviewPage {
  summary: { average: number; count: number; breakdown: Record<number, number> };
  reviews: Review[];
  page: number;
  totalPages: number;
  canReview: boolean;
  myReview: { rating: number; title: string | null; comment: string } | null;
}

export interface Earnings {
  earned: number;
  pending: number;
  returns: number;
  paidOut: number;
  available: number;
}

export interface Seller extends SellerSummary {
  description: string;
  phone: string;
  gstin: string | null;
  pickupAddress: { line1: string; city: string; state: string; postalCode: string };
  payoutUpi: string;
  statusReason: string | null;
  commissionRate: number | null;
  createdAt: string;
}

export interface SellerOverview {
  seller: Seller;
  commissionRate: number;
  earnings: Earnings;
  rating: { average: number; count: number };
  products: Partial<Record<ProductStatus, number>>;
  shipmentsToShip: number;
  openReturns: number;
}

export interface Payout {
  id: number;
  amount: number;
  reference: string | null;
  createdAt: string;
}

// A store's public page
export interface StorePageData {
  id: number;
  storeName: string;
  slug: string;
  description: string;
  createdAt: string;
  location: string;
  rating: { average: number; count: number };
  products: Product[];
}

export interface AdminStats {
  productCount: number;
  customerCount: number;
  orderCount: number;
  revenue: number;
  ordersByStatus: Partial<Record<OrderStatus, number>>;
  lowStock: { id: number; title: string; stock: number }[];
  sellerCount: number;
  pendingSellers: number;
  pendingListings: number;
  openReturns: number;
}

export interface StoreConfig {
  currency: string;
  payments: { stripe: boolean; razorpay: boolean; cod: boolean };
  razorpayKeyId: string | null;
  delivery: { fee: number; freeThreshold: number };
  returnWindowDays: number;
  sellerCommissionRate: number;
  platformSellerName: string;
  announcements: string[]; // The offers bar, set by admins
}

// A homepage banner slide (GET /banners), set up by admins
export interface HomeBanner {
  id: number;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  ctaLabel: string;
  ctaLink: string; // A store page ("/products?...") or an https:// link
  image: string | null;
  theme: 'EMERALD' | 'NAVY' | 'PEACH' | 'LAVENDER' | 'ROSE' | 'SKY';
  layout: 'SPLIT' | 'COVER';
  products: Pick<Product, 'id' | 'title' | 'image' | 'category'>[]; // Shown when there's no picture
}

export interface DeliveryEstimate {
  pincode: string;
  minDays: number;
  maxDays: number;
  earliest: string;
  latest: string;
  codAvailable: boolean;
}
