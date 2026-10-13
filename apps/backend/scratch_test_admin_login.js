const { AuthService } = require('./dist/services/auth.service');
require('dotenv').config();

async function testAdminLogin() {
  try {
    const res = await AuthService.adminLogin('admin@homechef.com', 'admin123');
    console.log('Admin login SUCCESS:', res);
  } catch (err) {
    console.error('Admin login FAILED error message:', err.message, err);
  }
}

testAdminLogin();
