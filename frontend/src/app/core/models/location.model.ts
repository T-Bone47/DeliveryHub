export interface LocationSnapshot {
  address: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface LocationView {
  id: string;
  name: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLocationPayload {
  name: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isActive?: boolean;
}
