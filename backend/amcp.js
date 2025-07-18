// amcp.js
const net = require('net');
const EventEmitter = require('events');

class AmcpClient extends EventEmitter {
  constructor() {
    super();
    this.client = new net.Socket();

    this.client.connect(5250, '127.0.0.1', () => {
      console.log('Forbundet til CasparCG via AMCP');
    });

    this.client.on('data', (data) => {
      const msg = data.toString();
      console.log('CasparCG svar:', msg);
      this.emit('response', msg); // Udsend event med svar
    });

    this.client.on('close', () => {
      console.log('Forbindelsen til CasparCG lukket');
    });
  }

  sendCommand(cmd) {
    this.client.write(cmd + '\r\n');
  }
}

const amcpClient = new AmcpClient();

module.exports = amcpClient;
