const express = require("express");
const app = express();
const mysql = require("mysql2/promise");
const cors = require("cors");

app.use(express.json());
app.use(cors());

const dbConfig = {
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
};

const passwordValidationMiddleware = (req, res, next) => {
  const expectedPassword = process.env.PASSWORD;
  const providedPassword = req.query.password;

  if (providedPassword === expectedPassword) {
    next();
  } else {
    res.status(401).json({ error: "Unauthorized: Invalid password" });
  }
};

const apiRouter = express.Router();

apiRouter.use(passwordValidationMiddleware);

apiRouter.get("/instances", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query('SELECT id, name FROM instance WHERE type = "pokemon_iv"');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.get("/instance/:id", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.query("SELECT data FROM instance WHERE id = ?", [req.params.id]);
    res.json(rows[0].data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.put("/instance/:id", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.query("UPDATE instance SET data = ? WHERE id = ?", [JSON.stringify(req.body), req.params.id]);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use("/api", apiRouter);

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
