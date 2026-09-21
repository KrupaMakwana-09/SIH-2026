const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'authController.js');
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("const OTP = require('../models/OTP');")) {
    content = content.replace(
        "const User = require('../models/User');",
        "const User = require('../models/User');\nconst OTP = require('../models/OTP');"
    );
}

content = content.replace(/role = 'staff',/g, "role = 'patient',");

const regCheck = 
    if (role !== 'patient') {
      return res.status(403).json({ success: false, message: 'Public registration is only allowed for Patients.' });
    }
;
if (!content.includes("Public registration is only allowed for Patients.")) {
    content = content.replace(
        "if (!username || !password || !name) {",
        regCheck + "    if (!username || !password || !name) {"
    );
}

fs.writeFileSync(file, content);
