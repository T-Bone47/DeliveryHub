import { BookingStatus, DeliveryStatus, PackageType } from './enums.model';
import { LocationSnapshot } from './location.model';

export interface ProofOfDeliveryView {
  photoUrl: string;
  capturedAt: string;
  capturedByAgentId?: string;
  otpVerified: boolean;
}

export type DeliveryExceptionReason =
  | 'Customer unavailable'
  | 'Wrong address'
  | 'Package damaged'
  | 'Customer rejected'
  | 'Vehicle issue'
  | 'Other';

export interface DeliveryExceptionView {
  reason: DeliveryExceptionReason | string;
  note?: string;
  reportedAt: string;
  reportedByAgentId?: string;
  attemptNumber?: number;
  previousStatus?: DeliveryStatus;
}

export interface PackageView {
  id: string;
  trackingNumber: string;
  customerId: string;
  packageType: PackageType;
  description: string;
  weight: number;
  sourceLocation: LocationSnapshot;
  destinationLocation: LocationSnapshot;
  serviceId: string;
  scheduledDate: string;
  status: DeliveryStatus;
  assignedAgentId: string | null;
  assignmentScore?: number;
  assignmentDistanceKm?: number;
  assignmentEstimatedMinutes?: number;
  assignmentReason?: string;
  assignedAt?: string;
  proofOfDelivery?: ProofOfDeliveryView | null;
  latestException?: DeliveryExceptionView | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookingView {
  id: string;
  bookingNumber: string;
  packageId: string;
  customerId: string;
  agentId: string;
  serviceId: string;
  bookingDate: string;
  scheduledDate: string;
  status: BookingStatus;
  confirmationCode: string;
  cancellationReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OtpView {
  verified: boolean;
  expiresAt: string;
  verifiedAt: string | null;
  attemptsRemaining: number;
}

export interface DeliveryView {
  id: string;
  packageId: string;
  bookingId: string;
  agentId: string;
  currentStatus: DeliveryStatus;
  pickupTime: string | null;
  estimatedDeliveryTime: string | null;
  actualDeliveryTime: string | null;
  pickupOtp?: OtpView | null;
  deliveryOtp?: OtpView | null;
  proofOfDelivery?: ProofOfDeliveryView | null;
  exceptions?: DeliveryExceptionView[];
  createdAt: string;
  updatedAt: string;
}

export interface GenerateOtpResponseData {
  otp: string;
  purpose: 'PICKUP' | 'DELIVERY';
  expiresAt: string;
  attemptsRemaining: number;
  delivery: DeliveryView;
}

export interface VerifyOtpPayload {
  purpose: 'PICKUP' | 'DELIVERY';
  otp: string;
}

export interface UpdateStatusPayload {
  status: DeliveryStatus;
}

export interface HistoryView {
  id: string;
  packageId: string;
  bookingId: string | null;
  agentId: string | null;
  status: DeliveryStatus;
  remarks: string;
  timestamp: string;
  changedByUserId: string | null;
}

export interface AssignedAgentView {
  id: string;
  userId: string;
  name: string;
  agentCode: string;
  status: string;
  rating: number;
}

export interface AssignmentView {
  packageId: string;
  agentId: string | null;
  agentName: string | null;
  score: number | null;
  distanceKm: number | null;
  estimatedMinutes: number | null;
  reason: string | null;
  assignedAt: string | null;
}

export interface PackageDetailsView {
  package: PackageView;
  assignment: AssignmentView;
  assignedAgent: AssignedAgentView | null;
  booking: BookingView | null;
  delivery: DeliveryView | null;
  history: HistoryView[];
  proofOfDelivery?: ProofOfDeliveryView | null;
  exceptions?: DeliveryExceptionView[];
  latestException?: DeliveryExceptionView | null;
}

export interface UploadProofPayload {
  photoData: string;
}

export interface ReportExceptionPayload {
  reason: string;
  note?: string;
}

export interface RescheduleDeliveryPayload {
  rescheduledDate: string;
}

export interface PackageListView {
  packages: PackageView[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreatePackageResult {
  package: PackageView;
  assignment: AssignmentView | null;
  booking: BookingView | null;
}

export interface AssignmentRetryResult {
  packageId: string;
  agentId: string | null;
  agentName: string | null;
  score: number | null;
  reason: string;
}

export interface CreatePackagePayload {
  packageType: PackageType;
  description: string;
  weight: number;
  sourceLocation: LocationSnapshot;
  destinationLocation: LocationSnapshot;
  serviceId: string;
  scheduledDate: string;
}

export interface PackageListQuery {
  status?: DeliveryStatus;
  agentId?: string;
  customerId?: string;
  serviceId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}
