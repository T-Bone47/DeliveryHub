import { ObjectId, type Db } from "mongodb";

import { type AgentDocument } from "../models/agent";
import { MongoRepository } from "./mongo.repository";

export class AgentRepository extends MongoRepository<AgentDocument> {
  constructor(db: Db) {
    super(db, "agents");
  }

  async findByAgentCode(agentCode: string): Promise<AgentDocument | null> {
    return this.collection.findOne({ agentCode } as { agentCode: string });
  }

  async findByUserId(userId: ObjectId): Promise<AgentDocument | null> {
    return this.collection.findOne({ userId } as { userId: ObjectId });
  }
}