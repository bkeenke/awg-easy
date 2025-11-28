'use strict';

const { release } = require('./package.json');

// Update checking
module.exports.CHECK_UPDATE = process.env.CHECK_UPDATE ? process.env.CHECK_UPDATE.toLowerCase() === 'true' : true;
module.exports.RELEASE = release;

// Server configuration
module.exports.PORT = process.env.PORT || 51821;
module.exports.WEBUI_HOST = process.env.WEBUI_HOST || '0.0.0.0';
module.exports.PASSWORD = process.env.PASSWORD;

// WireGuard configuration
module.exports.WG_PATH = process.env.WG_PATH || '/etc/wireguard/';
module.exports.WG_DEVICE = process.env.WG_DEVICE || 'eth0';
module.exports.WG_HOST = process.env.WG_HOST;
module.exports.WG_PORT = process.env.WG_PORT || 51820;
module.exports.WG_MTU = process.env.WG_MTU || null;
module.exports.WG_PERSISTENT_KEEPALIVE = process.env.WG_PERSISTENT_KEEPALIVE || 0;
module.exports.WG_DEFAULT_ADDRESS = process.env.WG_DEFAULT_ADDRESS || '10.8.0.x';
module.exports.WG_DEFAULT_DNS = typeof process.env.WG_DEFAULT_DNS === 'string'
  ? process.env.WG_DEFAULT_DNS
  : '1.1.1.1';
module.exports.WG_ALLOWED_IPS = process.env.WG_ALLOWED_IPS || '0.0.0.0/0, ::/0';

// IPTables hooks
module.exports.WG_PRE_UP = process.env.WG_PRE_UP || '';
module.exports.WG_POST_UP = process.env.WG_POST_UP || `
iptables -t nat -A POSTROUTING -s ${module.exports.WG_DEFAULT_ADDRESS.replace('x', '0')}/24 -o ${module.exports.WG_DEVICE} -j MASQUERADE;
iptables -A INPUT -p udp -m udp --dport 51820 -j ACCEPT;
iptables -A FORWARD -i wg0 -j ACCEPT;
iptables -A FORWARD -o wg0 -j ACCEPT;
`.split('\n').join(' ');

module.exports.WG_PRE_DOWN = process.env.WG_PRE_DOWN || '';
module.exports.WG_POST_DOWN = process.env.WG_POST_DOWN || '';

// UI Language
module.exports.LANG = process.env.LANGUAGE || 'en';

// Amnezia WireGuard parameters
// These parameters help to obfuscate WireGuard traffic
const getRandomInt = (min, max) => min + Math.floor(Math.random() * (max - min));
const getRandomJunkSize = () => getRandomInt(15, 150);
const getRandomHeader = () => getRandomInt(1, 2_147_483_647);

// Junk packet count - number of packets with random data sent before session start
module.exports.JC = process.env.JC || getRandomInt(3, 10);

// Junk packet minimum size
module.exports.JMIN = process.env.JMIN || 50;

// Junk packet maximum size
module.exports.JMAX = process.env.JMAX || 1000;

// Init packet junk size - random data added to init packet
module.exports.S1 = process.env.S1 || getRandomJunkSize();

// Response packet junk size - random data added to response packet
module.exports.S2 = process.env.S2 || getRandomJunkSize();

// Init packet magic header
module.exports.H1 = process.env.H1 || getRandomHeader();

// Response packet magic header
module.exports.H2 = process.env.H2 || getRandomHeader();

// Underload packet magic header
module.exports.H3 = process.env.H3 || getRandomHeader();

// Transport packet magic header
module.exports.H4 = process.env.H4 || getRandomHeader();
