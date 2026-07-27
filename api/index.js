require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors'); // Importante para o React conseguir ler a API

const app = express();

const origensPermitidas = [
  'http://127.0.0.1:5173',
  'https://front-vagas-sine.vercel.app', 
  'http://localhost:5173',
  'http://localhost:3000',
];

// Ativa o CORS para que seu front-end React (em outro domínio ou porta) acesse a API
app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origem (como aplicativos mobile, Postman ou ferramentas de teste)
    if (!origin) return callback(null, true);
    
    if (origensPermitidas.includes(origin) || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pelo CORS: Esta origem não tem permissão de acesso.'));
    }
  },
  methods: ['GET', 'OPTIONS'], // Como é apenas exposição, liberamos só GET e o pre-flight (OPTIONS)
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
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
    const { busca, escolaridade, genero, observacao } = req.query;
    
    let query = 'SELECT * FROM vagas_vaga WHERE expired = false';
    let params = [];
    let placeholderIdx = 1;

    if (busca) {
      query += ` AND (titulo ILIKE $${placeholderIdx} OR empresa ILIKE $${placeholderIdx} OR cidade ILIKE $${placeholderIdx})`;
      params.push(`%${busca}%`);
      placeholderIdx++;
    }

    if (escolaridade) {
      query += ` AND escolaridade ILIKE $${placeholderIdx}`;
      params.push(`%${escolaridade}%`);
      placeholderIdx++;
    }

    if (genero) {
      query += ` AND genero ILIKE $${placeholderIdx}`;
      params.push(`%${genero}%`);
      placeholderIdx++;
    }

    if (observacao) {
      query += ` AND observacao ILIKE $${placeholderIdx}`;
      params.push(`%${observacao}%`);
      placeholderIdx++;
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