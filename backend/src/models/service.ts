import { type MongoDocument, type Timestamped } from "./common";

export interface ServiceDocument extends MongoDocument, Timestamped {
  serviceCode: string;
  name: string;
  description: string;
  basePrice: number;
  isActive: boolean;
}