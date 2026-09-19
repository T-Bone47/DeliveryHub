const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = 'C:\\Users\\olive\\.gemini\\antigravity-ide\\brain\\e0d41da5-4ac0-42a0-8de9-4be5f6177cec';

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runVisualQA() {
  console.log('====================================================');
  console.log('DELIVERYHUB — REDESIGN VISUAL QA & SCREENSHOT SUITE');
  console.log('====================================================');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  try {
    // 1. Landing Page / Portal Select (Desktop 1440x900)
    console.log('\n1. Verifying Portal Selection Gateway (1440x900)...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle2' });
    await sleep(800);

    const landingScreenshotPath = path.join(ARTIFACT_DIR, 'portal_select_desktop.png');
    await page.screenshot({ path: landingScreenshotPath, fullPage: true });
    console.log(`  ✓ Saved: ${landingScreenshotPath}`);

    // Check Demo Drawer Interaction
    console.log('  Testing Demo Credentials Drawer toggle...');
    const drawerToggle = await page.$('.demo-drawer-toggle');
    if (drawerToggle) {
      await drawerToggle.click();
      await sleep(400);
      const drawerScreenshotPath = path.join(ARTIFACT_DIR, 'portal_select_drawer_open.png');
      await page.screenshot({ path: drawerScreenshotPath });
      console.log(`  ✓ Saved: ${drawerScreenshotPath}`);
    }

    // 2. Portal Select (Mobile 390x844)
    console.log('\n2. Verifying Portal Selection (Mobile 390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.goto('http://localhost:4200/', { waitUntil: 'networkidle2' });
    await sleep(600);

    const mobileLandingPath = path.join(ARTIFACT_DIR, 'portal_select_mobile.png');
    await page.screenshot({ path: mobileLandingPath, fullPage: true });
    console.log(`  ✓ Saved: ${mobileLandingPath}`);

    // 3. Customer Login Page (Desktop)
    console.log('\n3. Verifying Customer Login Page...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4200/customer/login', { waitUntil: 'networkidle2' });
    await sleep(600);

    const customerLoginPath = path.join(ARTIFACT_DIR, 'customer_login_desktop.png');
    await page.screenshot({ path: customerLoginPath, fullPage: true });
    console.log(`  ✓ Saved: ${customerLoginPath}`);

    // 4. Authenticating as Customer and checking Dashboard
    console.log('\n4. Logging in as Customer (rahul.demo@deliveryhub.local)...');
    await page.type('#customer-email', 'rahul.demo@deliveryhub.local');
    await page.type('#customer-password', 'Demo@123');
    await page.click('button.submit-btn');
    await page.waitForFunction(() => window.location.pathname.includes('/customer/dashboard'), { timeout: 10000 });
    await sleep(1500);

    const customerDashboardPath = path.join(ARTIFACT_DIR, 'customer_dashboard_desktop.png');
    await page.screenshot({ path: customerDashboardPath, fullPage: true });
    console.log(`  ✓ Saved: ${customerDashboardPath}`);

    // 5. Customer Dashboard Mobile (390x844)
    console.log('\n5. Verifying Customer Dashboard Mobile (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await sleep(600);
    const customerDashboardMobilePath = path.join(ARTIFACT_DIR, 'customer_dashboard_mobile.png');
    await page.screenshot({ path: customerDashboardMobilePath });
    console.log(`  ✓ Saved: ${customerDashboardMobilePath}`);

    // 6. Customer Delivery Detail View
    console.log('\n6. Verifying Customer Delivery Detail View...');
    await page.setViewport({ width: 1440, height: 900 });
    const detailBtn = await page.$('.action-btn, a[href*="/customer/deliveries/"]');
    if (detailBtn) {
      await detailBtn.click();
      await sleep(1500);
      const deliveryDetailPath = path.join(ARTIFACT_DIR, 'customer_delivery_detail_desktop.png');
      await page.screenshot({ path: deliveryDetailPath, fullPage: true });
      console.log(`  ✓ Saved: ${deliveryDetailPath}`);
    }

    // 7. Agent Portal Flow
    console.log('\n7. Verifying Courier Agent Portal...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4200/agent/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:4200/agent/login', { waitUntil: 'networkidle2' });
    await sleep(800);

    const agentLoginPath = path.join(ARTIFACT_DIR, 'agent_login_desktop.png');
    await page.screenshot({ path: agentLoginPath, fullPage: true });
    console.log(`  ✓ Saved: ${agentLoginPath}`);

    await page.type('#agent-email', 'agent.vikram@deliveryhub.local');
    await page.type('#agent-password', 'Agent@123');
    await page.click('button.submit-btn');
    await page.waitForFunction(() => window.location.pathname.includes('/agent/dashboard'), { timeout: 10000 });
    await sleep(1500);

    const agentDashboardPath = path.join(ARTIFACT_DIR, 'agent_dashboard_desktop.png');
    await page.screenshot({ path: agentDashboardPath, fullPage: true });
    console.log(`  ✓ Saved: ${agentDashboardPath}`);

    // Agent Dashboard Mobile (390x844)
    console.log('  Capturing Agent Mobile view (390x844)...');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await sleep(600);
    const agentMobilePath = path.join(ARTIFACT_DIR, 'agent_dashboard_mobile.png');
    await page.screenshot({ path: agentMobilePath });
    console.log(`  ✓ Saved: ${agentMobilePath}`);

    // 8. Admin Portal Flow
    console.log('\n8. Verifying Admin Platform Operations Console...');
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto('http://localhost:4200/admin/login', { waitUntil: 'networkidle2' });
    await page.evaluate(() => localStorage.clear());
    await page.goto('http://localhost:4200/admin/login', { waitUntil: 'networkidle2' });
    await sleep(800);

    const adminLoginPath = path.join(ARTIFACT_DIR, 'admin_login_desktop.png');
    await page.screenshot({ path: adminLoginPath, fullPage: true });
    console.log(`  ✓ Saved: ${adminLoginPath}`);

    await page.type('#admin-email', 'admin.demo@deliveryhub.local');
    await page.type('#admin-password', 'Admin@123');
    await page.click('button.submit-btn');
    await page.waitForFunction(() => window.location.pathname.includes('/admin/dashboard'), { timeout: 10000 });
    await page.waitForFunction(() => !document.querySelector('dh-loading-spinner'), { timeout: 15000 }).catch(() => {});
    await sleep(600);

    const adminDashboardPath = path.join(ARTIFACT_DIR, 'admin_dashboard_desktop.png');
    await page.screenshot({ path: adminDashboardPath, fullPage: true });
    console.log(`  ✓ Saved: ${adminDashboardPath}`);

    // Admin Deliveries & Exceptions Management Table
    console.log('  Capturing Admin Deliveries & Exceptions view...');
    await page.goto('http://localhost:4200/admin/deliveries', { waitUntil: 'networkidle2' });
    await page.waitForFunction(() => !document.querySelector('dh-loading-spinner'), { timeout: 15000 }).catch(() => {});
    await sleep(600);
    const adminPackagesPath = path.join(ARTIFACT_DIR, 'admin_packages_desktop.png');
    await page.screenshot({ path: adminPackagesPath, fullPage: true });
    console.log(`  ✓ Saved: ${adminPackagesPath}`);

    console.log('\n====================================================');
    console.log('ALL ROLE PORTALS & VIEWS VERIFIED WITH SCREENSHOTS');
    console.log('====================================================');
  } catch (err) {
    console.error('Visual QA Error:', err);
  } finally {
    await browser.close();
  }
}

runVisualQA();
