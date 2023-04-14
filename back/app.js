const express = require('express');
const app = express();
const mysql = require('mysql2/promise');

app.use(express.json());

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

app.get('/instances', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT id, name FROM instance WHERE type = "pokemon_iv"');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/instance/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT data FROM instance WHERE id = ?', [req.params.id]);
    res.json(rows[0].data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/instance/:id', async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query('UPDATE instance SET data = ? WHERE id = ?', [req.body.data, req.params.id]);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
