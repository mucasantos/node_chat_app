const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Simulando o banco de dados de usuários
const users = {};

// Rota de registro de usuário
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(500).json({ message: 'PRecisa informar os dados corretamente!!' });
  }
  if (users[email]) {
    return res.status(400).json({ message: 'Email already registered' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    users[email] = { name, email, password: hashedPassword };
  } catch (error) {
    return res.status(500).json({ message: 'Error!', error: error });
  }

  res.status(201).json({ message: 'User registered successfully' });
});

// Rota de login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = users[email];
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  // Gerar o token JWT
  const token = jwt.sign({ sub: email, name: user.name }, process.env.SECRET_KEY, {
    expiresIn: process.env.TOKEN_EXPIRATION
  });

  res.json({ access_token: token });
});

module.exports = router;
