require('dotenv').config();
const express = require('express');
const http = require('http');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const WebSocket = require('ws');
const cors = require('cors'); // Adicionando o cors aqui
const { authenticateToken } = require('./routes/protected');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json()); // Para tratar JSON no corpo das requisições

const users = {}; // Simula o banco de dados de usuários
const rooms = {}; // Estrutura para armazenar as salas

// Rotas de autenticação
app.use('/auth', require('./routes/auth'));

// Rota para listar os rooms já criados
app.get('/rooms', authenticateToken, (req, res) => {
  const roomList = Object.keys(rooms);
  res.json({ rooms: roomList });
});

// WebSocket protegido com JWT
wss.on('connection', (ws, req) => {
  const token = req.url.split('token=')[1];
  if (!token) {
    ws.send(JSON.stringify({ error: 'Missing token' }));
    return ws.close();
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, user) => {
    if (err) {
      ws.send(JSON.stringify({ error: 'Invalid or expired token' }));
      return ws.close();
    }

    let currentRoom = null;

    ws.on('message', (message) => {
      const data = JSON.parse(message);

      if (data.room) {
        // Usuário está tentando entrar em uma sala
        const room = data.room;

        // Remover o usuário da sala anterior (se houver)
        if (currentRoom) {
          rooms[currentRoom] = rooms[currentRoom].filter((client) => client !== ws);
          if (rooms[currentRoom].length === 0) {
            delete rooms[currentRoom];
          }
        }

        // Entrar na nova sala
        currentRoom = room;
        if (!rooms[room]) {
          rooms[room] = [];
        }
        rooms[room].push(ws);

        ws.send(JSON.stringify({ system: `Joined room ${room}` }));
        broadcastMessage(room, `${user.name} joined the room`);
      }

      if (data.message) {
        // Usuário está enviando uma mensagem
        if (!currentRoom) {
          ws.send(JSON.stringify({ error: 'Join a room first' }));
          return;
        }
        broadcastMessage(currentRoom, `${user.name}: ${data.message}`);
      }
    });

    ws.on('close', () => {
      if (currentRoom) {
        rooms[currentRoom] = rooms[currentRoom].filter((client) => client !== ws);
        if (rooms[currentRoom].length === 0) {
          delete rooms[currentRoom];
        }
        broadcastMessage(currentRoom, `${user.name} left the room`);
      }
    });

    function broadcastMessage(room, message) {
      if (rooms[room]) {
        rooms[room].forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ message }));
          }
        });
      }
    }
  });
});

// Iniciar o servidor
server.listen(8000, () => {
  console.log('Server listening on http://localhost:8000');
});
