const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const migrateRoles = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Migration] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);

    const users = await User.find({});
    console.log(`[Migration] Found ${users.length} users to inspect and migrate.`);

    let migratedCount = 0;

    for (const user of users) {
      const originalRole = user.role;
      const lower = (originalRole || '').toLowerCase().trim();
      let targetRole = 'User';

      if (lower === 'admin') {
        targetRole = 'Admin';
      } else if (
        lower === 'analyst' ||
        lower === 'threat hunter' ||
        lower === 'incident responder'
      ) {
        targetRole = 'Analyst';
      } else {
        // employee, user, or other reporter roles
        targetRole = 'User';
      }

      let modified = false;

      if (user.role !== targetRole) {
        console.log(`[Migration] User ${user.email}: migrating role from '${originalRole}' to '${targetRole}'`);
        user.role = targetRole;
        modified = true;
      }

      // If user is Marcus Brody, clean up threat hunter title in name
      if (user.name && user.name.includes('Threat Hunter')) {
        user.name = user.name.replace('Cyber Threat Hunter', 'SOC Analyst').replace('Threat Hunter', 'SOC Analyst');
        console.log(`[Migration] User ${user.email}: normalized title to '${user.name}'`);
        modified = true;
      }

      if (modified) {
        await user.save();
        migratedCount++;
      }
    }

    console.log(`[Migration] Migration complete. ${migratedCount} accounts updated.`);

    // Verification check
    const verifiedUsers = await User.find({}, 'name email role status department');
    console.log('[Migration] Verified Active Users Post-Migration:');
    console.table(
      verifiedUsers.map((u) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
        department: u.department,
      }))
    );

    const invalidRoles = verifiedUsers.filter((u) => !['Admin', 'Analyst', 'User'].includes(u.role));
    if (invalidRoles.length > 0) {
      console.error(`[Migration Error] Found invalid roles remaining:`, invalidRoles);
      process.exit(1);
    } else {
      console.log('[Migration] All user accounts strictly adhere to [Admin, Analyst, User]!');
    }

    process.exit(0);
  } catch (err) {
    console.error('[Migration Error]:', err);
    process.exit(1);
  }
};

migrateRoles();
