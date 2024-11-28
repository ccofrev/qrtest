const express = require('express');
const { Client } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Conectar con PostgreSQL (usa la URL de conexión proporcionada por Railway)
const client = new Client({
  connectionString: process.env.DATABASE_URL,  // Usa la URL de tu DB de Railway
  ssl: {
    rejectUnauthorized: false
  }
});

client.connect()
  .then(() => console.log('Conectado a PostgreSQL'))
  .catch(err => console.error('Error al conectar con la base de datos', err.stack));

// Crear la tabla si no existe
client.query(`
  CREATE TABLE IF NOT EXISTS qr_codes (
    id SERIAL PRIMARY KEY,
    timestamp TEXT,
    hash TEXT,
    userId TEXT,
    startTimestamp TEXT,
    expirationTimestamp TEXT
  )
`);

// Ruta para guardar un nuevo código QR
app.post('/api/qr', (req, res) => {
  const { timestamp, hash, userId, startTimestamp, expirationTimestamp } = req.body;
  
  const query = {
    text: 'INSERT INTO qr_codes (timestamp, hash, userId, startTimestamp, expirationTimestamp) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    values: [timestamp, hash, userId, startTimestamp, expirationTimestamp],
  };

  client.query(query)
    .then(result => res.status(201).send(result.rows[0]))
    .catch(err => res.status(500).send({ error: 'Error al guardar los datos en la base de datos.' }));
});

// Ruta para obtener todos los códigos QR almacenados
app.get('/api/qr', (req, res) => {
  client.query('SELECT * FROM qr_codes')
    .then(result => res.status(200).json(result.rows))
    .catch(err => res.status(500).send({ error: 'Error al obtener los datos de la base de datos.' }));
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
