// amcp.js
const net = require('net');
const EventEmitter = require('events');

class AmcpClient extends EventEmitter {
  constructor() {
    super();
    this.client = null;
    this.connected = false;

    this.connect();
  }

  connect() {
    if (this.client) {
      this.client.destroy(); // Luk eksisterende socket, hvis den findes
    }

    this.client = new net.Socket();

    this.client.connect(5250, '127.0.0.1', () => {
      this.connected = true;
      console.log('Forbundet til CasparCG via AMCP');
      this.emit('status', { connected: true });
    });

    this.client.on('data', (data) => {
      const msg = data.toString();
      console.log('CasparCG svar:', msg);
      this.emit('response', msg); // Udsend event med svar
    });

    this.client.on('error', (err) => {
      if (err.code !== 'ECONNREFUSED' && err.code !== 'EALREADY') {
        console.error('Fejl i forbindelse til CasparCG', err.message);
      }

      this.connected = false;
      this.emit('status', { connected: false });
    });

    this.client.on('close', () => {
      console.log('Forbindelsen til CasparCG lukket');

      this.connected = false;
      this.emit('status', { connected: false });

      // Prøv at genforbinde efter lidt tid
      setTimeout(() => this.connect(), 30000); // Prøv igen efter 30 sekunder
    });
  }

  sendCommand(cmd) {
    if (this.connected) {
      this.client.write(cmd + '\r\n');
    } else {
      console.warn('Kan ikke sende AMCP-kommando. Ikke forbundet til CasparCG.');
    }
  }
}

const amcpClient = new AmcpClient();

module.exports = amcpClient;
