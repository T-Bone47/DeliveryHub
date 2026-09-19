const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACTS_DIR = process.env.ARTIFACT_DIR || 'C:\\Users\\olive\\.gemini\\antigravity-ide\\brain\\4608294d-57d8-427f-b9c9-e02c858f9c89';
if (!fs.existsSync(ARTIFACTS_DIR)) fs.mkdirSync(ARTIFACTS_DIR, { recursive: true });
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserDemo() {
  console.log('====================================================');
  console.log('DELIVERYHUB — E2E BROWSER DEMO: OTP & TRACKING');
  console.log('====================================================');

  console.log('\n[0/10] Resetting seed data for demo package DLV-DEMO-0005...');
  const { runDemoSeed } = require('./dist/seed/seed-demo.js');
  await runDemoSeed();

  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: { width: 1280, height: 880 },
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  async function takeShot(filename) {
    const filePath = path.join(ARTIFACTS_DIR, filename);
    await page.screenshot({ path: filePath, fullPage: true });
    console.log(`  📸 Screenshot saved: ${filename}`);
  }

  let targetPkgId;

  try {
    // 1. Customer Login
    console.log('\n[1/10] Customer Logging In (Rahul)...');
    await page.goto('http://localhost:4200/customer/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#customer-email');
    await page.type('#customer-email', 'rahul.demo@deliveryhub.local');
    await page.type('#customer-password', 'Demo@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/customer/dashboard'), { timeout: 10000 });

    // 2. Open My Deliveries and locate DLV-DEMO-0005
    console.log('[2/10] Opening Customer Deliveries and selecting DLV-DEMO-0005...');
    await page.goto('http://localhost:4200/customer/deliveries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.tracking-link');

    const deliveryLinks = await page.$$('.tracking-link');
    let targetFound = false;
    for (const link of deliveryLinks) {
      const text = await page.evaluate((el) => el.textContent.trim(), link);
      if (text.includes('DLV-DEMO-0005')) {
        await link.click();
        targetFound = true;
        break;
      }
    }
    if (!targetFound) {
      throw new Error('DLV-DEMO-0005 link not found on Deliveries page.');
    }
    await page.waitForSelector('.stepper-card, .page-header');
    targetPkgId = await page.evaluate(() => window.location.pathname.split('/').pop());
    console.log(`     Target Package ID: ${targetPkgId}`);
    await sleep(1000);
    await takeShot('01_customer_assigned_delivery.png');

    // 3. Customer generates Pickup OTP
    console.log('[3/10] Customer generating Pickup OTP...');
    await page.waitForSelector('.otp-action-prompt button');
    await page.click('.otp-action-prompt button');
    await page.waitForSelector('.otp-digit');
    await sleep(1000);

    const pickupDigits = await page.$$eval('.otp-digit', (els) => els.map((e) => e.textContent.trim()).join(''));
    console.log(`     Customer Pickup OTP Generated: ${pickupDigits}`);
    await takeShot('02_customer_pickup_otp_generated.png');

    // 4. Logout Customer
    console.log('[4/10] Customer logging out...');
    await page.evaluate(() => localStorage.clear());

    // 5. Agent Login
    console.log('[5/10] Courier Agent Logging In (Vikram)...');
    await page.goto('http://localhost:4200/agent/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#agent-email');
    await page.type('#agent-email', 'agent.vikram@deliveryhub.local');
    await page.type('#agent-password', 'Agent@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/agent/dashboard'), { timeout: 10000 });

    // 6. Open Agent Assigned Deliveries and view DLV-DEMO-0005
    console.log('[6/10] Agent viewing assigned delivery console...');
    await page.goto('http://localhost:4200/agent/deliveries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.tracking-link');

    const agentLinks = await page.$$('.tracking-link');
    for (const link of agentLinks) {
      const text = await page.evaluate((el) => el.textContent.trim(), link);
      if (text.includes('DLV-DEMO-0005')) {
        await link.click();
        break;
      }
    }
    await page.waitForSelector('#pickupOtpInput');
    await sleep(1000);
    await takeShot('03_agent_pickup_verification_console.png');

    // 7. Agent enters customer Pickup OTP and verifies
    console.log(`[7/10] Agent entering Pickup OTP [${pickupDigits}] and verifying...`);
    await page.type('#pickupOtpInput', pickupDigits);
    await sleep(500);
    await page.click('.otp-input-row button');
    await page.waitForSelector('.action-btn-row button');
    await sleep(1000);
    await takeShot('04_agent_pickup_verified.png');

    // 8. Agent updates tracking: Start Transit -> In Transit -> Out for Delivery
    console.log('[8/10] Agent advancing tracking: Start Transit -> In Transit...');
    await page.click('.action-btn-row button');
    await sleep(1500);
    await takeShot('05_agent_in_transit.png');

    console.log('     Agent advancing tracking: In Transit -> Out for Delivery...');
    await page.click('.action-btn-row button');
    await page.waitForSelector('#deliveryOtpInput');
    await sleep(1000);
    await takeShot('06_agent_out_for_delivery.png');

    // 9. Customer logs in to generate Delivery OTP
    console.log('[9/10] Customer viewing Out for Delivery and generating Delivery OTP...');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:4200/customer/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#customer-email');
    await page.type('#customer-email', 'rahul.demo@deliveryhub.local');
    await page.type('#customer-password', 'Demo@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/customer/dashboard'), { timeout: 10000 });

    // Open delivery
    await page.goto('http://localhost:4200/customer/deliveries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.tracking-link');
    const custLinks = await page.$$('.tracking-link');
    for (const link of custLinks) {
      const text = await page.evaluate((el) => el.textContent.trim(), link);
      if (text.includes('DLV-DEMO-0005')) {
        await link.click();
        break;
      }
    }
    await page.waitForSelector('.otp-action-prompt button');
    await sleep(1000);
    await takeShot('07_customer_out_for_delivery.png');

    // Click Generate Delivery OTP
    await page.click('.otp-action-prompt button');
    await page.waitForSelector('.otp-digit');
    await sleep(1000);

    const deliveryDigits = await page.$$eval('.otp-digit', (els) => els.map((e) => e.textContent.trim()).join(''));
    console.log(`     Customer Delivery OTP Generated: ${deliveryDigits}`);
    await takeShot('08_customer_delivery_otp_generated.png');

    // 10. Agent logs in, verifies Delivery OTP, transitions to DELIVERED
    console.log('[10/10] Agent completing final delivery handover verification...');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:4200/agent/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#agent-email');
    await page.type('#agent-email', 'agent.vikram@deliveryhub.local');
    await page.type('#agent-password', 'Agent@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/agent/dashboard'), { timeout: 10000 });

    await page.goto('http://localhost:4200/agent/deliveries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.tracking-link');
    const agentLinks2 = await page.$$('.tracking-link');
    for (const link of agentLinks2) {
      const text = await page.evaluate((el) => el.textContent.trim(), link);
      if (text.includes('DLV-DEMO-0005')) {
        await link.click();
        break;
      }
    }
    await page.waitForSelector('#deliveryOtpInput');
    await page.type('#deliveryOtpInput', deliveryDigits);
    await sleep(500);

    await page.click('.otp-input-row button');
    await page.waitForSelector('.banner-success');
    await sleep(1000);
    await takeShot('09_agent_delivered_complete.png');

    // 11. Admin views complete audit trail
    console.log('[11/10] Admin inspecting complete audit trail and milestones...');
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:4200/admin/login', { waitUntil: 'networkidle0' });
    await page.waitForSelector('#admin-email');
    await page.type('#admin-email', 'admin.demo@deliveryhub.local');
    await page.type('#admin-password', 'Admin@123');
    await page.click('button[type="submit"]');
    await page.waitForFunction(() => window.location.pathname.includes('/admin/dashboard'), { timeout: 10000 });

    await page.goto('http://localhost:4200/admin/deliveries', { waitUntil: 'networkidle0' });
    await page.waitForSelector('.tracking-link');

    let adminFound = false;
    let adminLinks = await page.$$('.tracking-link');
    for (const link of adminLinks) {
      const text = await page.evaluate((el) => el.textContent.trim(), link);
      if (text.includes('DLV-DEMO-0005')) {
        await link.click();
        adminFound = true;
        break;
      }
    }
    if (!adminFound) {
      const buttons = await page.$$('nav.pagination button');
      for (const btn of buttons) {
        const text = await page.evaluate((el) => el.textContent.trim(), btn);
        if (text === 'Next') {
          await btn.click();
          await sleep(1000);
          break;
        }
      }
      adminLinks = await page.$$('.tracking-link');
      for (const link of adminLinks) {
        const text = await page.evaluate((el) => el.textContent.trim(), link);
        if (text.includes('DLV-DEMO-0005')) {
          await link.click();
          adminFound = true;
          break;
        }
      }
    }
    if (!adminFound && targetPkgId) {
      await page.goto(`http://localhost:4200/admin/deliveries/${targetPkgId}`, { waitUntil: 'networkidle0' });
    }
    await page.waitForSelector('.admin-audit-card');
    await sleep(1000);
    await takeShot('10_admin_audit_timeline.png');

    console.log('\n====================================================');
    console.log('E2E BROWSER DEMO COMPLETED SUCCESSFULLY WITH 10 ARTIFACTS!');
    console.log('====================================================');
  } catch (err) {
    console.error('Browser demo failure:', err);
    await takeShot('demo_error.png');
    process.exit(1);
  } finally {
    await browser.close();
    process.exit(0);
  }
}

runBrowserDemo();
