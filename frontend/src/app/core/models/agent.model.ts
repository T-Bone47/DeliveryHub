import { AgentStatus, VehicleType } from './enums.model';
import { PublicUser } from './user.model';

export interface AgentView {
  id: string;
  user: PublicUser;
  agentCode: string;
  vehicleType: VehicleType;
  status: AgentStatus;
  rating: number;
  activeDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  rewardPoints: number;
  penaltyPoints: number;
  servedLocationIds?: string[];
  availableLocationIds?: string[];
  offeredServiceIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentPerformanceView {
  id: string;
  agentCode: string;
  user: PublicUser;
  rating: number;
  activeDeliveries: number;
  completedDeliveries: number;
  onTimeDeliveries: number;
  delayedDeliveries: number;
  onTimeRate: number;
  rewardPoints: number;
  penaltyPoints: number;
}

export interface CreateAgentPayload {
  userId: string;
  agentCode: string;
  vehicleType: VehicleType;
  status?: AgentStatus;
  servedLocationIds?: string[];
  availableLocationIds?: string[];
  offeredServiceIds?: string[];
}
