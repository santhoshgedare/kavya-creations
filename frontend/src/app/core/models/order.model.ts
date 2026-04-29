export interface CartItem {
  productId: string;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
}

export interface Cart {
  cartId: string;
  items: CartItem[];
  total: number;
  totalItems: number;
}

export enum OrderStatus {
  Pending = 1,
  Confirmed = 2,
  Processing = 3,
  Shipped = 4,
  Delivered = 5,
  Cancelled = 6,
  Refunded = 7
}

export enum PaymentStatus {
  Pending = 1,
  Paid = 2,
  Failed = 3,
  Refunded = 4
}

export interface OrderItem {
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subTotal: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  subTotal: number;
  shippingCost: number;
  totalAmount: number;
  shippingAddress: string;
  notes?: string;
  paymentMethod?: string;
  items: OrderItem[];
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export interface OrderListItem {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  itemCount: number;
  createdAt: string;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateOrderRequest {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  notes?: string;
}
