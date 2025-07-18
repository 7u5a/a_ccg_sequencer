// services/osc.js
const osc = require('osc');

const udpPort = new osc.UDPPort({
  localAddress: '0.0.0.0',
  localPort: 57121,
  remoteAddress: '127.0.0.1',
  remotePort: 6250 // CasparCG default OSC port
});

udpPort.open();

udpPort.on('ready', () => {
  console.log('OSC port klar');
});

function sendOscMessage(address, args = []) {
  udpPort.send({
    address,
    args
  });
}

module.exports = { sendOscMessage };
