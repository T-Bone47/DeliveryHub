const http = require('http');
const fs = require('fs');
const path = require('path');

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

function fetchRaw(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    http.get(url, (res) => {
      resolve({ status: res.statusCode, contentType: res.headers['content-type'] });
    }).on('error', reject);
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

// 1x1 pixel transparent PNG data URI
const SAMPLE_BASE64_PHOTO =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function runTests() {
  console.log('====================================================');
  console.log('DELIVERYHUB — PROOF OF DELIVERY & EXCEPTION TESTS');
  console.log('====================================================');

  console.log('\n0. Demo seed already initialized...');
  // const { runDemoSeed } = require('./dist/seed/seed-demo.js');
  // await runDemoSeed();

  console.log('\n1. Authenticating test users...');
  const customerToken = await login('rahul.demo@deliveryhub.local', 'Demo@123');
  const otherCustomerToken = await login('priya.demo@deliveryhub.local', 'Demo@123');
  const agentToken = await login('agent.vikram@deliveryhub.local', 'Agent@123');
  const otherAgentToken = await login('agent.sneha@deliveryhub.local', 'Agent@123');
  const adminToken = await login('admin.demo@deliveryhub.local', 'Admin@123');
  console.log('All 5 accounts authenticated.');

  console.log('\n====================================================');
  console.log('====================================================');

  // Create a dedicated package for POD test flow
  const srvRes = await request('GET', '/api/services', null, customerToken);
  const srvId = srvRes.data.data.services[0].id;
  const lRes = await request('GET', '/api/locations', null, adminToken);
  const locations = lRes.data.data.locations;

  const createPkgRes = await request('POST', '/api/packages', {
    packageType: 'CLOTHING',
    description: 'Digital Proof of Delivery Demonstration',
    weight: 1.5,
    sourceLocation: {
      address: 'Hub Facility 101, Industrial Corridor',
      city: locations[0].city,
      state: locations[0].state,
      postalCode: locations[0].postalCode,
      latitude: locations[0].latitude,
      longitude: locations[0].longitude,
    },
    destinationLocation: {
      address: 'Suite 404, Tech Horizon Park',
      city: locations[1].city,
      state: locations[1].state,
      postalCode: locations[1].postalCode,
      latitude: locations[1].latitude,
      longitude: locations[1].longitude,
    },
    serviceId: srvId,
    scheduledDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  }, customerToken);
  assert(createPkgRes.status === 201, 'Created dedicated package for POD test');
  const pkgId = createPkgRes.data.data.package.id;

  // Retrieve assigned agent and dynamically determine correct agent token
  const initialDetails = await request('GET', `/api/packages/${pkgId}`, null, customerToken);
  const assignedAgentId = initialDetails.data.data.assignment.agentId;
  const assignedAgentName = initialDetails.data.data.assignment.agentName;
  console.log(`POD package assigned to courier: ${assignedAgentName} (${assignedAgentId})`);

  let assignedAgentToken = agentToken;
  let unassignedAgentToken = otherAgentToken;
  const probe = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'PICKED_UP' }, otherAgentToken);
  if (probe.status !== 403) {
    assignedAgentToken = otherAgentToken;
    unassignedAgentToken = agentToken;
  }

  // Pickup OTP
  console.log('\nStep 1.1: Customer generates Pickup OTP and Agent verifies...');
  const genPickupRes = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'PICKUP' }, customerToken);
  assert(genPickupRes.status === 200, 'Customer generated Pickup OTP');
  const pickupOtp = genPickupRes.data.data.otp;

  const verifyPickupRes = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'PICKUP', otp: pickupOtp }, assignedAgentToken);
  assert(verifyPickupRes.status === 200, 'Agent verified Pickup OTP');
  assert(verifyPickupRes.data.data.package.status === 'PICKED_UP', 'Package transitioned to PICKED_UP');

  // Transit & Out for Delivery
  console.log('\nStep 1.2: Agent moves package to IN_TRANSIT then OUT_FOR_DELIVERY...');
  const transitRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'IN_TRANSIT' }, assignedAgentToken);
  assert(transitRes.status === 200, 'Package status updated to IN_TRANSIT');

  const outRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'OUT_FOR_DELIVERY' }, assignedAgentToken);
  assert(outRes.status === 200, 'Package status updated to OUT_FOR_DELIVERY');

  // Customer generates Delivery OTP
  console.log('\nStep 1.3: Customer generates Delivery OTP...');
  const genDeliveryRes = await request('POST', `/api/packages/${pkgId}/otp`, { purpose: 'DELIVERY' }, customerToken);
  assert(genDeliveryRes.status === 200, 'Customer generated Delivery OTP');
  const deliveryOtp = genDeliveryRes.data.data.otp;

  // Edge Case: Agent tries to complete delivery without OTP
  console.log('\nStep 1.4: Testing completion guard before OTP verification...');
  const prematureDeliveredRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'DELIVERED' }, assignedAgentToken);
  assert(prematureDeliveredRes.status === 400, 'Premature DELIVERED blocked when OTP not verified (400)');

  // Agent verifies delivery OTP
  console.log('\nStep 1.5: Agent verifies customer Delivery OTP...');
  const verifyDeliveryRes = await request('POST', `/api/packages/${pkgId}/otp/verify`, { purpose: 'DELIVERY', otp: deliveryOtp }, assignedAgentToken);
  assert(verifyDeliveryRes.status === 200, 'Delivery OTP verified successfully');
  assert(verifyDeliveryRes.data.data.package.status === 'OUT_FOR_DELIVERY', 'Status remains OUT_FOR_DELIVERY until POD uploaded');
  assert(verifyDeliveryRes.data.data.delivery.deliveryOtp.verified === true, 'deliveryOtp.verified is true');

  // Edge Case: Agent tries to complete delivery without POD photo
  console.log('\nStep 1.6: Testing completion guard before POD photo upload...');
  const prematureWithoutPodRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'DELIVERED' }, assignedAgentToken);
  assert(prematureWithoutPodRes.status === 400, 'DELIVERED blocked when POD photo missing (400)');

  // Edge Case: Customer attempts to upload POD
  console.log('\nStep 1.7: Role permissions on POD upload...');
  const custUploadRes = await request('POST', `/api/packages/${pkgId}/proof`, { photoData: SAMPLE_BASE64_PHOTO }, customerToken);
  assert(custUploadRes.status === 403, 'Customer blocked from uploading POD (403)');

  // Edge Case: Other agent attempts to upload POD
  const otherAgentUploadRes = await request('POST', `/api/packages/${pkgId}/proof`, { photoData: SAMPLE_BASE64_PHOTO }, unassignedAgentToken);
  assert(otherAgentUploadRes.status === 403, 'Unauthorized agent blocked from uploading POD (403)');

  // Agent uploads POD photo
  console.log('\nStep 1.8: Assigned Agent uploads Proof of Delivery photo...');
  const agentUploadRes = await request('POST', `/api/packages/${pkgId}/proof`, { photoData: SAMPLE_BASE64_PHOTO }, assignedAgentToken);
  assert(agentUploadRes.status === 200, 'Agent successfully uploaded POD photo (200)');
  const podPhotoUrl = agentUploadRes.data?.data?.proofOfDelivery?.photoUrl || agentUploadRes.data?.data?.delivery?.proofOfDelivery?.photoUrl;
  assert(!!podPhotoUrl && podPhotoUrl.startsWith('/uploads/pod/'), `POD photo saved to ${podPhotoUrl}`);

  // Static file serving verification
  console.log('\nStep 1.9: Verifying static file serving via Express...');
  const staticRes = await fetchRaw(podPhotoUrl);
  assert(staticRes.status === 200, `Uploaded photo served statically at ${podPhotoUrl} (200 OK)`);
  assert(staticRes.contentType?.includes('image/png'), `Correct content-type image/png served: ${staticRes.contentType}`);

  // Agent completes delivery
  console.log('\nStep 1.10: Agent completes delivery transition...');
  const finalDeliveredRes = await request('PATCH', `/api/packages/${pkgId}/status`, { status: 'DELIVERED' }, assignedAgentToken);
  assert(finalDeliveredRes.status === 200, 'Delivery successfully marked DELIVERED (200)');
  assert(finalDeliveredRes.data.data.package.status === 'DELIVERED', 'Package status is now DELIVERED');
  assert(finalDeliveredRes.data.data.delivery.currentStatus === 'DELIVERED', 'Delivery record marked DELIVERED');

  // Customer & Admin can view POD
  console.log('\nStep 1.11: Customer and Admin view Proof of Delivery...');
  const custProofRes = await request('GET', `/api/packages/${pkgId}/proof`, null, customerToken);
  assert(custProofRes.status === 200, 'Customer retrieved Proof of Delivery');
  assert(custProofRes.data.data.otpVerified === true, 'Proof confirms OTP was verified');
  assert(custProofRes.data.data.photoUrl === podPhotoUrl, 'Proof photo URL matches');

  const adminProofRes = await request('GET', `/api/packages/${pkgId}/proof`, null, adminToken);
  assert(adminProofRes.status === 200, 'Admin retrieved Proof of Delivery');

  // Edge Case: Cannot reschedule a delivered package
  console.log('\nStep 1.12: Guard against rescheduling DELIVERED package...');
  const rescheduleDeliveredRes = await request('POST', `/api/packages/${pkgId}/reschedule`, {
    rescheduledDate: new Date(Date.now() + 86400000).toISOString(),
  }, customerToken);
  assert(rescheduleDeliveredRes.status === 400, 'Customer blocked from rescheduling DELIVERED package (400)');

  console.log('\n====================================================');
  console.log('TEST SUITE 2: DELIVERY EXCEPTION & RESCHEDULING FLOW');
  console.log('====================================================');

  // Create a new package as customer
  console.log('\nStep 2.1: Customer creates a new delivery request...');
  const servicesRes = await request('GET', '/api/services', null, customerToken);
  const serviceId = servicesRes.data.data.services[0].id;
  const locationsRes = await request('GET', '/api/locations', null, adminToken);
  const locs = locationsRes.data.data.locations;

  const createExcPkgRes = await request('POST', '/api/packages', {
    packageType: 'ELECTRONICS',
    description: 'College demo exception test laptop',
    weight: 2.5,
    sourceLocation: {
      address: 'Hub Facility 102, Transit Zone',
      city: locs[0].city,
      state: locs[0].state,
      postalCode: locs[0].postalCode,
      latitude: locs[0].latitude,
      longitude: locs[0].longitude,
    },
    destinationLocation: {
      address: 'Suite 202, Metro Business Center',
      city: locs[1].city,
      state: locs[1].state,
      postalCode: locs[1].postalCode,
      latitude: locs[1].latitude,
      longitude: locs[1].longitude,
    },
    serviceId,
    scheduledDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
  }, customerToken);
  assert(createExcPkgRes.status === 201, 'Package created successfully');
  const excPkgId = createExcPkgRes.data.data.package.id;
  assert(!!createExcPkgRes.data.data.assignment?.agentId, 'Agent assigned to package');

  // Get assigned agent user token
  const excDetails = await request('GET', `/api/packages/${excPkgId}`, null, customerToken);
  const excAgentId = excDetails.data.data.assignment.agentId;
  const excAgentName = excDetails.data.data.assignment.agentName;
  console.log(`Package assigned to courier: ${excAgentName} (${excAgentId})`);

  // We have 2 agent tokens: Vikram and Sneha. Determine which is assigned.
  let excAgentToken = agentToken;
  let excUnassignedToken = otherAgentToken;
  // Test which token can access as assigned courier
  const probeExc = await request('POST', `/api/packages/${excPkgId}/exception`, { reason: 'Customer unavailable' }, otherAgentToken);
  if (probeExc.status !== 403) {
    excAgentToken = otherAgentToken;
    excUnassignedToken = agentToken;
  }

  // Edge Case: Customer reporting exception
  console.log('\nStep 2.2: RBAC checks on exception reporting...');
  const custExcRes = await request('POST', `/api/packages/${excPkgId}/exception`, { reason: 'Customer unavailable' }, customerToken);
  assert(custExcRes.status === 403, 'Customer blocked from reporting delivery exception (403)');

  // Edge Case: Invalid reason
  const invalidReasonRes = await request('POST', `/api/packages/${excPkgId}/exception`, { reason: 'Alien abduction' }, excAgentToken);
  assert(invalidReasonRes.status === 400, 'Invalid exception reason rejected with 400');

  // Assigned Agent reports valid exception
  console.log('\nStep 2.3: Agent reports delivery exception...');
  const reportExcRes = await request('POST', `/api/packages/${excPkgId}/exception`, {
    reason: 'Customer unavailable',
    note: 'Customer not answering phone or doorbell after 3 attempts.',
  }, excAgentToken);
  assert(reportExcRes.status === 200, 'Agent reported delivery exception successfully (200)');
  assert(reportExcRes.data.data.package.status === 'FAILED', 'Package status transitioned to FAILED');
  assert(reportExcRes.data.data.latestException?.reason === 'Customer unavailable', 'latestException recorded correctly');
  assert(reportExcRes.data.data.latestException?.attemptNumber === 1, 'attemptNumber is 1');

  // Edge Case: Reschedule with past date
  console.log('\nStep 2.4: Validation on rescheduling date...');
  const pastRescheduleRes = await request('POST', `/api/packages/${excPkgId}/reschedule`, {
    rescheduledDate: new Date(Date.now() - 3600000).toISOString(),
  }, customerToken);
  assert(pastRescheduleRes.status === 400, 'Past date rejected with 400');

  // Edge Case: Other customer tries to reschedule
  const otherCustRescheduleRes = await request('POST', `/api/packages/${excPkgId}/reschedule`, {
    rescheduledDate: new Date(Date.now() + 86400000).toISOString(),
  }, otherCustomerToken);
  assert(otherCustRescheduleRes.status === 403, 'Unauthorized customer blocked from rescheduling (403)');

  // Customer reschedules delivery with valid future date
  console.log('\nStep 2.5: Customer reschedules failed delivery...');
  const futureDate = new Date(Date.now() + 72 * 3600 * 1000).toISOString();
  const rescheduleRes = await request('POST', `/api/packages/${excPkgId}/reschedule`, {
    rescheduledDate: futureDate,
  }, customerToken);
  assert(rescheduleRes.status === 200, 'Delivery successfully rescheduled (200)');
  assert(rescheduleRes.data.data.package.status === 'PENDING' || rescheduleRes.data.data.package.status === 'AGENT_ASSIGNED', 'Status reset and assignment triggered');

  // Verify delivery history audit trail
  console.log('\nStep 2.6: Verifying audit trail in history...');
  const updatedPkgDetails = await request('GET', `/api/packages/${excPkgId}`, null, customerToken);
  const histories = updatedPkgDetails.data.data.history;
  const failedMilestone = histories.find((h) => h.status === 'FAILED');
  assert(!!failedMilestone, 'History contains FAILED milestone');
  assert(failedMilestone?.remarks.includes('Customer unavailable'), 'Milestone remarks include exception reason');

  const rescheduledMilestone = histories.find((h) => h.status === 'RESCHEDULED');
  assert(!!rescheduledMilestone, 'History contains RESCHEDULED milestone');

  console.log('\n====================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
