// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { sendOscMessage } = require('./osc');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

const amcpClient = require('./amcp');

io.on('connection', (socket) => {
  console.log('Socket.IO client connected');

  socket.on('amcp', (cmd) => {
    console.log('Sending AMCP:', cmd);
    amcpClient.sendCommand(cmd);
  });

  // Når CasparCG svarer, send svaret til alle klienter (eller den specifikke)
  amcpClient.on('response', (msg) => {
    // Her kan du parse msg for at sende et objekt, fx:
    socket.emit('amcp-response', { command: 'TLS', response: msg });
  });

  // OSC event håndtering som før
  socket.on('osc', (data) => {
    console.log('Sending OSC:', data);
    sendOscMessage(data.address, data.args);
  });
});

const fs = require('fs');

const casparTemplatePath = 'C:/casparcg-server-v2.3.1-lts-stable/template';

app.get('/templates/*', (req, res) => {
  const templatePath = req.params[0];

  const safePath = path
    .normalize(templatePath)
    .replace(/^(\.\.(\/|\\|$))+/g, '');

  let filePath = path.join(casparTemplatePath, safePath);
  if (!filePath.endsWith('.html')) {
    filePath += '.html';
  }

  fs.access(filePath, fs.constants.R_OK, (err) => {
    if (err) {
      return res.status(404).send('Template not found');
    }
    res.sendFile(filePath);
  });
});

server.listen(3000, () => {
  console.log('Server kører på http://localhost:3000');
});
