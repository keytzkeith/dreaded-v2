const { database } = require('../Env/settings');

let db;

if (database && database.trim() !== '') {
    console.log('[DB] Using PostgreSQL backend');
    db = require('./config');
} else {
    console.log('[DB] Falling back to JSON backend');
    db = require('./jsonset');
}

module.exports = db;