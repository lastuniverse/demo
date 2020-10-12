const net = require('net');

function isSocket(item) {
  return item instanceof net.Socket;
}

function isServer(item) {
  return item instanceof net.Server;
}

function getConnections() {
  // eslint-disable-next-line no-underscore-dangle
  const list = process._getActiveHandles();
  return list;
}

function getServers() {
  return getConnections().filter((item) => isServer(item));
}

function getSockets() {
  return getConnections().filter((item) => isSocket(item));
}

function shutdown() {
  getServers().forEach((server) => server.close());
  getSockets().forEach((socket) => socket.end());
  process.exit();
}

process.on('SIGINT', shutdown);
process.on('SIGKIL', shutdown);
process.on('exit', shutdown);
