const net = require('net');
const Emitter = require('events');
const tools = require('./tools.js');


class Server extends Emitter {

	constructor() {
		try {
			super();

			this.descriptor = tools.socketFileNameByPid(process.pid);

			this.startServer();

		} catch (e) {
			console.log(e)
		}
	}

	startServer() {
		try {
			this.server = net.createServer(socket => {
				socket.on('data', (data) => {
					data.toString()
						.split(/\r\n/)
						.forEach((text) => {
							if (!text) return
							try {
								const message = JSON.parse(text);
								if (!message || !message.eventName) return;
								// message.socket = socket;
								this.emit(message.eventName, message);
							} catch (e) {
								console.log(e, `<${text}>`);
							}

						});
				});
			});

			this.server.on('error', (error) => {
				try {
					if (error.code !== 'EADDRINUSE') throw error;

					setTimeout(() => {
						this.server.close();
						this.server.listen(this.descriptor, () => {
							console.log('Process', process.pid, 'opened server on', this.server.address());
							this.emit('network.ready');
						});
					}, 1000);
				} catch (e) {
					console.log(e)
				}
			});

			this.server.listen(this.descriptor, () => {
				console.log('Process', process.pid, 'opened server on', this.server.address());
				this.emit('network.ready');
			});
		} catch (e) {
			console.log(e)
		}

	}



};

exports = module.exports = Server;