import { MongoServerError, type Db } from "mongodb";

const COLLECTION_NAMES = [
  "users",
  "agents",
  "services",
  "locations",
  "packages",
  "bookings",
  "deliveries",
  "deliveryHistory",
  "rewardPenalties",
  "notifications",
] as const;

async function ensureCollections(db: Db): Promise<void> {
  for (const collectionName of COLLECTION_NAMES) {
    try {
      await db.createCollection(collectionName);
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== 48) {
        // 48 = NamespaceExists, safe to ignore
      }
    }
  }
}

export async function initializeMongoDBSchema(db: Db): Promise<void> {
  await ensureCollections(db);

  const indexOperations = [
    () =>
      db.collection("users").createIndex(
        { email: 1 },
        { name: "users_email_unique", unique: true },
      ),
    () =>
      db.collection("agents").createIndex(
        { agentCode: 1 },
        { name: "agents_agentCode_unique", unique: true },
      ),
    () =>
      db.collection("services").createIndex(
        { serviceCode: 1 },
        { name: "services_serviceCode_unique", unique: true },
      ),
    () =>
      db.collection("packages").createIndex(
        { trackingNumber: 1 },
        { name: "packages_trackingNumber_unique", unique: true },
      ),
    () =>
      db.collection("bookings").createIndex(
        { bookingNumber: 1 },
        { name: "bookings_bookingNumber_unique", unique: true },
      ),
    () =>
      db.collection("bookings").createIndex(
        { confirmationCode: 1 },
        { name: "bookings_confirmationCode_unique", unique: true },
      ),
    () => db.collection("packages").createIndex({ customerId: 1 }),
    () => db.collection("packages").createIndex({ assignedAgentId: 1 }),
    () => db.collection("packages").createIndex({ status: 1 }),
    () => db.collection("bookings").createIndex({ customerId: 1 }),
    () => db.collection("bookings").createIndex({ agentId: 1 }),
    () => db.collection("bookings").createIndex({ status: 1 }),
    () => db.collection("deliveryHistory").createIndex({ packageId: 1 }),
    () => db.collection("deliveryHistory").createIndex({ agentId: 1 }),
    () => db.collection("rewardPenalties").createIndex({ agentId: 1 }),
    () => db.collection("notifications").createIndex({ userId: 1 }),
  ];

  for (const op of indexOperations) {
    try {
      await op();
    } catch (_error) {
      // Ignore existing index or conflict gracefully
    }
  }
}