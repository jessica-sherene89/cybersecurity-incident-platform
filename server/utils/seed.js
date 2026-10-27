const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Incident = require('../models/Incident');
const Evidence = require('../models/Evidence');
const InvestigationNote = require('../models/InvestigationNote');
const ResponseAction = require('../models/ResponseAction');
const ActivityLog = require('../models/ActivityLog');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Seed] Connected to MongoDB: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[Seed MongoDB Error]: ${error.message}`);
    process.exit(1);
  }
};

const seedData = async () => {
  await connectDB();

  try {
    console.log('[Seed] Clearing existing collections...');
    await User.deleteMany();
    await Incident.deleteMany();
    await Evidence.deleteMany();
    await InvestigationNote.deleteMany();
    await ResponseAction.deleteMany();
    await ActivityLog.deleteMany();

    // Ensure uploads directory exists and add dummy evidence files
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const sampleLogFile = path.join(uploadsDir, 'auth_failure_trace.log');
    fs.writeFileSync(
      sampleLogFile,
      `2026-09-14 02:14:11 [WARN] Failed password for root from 198.51.100.42 port 49221 ssh2\n2026-09-14 02:14:14 [ALERT] Repeated SSH authentication failures detected from IP: 198.51.100.42. Potential brute force attack.\n2026-09-14 02:15:02 [CRIT] Multiple Kerberos ticket requests with invalid SPN from host SEC-WKST-04.`
    );

    const samplePcapFile = path.join(uploadsDir, 'ddos_syn_flood_capture.txt');
    fs.writeFileSync(
      samplePcapFile,
      `Packet Capture Summary - Ingress Edge Router (Interface eth0)\nTCP SYN flood detected: 450,000 pps targeting port 443. Source IP spoofing detected across multiple ASN subnets.`
    );

    console.log('[Seed] Creating demo users...');
    const demoPassword = 'Password123!';

    const admin = await User.create({
      name: 'Alex Vance (Chief Security Officer)',
      email: 'admin@cyberguardsoc.com',
      password: 'Admin@12345',
      role: 'Admin',
      status: 'active',
      department: 'Security Operations & CISO Office',
    });

    await User.create({
      name: 'System Administrator',
      email: 'admin@example.com',
      password: demoPassword,
      role: 'Admin',
      status: 'active',
      department: 'Global Security Operations Center',
    });

    const analyst1 = await User.create({
      name: 'Sarah Chen (Senior SOC Analyst)',
      email: 'analyst@example.com',
      password: demoPassword,
      role: 'Analyst',
      status: 'active',
      department: 'Incident Response Team',
    });

    const analyst2 = await User.create({
      name: 'Marcus Brody (SOC Analyst)',
      email: 'hunter@example.com',
      password: demoPassword,
      role: 'Analyst',
      status: 'active',
      department: 'Threat Intelligence',
    });

    const employee = await User.create({
      name: 'David Miller (Finance Lead)',
      email: 'employee@example.com',
      password: demoPassword,
      role: 'User',
      status: 'active',
      department: 'Corporate Finance',
    });

    const employee2 = await User.create({
      name: 'Elena Rostova (DevOps Engineer)',
      email: 'elena@example.com',
      password: demoPassword,
      role: 'User',
      status: 'active',
      department: 'Cloud Infrastructure',
    });

    console.log('[Seed] Users successfully created.');

    console.log('[Seed] Creating realistic cybersecurity incidents...');

    // 1. Critical Ransomware Incident
    const inc1 = await Incident.create({
      incidentId: 'INC-2026-0001',
      title: 'LockBit 3.0 Ransomware Payload Detected on File Server',
      type: 'Ransomware',
      severity: 'Critical',
      description:
        'Endpoint detection flagged automated encryption activity on primary accounting file share (SRV-FIN-02). Volume Shadow copies deleted and ransom note readme.txt placed in shared directories.',
      location: 'On-Premise Data Center / Host: SRV-FIN-02',
      reportedBy: employee._id,
      assignedTo: analyst1._id,
      status: 'Investigating',
      reportedAt: new Date(Date.now() - 48 * 3600 * 1000),
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: employee._id,
          updatedAt: new Date(Date.now() - 48 * 3600 * 1000),
          comment: 'Ransom note readme.txt found on shared financial drive.',
        },
        {
          status: 'Under Review',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 47 * 3600 * 1000),
          comment: 'Escalated immediately to Severity: Critical.',
        },
        {
          status: 'Assigned',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 46 * 3600 * 1000),
          comment: 'Assigned lead investigator Sarah Chen.',
        },
        {
          status: 'Investigating',
          updatedBy: analyst1._id,
          updatedAt: new Date(Date.now() - 44 * 3600 * 1000),
          comment: 'Network isolation confirmed. Initiating live memory dump analysis.',
        },
      ],
    });

    // Notes for inc1
    await InvestigationNote.create([
      {
        incidentId: inc1._id,
        note: 'Host SRV-FIN-02 severed from internal VLAN at switch port Gi1/0/14. Lateral movement to domain controller prevented.',
        addedBy: analyst1._id,
        createdAt: new Date(Date.now() - 45 * 3600 * 1000),
      },
      {
        incidentId: inc1._id,
        note: 'Identified malicious execution parent process powershell.exe invoking encoded Base64 command originating from scheduled task.',
        addedBy: analyst1._id,
        createdAt: new Date(Date.now() - 30 * 3600 * 1000),
      },
    ]);

    // Response Actions for inc1
    await ResponseAction.create([
      {
        incidentId: inc1._id,
        action: 'Isolated affected host SRV-FIN-02 from local network',
        performedBy: analyst1._id,
        status: 'Completed',
        details: 'VLAN quarantine port rule enabled on Cisco Catalyst core switch.',
        createdAt: new Date(Date.now() - 45 * 3600 * 1000),
      },
      {
        incidentId: inc1._id,
        action: 'Revoked compromise Kerberos tickets and reset admin service accounts',
        performedBy: analyst1._id,
        status: 'Completed',
        details: 'Forced Krbtgt password rotation and invalidated active sessions.',
        createdAt: new Date(Date.now() - 40 * 3600 * 1000),
      },
      {
        incidentId: inc1._id,
        action: 'Restore file repository from immutable cloud air-gapped backup',
        performedBy: analyst1._id,
        status: 'In Progress',
        details: 'Backup snapshot from 2026-09-13 verified clean and staging for restore.',
        createdAt: new Date(Date.now() - 20 * 3600 * 1000),
      },
    ]);

    // Evidence for inc1
    await Evidence.create({
      incidentId: inc1._id,
      fileName: 'auth_failure_trace.log',
      originalName: 'auth_failure_trace.log',
      fileType: 'text/plain',
      filePath: '/uploads/auth_failure_trace.log',
      fileSize: 312,
      description: 'Host syslog capture highlighting brute-force and privilege escalation indicators.',
      uploadedBy: analyst1._id,
      uploadedAt: new Date(Date.now() - 42 * 3600 * 1000),
    });

    // 2. High Severity Phishing Incident
    const inc2 = await Incident.create({
      incidentId: 'INC-2026-0002',
      title: 'Targeted Executive Spear Phishing (C-Suite Invoice Fraud)',
      type: 'Phishing',
      severity: 'High',
      description:
        'Multiple employees received sophisticated spoofed emails claiming to be from the CEO requesting urgent wire transfers via a cloned Microsoft 365 login portal.',
      location: 'Corporate Email Gateway (O365)',
      reportedBy: employee._id,
      assignedTo: analyst1._id,
      status: 'Contained',
      reportedAt: new Date(Date.now() - 36 * 3600 * 1000),
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: employee._id,
          updatedAt: new Date(Date.now() - 36 * 3600 * 1000),
          comment: 'Reported suspicious invoice email with malicious URL.',
        },
        {
          status: 'Under Review',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 35 * 3600 * 1000),
          comment: 'Reviewed phishing header indicators.',
        },
        {
          status: 'Assigned',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 34 * 3600 * 1000),
          comment: 'Assigned to Sarah Chen.',
        },
        {
          status: 'Investigating',
          updatedBy: analyst1._id,
          updatedAt: new Date(Date.now() - 32 * 3600 * 1000),
          comment: 'Extracted credential harvesting domain: login-verify-auth365.online.',
        },
        {
          status: 'Contained',
          updatedBy: analyst1._id,
          updatedAt: new Date(Date.now() - 25 * 3600 * 1000),
          comment: 'Domain blacklisted at firewall and emails purged from mailboxes.',
        },
      ],
    });

    // Actions for inc2
    await ResponseAction.create([
      {
        incidentId: inc2._id,
        action: 'Blocked malicious domain and IP at edge firewall',
        performedBy: analyst1._id,
        status: 'Completed',
        details: 'DNS sinkhole created for login-verify-auth365.online (IP: 185.220.101.5).',
        createdAt: new Date(Date.now() - 30 * 3600 * 1000),
      },
      {
        incidentId: inc2._id,
        action: 'Purged phishing emails from 14 recipient mailboxes',
        performedBy: analyst1._id,
        status: 'Completed',
        details: 'Automated PowerShell purge using MessageTrace ID.',
        createdAt: new Date(Date.now() - 28 * 3600 * 1000),
      },
    ]);

    // 3. DDoS Attack Incident
    const inc3 = await Incident.create({
      incidentId: 'INC-2026-0003',
      title: 'Volumetric Distributed Denial of Service (DDoS) on API Gateway',
      type: 'DDoS',
      severity: 'Critical',
      description:
        'Customer facing portal experiencing latency spikes exceeding 12,000ms. Ingress traffic peaked at 45Gbps UDP/SYN amplification targeting load balancer public VIP.',
      location: 'AWS Cloud / CloudFront & Edge ALB',
      reportedBy: employee2._id,
      assignedTo: analyst2._id,
      status: 'Contained',
      reportedAt: new Date(Date.now() - 24 * 3600 * 1000),
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: employee2._id,
          updatedAt: new Date(Date.now() - 24 * 3600 * 1000),
          comment: 'Alarm triggered on API Gateway error rate > 40%.',
        },
        {
          status: 'Assigned',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 23 * 3600 * 1000),
          comment: 'Assigned to Marcus Brody.',
        },
        {
          status: 'Investigating',
          updatedBy: analyst2._id,
          updatedAt: new Date(Date.now() - 22 * 3600 * 1000),
          comment: 'Traffic analysis confirmed botnet SYN flood.',
        },
        {
          status: 'Contained',
          updatedBy: analyst2._id,
          updatedAt: new Date(Date.now() - 18 * 3600 * 1000),
          comment: 'Cloudflare under-attack challenge and rate limiting rules applied.',
        },
      ],
    });

    await Evidence.create({
      incidentId: inc3._id,
      fileName: 'ddos_syn_flood_capture.txt',
      originalName: 'ddos_syn_flood_capture.txt',
      fileType: 'text/plain',
      filePath: '/uploads/ddos_syn_flood_capture.txt',
      fileSize: 220,
      description: 'Edge router packet capture diagnostic showing flood signature.',
      uploadedBy: analyst2._id,
      uploadedAt: new Date(Date.now() - 20 * 3600 * 1000),
    });

    // 4. Unauthorized Privileged Access - Resolved
    const inc4 = await Incident.create({
      incidentId: 'INC-2026-0004',
      title: 'Anomalous VPN Login from Unrecognized Geo-Location (Tor Exit Node)',
      type: 'Unauthorized Access',
      severity: 'High',
      description:
        'Privileged service account logged in via GlobalProtect VPN concurrently from Berlin and Singapore within 4 minutes. Impossible travel alert triggered.',
      location: 'Corporate VPN Gateway',
      reportedBy: analyst1._id,
      assignedTo: analyst1._id,
      status: 'Resolved',
      reportedAt: new Date(Date.now() - 72 * 3600 * 1000),
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: analyst1._id,
          updatedAt: new Date(Date.now() - 72 * 3600 * 1000),
          comment: 'SIEM impossible travel rule triggered.',
        },
        {
          status: 'Investigating',
          updatedBy: analyst1._id,
          updatedAt: new Date(Date.now() - 70 * 3600 * 1000),
          comment: 'User confirmed they were not in Singapore.',
        },
        {
          status: 'Contained',
          updatedBy: analyst1._id,
          updatedAt: new Date(Date.now() - 68 * 3600 * 1000),
          comment: 'VPN session killed and user password rotated.',
        },
        {
          status: 'Resolved',
          updatedBy: analyst1._id,
          updatedAt: new Date(Date.now() - 50 * 3600 * 1000),
          comment: 'Hardware FIDO2 token bound to account. Threat eradicated.',
        },
        {
          status: 'Closed',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 40 * 3600 * 1000),
          comment: 'Post-incident review completed.',
        },
      ],
    });

    await ResponseAction.create([
      {
        incidentId: inc4._id,
        action: 'Terminated rogue VPN session and disabled account token',
        performedBy: analyst1._id,
        status: 'Completed',
        details: 'Revoked RADIUS authorization and killed active tunnel.',
        createdAt: new Date(Date.now() - 69 * 3600 * 1000),
      },
      {
        incidentId: inc4._id,
        action: 'Enforced FIDO2 WebAuthn Hardware Security Key mandatory policy',
        performedBy: admin._id,
        status: 'Completed',
        details: 'Enrolled user in YubiKey requirement group.',
        createdAt: new Date(Date.now() - 55 * 3600 * 1000),
      },
    ]);

    // 5. Data Breach / Leak Attempt - Under Review
    await Incident.create({
      incidentId: 'INC-2026-0005',
      title: 'DLP Alert: Bulk Export of Customer PII to Personal Cloud Storage',
      type: 'Data Breach',
      severity: 'Critical',
      description:
        'Data Loss Prevention system detected 14,000 credit records exported into unencrypted zip archive attempting transfer via browser to unapproved file-sharing site.',
      location: 'Workstation WS-FIN-089 (Marketing Department)',
      reportedBy: employee._id,
      assignedTo: null,
      status: 'Under Review',
      reportedAt: new Date(Date.now() - 8 * 3600 * 1000),
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: employee._id,
          updatedAt: new Date(Date.now() - 8 * 3600 * 1000),
          comment: 'DLP agent automatically reported upload block.',
        },
        {
          status: 'Under Review',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 7 * 3600 * 1000),
          comment: 'Reviewing employee authorization and DLP logs.',
        },
      ],
    });

    // 6. Malware Detected - Reported (Brand New)
    await Incident.create({
      incidentId: 'INC-2026-0006',
      title: 'Trojan.Win32.CobaltStrike Beacon Flagged by EDR on Sales Laptop',
      type: 'Malware',
      severity: 'High',
      description:
        'CrowdStrike Falcon flagged malicious process injection in explorer.exe with recurring HTTP beaconing to known malicious C2 IP address: 194.26.29.112.',
      location: 'Remote Sales Workstation (LAPTOP-SLS-21)',
      reportedBy: employee._id,
      assignedTo: null,
      status: 'Reported',
      reportedAt: new Date(Date.now() - 2 * 3600 * 1000),
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: employee._id,
          updatedAt: new Date(Date.now() - 2 * 3600 * 1000),
          comment: 'Antivirus popup received alerting user to Trojan detection.',
        },
      ],
    });

    // 7. Password Attack - Medium Severity - Resolved
    await Incident.create({
      incidentId: 'INC-2026-0007',
      title: 'Distributed Credential Stuffing Attempt on Customer Authentication API',
      type: 'Password Attack',
      severity: 'Medium',
      description:
        'Rate of failed login attempts jumped 800% over a 20-minute window using common credential dictionary lists across rotating proxies.',
      location: 'Auth Service (auth.enterprise.net)',
      reportedBy: employee2._id,
      assignedTo: analyst2._id,
      status: 'Resolved',
      reportedAt: new Date(Date.now() - 96 * 3600 * 1000),
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: employee2._id,
          updatedAt: new Date(Date.now() - 96 * 3600 * 1000),
          comment: 'WAF rate limiter alerted on excessive 401 response counts.',
        },
        {
          status: 'Assigned',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 95 * 3600 * 1000),
          comment: 'Assigned to Marcus Brody.',
        },
        {
          status: 'Resolved',
          updatedBy: analyst2._id,
          updatedAt: new Date(Date.now() - 80 * 3600 * 1000),
          comment: 'CAPTCHA challenge activated globally and proxy ranges blacklisted.',
        },
      ],
    });

    // 8. Insider Threat - Low Severity - Closed
    await Incident.create({
      incidentId: 'INC-2026-0008',
      title: 'After-Hours Access to Confidential Source Code Repositories',
      type: 'Insider Threat',
      severity: 'Low',
      description:
        'Engineer downloaded 22 proprietary repositories on a Sunday at 03:00 AM via corporate VPN without active on-call assignment.',
      location: 'GitHub Enterprise / Internal Git Server',
      reportedBy: employee2._id,
      assignedTo: analyst1._id,
      status: 'Closed',
      reportedAt: new Date(Date.now() - 120 * 3600 * 1000),
      statusHistory: [
        {
          status: 'Reported',
          updatedBy: employee2._id,
          updatedAt: new Date(Date.now() - 120 * 3600 * 1000),
          comment: 'Audit log flag on abnormal download volume.',
        },
        {
          status: 'Resolved',
          updatedBy: analyst1._id,
          updatedAt: new Date(Date.now() - 110 * 3600 * 1000),
          comment: 'Verified legitimate off-hours maintenance work with engineering manager.',
        },
        {
          status: 'Closed',
          updatedBy: admin._id,
          updatedAt: new Date(Date.now() - 100 * 3600 * 1000),
          comment: 'Marked as authorized activity. Case closed.',
        },
      ],
    });

    console.log('[Seed] Seeding audit activity logs...');
    await ActivityLog.create([
      {
        action: 'USER_CREATED',
        description: `Chief Security Officer account provisioned for Alex Vance.`,
        performedBy: admin._id,
        userRole: 'Admin',
        userName: admin.name,
        timestamp: new Date(Date.now() - 72 * 3600 * 1000),
      },
      {
        action: 'INCIDENT_CREATED',
        description: `Critical incident INC-2026-0001 reported: "LockBit 3.0 Ransomware Payload Detected on File Server".`,
        performedBy: employee._id,
        userRole: 'User',
        userName: employee.name,
        incidentId: inc1._id,
        incidentTicketId: inc1.incidentId,
        details: { type: 'Ransomware', severity: 'Critical' },
        timestamp: new Date(Date.now() - 48 * 3600 * 1000),
      },
      {
        action: 'INCIDENT_ASSIGNED',
        description: `Incident INC-2026-0001 assigned to Senior SOC Analyst Sarah Chen.`,
        performedBy: admin._id,
        userRole: 'Admin',
        userName: admin.name,
        incidentId: inc1._id,
        incidentTicketId: inc1.incidentId,
        targetUser: analyst1._id,
        timestamp: new Date(Date.now() - 47 * 3600 * 1000),
      },
      {
        action: 'EVIDENCE_UPLOADED',
        description: `Forensic artifact auth_failure_trace.log uploaded for incident INC-2026-0001.`,
        performedBy: analyst1._id,
        userRole: 'Analyst',
        userName: analyst1.name,
        incidentId: inc1._id,
        incidentTicketId: inc1.incidentId,
        timestamp: new Date(Date.now() - 46 * 3600 * 1000),
      },
      {
        action: 'ACTION_CREATED',
        description: `Response action "Network Isolation of SRV-FIN-02" recorded by Sarah Chen.`,
        performedBy: analyst1._id,
        userRole: 'Analyst',
        userName: analyst1.name,
        incidentId: inc1._id,
        incidentTicketId: inc1.incidentId,
        details: { status: 'Completed' },
        timestamp: new Date(Date.now() - 45 * 3600 * 1000),
      },
      {
        action: 'INCIDENT_STATUS_CHANGED',
        description: `Incident INC-2026-0001 status transitioned from [Assigned] to [Investigating].`,
        performedBy: analyst1._id,
        userRole: 'Analyst',
        userName: analyst1.name,
        incidentId: inc1._id,
        incidentTicketId: inc1.incidentId,
        details: { status: 'Investigating' },
        timestamp: new Date(Date.now() - 44 * 3600 * 1000),
      },
      {
        action: 'USER_LOGIN',
        description: `Administrator Alex Vance authenticated from SOC Security Terminal.`,
        performedBy: admin._id,
        userRole: 'Admin',
        userName: admin.name,
        timestamp: new Date(Date.now() - 2 * 3600 * 1000),
      },
    ]);

    console.log('[Seed] Database seeding completed successfully!');
    console.log('---------------------------------------------------------');
    console.log('Demo Login Credentials:');
    console.log('1. Fixed Admin:        admin@cyberguardsoc.com / Admin@12345');
    console.log('2. Security Analyst:  analyst@example.com     / Password123!');
    console.log('3. User:              employee@example.com    / Password123!');
    console.log('---------------------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedData();
