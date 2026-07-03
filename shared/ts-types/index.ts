export type UserRole = 'customer' | 'provider' | 'admin';

export interface Profile {
  id: string;
  fullName: string;
  phone?: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProviderProfile {
  id: string;
  bio?: string;
  isVerified: boolean;
  verificationDocumentUrl?: string;
  isOnline: boolean;
  ratingAvg: number;
  ratingCount: number;
  isPremium: boolean;
  isFeatured: boolean;
  serviceRadiusKm: number;
  updatedAt: string;
}

export type BookingStatus = 'pending_payment' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  customerId: string;
  providerId: string;
  status: BookingStatus;
  scheduledTime: string;
  address: string;
  latitude: number;
  longitude: number;
  totalPrice: number;
  commissionFee: number;
  providerEarnings: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  bookingId: string;
  snippeCheckoutId: string;
  status: PaymentStatus;
  amount: number;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string;
}
