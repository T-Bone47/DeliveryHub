const http = require('http');

const BASE_URL = 'http://localhost:5000';

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request('POST', '/api/auth/login', { email, password });
  if (res.status !== 200 || !res.data.data?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.data.token;
}

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('DELIVERYHUB — DELIVERY OTP & TRACKING VERIFICATION');
  console.log('====================================================');

  console.log('\n0. Resetting demo seed for pristine verification...');
  try {
    const { runDemoSeed } = require('./dist/seed/seed-demo.js');
    await runDemoSeed();
    await new Promise((r) => setTimeout(r, 1500));
  } catch (err) {
    console.log('Demo seed reset skipped (database already seeded).');
  }

  console.log('\n1. Authenticating test users...');
  const customerToken = await login('rahul.demo@deliveryhub.local', 'Demo@123');
  const otherCustomerToken = await login('priya.demo@deliveryhub.local', 'Demo@123');
  const agentToken = await login('agent.vikram@deliveryhub.local', 'Agent@123');
  const otherAgentToken = await login('agent.sneha@deliveryhub.local', 'Agent@123');
  const adminToken = await login('admin.demo@deliveryhub.local', 'Admin@123');
  console.log('All 5 role accounts authenticated.');

  console.log('\n2. Setting up isolated test package for OTP & tracking verification...');
  let targetPkg;
  const createPkgRes = await request('POST', '/api/packages', {
    pickupAddress: {
      street: '100 HiTech City Rd',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500081',
      latitude: 17.4435,
      longitude: 78.3772,
    },
    deliveryAddress: {
      street: '45 MG Road',
      city: 'Vijayawada',
      state: 'Andhra Pradesh',
      postalCode: '520002',
      latitude: 16.5088,
      longitude: 80.6475,
    },
    packageDetails: {
      weightKg: 1.5,
      dimensionsCm: { length: 15, width: 10, height: 8 },
      category: 'ELECTRONICS',
      value: 2000,
      description: 'Isolated test parcel',
    },
    priority: 'EXPRESS',
  }, customerToken);

  if (createPkgRes.status === 201 && createPkgRes.data?.data) {
    targetPkg = createPkgRes.data.data;
  } else {
    const myPackages = await request('GET', '/api/packages/my?limit=50', null, customerToken);
    targetPkg = myPackages.data.data.packages.find((p) => p.status === 'AGENT_ASSIGNED') || myPackages.data.data.packages[0];
  }

  assert(!!targetPkg, 'Found or created target test package');
  const pkgId = targetPkg.id;
  assert(targetPkg.status === 'AGENT_ASSIGNED' || targetPkg.status === 'PENDING', 'Package is in valid dispatch state');

  console.log('\n3. Testing Security Matrix: Unauthorized OTP Generation...');
  const otherCustOtp = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'PICKUP' }, otherCustomerToken);
  assert(otherCustOtp.status === 404 || otherCustOtp.status === 403, 'Unauthorized customer blocked from generating OTP (403/404)');

  const agentGenOtp = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'PICKUP' }, agentToken);
  assert(agentGenOtp.status === 403, 'Agent blocked from generating customer OTP (403)');

  const invalidPurposeOtp = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'DELIVERY' }, customerToken);
  assert(invalidPurposeOtp.status === 400, 'Generating DELIVERY OTP while in AGENT_ASSIGNED state blocked (400)');

  console.log('\n4. Customer generates Pickup OTP...');
  const genRes = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'PICKUP' }, customerToken);
  assert(genRes.status === 200, 'Customer successfully generated Pickup OTP (200)');
  assert(typeof genRes.data.data.otp === 'string' && genRes.data.data.otp.length === 6, 'OTP is 6 digits');
  const rawPickupOtp = genRes.data.data.otp;
  console.log(`     Generated Code: ${rawPickupOtp}`);

  console.log('\n5. Verifying plaintext OTP is NOT leaked in GET requests...');
  const getPkg = await request('GET', `/api/packages/${pkgId}`, null, customerToken);
  console.log('GET PKG RESPONSE:', getPkg.status, JSON.stringify(getPkg.data));
  assert(getPkg.status === 200, 'GET /packages/:id returned 200');
  assert(!getPkg.data.data?.delivery?.pickupOtp?.otp, 'Plaintext OTP is not leaked in GET /packages/:id');
  assert(!getPkg.data.data?.delivery?.pickupOtp?.otpHash, 'OTP bcrypt hash is not leaked to client');
  assert(getPkg.data.data?.delivery?.pickupOtp?.verified === false, 'pickupOtp.verified is false');

  console.log('\n6. Testing Security Matrix: Unauthorized OTP Verification...');
  const otherAgentVerify = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'PICKUP', otp: rawPickupOtp }, otherAgentToken);
  assert(otherAgentVerify.status === 403, 'Unassigned agent blocked from verifying OTP (403)');

  const custVerify = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'PICKUP', otp: rawPickupOtp }, customerToken);
  assert(custVerify.status === 403, 'Customer blocked from calling verify endpoint (403)');

  const wrongPurposeVerify = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'DELIVERY', otp: rawPickupOtp }, agentToken);
  assert(wrongPurposeVerify.status === 400, 'Pickup OTP cannot verify DELIVERY purpose (400)');

  console.log('\n7. Testing Incorrect OTP & Brute-Force Rate Limiting...');
  const wrongRes1 = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'PICKUP', otp: '000000' }, agentToken);
  assert(wrongRes1.status === 400, 'Incorrect OTP rejected (400)');
  assert(wrongRes1.data.message.includes('4'), 'Attempts decremented to 4');

  // Fail remaining attempts to exhaust limit
  for (let i = 2; i <= 5; i++) {
    await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'PICKUP', otp: '000000' }, agentToken);
  }
  const exhaustedRes = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'PICKUP', otp: rawPickupOtp }, agentToken);
  assert(exhaustedRes.status === 400 && (exhaustedRes.data.message.includes('exceeded') || exhaustedRes.data.message.includes('attempts')), 'Exhausted OTP locked out even with correct code');

  console.log('\n8. Customer regenerates Pickup OTP and Agent verifies...');
  const regenRes = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'PICKUP' }, customerToken);
  assert(regenRes.status === 200, 'Customer regenerated new Pickup OTP');
  const validPickupOtp = regenRes.data.data.otp;
  console.log(`     Fresh Pickup Code: ${validPickupOtp}`);

  const validVerifyRes = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'PICKUP', otp: validPickupOtp }, agentToken);
  assert(validVerifyRes.status === 200, 'Correct Pickup OTP verified successfully');
  assert(validVerifyRes.data.data.package.status === 'PICKED_UP', 'Status transitioned to PICKED_UP');
  assert(!!validVerifyRes.data.data.delivery.pickupTime, 'pickupTime recorded on delivery document');
  assert(validVerifyRes.data.data.delivery.pickupOtp.verified === true, 'pickupOtp.verified is true');

  console.log('\n9. Testing OTP Reuse Prevention...');
  const reuseRes = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'PICKUP', otp: validPickupOtp }, agentToken);
  assert(reuseRes.status === 400 || reuseRes.status === 409, 'Verified OTP cannot be reused (400/409)');

  console.log('\n10. Testing Agent Tracking Transitions (State Machine)...');
  const custTrackRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'IN_TRANSIT' }, customerToken);
  assert(custTrackRes.status === 403, 'Customer cannot update delivery tracking status (403)');

  const otherAgentTrack = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'IN_TRANSIT' }, otherAgentToken);
  assert(otherAgentTrack.status === 403, 'Unassigned agent cannot update tracking status (403)');

  const invalidDirectDelivered = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'DELIVERED' }, agentToken);
  assert(invalidDirectDelivered.status === 400, 'Direct transition PICKED_UP -> DELIVERED rejected (400)');

  const transitRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'IN_TRANSIT' }, agentToken);
  assert(transitRes.status === 200, 'Agent updated status to IN_TRANSIT');
  assert(transitRes.data.data.package.status === 'IN_TRANSIT', 'Package status is now IN_TRANSIT');

  const outRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'OUT_FOR_DELIVERY' }, agentToken);
  assert(outRes.status === 200, 'Agent updated status to OUT_FOR_DELIVERY');
  assert(outRes.data.data.package.status === 'OUT_FOR_DELIVERY', 'Package status is now OUT_FOR_DELIVERY');

  console.log('\n11. Testing Delivery OTP Handover & Final Completion...');
  const directCompleteWithoutOtp = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'DELIVERED' }, agentToken);
  assert(directCompleteWithoutOtp.status === 400 && (directCompleteWithoutOtp.data.message.includes('delivery OTP') || directCompleteWithoutOtp.data.code === 'DELIVERY_OTP_REQUIRED'), 'Bypassing Delivery OTP blocked (400)');

  const genDeliveryOtp = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'DELIVERY' }, customerToken);
  assert(genDeliveryOtp.status === 200, 'Customer generated Delivery OTP');
  const validDeliveryOtp = genDeliveryOtp.data.data.otp;
  console.log(`     Delivery Code: ${validDeliveryOtp}`);

  const verifyDeliveryRes = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'DELIVERY', otp: validDeliveryOtp }, agentToken);
  assert(verifyDeliveryRes.status === 200, 'Delivery OTP verified successfully');
  assert(verifyDeliveryRes.data.data.package.status === 'OUT_FOR_DELIVERY', 'Status remains OUT_FOR_DELIVERY pending POD');
  assert(verifyDeliveryRes.data.data.delivery.deliveryOtp.verified === true, 'deliveryOtp.verified is true');

  // Feature 1: Upload Proof of Delivery before completing delivery
  const samplePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const podRes = await request('POST', `/api/packages/${pkgId}/proof`, { photoData: samplePhoto }, agentToken);
  assert(podRes.status === 200, 'Proof of delivery uploaded successfully');

  const completeRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'DELIVERED' }, agentToken);
  assert(completeRes.status === 200, 'Status transitioned to DELIVERED');
  assert(!!completeRes.data.data.delivery.actualDeliveryTime, 'actualDeliveryTime recorded');

  console.log('\n12. Testing Terminal State Protection...');
  const postTerminalOtp = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'DELIVERY' }, customerToken);
  assert(postTerminalOtp.status === 400, 'Generating OTP on DELIVERED package rejected (400)');

  const postTerminalUpdate = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'OUT_FOR_DELIVERY' }, agentToken);
  assert(postTerminalUpdate.status === 400 || postTerminalUpdate.status === 409, 'Updating tracking on DELIVERED package rejected (400/409)');

  console.log('\n13. Verifying Delivery History & Booking Completion...');
  const finalDetails = await request('GET', `/api/packages/${pkgId}`, null, adminToken);
  assert(finalDetails.data.data.booking.status === 'COMPLETED', 'Booking status transitioned to COMPLETED');
  const historyStatuses = finalDetails.data.data.history.map((h) => h.status);
  console.log('     Complete history sequence:', historyStatuses.join(' -> '));
  assert(historyStatuses.includes('PENDING') || historyStatuses.includes('AGENT_ASSIGNED'), 'History has initial state (PENDING or AGENT_ASSIGNED)');
  assert(historyStatuses.includes('AGENT_ASSIGNED'), 'History has AGENT_ASSIGNED');
  assert(historyStatuses.includes('PICKED_UP'), 'History has PICKED_UP');
  assert(historyStatuses.includes('IN_TRANSIT'), 'History has IN_TRANSIT');
  assert(historyStatuses.includes('OUT_FOR_DELIVERY'), 'History has OUT_FOR_DELIVERY');
  assert(historyStatuses.includes('DELIVERED'), 'History has DELIVERED');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
