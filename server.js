require('dotenv').config();

const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 9000;
const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const { Client } = require('pg');
const app = express();



app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended: true}));


const database = new Client({
  host: process.env.HEROKU_DB_HOST,
  user: process.env.HEROKU_DB_USER,
  password: process.env.HEROKU_DB_PASSWORD,
  database: process.env.HEROKU_DB_NAME,
  port: process.env.DB_PORT
})
database.connect();

app.get('/users', async (req, res) => {
  const data = await database.query('SELECT * FROM users');
  res.send(data.rows);
});


app.get('/user/:id', async (req, res) => {
  const user = req.params.id;
  const data = await database.query(`SELECT * FROM users WHERE email = '${user}'`);
  if(data.rows.length > 0) {
    const token = jwt.sign(JSON.stringify(data.rows[0]), process.env.JWT_KEY);
    res.send(token);
  } else {
    res.send('User not Found')
  }

});

app.post('/register', async (req,res) => {
  const { name, email, password } = req.body;
  const hash = bcrypt.hashSync(password);
  const dbQuery = `INSERT INTO users (name,email,password) VALUES ('${name}','${email}','${hash}')`;
  const data = await database.query(dbQuery, (err, result) => {
    if (err) {
      res.send(err);
    }
  })
  const user = await database.query(`SELECT * FROM users WHERE email = '${email}'`);
  const token = jwt.sign(JSON.stringify(user.rows[0]), process.env.JWT_KEY);
  res.send(token);
});

app.post('/login', async (req,res) => {
  const { email, password } = req.body;
  const data = await database.query(`SELECT * FROM users WHERE email = '${email}'`);
  if(data.rows[0] && bcrypt.compareSync(password, data.rows[0].password)) {
    const token = jwt.sign(JSON.stringify(data.rows[0]), process.env.JWT_KEY);
    res.send(token);
  } else {
    res.send('User not Found');
  }
})

app.delete('/delete/:id', async (req,res) => {
  const user = req.params.id;
  const data = await database.query(`DELETE FROM users WHERE email='${user}'`);
  res.send('Deleted')
});

app.put('/update/:id', async (req, res) => {
  const userEmail = req.params.id;
  const { name, email, password} = req.body;
  const hash = bcrypt.hashSync(password);
  const dbQuery = `UPDATE users SET name='${name}', email='${email}', password='${hash}' WHERE email='${userEmail}'`;
  const data = await database.query(dbQuery)
    .catch(err => res.send(err));
  const user = await database.query(`SELECT * FROM users WHERE email = '${email}'`);
  const token = jwt.sign(JSON.stringify(user.rows[0]), process.env.JWT_KEY);
  res.send(token);
});

app.listen(port, () => {
  console.log("Server running on port: " + port);
});