const net = require('net');

function getConnections(){
	return process._getActiveHandles();
}

function getServers() {
	return getConnections().filter(item => isServer(item));
}

function getSockets() {
	return getConnections().filter(item => isSocket(item));
}

function isSocket(item) {
	return item instanceof net.Socket;
}

function isServer(item) {
	return item instanceof net.Server;
}

function shutdown() {
	getServers().forEach(server => server.close());
	getSockets().forEach(socket => socket.end());
	process.exit();
};

process.on('SIGINT', shutdown);
process.on('SIGKIL', shutdown);
process.on('exit', shutdown);

