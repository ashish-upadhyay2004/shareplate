export type UserRole = 'donor' | 'ngo' | 'admin';

export type DonationStatus = 'posted' | 'requested' | 'confirmed' | 'picked_up' | 'completed' | 'expired' | 'cancelled';

export type FoodType = 'veg' | 'non-veg' | 'both';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgName: string;
  contact: string;
  address: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  avatar?: string;
  createdAt: Date;
}

export interface DonationListing {
  id: string;
  donorId: string;
  donorName: string;
  donorOrg: string;
  foodType: FoodType;
  foodCategory: string;
  quantity: number;
  quantityUnit: string;
  packagingType: string;
  preparedTime: Date;
  expiryTime: Date;
  pickupTimeStart: Date;
  pickupTimeEnd: Date;
  location: string;
  address: string;
  status: DonationStatus;
  photos: string[];
  hygieneNotes: string;
  allergens: string[];
  createdAt: Date;
}

export interface DonationRequest {
  id: string;
  listingId: string;
  ngoId: string;
  ngoName: string;
  ngoOrg: string;
  message: string;
  requestedPickupTime: Date;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
}

export interface Feedback {
  id: string;
  listingId: string;
  fromUserId: string;
  toUserId: string;
  stars: number;
  comment: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'request_received' | 'request_accepted' | 'pickup_reminder' | 'expiry_warning' | 'donation_completed';
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  listingId?: string;
}

export interface ChatMessage {
  id: string;
  listingId: string;
  senderId: string;
  senderName: string;
  message: string;
  createdAt: Date;
}
