export interface ServiceView {
  id: string;
  serviceCode: string;
  name: string;
  description: string;
  basePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicePayload {
  serviceCode: string;
  name: string;
  description: string;
  basePrice: number;
  isActive?: boolean;
}
