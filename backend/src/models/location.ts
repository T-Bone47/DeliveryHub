import { type MongoDocument, type Timestamped } from "./common";

export interface LocationDocument extends MongoDocument, Timestamped {
  name: string;
  city: string;
  state: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
}