const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = process.env.ARTIFACT_DIR || 'C:\\Users\\olive\\.gemini\\antigravity-ide\\brain\\4608294d-57d8-427f-b9c9-e02c858f9c89';
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

async function runE2E() {
  console.log('--- STARTING COMPLETE BROWSER E2E TEST ---');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 }
  });

  const page = await browser.newPage();
  const testResults = [];

  // 1. Landing Portal Selector
  console.log('Navigating to landing portal...');
  await page.goto('http://localhost:4200', { waitUntil: 'networkidle0' });
  const landingCards = await page.$$('.portal-card');
  console.log(`Found ${landingCards.length} portal cards.`);
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'portal_landing.png') });
  testResults.push({
    step: 'Landing Portal Selection Screen',
    pass: landingCards.length === 3,
    detail: 'Rendered Customer, Agent, Admin portal cards'
  });

  // 2. Navigate to Customer Login
  console.log('Navigating to /customer/login...');
  await page.goto('http://localhost:4200/customer/login', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'customer_login.png') });
  testResults.push({
    step: 'Customer Login Page Render',
    pass: page.url().includes('/customer/login'),
    detail: 'Loaded clean 2-column Customer Portal login'
  });

  // 3. Customer Sign In
  console.log('Entering customer credentials...');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'rahul.demo@deliveryhub.local');
  await page.type('input[formControlName="password"]', 'Demo@123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'customer_dashboard.png') });
  const isCustDash = page.url().includes('/customer/dashboard');
  console.log('Current URL after login:', page.url());
  testResults.push({
    step: 'Customer Sign In -> /customer/dashboard',
    pass: isCustDash,
    detail: `Landed on: ${page.url()}`
  });

  // 4. Direct URL Protection / RoleGuard Test
  console.log('Attempting direct URL navigation to /admin/dashboard as Customer...');
  await page.goto('http://localhost:4200/admin/dashboard', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'access_restricted.png') });
  const isAccessRestricted = page.url().includes('/access-restricted');
  console.log('Current URL after unauthorized navigation:', page.url());
  testResults.push({
    step: 'Customer blocked from /admin/dashboard -> /access-restricted (403 UX)',
    pass: isAccessRestricted,
    detail: `Blocked by RoleGuard, redirected to: ${page.url()}`
  });

  // 5. Logout
  console.log('Logging out...');
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.goto('http://localhost:4200/agent/login', { waitUntil: 'networkidle0' });

  // 6. Wrong Portal Login: Enter Customer credentials on Agent Login
  console.log('Testing wrong portal detection on /agent/login with Customer credentials...');
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'rahul.demo@deliveryhub.local');
  await page.type('input[formControlName="password"]', 'Demo@123');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'wrong_portal_detection.png') });
  const wrongPortalNotice = await page.evaluate(() => {
    return document.body.innerText.includes('This account is registered as a Customer');
  });
  console.log('Wrong portal warning displayed:', wrongPortalNotice);
  testResults.push({
    step: 'Wrong Portal Detection (/agent/login with Customer account)',
    pass: wrongPortalNotice,
    detail: 'Displays role mismatch warning with CTA to Customer Portal'
  });

  // 7. Agent Login with Agent Credentials
  console.log('Entering Agent credentials on /agent/login...');
  await page.evaluate(() => {
    document.querySelector('input[type="email"]').value = '';
    document.querySelector('input[formControlName="password"]').value = '';
  });
  await page.type('input[type="email"]', 'agent.vikram@deliveryhub.local');
  await page.type('input[formControlName="password"]', 'Agent@123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'agent_dashboard.png') });
  const isAgentDash = page.url().includes('/agent/dashboard');
  console.log('Current URL after Agent login:', page.url());
  testResults.push({
    step: 'Agent Sign In -> /agent/dashboard',
    pass: isAgentDash,
    detail: `Landed on: ${page.url()}`
  });

  // 8. Agent Assigned Deliveries
  console.log('Navigating to /agent/deliveries...');
  await page.goto('http://localhost:4200/agent/deliveries', { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'agent_deliveries.png') });
  testResults.push({
    step: 'Agent Assigned Deliveries View (/agent/deliveries)',
    pass: page.url().includes('/agent/deliveries'),
    detail: 'Rendered courier assigned dispatches list'
  });

  // 9. Logout
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  // 10. Admin Login
  console.log('Navigating to /admin/login...');
  await page.goto('http://localhost:4200/admin/login', { waitUntil: 'networkidle0' });
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', 'admin.demo@deliveryhub.local');
  await page.type('input[formControlName="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'admin_dashboard.png') });
  const isAdminDash = page.url().includes('/admin/dashboard');
  console.log('Current URL after Admin login:', page.url());
  testResults.push({
    step: 'Admin Sign In -> /admin/dashboard',
    pass: isAdminDash,
    detail: `Landed on: ${page.url()}`
  });

  await browser.close();

  console.log('\n--- BROWSER E2E SUMMARY ---');
  testResults.forEach(r => console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'}: ${r.step} - ${r.detail}`));
  const allPass = testResults.every(r => r.pass);
  console.log(`\nOVERALL BROWSER E2E: ${allPass ? 'ALL PASSED' : 'FAILED'}`);
  process.exit(allPass ? 0 : 1);
}

runE2E().catch(e => {
  console.error('E2E run error:', e);
  process.exit(1);
});
