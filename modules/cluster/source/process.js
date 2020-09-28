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


// ищу пути запускать несколько серверов на одном порту 
// как https://xsltdev.ru/nodejs/tutorial/cluster/
setTimeout(() => {
	console.log('++++++++++++++++++++++++++++++++++++++')

	try {
		// statements

		// const reserver = net.createServer((socket) => {
		//   // socket.end('goodbye\n');
		// }).on('error', (err) => {
		//   // handle errors here
		//   throw err;
		// });

		// reserver.listen(this.server._handle, (...args)=>{
		// 	console.log("SERVERS",...args);
		// });

		// reserver.on("connection", (socket)=>{
		// 	console.log("SERVERS","connection");
		// });

		// const socket = net.createConnection({path: this.socketPath}, () => {
		// 	//'connect' listener
		// 	console.log('connected to server!!!!!');
		// 	socket.write(JSON.stringify({eventName: 'test', data:{pid: this.id}}));
		// });

		// socket.on('end', () => {
		// 	console.log('disconnected from server');
		// });

	} catch (e) {
		// statements
		console.log(e);
	}


}, 2000)