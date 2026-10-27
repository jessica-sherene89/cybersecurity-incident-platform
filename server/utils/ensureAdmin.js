const User = require('../models/User');

/**
 * Ensures the fixed Admin account exists with the required credentials and role
 * Email: admin@cyberguardsoc.com
 * Password: Admin@12345
 * Role: Admin
 */
const ensureAdminAccount = async () => {
  try {
    const adminEmail = 'admin@cyberguardsoc.com';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      console.log('[Bootstrap] Fixed Admin account not found. Creating admin@cyberguardsoc.com...');
      await User.create({
        name: 'Chief Security Officer (Admin)',
        email: adminEmail,
        password: 'Admin@12345',
        role: 'Admin',
        status: 'active',
        department: 'SOC Administration & Operations',
      });
      console.log('[Bootstrap] Fixed Admin account created successfully: admin@cyberguardsoc.com (Role: Admin)');
    } else {
      let needsSave = false;
      if (admin.role !== 'Admin') {
        admin.role = 'Admin';
        needsSave = true;
      }
      if (admin.status !== 'active') {
        admin.status = 'active';
        needsSave = true;
      }
      if (needsSave) {
        await admin.save();
        console.log('[Bootstrap] Verified and updated admin@cyberguardsoc.com role to Admin.');
      }
    }
  } catch (error) {
    console.error('[Bootstrap Admin Error]:', error.message);
  }
};

module.exports = ensureAdminAccount;
