const usePostgres = !!process.env.DATABASE_URL || !!require('../Env/settings').database;

const db = usePostgres
  ? require('./config');
  : require('./jsonset');    

module.exports = db;