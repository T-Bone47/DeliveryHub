const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'C:\\Users\\olive\\.gemini\\antigravity-ide\\brain\\4608294d-57d8-427f-b9c9-e02c858f9c89';
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function request(method, urlPath, body, token, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(`http://localhost:5000${urlPath}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json().catch(() => null);
      if (res.status >= 500 && attempt < retries) {
        console.warn(`[WARN] 500 on ${method} ${urlPath}, retrying (${attempt}/${retries})...`);
        await sleep(1500);
        continue;
      }
      return { status: res.status, data };
    } catch (err) {
      if (attempt < retries) {
        console.warn(`[WARN] Network error on ${method} ${urlPath}: ${err.message}, retrying (${attempt}/${retries})...`);
        await sleep(1500);
        continue;
      }
      throw err;
    }
  }
}

async function runVisualE2E() {
  console.log('====================================================');
  console.log('DELIVERYHUB — VISUAL DEMO & SCREENSHOT GENERATOR');
  console.log('====================================================');

  console.log('1. Setting up admin session & fetching user directory...');
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin.demo@deliveryhub.local',
    password: 'Admin@123'
  });
  const adminToken = adminLogin.data.data.token;
  const adminUser = adminLogin.data.data.user;

  // Get all users to build an ID-to-email map
  const usersRes = await request('GET', '/api/users', null, adminToken);
  const allUsers = usersRes.data.data.users;
  const userMap = {};
  for (const u of allUsers) {
    userMap[u.id] = u;
  }

  // Customer Rahul Sharma login
  const customerLogin = await request('POST', '/api/auth/login', {
    email: 'rahul.demo@deliveryhub.local',
    password: 'Demo@123'
  });
  const customerToken = customerLogin.data.data.token;
  const customerUser = customerLogin.data.data.user;

  const adminLocs = await request('GET', '/api/locations', null, adminToken);
  const locs = adminLocs.data.data.locations;
  const servicesRes = await request('GET', '/api/services', null, customerToken);
  const serviceId = servicesRes.data.data.services[0].id;

  // ----------------------------------------------------
  // Scenario A: Customer Failed Delivery (Reschedule Demo)
  // ----------------------------------------------------
  console.log('\n2. Creating Failed Package for Rahul Sharma...');
  const failedPkgRes = await request('POST', '/api/packages', {
    packageType: 'DOCUMENT',
    description: 'Urgent Property Registration Deed',
    weight: 0.4,
    sourceLocation: {
      address: 'Tower A, Financial District',
      city: locs[0].city,
      state: locs[0].state,
      postalCode: locs[0].postalCode,
      latitude: locs[0].latitude,
      longitude: locs[0].longitude
    },
    destinationLocation: {
      address: 'Plot 88, Jubilee Hills',
      city: locs[1].city,
      state: locs[1].state,
      postalCode: locs[1].postalCode,
      latitude: locs[1].latitude,
      longitude: locs[1].longitude
    },
    serviceId,
    scheduledDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  }, customerToken);
  const failedPkg = failedPkgRes.data.data.package;
  await sleep(1000);

  // Find assigned courier for failed package and report exception
  const failedDetails = await request('GET', `/api/packages/${failedPkg.id}`, null, customerToken);
  const failedAgentUserId = failedDetails.data.data.assignedAgent?.userId;
  const failedAgentUser = userMap[failedAgentUserId] || { email: 'agent.vikram@deliveryhub.local' };
  const failedAgentLogin = await request('POST', '/api/auth/login', {
    email: failedAgentUser.email,
    password: 'Agent@123'
  });
  const failedAgentToken = failedAgentLogin.data.data.token;
  await sleep(1000);

  await request('POST', `/api/packages/${failedPkg.id}/exception`, {
    reason: 'Customer unavailable',
    note: 'Door locked, security guard confirmed resident is traveling until tomorrow.'
  }, failedAgentToken);
  console.log(`✓ Failed package created and exception recorded: ${failedPkg.trackingNumber}`);
  await sleep(1000);

  // ----------------------------------------------------
  // Scenario B: Delivered Package with Digital POD for Rahul
  // ----------------------------------------------------
  console.log('\n3. Creating Delivered Package with Proof of Delivery for Rahul Sharma...');
  const deliveredPkgRes = await request('POST', '/api/packages', {
    packageType: 'ELECTRONICS',
    description: 'Sony WH-1000XM5 Wireless Headphones',
    weight: 1.2,
    sourceLocation: {
      address: 'Logistics Park, Shamshabad',
      city: locs[0].city,
      state: locs[0].state,
      postalCode: locs[0].postalCode,
      latitude: locs[0].latitude,
      longitude: locs[0].longitude
    },
    destinationLocation: {
      address: 'Apartment 4B, Gachibowli High Street',
      city: locs[1].city,
      state: locs[1].state,
      postalCode: locs[1].postalCode,
      latitude: locs[1].latitude,
      longitude: locs[1].longitude
    },
    serviceId,
    scheduledDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  }, customerToken);
  const deliveredPkg = deliveredPkgRes.data.data.package;
  await sleep(1000);

  const dlvDetails = await request('GET', `/api/packages/${deliveredPkg.id}`, null, customerToken);
  const dlvAgentUserId = dlvDetails.data.data.assignedAgent?.userId;
  const dlvAgentUser = userMap[dlvAgentUserId] || { email: 'agent.vikram@deliveryhub.local' };
  const dlvAgentLogin = await request('POST', '/api/auth/login', {
    email: dlvAgentUser.email,
    password: 'Agent@123'
  });
  const dlvAgentToken = dlvAgentLogin.data.data.token;
  await sleep(1000);

  // Pickup OTP
  const pOtpRes = await request('POST', `/api/packages/${deliveredPkg.id}/otp`, { purpose: 'PICKUP' }, customerToken);
  await request('POST', `/api/packages/${deliveredPkg.id}/otp/verify`, { purpose: 'PICKUP', otp: pOtpRes.data.data.otp }, dlvAgentToken);
  await request('PATCH', `/api/packages/${deliveredPkg.id}/status`, { status: 'IN_TRANSIT' }, dlvAgentToken);
  await request('PATCH', `/api/packages/${deliveredPkg.id}/status`, { status: 'OUT_FOR_DELIVERY' }, dlvAgentToken);
  await sleep(1000);

  // Delivery OTP
  const dOtpRes = await request('POST', `/api/packages/${deliveredPkg.id}/otp`, { purpose: 'DELIVERY' }, customerToken);
  await request('POST', `/api/packages/${deliveredPkg.id}/otp/verify`, { purpose: 'DELIVERY', otp: dOtpRes.data.data.otp }, dlvAgentToken);
  await sleep(1000);

  // POD Photo Upload
  const samplePhoto = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  await request('POST', `/api/packages/${deliveredPkg.id}/proof`, { photoData: samplePhoto }, dlvAgentToken);
  await request('PATCH', `/api/packages/${deliveredPkg.id}/status`, { status: 'DELIVERED' }, dlvAgentToken);
  console.log(`✓ Delivered package completed with POD: ${deliveredPkg.trackingNumber}`);
  await sleep(1000);

  // ----------------------------------------------------
  // Scenario C: Active OUT_FOR_DELIVERY Package for Agent Console
  // ----------------------------------------------------
  console.log('\n4. Creating OUT_FOR_DELIVERY package for Agent Console...');
  const activePkgRes = await request('POST', '/api/packages', {
    packageType: 'PARCEL',
    description: 'Handcrafted Espresso Maker',
    weight: 3.5,
    sourceLocation: {
      address: 'Central Distribution Center, Kukatpally',
      city: locs[0].city,
      state: locs[0].state,
      postalCode: locs[0].postalCode,
      latitude: locs[0].latitude,
      longitude: locs[0].longitude
    },
    destinationLocation: {
      address: 'Villa 12, Boulder Hills, Gachibowli',
      city: locs[1].city,
      state: locs[1].state,
      postalCode: locs[1].postalCode,
      latitude: locs[1].latitude,
      longitude: locs[1].longitude
    },
    serviceId,
    scheduledDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  }, customerToken);
  const activePkg = activePkgRes.data.data.package;
  await sleep(1000);

  const activeDetails = await request('GET', `/api/packages/${activePkg.id}`, null, customerToken);
  const activeAgentUserId = activeDetails.data.data.assignedAgent?.userId;
  const activeAgentUser = userMap[activeAgentUserId] || { email: 'agent.vikram@deliveryhub.local' };
  const activeAgentLogin = await request('POST', '/api/auth/login', {
    email: activeAgentUser.email,
    password: 'Agent@123'
  });
  const activeAgentToken = activeAgentLogin.data.data.token;
  await sleep(1000);

  // Move activePkg to OUT_FOR_DELIVERY
  const actPOtpRes = await request('POST', `/api/packages/${activePkg.id}/otp`, { purpose: 'PICKUP' }, customerToken);
  await request('POST', `/api/packages/${activePkg.id}/otp/verify`, { purpose: 'PICKUP', otp: actPOtpRes.data.data.otp }, activeAgentToken);
  await request('PATCH', `/api/packages/${activePkg.id}/status`, { status: 'IN_TRANSIT' }, activeAgentToken);
  await request('PATCH', `/api/packages/${activePkg.id}/status`, { status: 'OUT_FOR_DELIVERY' }, activeAgentToken);
  console.log(`✓ Active package ${activePkg.trackingNumber} is OUT_FOR_DELIVERY with agent ${activeAgentUser.fullName}`);
  await sleep(1000);

  // ----------------------------------------------------
  // Launch Puppeteer & Capture Screenshots
  // ----------------------------------------------------
  console.log('\n5. Launching Puppeteer browser session...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  // Test 1: Admin Dashboard & Active Exceptions Table
  console.log('\n6. Capturing Admin Exceptions Table...');
  await page.goto('http://localhost:4200/login', { waitUntil: 'networkidle0' });
  await page.evaluate((token, user) => {
    localStorage.setItem('deliveryhub.token', token);
    localStorage.setItem('deliveryhub.user', JSON.stringify(user));
  }, adminToken, adminUser);
  await page.goto('http://localhost:4200/admin/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2000));

  await page.evaluate(() => {
    const el = document.querySelector('.exceptions-section') || document.querySelector('h3');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));
  const adminShot = path.join(ARTIFACT_DIR, 'admin_exceptions_table.png');
  await page.screenshot({ path: adminShot, fullPage: false });
  console.log(`✓ Admin Exceptions Table saved: ${adminShot}`);

  // Test 2: Customer View of Delivered Package with Digital Proof of Delivery
  console.log('\n7. Capturing Customer POD View...');
  await page.evaluate((token, user) => {
    localStorage.setItem('deliveryhub.token', token);
    localStorage.setItem('deliveryhub.user', JSON.stringify(user));
  }, customerToken, customerUser);
  await page.goto(`http://localhost:4200/customer/deliveries/${deliveredPkg.id}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  await page.evaluate(() => {
    const el = document.querySelector('.pod-card') || document.querySelector('.pod-header') || document.querySelector('.timeline-card');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));
  const customerPodShot = path.join(ARTIFACT_DIR, 'customer_pod_view.png');
  await page.screenshot({ path: customerPodShot, fullPage: false });
  console.log(`✓ Customer POD View saved: ${customerPodShot}`);

  // Test 3: Customer View of Failed Package with Reschedule Picker
  console.log('\n8. Capturing Customer Reschedule Card...');
  await page.goto(`http://localhost:4200/customer/deliveries/${failedPkg.id}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  await page.evaluate(() => {
    const el = document.querySelector('.reschedule-card') || document.querySelector('.exception-banner');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));
  const customerRescheduleShot = path.join(ARTIFACT_DIR, 'customer_reschedule_card.png');
  await page.screenshot({ path: customerRescheduleShot, fullPage: false });
  console.log(`✓ Customer Reschedule Card saved: ${customerRescheduleShot}`);

  // Test 4: Agent Delivery Console (OUT_FOR_DELIVERY state)
  console.log('\n9. Capturing Agent POD Console with assigned courier...');
  await page.evaluate((token, user) => {
    localStorage.setItem('deliveryhub.token', token);
    localStorage.setItem('deliveryhub.user', JSON.stringify(user));
  }, activeAgentToken, activeAgentUser);
  await page.goto(`http://localhost:4200/agent/deliveries/${activePkg.id}`, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 2500));

  await page.evaluate(() => {
    const el = document.querySelector('.agent-actions') || document.querySelector('.agent-banner');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  await new Promise(r => setTimeout(r, 1000));
  const agentConsoleShot = path.join(ARTIFACT_DIR, 'agent_pod_console.png');
  await page.screenshot({ path: agentConsoleShot, fullPage: false });
  console.log(`✓ Agent POD Console saved: ${agentConsoleShot}`);

  // Test 5: Open Exception Reporting Modal
  console.log('\n10. Capturing Agent Exception Modal...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.innerText.includes('Report') || b.innerText.includes('Issue'));
    if (btn) btn.click();
  });
  await new Promise(r => setTimeout(r, 1500));
  const agentModalShot = path.join(ARTIFACT_DIR, 'agent_exception_modal.png');
  await page.screenshot({ path: agentModalShot, fullPage: false });
  console.log(`✓ Agent Exception Modal saved: ${agentModalShot}`);

  await browser.close();
  console.log('\n====================================================');
  console.log('ALL 5 SCREENSHOTS SUCCESSFULLY CAPTURED!');
  console.log('====================================================');
  process.exit(0);
}

runVisualE2E().catch(err => {
  console.error('Fatal visual E2E error:', err);
  process.exit(1);
});
