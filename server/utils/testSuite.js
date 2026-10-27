const API_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING RBAC & ROLE MANAGEMENT VERIFICATION SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // 1. Test Logins
    console.log('--- 1. Testing Logins for Supported Roles ---');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@cyberguardsoc.com', password: 'Admin@12345' }),
    }).then((r) => r.json());
    assert(adminLoginRes.success && adminLoginRes.user.role === 'Admin', 'Admin Login returns role Admin');
    const adminToken = adminLoginRes.token;

    const analystLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'analyst@example.com', password: 'Password123!' }),
    }).then((r) => r.json());
    assert(analystLoginRes.success && analystLoginRes.user.role === 'Analyst', 'Analyst Login returns role Analyst');
    const analystToken = analystLoginRes.token;
    const analystId = analystLoginRes.user._id;

    const hunterLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hunter@example.com', password: 'Password123!' }),
    }).then((r) => r.json());
    assert(
      hunterLoginRes.success && hunterLoginRes.user.role === 'Analyst',
      'Migrated Threat Hunter (hunter@example.com) logs in with role Analyst'
    );

    const userLoginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'employee@example.com', password: 'Password123!' }),
    }).then((r) => r.json());
    assert(
      userLoginRes.success && userLoginRes.user.role === 'User',
      'Migrated Employee (employee@example.com) logs in with role User'
    );
    const userToken = userLoginRes.token;
    const userId = userLoginRes.user._id;

    // 2. Test Registration & Protection Against Role Tampering
    console.log('\n--- 2. Testing Registration & Role Tampering Prevention ---');
    const randomSuffix = Date.now().toString().slice(-4);
    const testRegEmail = `testuser_${randomSuffix}@cyberguardsoc.com`;
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Reporter User',
        email: testRegEmail,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        department: 'Operations',
        role: 'Admin', // Malicious attempt to self-grant Admin role
      }),
    }).then((r) => r.json());

    assert(
      regRes.success && regRes.user.role === 'User',
      'Public registration ignores role: Admin parameter and strictly enforces role User'
    );
    const newRegUserToken = regRes.token;
    const newRegUserId = regRes.user._id;

    // 3. Test Incident Submission & Scoping
    console.log('\n--- 3. Testing Incident Submission & Privacy Scoping ---');
    const incidentData = {
      title: `Unauthorized USB Drive Inserted - Host TEST-${randomSuffix}`,
      type: 'Suspicious Activity',
      severity: 'Medium',
      location: `Workstation WS-${randomSuffix}`,
      description: 'An unapproved mass storage device was plugged into workstation USB port.',
    };

    const createIncRes = await fetch(`${API_URL}/incidents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${newRegUserToken}`,
      },
      body: JSON.stringify(incidentData),
    }).then((r) => r.json());

    const createdIncident = createIncRes.incident || createIncRes.data;
    assert(createIncRes.success && createdIncident?._id, 'User can successfully submit a cybersecurity incident');
    const testIncidentId = createdIncident._id;

    // User views their own incident
    const viewOwnIncRes = await fetch(`${API_URL}/incidents/${testIncidentId}`, {
      headers: { Authorization: `Bearer ${newRegUserToken}` },
    });
    assert(viewOwnIncRes.status === 200, 'User can view their own submitted incident details (200 OK)');

    // Different user attempts to view this incident
    const viewOtherIncRes = await fetch(`${API_URL}/incidents/${testIncidentId}`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    assert(
      viewOtherIncRes.status === 403,
      "User CANNOT view another user's private incident record (403 Forbidden)"
    );

    // User attempts to access Admin User Management
    const userAccessUsersRes = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${newRegUserToken}` },
    });
    assert(userAccessUsersRes.status === 403, 'User CANNOT access /api/users (403 Forbidden)');

    // User attempts to access Global Evidence Vault
    const userAccessEvidenceRes = await fetch(`${API_URL}/evidence`, {
      headers: { Authorization: `Bearer ${newRegUserToken}` },
    });
    assert(userAccessEvidenceRes.status === 403, 'User CANNOT access global /api/evidence (403 Forbidden)');

    // User attempts to access Global Actions
    const userAccessActionsRes = await fetch(`${API_URL}/actions`, {
      headers: { Authorization: `Bearer ${newRegUserToken}` },
    });
    assert(userAccessActionsRes.status === 403, 'User CANNOT access global /api/actions (403 Forbidden)');

    // 4. Test Analyst Capabilities
    console.log('\n--- 4. Testing Analyst Permissions ---');
    // Analyst views assignments
    const myAssignmentsRes = await fetch(`${API_URL}/incidents/my-assignments`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    }).then((r) => r.json());
    assert(myAssignmentsRes.success && Array.isArray(myAssignmentsRes.incidents), 'Analyst can view /api/incidents/my-assignments');

    // Analyst adds note
    const addNoteRes = await fetch(`${API_URL}/incidents/${testIncidentId}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${analystToken}`,
      },
      body: JSON.stringify({ note: 'Initial forensic triage started. Isolating host.' }),
    }).then((r) => r.json());
    assert(addNoteRes.success, 'Analyst can record investigation notes on incident');

    // Analyst updates status
    const updateStatusRes = await fetch(`${API_URL}/incidents/${testIncidentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${analystToken}`,
      },
      body: JSON.stringify({ status: 'Investigating', comment: 'Host isolated from VLAN.' }),
    }).then((r) => r.json());
    assert(
      updateStatusRes.success && updateStatusRes.incident.status === 'Investigating',
      'Analyst can update incident status'
    );

    // Analyst attempts to access user management
    const analystAccessUsersRes = await fetch(`${API_URL}/users`, {
      headers: { Authorization: `Bearer ${analystToken}` },
    });
    assert(analystAccessUsersRes.status === 403, 'Analyst CANNOT access admin /api/users (403 Forbidden)');

    // 5. Test Admin Capabilities & Assignment
    console.log('\n--- 5. Testing Admin Controls & Analyst Assignment ---');
    // Admin gets analyst list
    const analystsListRes = await fetch(`${API_URL}/users/analysts`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    const validAnalystsOnly = (analystsListRes.analysts || []).every(
      (a) => a.role === 'Analyst' || a.role === 'analyst'
    );
    assert(
      analystsListRes.success && validAnalystsOnly,
      'Admin /users/analysts returns only active analysts with role Analyst'
    );

    // Admin assigns incident to analyst
    const assignRes = await fetch(`${API_URL}/incidents/${testIncidentId}/assign`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ analystId }),
    }).then((r) => r.json());
    assert(
      assignRes.success && assignRes.incident?.assignedTo?._id === analystId,
      'Admin successfully assigns incident to Security Analyst'
    );

    // Admin updates a user's role to Analyst
    const roleUpdateRes = await fetch(`${API_URL}/users/${newRegUserId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'Analyst' }),
    }).then((r) => r.json());
    assert(roleUpdateRes.success && roleUpdateRes.user.role === 'Analyst', 'Admin can promote user to Analyst');

    // Admin attempts to assign invalid role (Threat Hunter / Employee)
    const invalidRoleRes = await fetch(`${API_URL}/users/${newRegUserId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'Threat Hunter' }),
    }).then((r) => r.json());
    assert(!invalidRoleRes.success, 'Admin cannot assign deprecated role Threat Hunter (rejected)');

    // Revert test user role back to User
    await fetch(`${API_URL}/users/${newRegUserId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ role: 'User' }),
    });

    // 6. Test Dashboard Scoping
    console.log('\n--- 6. Testing Dashboard Scoping ---');
    const userStatsRes = await fetch(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${newRegUserToken}` },
    }).then((r) => r.json());
    assert(
      userStatsRes.success && userStatsRes.stats?.totalIncidents === 1,
      'User dashboard metrics are scoped strictly to incidents reported by the User (totalIncidents = 1)'
    );

    const adminStatsRes = await fetch(`${API_URL}/dashboard/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    }).then((r) => r.json());
    assert(
      adminStatsRes.success && adminStatsRes.stats?.totalIncidents > 1,
      'Admin dashboard metrics reflect enterprise-wide incident count'
    );

    console.log('\n====================================================');
    console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTests();
