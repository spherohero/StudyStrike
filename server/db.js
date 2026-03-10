const { Pool } = require('pg');
require('dotenv').config();

// nodejs docs recommend pools instead of single clients to allow for multiple requests in parallel

const pool = new Pool({
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  password: process.env.PG_PASSWORD,
  database: process.env.PG_DATABASE,
  port: process.env.PG_PORT,
  ssl: {
    rejectUnauthorized: false // aws kept failing bcs ssl usually req, turn it off since it will be localhost
  }
});

// nodejs docs have seperate discovery, need to export the variables using module.exports for other files to import
module.exports = pool;
