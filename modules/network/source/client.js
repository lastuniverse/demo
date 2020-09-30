const net = require('net');
const Emitter = require('events');
const tools = require('./tools.js');
const uuidv4 = require('../../tools/uuidv4.js');


class Client extends Emitter {

	constructor(pid) {
		try {
			super();

			this.pid = pid;

			this.connect();

		} catch (e) {
			console.log(e)
		}
	}

	connect() {
		try {

			this.socket = net.createConnection({
				path: tools.socketFileNameByPid(this.pid)
			}, () => {
				console.log('Process', process.pid, 'connected to server', this.pid);
				this.emit('network.ready', {
					from: process.pid,
					to: this.pid,
					// client: this
				});
			});


			this.socket.on('end', () => {
				console.log('Process', process.pid, 'disconnected from server', this.pid);
			});

			this.socket.on('error', () => {
				setTimeout(() => {
					this.connect(this.pid);
				}, 1000)
			});
		} catch (e) {
			console.log(e);
		}
	}

	send(eventName,data) {
		try {
			this.socket.write(JSON.stringify({
			from: process.pid,
			to: this.pid,
			messageId: uuidv4(),
			eventName:eventName,
			data: data	
			}) + '\r\n');
		} catch (e) {
			console.log(e)
		}
	}
}



exports = module.exports = Client;