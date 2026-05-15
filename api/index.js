require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Importante para o React conseguir ler a API

const app = express();

// Ativa o CORS para que seu front-end React (em outro domínio ou porta) acesse a API
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Necessário para conexões seguras com o Neon
  }
});

// Rota simplificada: GET /api/vagas
app.get('/api/vagas', async (req, res) => {
  try {
    const { busca } = req.query;
    
    let query = 'SELECT * FROM vagas_vaga WHERE expired = false';
    let params = [];

    if (busca) {
      query += ' AND (titulo ILIKE $1 OR empresa ILIKE $1 OR cidade ILIKE $1)';
      params.push(`%${busca}%`);
    }

    query += ' ORDER BY id DESC';

    const { rows } = await pool.query(query, params);
    
    // Retorna JSON puro
    res.status(200).json(rows);
  } catch (err) {
    console.error('Erro na query:', err.message);
    res.status(500).json({ error: 'Falha ao buscar vagas no banco.', detalhes: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 API de Vagas rodando em http://localhost:${PORT}`);
});

// Exporta para a Vercel
module.exports = app;