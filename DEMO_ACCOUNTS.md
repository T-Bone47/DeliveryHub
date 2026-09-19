# DeliveryHub — Demo Accounts & Credentials

> [!WARNING]
> **DEVELOPMENT & DEMONSTRATION USE ONLY**  
> Do NOT use these accounts or passwords in production.

---

## 1. Demo Administrator

| Name | Role | Email | Password | Access Path | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| DeliveryHub Demo Admin | `ADMIN` | `admin.demo@deliveryhub.local` | `Admin@123` | `/admin/login` | Full delivery operations, agent management, assignment retries, service/location settings |
| System Admin (Legacy) | `ADMIN` | `admin@deliveryhub.local` | `Admin@123` | `/admin/login` | Baseline system administrator |

---

## 2. Demo Customers

All demo customer accounts use the password: `Demo@123`

| Name | Email | Phone | Access Path | Seeded Deliveries |
| :--- | :--- | :--- | :--- | :--- |
| **Rahul Sharma** | `rahul.demo@deliveryhub.local` | `+91 98111 00001` | `/customer/login` | 5 packages (Pending, Assigned, Picked Up, In Transit, Delivered) |
| **Priya Nair** | `priya.demo@deliveryhub.local` | `+91 98111 00002` | `/customer/login` | 4 packages (Pending, Assigned, In Transit, Delivered) |
| **Arjun Kumar** | `arjun.demo@deliveryhub.local` | `+91 98111 00003` | `/customer/login` | 4 packages (Pending, Assigned, In Transit, Delivered) |
| **Ananya Rao** | `ananya.demo@deliveryhub.local` | `+91 98111 00004` | `/customer/login` | 3 packages (Pending, Picked Up, In Transit) |
| **Karthik Menon** | `karthik.demo@deliveryhub.local` | `+91 98111 00005` | `/customer/login` | 2 packages (Assigned, Delivered) |
| **Meera Krishnan** | `meera.demo@deliveryhub.local` | `+91 98111 00006` | `/customer/login` | 2 packages (Picked Up, Delivered) |

---

## 3. Demo Delivery Agents

All demo agent accounts use the password: `Agent@123`

| Name | Agent Code | Vehicle | Status | Rating | Active | Email | Access Path | Coverage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Vikram Sethi** | `AGENT-101` | `BIKE` | **AVAILABLE** | 4.90 | 1 | `agent.vikram@deliveryhub.local` | `/agent/login` | Telangana, Andhra Pradesh |
| **Sneha Patel** | `AGENT-102` | `SCOOTER` | **AVAILABLE** | 4.80 | 2 | `agent.sneha@deliveryhub.local` | `/agent/login` | Andhra Pradesh, Tamil Nadu, Telangana |
| **Rohan Verma** | `AGENT-103` | `VAN` | **AVAILABLE** | 4.75 | 0 | `agent.rohan@deliveryhub.local` | `/agent/login` | Karnataka, Tamil Nadu |
| **Deepak Reddy** | `AGENT-104` | `MINI_TRUCK` | **BUSY** | 4.65 | 4 | `agent.deepak@deliveryhub.local` | `/agent/login` | Telangana, Andhra Pradesh, Karnataka |
| **Kavita Joshi** | `AGENT-105` | `SCOOTER` | **AVAILABLE** | 4.92 | 1 | `agent.kavita@deliveryhub.local` | `/agent/login` | Telangana, Andhra Pradesh, Tamil Nadu, Karnataka |
| **Manoj Tiwari** | `AGENT-106` | `BIKE` | **BUSY** | 4.50 | 5 | `agent.manoj@deliveryhub.local` | `/agent/login` | Andhra Pradesh |
| **Suresh Iyer** | `AGENT-107` | `VAN` | **OFFLINE** | 4.40 | 0 | `agent.suresh@deliveryhub.local` | `/agent/login` | Tamil Nadu |
| **Divya Balan** | `AGENT-108` | `BIKE` | **AVAILABLE** | 4.88 | 1 | `agent.divya@deliveryhub.local` | `/agent/login` | Telangana, Karnataka |

---

## 4. Seeding Commands

Run demo seed:
```bash
cd backend
npm run seed:demo
```

The demo seed is **idempotent** and will not generate duplicate users, agents, or locations on repeated execution.
