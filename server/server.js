const express = require('express'); //express.js thru node for web comm
const pool = require('./db');  //imports created postgres pool from db.js
const app = express();  // creates new express app

//default for localhost 3000
const port = 3000;

// change the path to check the database, instantly return "request obj and response obj"
// request object is stuff like ip addr, http method
// response obj is what goes to client
app.get('/db-test', async (req, res) => {
  try { // try catch
    // postgres prompted to return current time as result in UTC
    const result = await pool.query('SELECT NOW()'); 
    res.json({ // json formatted response obj
      success: true, 
      message: 'Connected to AWS database',
      time: result.rows[0].now 
    });
  } catch (err) { // if cant connect to db, give fail response obh
    console.error('Connection error:', err);
    // http 500 is INTERNAL SERVER ERROR
    res.status(500).json({ error: 'Failed to connect to AWS database.' });
  }
});

//allows for express and server to wait for client requests on the selected port
app.listen(port, () => {
  console.log(`StudyStrike running on http://localhost:${port}`);
  console.log(`Database test at http://localhost:${port}/db-test`);
});

// included nodemon as a node package to instantly update without restarting server