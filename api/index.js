const path = require('path');

// Load dotenv from backend folder
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });

const app = require('../backend/server');

module.exports = app;
