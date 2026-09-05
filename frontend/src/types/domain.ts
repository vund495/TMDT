// =============================================================================
// Types đồng bộ với backend FastAPI (app/schemas + app/models)
// =============================================================================

export type Role = "customer" | "workshop_owner" | "admin";

export interface UserProfile {
  id: string;
  auth_id?: string | null;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role: Role;
  created_at?: string;
}

export interface AdminUser extends UserProfile {
  bad_order_count?: number;
  is_active?: boolean;
  workshop_name?: string | null;
  orders_count?: number;
  total_spent?: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserProfile;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  related_entity_id?: string | null;
  related_entity_type?: string | null;
  is_read: boolean;
  created_at: string;
}

export type WorkshopStatus = "pending" | "approved" | "rejected";

export interface Workshop {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  logo_url?: string | null;
  status: WorkshopStatus;
  rating_avg?: number;
  reject_reason?: string | null;
  created_at?: string;
}

export type ProductStatus = "draft" | "pending_review" | "active" | "approved" | "rejected";

export interface Product {
  id: string;
  workshop_id: string;
  name: string;
  description?: string | null;
  theme?: string | null;
  material?: string | null;
  firing_technique?: string | null;
  glaze?: string | null;
  original_price: number;
  sale_price?: number | null;
  stock: number;
  sold_count: number;
  images?: string[] | null;
  video_url?: string | null;
  status: ProductStatus;
  reject_reason?: string | null;
  passport_qr?: string | null;
  created_at?: string;
}

export interface ProductDetail extends Product {
  workshop_name?: string;
  workshop_address?: string | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ---------------- Giỏ hàng ----------------
export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product_name?: string;
  product_image?: string | null;
  unit_price?: number;
  subtotal?: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

// ---------------- Đơn hàng ----------------
export type OrderStatus =
  | "pending_payment"
  | "preparing"
  | "shipping"
  | "completed"
  | "disputing"
  | "returned";

export interface Order {
  id: string;
  code: string;
  customer_id: string;
  workshop_id: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  shipping_fee: number;
  total: number;
  receiver_name: string;
  receiver_phone: string;
  shipping_address: string;
  anti_shock_packed: boolean;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  unit_price: number;
  quantity: number;
  passport_qr?: string | null;
}

export interface OrderDetail extends Order {
  items: OrderItem[];
}

export interface Shipment {
  id: string;
  order_id: string;
  carrier?: string | null;
  tracking_code?: string | null;
  status: string;
  is_returned: boolean;
}

export interface OrderCreateOut {
  order: Order;
  qr_url?: string;
  payment_id?: string;
}

// ---------------- Tour ----------------
export type TourBookingStatus =
  | "pending_payment"
  | "confirmed"
  | "cancelled"
  | "attended"
  | "no_show";

export interface TourSlot {
  id: string;
  workshop_id: string;
  tour_date: string;
  start_time: string;
  capacity: number;
  slots_left: number;
  price_per_guest: number;
}

export interface TourBooking {
  id: string;
  slot_id: string;
  customer_id: string;
  num_guests: number;
  total_amount: number;
  status: TourBookingStatus;
  voucher_issued: boolean;
  created_at: string;
}

export interface TourBookingCreateOut {
  booking: TourBooking;
  qr_url?: string;
  payment_id?: string;
}

// ---------------- Voucher ----------------
export interface Voucher {
  id: string;
  code: string;
  workshop_id?: string | null;
  discount_percent: number;
  max_discount_amount?: number | null;
  valid_from: string;
  valid_until: string;
  usage_limit?: number | null;
  used_count: number;
  active: boolean;
}

// ---------------- Khiếu nại ----------------
export type DisputeStatus = "open" | "reviewing" | "resolved";

export interface Dispute {
  id: string;
  order_id: string;
  customer_id: string;
  reason: string;
  evidence_urls?: string[] | null;
  status: DisputeStatus;
  resolution?: string | null;
  admin_note?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

// ---------------- Đánh giá / bình luận ----------------
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  order_id?: string | null;
  rating: number;
  content?: string | null;
  created_at: string;
  user_name?: string;
}

export interface Comment {
  id: string;
  product_id: string;
  user_id: string;
  parent_id?: string | null;
  content: string;
  created_at: string;
  user_name?: string;
}

// ---------------- Doanh thu ----------------
export interface RevenuePeriod {
  period: string;
  workshop_id?: string | null;
  gross_amount: number;
  commission_amount: number;
  payout_amount: number;
}

export interface WalletPeriod {
  period: string;
  gross_amount: number;
  commission_amount: number;
  payout_amount: number;
  paid_orders: number;
}

export interface WorkshopWallet {
  total_gross: number;
  total_commission: number;
  total_payout: number;
  total_paid_orders: number;
  periods: WalletPeriod[];
}

// ---------------- Thông báo (toast) ----------------
export interface ToastMsg {
  id: string;
  type: "success" | "info" | "error";
  message: string;
}
