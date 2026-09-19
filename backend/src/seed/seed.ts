import bcrypt from "bcrypt";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const uri =
  process.env.MONGODB_URI ??
  "mongodb+srv://dreamteamoliver_db_user:XmbyTUdPhMIvHz6j@cluster0.pc8frmd.mongodb.net/delivery_agent_system?retryWrites=true&w=majority";

export async function runSeed(): Promise<void> {
  console.log("Connecting to MongoDB Atlas at:", uri.replace(/:[^:@]+@/, ":****@"));
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();
  const db = client.db("delivery_agent_system");

  const now = new Date();
  const defaultPasswordHash = await bcrypt.hash("Password123", 12);

  // 1. Seed Users
  console.log("Seeding users...");
  const usersCollection = db.collection("users");

  const users = [
    {
      _id: new ObjectId(),
      fullName: "System Admin",
      email: "admin@deliveryhub.local",
      phone: "+91 90000 00001",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      fullName: "Rajesh Kumar (Agent)",
      email: "agent1@deliveryhub.local",
      phone: "+91 98765 43210",
      passwordHash: defaultPasswordHash,
      role: "AGENT",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      _id: new ObjectId(),
      fullName: "Priya Sharma (Customer)",
      email: "customer1@deliveryhub.local",
      phone: "+91 91234 56789",
      passwordHash: defaultPasswordHash,
      role: "CUSTOMER",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const u of users) {
    await usersCollection.updateOne(
      { email: u.email },
      { $setOnInsert: u },
      { upsert: true },
    );
  }

  const seededAdmin = await usersCollection.findOne({ email: "admin@deliveryhub.local" });
  const seededAgentUser = await usersCollection.findOne({ email: "agent1@deliveryhub.local" });
  const seededCustomer = await usersCollection.findOne({ email: "customer1@deliveryhub.local" });

  // 2. Seed Locations
  console.log("Seeding locations...");
  const locationsCollection = db.collection("locations");
  const locations = [
    {
      name: "Hyderabad Central Hub",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500001",
      latitude: 17.385,
      longitude: 78.4867,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Secunderabad Depot",
      city: "Secunderabad",
      state: "Telangana",
      postalCode: "500003",
      latitude: 17.4399,
      longitude: 78.4983,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Warangal Delivery Point",
      city: "Warangal",
      state: "Telangana",
      postalCode: "506002",
      latitude: 17.9784,
      longitude: 79.5941,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      name: "Vijayawada Main Hub",
      city: "Vijayawada",
      state: "Andhra Pradesh",
      postalCode: "520001",
      latitude: 16.5062,
      longitude: 80.648,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const locationIds: ObjectId[] = [];
  for (const loc of locations) {
    const existing = await locationsCollection.findOne({ name: loc.name });
    if (existing) {
      locationIds.push(existing._id);
    } else {
      const res = await locationsCollection.insertOne(loc);
      locationIds.push(res.insertedId);
    }
  }

  // 3. Seed Services
  console.log("Seeding delivery services...");
  const servicesCollection = db.collection("services");
  const services = [
    {
      serviceCode: "STANDARD",
      name: "Standard Delivery",
      description: "Economical 2-3 business day delivery",
      basePrice: 50,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      serviceCode: "EXPRESS",
      name: "Express Delivery",
      description: "Priority next-day delivery",
      basePrice: 120,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      serviceCode: "SAME_DAY",
      name: "Same Day Delivery",
      description: "Fast intra-city same day delivery",
      basePrice: 200,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const serviceIds: ObjectId[] = [];
  for (const srv of services) {
    const existing = await servicesCollection.findOne({ serviceCode: srv.serviceCode });
    if (existing) {
      serviceIds.push(existing._id);
    } else {
      const res = await servicesCollection.insertOne(srv);
      serviceIds.push(res.insertedId);
    }
  }

  // 4. Seed Agent Profile for Rajesh Kumar
  console.log("Seeding agent profile...");
  const agentsCollection = db.collection("agents");
  if (seededAgentUser) {
    await agentsCollection.updateOne(
      { agentCode: "AGENT-001" },
      {
        $setOnInsert: {
          userId: seededAgentUser._id,
          agentCode: "AGENT-001",
          vehicleType: "BIKE",
          status: "AVAILABLE",
          rating: 4.8,
          activeDeliveries: 0,
          completedDeliveries: 15,
          onTimeDeliveries: 14,
          rewardPoints: 120,
          penaltyPoints: 0,
          servedLocationIds: locationIds,
          availableLocationIds: [locationIds[0], locationIds[1]],
          offeredServiceIds: serviceIds,
          createdAt: now,
          updatedAt: now,
        },
      },
      { upsert: true },
    );
  }

  console.log("✅ Seed completed successfully!");
  console.log("------------------------------------------");
  console.log("Admin Account:    admin@deliveryhub.local    / Password123 (or Admin@123)");
  console.log("Agent Account:    agent1@deliveryhub.local   / Password123");
  console.log("Customer Account: customer1@deliveryhub.local / Password123");
  console.log("Locations Seeded: 4 locations (Hyderabad, Secunderabad, Warangal, Vijayawada)");
  console.log("Services Seeded:  3 tiers (STANDARD, EXPRESS, SAME_DAY)");
  console.log("Agent Profile:    AGENT-001 (Status: AVAILABLE, fully linked to locations and services)");
  console.log("------------------------------------------");

  await client.close();
}

if (require.main === module) {
  runSeed().catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
}
