import bcrypt from "bcrypt";
import { ObjectId } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

import { connectMongoDB, getMongoDB, disconnectMongoDB } from "../config/mongodb";

export async function runDemoSeed(): Promise<void> {
  console.log("==================================================");
  console.log("DELIVERYHUB — REALISTIC DEMO DATA SEEDER");
  console.log("==================================================");
  console.log("Connecting to MongoDB Atlas...");

  await connectMongoDB();
  const db = getMongoDB();

  const now = new Date();
  const adminPasswordHash = await bcrypt.hash("Admin@123", 12);
  const agentPasswordHash = await bcrypt.hash("Agent@123", 12);
  const customerPasswordHash = await bcrypt.hash("Demo@123", 12);

  // 1. Seed Locations (10 realistic Indian hubs across 4 southern states)
  console.log("1/7 Seeding 10 delivery locations...");
  const locationsCollection = db.collection("locations");

  const rawLocations = [
    {
      name: "Hyderabad Central Hub",
      city: "Hyderabad",
      state: "Telangana",
      postalCode: "500001",
      latitude: 17.385,
      longitude: 78.4867,
    },
    {
      name: "Vijayawada Express Hub",
      city: "Vijayawada",
      state: "Andhra Pradesh",
      postalCode: "520001",
      latitude: 16.5062,
      longitude: 80.648,
    },
    {
      name: "Tadipatri Regional Hub",
      city: "Tadipatri",
      state: "Andhra Pradesh",
      postalCode: "515411",
      latitude: 14.9084,
      longitude: 78.0097,
    },
    {
      name: "Visakhapatnam Port Depot",
      city: "Visakhapatnam",
      state: "Andhra Pradesh",
      postalCode: "530001",
      latitude: 17.6868,
      longitude: 83.2185,
    },
    {
      name: "Chennai South Depot",
      city: "Chennai",
      state: "Tamil Nadu",
      postalCode: "600001",
      latitude: 13.0827,
      longitude: 80.2707,
    },
    {
      name: "Bengaluru Tech Logistics",
      city: "Bengaluru",
      state: "Karnataka",
      postalCode: "560001",
      latitude: 12.9716,
      longitude: 77.5946,
    },
    {
      name: "Coimbatore Textile Hub",
      city: "Coimbatore",
      state: "Tamil Nadu",
      postalCode: "641001",
      latitude: 11.0168,
      longitude: 76.9558,
    },
    {
      name: "Tirupati Gateway Hub",
      city: "Tirupati",
      state: "Andhra Pradesh",
      postalCode: "517501",
      latitude: 13.6288,
      longitude: 79.4192,
    },
    {
      name: "Guntur Junction Depot",
      city: "Guntur",
      state: "Andhra Pradesh",
      postalCode: "522002",
      latitude: 16.3067,
      longitude: 80.4365,
    },
    {
      name: "Warangal Express Depot",
      city: "Warangal",
      state: "Telangana",
      postalCode: "506002",
      latitude: 17.9784,
      longitude: 79.5941,
    },
  ];

  const locationMap = new Map<string, any>();
  for (const loc of rawLocations) {
    const existing = await locationsCollection.findOne({ name: loc.name });
    if (existing) {
      locationMap.set(loc.name, existing);
    } else {
      const doc = {
        ...loc,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const res = await locationsCollection.insertOne(doc);
      locationMap.set(loc.name, { _id: res.insertedId, ...doc });
    }
  }
  const allLocationIds = Array.from(locationMap.values()).map((l) => l._id);

  // 2. Seed Services (5 tiers)
  console.log("2/7 Seeding 5 delivery services...");
  const servicesCollection = db.collection("services");

  const rawServices = [
    {
      serviceCode: "STANDARD",
      name: "Standard Delivery",
      description: "Economical 2-3 business day surface delivery",
      basePrice: 50,
    },
    {
      serviceCode: "EXPRESS",
      name: "Express Delivery",
      description: "Priority next-day air & express surface delivery",
      basePrice: 120,
    },
    {
      serviceCode: "SAME_DAY",
      name: "Same Day Delivery",
      description: "Urgent same day intracity & regional courier delivery",
      basePrice: 200,
    },
    {
      serviceCode: "DOCUMENT",
      name: "Document Courier",
      description: "Tamper-evident legal and business documents delivery",
      basePrice: 80,
    },
    {
      serviceCode: "FRAGILE",
      name: "Fragile & White Glove",
      description: "Special handling with shock-absorbent packaging",
      basePrice: 180,
    },
  ];

  const serviceMap = new Map<string, any>();
  for (const srv of rawServices) {
    const existing = await servicesCollection.findOne({ serviceCode: srv.serviceCode });
    if (existing) {
      serviceMap.set(srv.serviceCode, existing);
    } else {
      const doc = {
        ...srv,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const res = await servicesCollection.insertOne(doc);
      serviceMap.set(srv.serviceCode, { _id: res.insertedId, ...doc });
    }
  }
  const allServiceIds = Array.from(serviceMap.values()).map((s) => s._id);

  // 3. Seed Users (1 Admin, 6 Customers, 8 Agents)
  console.log("3/7 Seeding demo accounts (Admin, Customers, Agents)...");
  const usersCollection = db.collection("users");

  // 3a. Admin
  await usersCollection.updateOne(
    { email: "admin.demo@deliveryhub.local" },
    {
      $setOnInsert: {
        fullName: "DeliveryHub Demo Admin",
        email: "admin.demo@deliveryhub.local",
        phone: "+91 90000 00099",
        passwordHash: adminPasswordHash,
        role: "ADMIN",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  // Also ensure baseline admin has valid passwordHash
  await usersCollection.updateOne(
    { email: "admin@deliveryhub.local" },
    {
      $set: { passwordHash: adminPasswordHash, isActive: true },
      $setOnInsert: {
        fullName: "System Admin",
        phone: "+91 90000 00001",
        role: "ADMIN",
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true },
  );

  // 3b. Customers (6 customers)
  const rawCustomers = [
    { fullName: "Rahul Sharma", email: "rahul.demo@deliveryhub.local", phone: "+91 98111 00001" },
    { fullName: "Priya Nair", email: "priya.demo@deliveryhub.local", phone: "+91 98111 00002" },
    { fullName: "Arjun Kumar", email: "arjun.demo@deliveryhub.local", phone: "+91 98111 00003" },
    { fullName: "Ananya Rao", email: "ananya.demo@deliveryhub.local", phone: "+91 98111 00004" },
    { fullName: "Karthik Menon", email: "karthik.demo@deliveryhub.local", phone: "+91 98111 00005" },
    { fullName: "Meera Krishnan", email: "meera.demo@deliveryhub.local", phone: "+91 98111 00006" },
  ];

  const customerMap = new Map<string, any>();
  for (const c of rawCustomers) {
    let user = await usersCollection.findOne({ email: c.email });
    if (!user) {
      const doc = {
        fullName: c.fullName,
        email: c.email,
        phone: c.phone,
        passwordHash: customerPasswordHash,
        role: "CUSTOMER",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const res = await usersCollection.insertOne(doc);
      user = { _id: res.insertedId, ...doc };
    }
    customerMap.set(c.email, user);
  }

  // 3c. Agents (8 agents: 4 AVAILABLE, 2 BUSY, 2 OFFLINE)
  const rawAgents = [
    {
      fullName: "Vikram Sethi",
      email: "agent.vikram@deliveryhub.local",
      phone: "+91 98222 00101",
      agentCode: "AGENT-101",
      vehicleType: "BIKE",
      status: "AVAILABLE",
      rating: 4.9,
      activeDeliveries: 1,
      completedDeliveries: 42,
      onTimeDeliveries: 40,
      rewardPoints: 180,
      penaltyPoints: 0,
      states: ["Telangana", "Andhra Pradesh"],
    },
    {
      fullName: "Sneha Patel",
      email: "agent.sneha@deliveryhub.local",
      phone: "+91 98222 00102",
      agentCode: "AGENT-102",
      vehicleType: "SCOOTER",
      status: "AVAILABLE",
      rating: 4.8,
      activeDeliveries: 2,
      completedDeliveries: 35,
      onTimeDeliveries: 33,
      rewardPoints: 140,
      penaltyPoints: 0,
      states: ["Andhra Pradesh", "Tamil Nadu", "Telangana"],
    },
    {
      fullName: "Rohan Verma",
      email: "agent.rohan@deliveryhub.local",
      phone: "+91 98222 00103",
      agentCode: "AGENT-103",
      vehicleType: "VAN",
      status: "AVAILABLE",
      rating: 4.75,
      activeDeliveries: 0,
      completedDeliveries: 28,
      onTimeDeliveries: 27,
      rewardPoints: 110,
      penaltyPoints: 0,
      states: ["Karnataka", "Tamil Nadu"],
    },
    {
      fullName: "Deepak Reddy",
      email: "agent.deepak@deliveryhub.local",
      phone: "+91 98222 00104",
      agentCode: "AGENT-104",
      vehicleType: "MINI_TRUCK",
      status: "BUSY",
      rating: 4.65,
      activeDeliveries: 4,
      completedDeliveries: 50,
      onTimeDeliveries: 46,
      rewardPoints: 210,
      penaltyPoints: 10,
      states: ["Telangana", "Andhra Pradesh", "Karnataka"],
    },
    {
      fullName: "Kavita Joshi",
      email: "agent.kavita@deliveryhub.local",
      phone: "+91 98222 00105",
      agentCode: "AGENT-105",
      vehicleType: "SCOOTER",
      status: "AVAILABLE",
      rating: 4.92,
      activeDeliveries: 1,
      completedDeliveries: 60,
      onTimeDeliveries: 58,
      rewardPoints: 250,
      penaltyPoints: 0,
      states: ["Telangana", "Andhra Pradesh", "Tamil Nadu", "Karnataka"],
    },
    {
      fullName: "Manoj Tiwari",
      email: "agent.manoj@deliveryhub.local",
      phone: "+91 98222 00106",
      agentCode: "AGENT-106",
      vehicleType: "BIKE",
      status: "BUSY",
      rating: 4.5,
      activeDeliveries: 5,
      completedDeliveries: 22,
      onTimeDeliveries: 20,
      rewardPoints: 80,
      penaltyPoints: 20,
      states: ["Andhra Pradesh"],
    },
    {
      fullName: "Suresh Iyer",
      email: "agent.suresh@deliveryhub.local",
      phone: "+91 98222 00107",
      agentCode: "AGENT-107",
      vehicleType: "VAN",
      status: "OFFLINE",
      rating: 4.4,
      activeDeliveries: 0,
      completedDeliveries: 18,
      onTimeDeliveries: 17,
      rewardPoints: 60,
      penaltyPoints: 0,
      states: ["Tamil Nadu"],
    },
    {
      fullName: "Divya Balan",
      email: "agent.divya@deliveryhub.local",
      phone: "+91 98222 00108",
      agentCode: "AGENT-108",
      vehicleType: "BIKE",
      status: "AVAILABLE",
      rating: 4.88,
      activeDeliveries: 1,
      completedDeliveries: 31,
      onTimeDeliveries: 30,
      rewardPoints: 130,
      penaltyPoints: 0,
      states: ["Telangana", "Karnataka"],
    },
  ];

  // 4. Seed Agent Profiles & Links
  console.log("4/7 Creating Agent profiles, coverage, and service offerings...");
  const agentsCollection = db.collection("agents");
  const agentMap = new Map<string, any>();

  for (const ag of rawAgents) {
    let user = await usersCollection.findOne({ email: ag.email });
    if (!user) {
      const userDoc = {
        fullName: ag.fullName,
        email: ag.email,
        phone: ag.phone,
        passwordHash: agentPasswordHash,
        role: "AGENT",
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      const res = await usersCollection.insertOne(userDoc);
      user = { _id: res.insertedId, ...userDoc };
    }

    // Match served locations by state
    const servedLocIds = Array.from(locationMap.values())
      .filter((loc) => ag.states.includes(loc.state))
      .map((loc) => loc._id);

    let agentDoc = await agentsCollection.findOne({ agentCode: ag.agentCode });
    if (!agentDoc) {
      const insert = {
        userId: user._id,
        agentCode: ag.agentCode,
        vehicleType: ag.vehicleType,
        status: ag.status,
        rating: ag.rating,
        activeDeliveries: ag.activeDeliveries,
        completedDeliveries: ag.completedDeliveries,
        onTimeDeliveries: ag.onTimeDeliveries,
        rewardPoints: ag.rewardPoints,
        penaltyPoints: ag.penaltyPoints,
        servedLocationIds: servedLocIds,
        availableLocationIds: servedLocIds.slice(0, 2),
        offeredServiceIds: allServiceIds,
        createdAt: now,
        updatedAt: now,
      };
      const res = await agentsCollection.insertOne(insert);
      agentDoc = { _id: res.insertedId, ...insert };
    } else {
      await agentsCollection.updateOne(
        { _id: agentDoc._id },
        {
          $set: {
            servedLocationIds: servedLocIds,
            offeredServiceIds: allServiceIds,
            status: ag.status,
            rating: ag.rating,
          },
        },
      );
    }
    agentMap.set(ag.agentCode, { agentDoc, user });
  }

  // 5. Seed Packages, Bookings, Deliveries, and Histories (20 Packages across statuses)
  console.log("5/7 Seeding 20 demo packages across all statuses...");
  const packagesCollection = db.collection("packages");
  const bookingsCollection = db.collection("bookings");
  const deliveriesCollection = db.collection("deliveries");
  const historiesCollection = db.collection("deliveryHistory");

  const customersList = Array.from(customerMap.values());
  const standardSrv = serviceMap.get("STANDARD");
  const expressSrv = serviceMap.get("EXPRESS");
  const sameDaySrv = serviceMap.get("SAME_DAY");
  const fragileSrv = serviceMap.get("FRAGILE");

  const hydLoc = locationMap.get("Hyderabad Central Hub");
  const vjaLoc = locationMap.get("Vijayawada Express Hub");
  const tdpLoc = locationMap.get("Tadipatri Regional Hub");
  const vizLoc = locationMap.get("Visakhapatnam Port Depot");
  const chnLoc = locationMap.get("Chennai South Depot");
  const blrLoc = locationMap.get("Bengaluru Tech Logistics");
  const cbeLoc = locationMap.get("Coimbatore Textile Hub");
  const tptLoc = locationMap.get("Tirupati Gateway Hub");
  const gntLoc = locationMap.get("Guntur Junction Depot");
  const wglLoc = locationMap.get("Warangal Express Depot");

  const vikramAgent = agentMap.get("AGENT-101").agentDoc;
  const snehaAgent = agentMap.get("AGENT-102").agentDoc;
  const rohanAgent = agentMap.get("AGENT-103").agentDoc;
  const deepakAgent = agentMap.get("AGENT-104").agentDoc;
  const kavitaAgent = agentMap.get("AGENT-105").agentDoc;
  const manojAgent = agentMap.get("AGENT-106").agentDoc;
  const divyaAgent = agentMap.get("AGENT-108").agentDoc;

  const demoPackagesData = [
    // --- 4 PENDING Packages ---
    {
      trackingNumber: "DLV-DEMO-0001",
      customer: customersList[0],
      packageType: "ELECTRONICS",
      description: "Dell Precision Laptop & Accessories",
      weight: 2.5,
      source: hydLoc,
      destination: vjaLoc,
      service: standardSrv,
      status: "PENDING",
      agent: null,
    },
    {
      trackingNumber: "DLV-DEMO-0002",
      customer: customersList[1],
      packageType: "DOCUMENTS",
      description: "University Academic Certificates & Transcripts",
      weight: 0.5,
      source: chnLoc,
      destination: blrLoc,
      service: expressSrv,
      status: "PENDING",
      agent: null,
    },
    {
      trackingNumber: "DLV-DEMO-0003",
      customer: customersList[2],
      packageType: "BOOKS",
      description: "Medical Reference Handbooks Vol 1-4",
      weight: 3.2,
      source: vjaLoc,
      destination: vizLoc,
      service: standardSrv,
      status: "PENDING",
      agent: null,
    },
    {
      trackingNumber: "DLV-DEMO-0004",
      customer: customersList[3],
      packageType: "FRAGILE",
      description: "Artisan Ceramic Vases & Handicrafts",
      weight: 1.8,
      source: wglLoc,
      destination: tdpLoc,
      service: fragileSrv,
      status: "PENDING",
      agent: null,
    },

    // --- 4 AGENT_ASSIGNED Packages ---
    {
      trackingNumber: "DLV-DEMO-0005",
      customer: customersList[0],
      packageType: "CLOTHING",
      description: "Designer Festive Apparel Package",
      weight: 1.2,
      source: hydLoc,
      destination: wglLoc,
      service: standardSrv,
      status: "AGENT_ASSIGNED",
      agent: vikramAgent,
      score: 92.5,
      dist: 12.4,
      eta: 35,
    },
    {
      trackingNumber: "DLV-DEMO-0006",
      customer: customersList[1],
      packageType: "FOOD",
      description: "Organic Specialty Teas & Spices Crate",
      weight: 1.5,
      source: chnLoc,
      destination: cbeLoc,
      service: expressSrv,
      status: "AGENT_ASSIGNED",
      agent: snehaAgent,
      score: 89.2,
      dist: 18.2,
      eta: 45,
    },
    {
      trackingNumber: "DLV-DEMO-0007",
      customer: customersList[2],
      packageType: "ELECTRONICS",
      description: "Noise Cancelling Headphones & Mic",
      weight: 0.8,
      source: hydLoc,
      destination: vjaLoc,
      service: expressSrv,
      status: "AGENT_ASSIGNED",
      agent: kavitaAgent,
      score: 94.1,
      dist: 9.8,
      eta: 25,
    },
    {
      trackingNumber: "DLV-DEMO-0008",
      customer: customersList[4],
      packageType: "DOCUMENTS",
      description: "Commercial Lease & Property Deeds",
      weight: 0.4,
      source: blrLoc,
      destination: chnLoc,
      service: expressSrv,
      status: "AGENT_ASSIGNED",
      agent: divyaAgent,
      score: 91.0,
      dist: 14.5,
      eta: 40,
    },

    // --- 3 PICKED_UP Packages ---
    {
      trackingNumber: "DLV-DEMO-0009",
      customer: customersList[0],
      packageType: "MEDICAL",
      description: "Temperature-Controlled Diagnostic Kits",
      weight: 1.0,
      source: vjaLoc,
      destination: gntLoc,
      service: expressSrv,
      status: "PICKED_UP",
      agent: snehaAgent,
      score: 88.7,
      dist: 22.0,
      eta: 50,
    },
    {
      trackingNumber: "DLV-DEMO-0010",
      customer: customersList[3],
      packageType: "ELECTRONICS",
      description: "Mechanical Keyboards & Gaming Mice",
      weight: 2.1,
      source: hydLoc,
      destination: blrLoc,
      service: standardSrv,
      status: "PICKED_UP",
      agent: deepakAgent,
      score: 86.4,
      dist: 30.5,
      eta: 65,
    },
    {
      trackingNumber: "DLV-DEMO-0011",
      customer: customersList[5],
      packageType: "CLOTHING",
      description: "Winter Jackets & Outdoor Gear",
      weight: 3.5,
      source: vjaLoc,
      destination: tptLoc,
      service: standardSrv,
      status: "PICKED_UP",
      agent: manojAgent,
      score: 84.2,
      dist: 25.0,
      eta: 55,
    },

    // --- 4 IN_TRANSIT Packages ---
    {
      trackingNumber: "DLV-DEMO-0012",
      customer: customersList[1],
      packageType: "ELECTRONICS",
      description: "Smart Tablets & Stylus Bundles",
      weight: 1.9,
      source: hydLoc,
      destination: vjaLoc,
      service: sameDaySrv,
      status: "IN_TRANSIT",
      agent: deepakAgent,
      score: 87.0,
      dist: 28.0,
      eta: 60,
    },
    {
      trackingNumber: "DLV-DEMO-0013",
      customer: customersList[0],
      packageType: "DOCUMENTS",
      description: "Architectural Blueprints & Contracts",
      weight: 0.9,
      source: vjaLoc,
      destination: vizLoc,
      service: expressSrv,
      status: "IN_TRANSIT",
      agent: manojAgent,
      score: 85.5,
      dist: 24.1,
      eta: 50,
    },
    {
      trackingNumber: "DLV-DEMO-0014",
      customer: customersList[2],
      packageType: "FRAGILE",
      description: "High-Precision Laboratory Glassware",
      weight: 1.6,
      source: hydLoc,
      destination: blrLoc,
      service: fragileSrv,
      status: "IN_TRANSIT",
      agent: deepakAgent,
      score: 86.0,
      dist: 32.0,
      eta: 70,
    },
    {
      trackingNumber: "DLV-DEMO-0015",
      customer: customersList[3],
      packageType: "FOOD",
      description: "Assorted Gourmet Chocolates & Confectionery",
      weight: 1.1,
      source: tptLoc,
      destination: vjaLoc,
      service: expressSrv,
      status: "IN_TRANSIT",
      agent: manojAgent,
      score: 83.9,
      dist: 26.5,
      eta: 55,
    },

    // --- 5 DELIVERED Packages ---
    {
      trackingNumber: "DLV-DEMO-0016",
      customer: customersList[0],
      packageType: "ELECTRONICS",
      description: "Smartwatch & Fitness Trackers",
      weight: 0.6,
      source: hydLoc,
      destination: wglLoc,
      service: standardSrv,
      status: "DELIVERED",
      agent: vikramAgent,
      score: 95.0,
      dist: 8.0,
      eta: 20,
    },
    {
      trackingNumber: "DLV-DEMO-0017",
      customer: customersList[1],
      packageType: "CLOTHING",
      description: "Formal Shirts & Tailored Suits",
      weight: 2.0,
      source: chnLoc,
      destination: cbeLoc,
      service: standardSrv,
      status: "DELIVERED",
      agent: snehaAgent,
      score: 91.2,
      dist: 15.0,
      eta: 35,
    },
    {
      trackingNumber: "DLV-DEMO-0018",
      customer: customersList[4],
      packageType: "BOOKS",
      description: "Engineering Mathematics Volumes I-III",
      weight: 2.8,
      source: blrLoc,
      destination: chnLoc,
      service: standardSrv,
      status: "DELIVERED",
      agent: rohanAgent,
      score: 88.0,
      dist: 16.5,
      eta: 40,
    },
    {
      trackingNumber: "DLV-DEMO-0019",
      customer: customersList[5],
      packageType: "MEDICAL",
      description: "First Aid Safety Equipment Pack",
      weight: 1.4,
      source: hydLoc,
      destination: vjaLoc,
      service: expressSrv,
      status: "DELIVERED",
      agent: kavitaAgent,
      score: 93.4,
      dist: 11.0,
      eta: 30,
    },
    {
      trackingNumber: "DLV-DEMO-0020",
      customer: customersList[2],
      packageType: "DOCUMENTS",
      description: "Patent Filing & Legal Documentation",
      weight: 0.5,
      source: blrLoc,
      destination: hydLoc,
      service: expressSrv,
      status: "DELIVERED",
      agent: divyaAgent,
      score: 90.5,
      dist: 13.0,
      eta: 35,
    },

    // --- 2 OUT_FOR_DELIVERY Packages ---
    {
      trackingNumber: "DLV-DEMO-0021",
      customer: customersList[0], // Rahul (Demo Customer)
      packageType: "ELECTRONICS",
      description: "Noise-Cancelling Studio Headset",
      weight: 1.1,
      source: hydLoc,
      destination: vjaLoc,
      service: expressSrv,
      status: "OUT_FOR_DELIVERY",
      agent: vikramAgent, // Vikram (Demo Agent)
      score: 96.0,
      dist: 6.2,
      eta: 15,
    },
    {
      trackingNumber: "DLV-DEMO-0022",
      customer: customersList[1],
      packageType: "DOCUMENTS",
      description: "Priority Commercial Contract",
      weight: 0.3,
      source: chnLoc,
      destination: cbeLoc,
      service: expressSrv,
      status: "OUT_FOR_DELIVERY",
      agent: snehaAgent,
      score: 93.5,
      dist: 9.0,
      eta: 25,
    },
  ];

  for (let idx = 0; idx < demoPackagesData.length; idx++) {
    const item = demoPackagesData[idx];
    const tracking = item.trackingNumber;

    const sourceSnapshot = {
      address: `10${idx + 1}, Logistics Park`,
      city: item.source.city,
      state: item.source.state,
      postalCode: item.source.postalCode,
      latitude: item.source.latitude,
      longitude: item.source.longitude,
    };

    const destinationSnapshot = {
      address: `50${idx + 1}, Trade Center`,
      city: item.destination.city,
      state: item.destination.state,
      postalCode: item.destination.postalCode,
      latitude: item.destination.latitude,
      longitude: item.destination.longitude,
    };

    let pkg = await packagesCollection.findOne({ trackingNumber: tracking });
    const isNew = !pkg;

    const packageDocData: any = {
      trackingNumber: tracking,
      customerId: item.customer._id,
      packageType: item.packageType,
      description: item.description,
      weight: item.weight,
      sourceLocation: sourceSnapshot,
      destinationLocation: destinationSnapshot,
      serviceId: item.service._id,
      scheduledDate: new Date(now.getTime() + (idx - 10) * 86400000),
      status: item.status,
      assignedAgentId: item.agent ? item.agent._id : null,
      proofOfDelivery: null,
      latestException: null,
      updatedAt: now,
    };

    if (item.agent) {
      packageDocData.assignmentScore = item.score;
      packageDocData.assignmentDistanceKm = item.dist;
      packageDocData.assignmentEstimatedMinutes = item.eta;
      packageDocData.assignmentReason =
        "Auto-assigned using workload (25%), rating (20%), distance (40%), and on-time performance (15%).";
      packageDocData.assignedAt = new Date(now.getTime() - (20 - idx) * 3600000);
    }

    let currentPkgId: ObjectId;
    let pkgCreatedAt: Date;

    if (isNew) {
      pkgCreatedAt = new Date(now.getTime() - (24 - idx) * 3600000);
      packageDocData.createdAt = pkgCreatedAt;
      const res = await packagesCollection.insertOne(packageDocData);
      currentPkgId = res.insertedId;
    } else {
      currentPkgId = pkg!._id;
      pkgCreatedAt = pkg!.createdAt ?? now;
      await packagesCollection.updateOne({ _id: currentPkgId }, { $set: packageDocData });
    }

    // Associated Booking, Delivery, and Histories for non-pending packages
    if (item.status !== "PENDING" && item.agent) {
      const bookingNumber = `BK-DEMO-${String(idx + 1).padStart(4, "0")}`;
      const confCode = `CNF${String(idx + 1).padStart(5, "0")}`;

      const bookingStatus =
        item.status === "DELIVERED"
          ? "COMPLETED"
          : "CONFIRMED";

      const bookingDoc = {
        bookingNumber,
        packageId: currentPkgId,
        customerId: item.customer._id,
        agentId: item.agent._id,
        serviceId: item.service._id,
        bookingDate: pkgCreatedAt,
        scheduledDate: packageDocData.scheduledDate,
        status: bookingStatus,
        confirmationCode: confCode,
        cancellationReason: null,
        createdAt: pkgCreatedAt,
        updatedAt: now,
      };

      const existingBooking = await bookingsCollection.findOne({ packageId: currentPkgId });
      let bookingId: ObjectId;
      if (existingBooking) {
        bookingId = existingBooking._id;
        await bookingsCollection.updateOne({ _id: bookingId }, { $set: bookingDoc });
      } else {
        const bRes = await bookingsCollection.insertOne(bookingDoc);
        bookingId = bRes.insertedId;
      }

      // Delivery record
      const deliveryStatus = item.status;
      const pickupTime =
        ["PICKED_UP", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(item.status)
          ? new Date(now.getTime() - (15 - idx) * 1800000)
          : null;
      const actualDeliveryTime =
        item.status === "DELIVERED"
          ? new Date(now.getTime() - (5 - (idx % 5)) * 1800000)
          : null;

      const pickupOtp = pickupTime
        ? {
            otpHash: "$2b$10$demoPickupOtpHashSeededPlaceholder0000000000000000000000",
            purpose: "PICKUP",
            expiresAt: new Date(now.getTime() + 600000),
            attempts: 1,
            maxAttempts: 5,
            verified: true,
            verifiedAt: pickupTime,
            createdAt: new Date(pickupTime.getTime() - 300000),
          }
        : null;

      const deliveryOtp = actualDeliveryTime
        ? {
            otpHash: "$2b$10$demoDeliveryOtpHashSeededPlaceholder000000000000000000000",
            purpose: "DELIVERY",
            expiresAt: new Date(now.getTime() + 600000),
            attempts: 1,
            maxAttempts: 5,
            verified: true,
            verifiedAt: actualDeliveryTime,
            createdAt: new Date(actualDeliveryTime.getTime() - 300000),
          }
        : null;

      const deliveryDoc = {
        packageId: currentPkgId,
        bookingId,
        agentId: item.agent._id,
        currentStatus: deliveryStatus,
        pickupTime,
        estimatedDeliveryTime: new Date(now.getTime() + 7200000),
        actualDeliveryTime,
        pickupOtp,
        deliveryOtp,
        proofOfDelivery: null,
        latestException: null,
        exceptionHistory: [],
        createdAt: pkgCreatedAt,
        updatedAt: now,
      };

      await deliveriesCollection.updateOne(
        { packageId: currentPkgId },
        { $set: deliveryDoc },
        { upsert: true },
      );

      // Seed timeline history records
      await historiesCollection.deleteMany({ packageId: currentPkgId });
      const steps: any[] = [
        {
          packageId: currentPkgId,
          bookingId,
          agentId: null,
          status: "PENDING",
          remarks: "Delivery request submitted by customer.",
          timestamp: pkgCreatedAt,
          changedByUserId: item.customer._id,
        },
        {
          packageId: currentPkgId,
          bookingId,
          agentId: item.agent._id,
          status: "AGENT_ASSIGNED",
          remarks: `Delivery assigned to agent with score ${item.score}%.`,
          timestamp: packageDocData.assignedAt ?? now,
          changedByUserId: item.customer._id,
        },
      ];

        if (pickupTime) {
          steps.push({
            packageId: currentPkgId,
            bookingId,
            agentId: item.agent._id,
            status: "PICKED_UP",
            remarks: "Pickup verified via customer OTP and collected by agent.",
            timestamp: pickupTime,
            changedByUserId: item.agent.userId,
          });
        }

        if (["IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(item.status)) {
          steps.push({
            packageId: currentPkgId,
            bookingId,
            agentId: item.agent._id,
            status: "IN_TRANSIT",
            remarks: "Package in transit between logistic distribution hubs.",
            timestamp: new Date(now.getTime() - (10 - (idx % 4)) * 1800000),
            changedByUserId: item.agent.userId,
          });
        }

        if (["OUT_FOR_DELIVERY", "DELIVERED"].includes(item.status)) {
          steps.push({
            packageId: currentPkgId,
            bookingId,
            agentId: item.agent._id,
            status: "OUT_FOR_DELIVERY",
            remarks: "Courier agent is out for final mile delivery.",
            timestamp: new Date(now.getTime() - (8 - (idx % 3)) * 1800000),
            changedByUserId: item.agent.userId,
          });
        }

        if (actualDeliveryTime) {
          steps.push({
            packageId: currentPkgId,
            bookingId,
            agentId: item.agent._id,
            status: "DELIVERED",
            remarks: "Final delivery handover verified via Customer Delivery OTP.",
            timestamp: actualDeliveryTime,
            changedByUserId: item.agent.userId,
          });
        }

        await historiesCollection.insertMany(steps);
    } else {
      // Pending package initial history
      await historiesCollection.deleteMany({ packageId: currentPkgId });
      await historiesCollection.insertOne({
        packageId: currentPkgId,
        bookingId: null,
        agentId: null,
        status: "PENDING",
        remarks: "Delivery request created and waiting for assignment.",
        timestamp: pkgCreatedAt,
        changedByUserId: item.customer._id,
      });
    }
  }

  console.log("6/7 Verifying package distribution...");
  const counts = await packagesCollection
    .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
    .toArray();
  console.log("Status distribution:", counts);

  console.log("7/7 Demo seed completed successfully!");
  console.log("==================================================");
  console.log("DEMO CREDENTIALS SUMMARY");
  console.log("==================================================");
  console.log("Admin:    admin.demo@deliveryhub.local     / Admin@123");
  console.log("Customer: rahul.demo@deliveryhub.local     / Demo@123");
  console.log("Customer: priya.demo@deliveryhub.local     / Demo@123");
  console.log("Agent:    agent.vikram@deliveryhub.local   / Agent@123");
  console.log("Agent:    agent.sneha@deliveryhub.local    / Agent@123");
  console.log("Agent:    agent.deepak@deliveryhub.local   / Agent@123");
  console.log("==================================================");

}

if (require.main === module) {
  runDemoSeed()
    .catch((err) => {
      console.error("Demo seed error:", err);
      process.exit(1);
    })
    .finally(async () => {
      await disconnectMongoDB();
    });
}
