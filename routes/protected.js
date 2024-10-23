const jwt = require('jsonwebtoken');

// Middleware para proteger rotas com JWT
const authenticateToken = (req, res, next) => {
  const cred = req.headers['authorization'];

  if (!cred) return res.status(401).json({ message: 'Missing token' });
  const token = cred.split(' ')[1];
  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };
