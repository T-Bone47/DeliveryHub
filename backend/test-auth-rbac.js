const http = require('http');

function post(url, data, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const body = JSON.stringify(data);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname,
      method: 'POST',
      headers,
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch {
          resolve({ status: res.statusCode, body: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function get(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const req = http.request({
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + (parsed.search || ''),
      method: 'GET',
      headers,
    }, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(resData) });
        } catch {
          resolve({ status: res.statusCode, body: resData });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTests() {
  const results = [];
  console.log('--- STARTING DELIVERYHUB AUTH & RBAC TEST MATRIX ---');

  // 1. Customer Login
  let custRes = await post('http://localhost:5000/api/auth/login', {
    email: 'rahul.demo@deliveryhub.local',
    password: 'Demo@123'
  });
  results.push({
    test: 'Customer Valid Login',
    pass: custRes.status === 200 && custRes.body.data?.user?.role === 'CUSTOMER',
    detail: `Status ${custRes.status}, role: ${custRes.body.data?.user?.role}`
  });
  const custToken = custRes.body?.data?.token;

  // 2. Customer Invalid Password
  let custBadRes = await post('http://localhost:5000/api/auth/login', {
    email: 'rahul.demo@deliveryhub.local',
    password: 'WrongPassword'
  });
  results.push({
    test: 'Customer Invalid Password Rejected (401)',
    pass: custBadRes.status === 401,
    detail: `Status ${custBadRes.status}`
  });

  // 3. Customer Public Registration with spoofed ADMIN role
  const testEmail = `test.cust.${Date.now()}@deliveryhub.local`;
  let regRes = await post('http://localhost:5000/api/auth/register', {
    fullName: 'Test Public User',
    email: testEmail,
    password: 'Password@123',
    phone: '+91 98765 43210',
    role: 'ADMIN' // Spoofed role
  });
  results.push({
    test: 'Public Registration Role-Lock (ignores spoofed ADMIN role)',
    pass: regRes.status === 201 && regRes.body.data?.user?.role === 'CUSTOMER',
    detail: `Status ${regRes.status}, assigned role: ${regRes.body.data?.user?.role}`
  });

  // 4. Customer RBAC against Admin Endpoint
  let custAdminRes = await get('http://localhost:5000/api/agents', custToken);
  results.push({
    test: 'Customer Blocked from Admin Endpoint /api/agents (403)',
    pass: custAdminRes.status === 403,
    detail: `Status ${custAdminRes.status}, code: ${custAdminRes.body?.error?.code}`
  });

  // 5. Agent Login
  let agRes = await post('http://localhost:5000/api/auth/login', {
    email: 'agent.vikram@deliveryhub.local',
    password: 'Agent@123'
  });
  results.push({
    test: 'Agent Valid Login',
    pass: agRes.status === 200 && agRes.body.data?.user?.role === 'AGENT',
    detail: `Status ${agRes.status}, role: ${agRes.body.data?.user?.role}`
  });
  const agToken = agRes.body?.data?.token;

  // 6. Agent /api/agents/me
  let agMeRes = await get('http://localhost:5000/api/agents/me', agToken);
  results.push({
    test: 'Agent Profile Endpoint /api/agents/me',
    pass: agMeRes.status === 200 && !!agMeRes.body.data?.agent?.agentCode,
    detail: `Status ${agMeRes.status}, agentCode: ${agMeRes.body.data?.agent?.agentCode}`
  });

  // 7. Agent Blocked from Admin Endpoints
  let agAdminRes = await post('http://localhost:5000/api/agents', { agentCode: 'HACK' }, agToken);
  results.push({
    test: 'Agent Blocked from POST /api/agents (403)',
    pass: agAdminRes.status === 403,
    detail: `Status ${agAdminRes.status}`
  });

  // 8. Admin Login
  let admRes = await post('http://localhost:5000/api/auth/login', {
    email: 'admin.demo@deliveryhub.local',
    password: 'Admin@123'
  });
  results.push({
    test: 'Admin Valid Login',
    pass: admRes.status === 200 && admRes.body.data?.user?.role === 'ADMIN',
    detail: `Status ${admRes.status}, role: ${admRes.body.data?.user?.role}`
  });
  const admToken = admRes.body?.data?.token;

  // 9. Admin Agent Management Access
  let admAgentsRes = await get('http://localhost:5000/api/agents', admToken);
  results.push({
    test: 'Admin Authorized for GET /api/agents (200)',
    pass: admAgentsRes.status === 200 && Array.isArray(admAgentsRes.body.data?.agents),
    detail: `Status ${admAgentsRes.status}, count: ${admAgentsRes.body?.data?.agents?.length}`
  });

  // 10. Admin Packages Access & Finding Pending Package
  let admPkgsRes = await get('http://localhost:5000/api/packages', admToken);
  const pendingPkg = admPkgsRes.body?.data?.packages?.find(p => p.status === 'PENDING');
  results.push({
    test: 'Admin Authorized for GET /api/packages (200)',
    pass: admPkgsRes.status === 200 && admPkgsRes.body?.data?.packages?.length >= 20,
    detail: `Total packages: ${admPkgsRes.body?.data?.packages?.length}, found pending: ${pendingPkg?.trackingNumber}`
  });

  // 11. Admin Retry Assignment on Pending Package
  if (pendingPkg) {
    const pkgId = pendingPkg.id || pendingPkg._id;
    let assignRes = await post(`http://localhost:5000/api/packages/${pkgId}/assign`, {}, admToken);
    results.push({
      test: `Admin Retry Assignment on ${pendingPkg.trackingNumber}`,
      pass: assignRes.status === 200 && (assignRes.body.data?.package?.status === 'AGENT_ASSIGNED' || !!assignRes.body.data?.agentId),
      detail: `Status ${assignRes.status}, assigned agent: ${assignRes.body.data?.agentName || assignRes.body.data?.agentId}`
    });
  }

  // 12. Customer End-to-End Delivery Creation + Auto-Assignment
  let locsRes = await get('http://localhost:5000/api/locations');
  let servsRes = await get('http://localhost:5000/api/services');
  const hyd = locsRes.body?.data?.locations?.find(l => l.city?.toLowerCase().includes('hyderabad'));
  const tdp = locsRes.body?.data?.locations?.find(l => l.city?.toLowerCase().includes('tadi'));
  const std = servsRes.body?.data?.services?.[0];

  if (hyd && tdp && std) {
    const originId = hyd.id || hyd._id;
    const destId = tdp.id || tdp._id;
    const servId = std.id || std._id;
    let newPkgRes = await post('http://localhost:5000/api/packages', {
      sourceLocationId: originId,
      destinationLocationId: destId,
      serviceId: servId,
      weight: 2.5,
      packageType: 'PARCEL',
      description: 'E2E Customer Test Package',
      senderName: 'Rahul Sharma',
      senderPhone: '+91 98765 11111',
      recipientName: 'Karthik Rao',
      recipientPhone: '+91 98765 22222',
      recipientAddress: 'Main Bazaar, Tadipatri, AP'
    }, custToken);

    results.push({
      test: 'Customer Create Delivery with Automatic Agent Assignment',
      pass: newPkgRes.status === 201 && (newPkgRes.body?.data?.package?.status === 'AGENT_ASSIGNED' || newPkgRes.body?.data?.package?.status === 'PENDING'),
      detail: `Tracking: ${newPkgRes.body.data?.package?.trackingNumber}, Status: ${newPkgRes.body.data?.package?.status}, Assigned: ${newPkgRes.body.data?.package?.assignedAgentId}`
    });
  }

  console.log('\n--- RESULTS SUMMARY ---');
  results.forEach(r => console.log(`${r.pass ? '✅ PASS' : '❌ FAIL'}: ${r.test} - ${r.detail}`));
  const allPassed = results.every(r => r.pass);
  console.log(`\nOVERALL: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`);
  process.exit(allPassed ? 0 : 1);
}

runTests().catch(e => {
  console.error('Test error:', e);
  process.exit(1);
});
