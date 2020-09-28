const Emitter = require('events');
const net = require('net');
const Node = require('./node.js');



const socketDir = './tmp/';
const cap = () => {};


function getDescriptorByPid(pid) {
	try {
		return `${socketDir}cluster.${pid}.sock`;
	} catch (e) {
		console.error(e)
	}
}

function parseDataToJSON(data) {
	try {
		return data
			.toString()
			.split(/\r\n/)
			.filter(message => message.length)
			.map(message => {
				try {
					// console.log('network.js', 'parseDataToJSON', message);
					return JSON.parse(message);
				} catch (e) {
					console.error(e, `<${message}>`);
				}
			});
	} catch (e) {
		console.error(e)
	}
}


const listeners = {

	// если сделать стрелочными, не привяжется контекст класса
	// как вариант, можно объяввить внутри класса 	listeners = {...};

	serverError: function(error) {
		try {
			if (error.code !== 'EADDRINUSE') throw error;

			setTimeout(() => {
				this.server.close();
				this.server.listen(this.descriptor, cap);
			}, 1000);
		} catch (e) {
			console.error(e)
		}
	},

	clientEnd: function() {
		try {
			console.log('Node ??? disconnected from server', process.pid);
		} catch (e) {
			console.error(e)
		}
	},

	data: function(data) {
		try {
			const messageList = data.toString()

			parseDataToJSON(data)
				.forEach(message => {
					try {
						if (!message || !message.eventName) return;

						if (message.type == "reply")
							return this.getNode(message.from).emit(message.eventName, message);

						if (message.type != "query")
							return this.emit(message.eventName, message);

						const replyEventName = `service.reply.${message.messageID}`;

						const reply = (data) => {
							this.send(message.from, replyEventName, data);
						}

						this.emit(message.eventName, message, reply);
					} catch (e) {
						// statements
						console.log(e);
					}
				});
		} catch (e) {
			console.error(e)
		}
	},

	test: function() {

		return this;
	}


};



class Network extends Emitter {

	constructor() {
		try {
			super();

			this.descriptor = getDescriptorByPid(process.pid);

			this.nodeList = {};

			this.messages = [];

			this.listeners = Object.keys(listeners).reduce((acc, key) => {

				acc[key] = listeners[key].bind(this);

				return acc;
			}, {});

		} catch (e) {
			console.error(e)
		}
	}


	startServer(cb = cap) {
		this.server = net.createServer(socket => {
			socket.on('data', this.listeners.data);
		});

		this.server.on('error', this.listeners.serverError);

		this.server.listen(this.descriptor, () => {
			console.log('Node', process.pid, 'opened server on', this.server.address());
			cb();
		});
	}

	connectToNode(pid, cb = cap) {
		const socket = net.createConnection({
			path: getDescriptorByPid(pid)
		}, () => {
			try {
				const node = new Node(pid, socket);

				this.nodeList[pid] = node;

				console.log(`Node ${process.pid} connected to node ${pid} !`);

				cb(node);

				this.resend();
			} catch (e) {
				// statements
				console.log(e);
			}

		});

		socket.on('data', this.listeners.data);

		socket.on('end', this.listeners.clientEnd);
	}

	connectToNodes(pids, cb) {
		pids.forEach(pid => this.connectToNode(pid, cb));
	}

	getNode(pid) {
		return this.nodeList[pid];
	}
	resend(timeout = 10000) {
		setTimeout(() => {
			let messages = this.messages;
			this.messages = [];

			messages.forEach((message) => {
				const {
					targetPid,
					eventName,
					data,
					callback
				} = message;
				try {
					this.send(targetPid, eventName, data, callback);
				} catch (e) {
					// statements
					console.log(e);
				}

			});

			if (this.messages.length) this.resend(timeout);
		}, timeout);
	}

	send(targetPid, eventName, data, callback) {
		try {
			if (targetPid == process.pid) return;

			const node = this.getNode(targetPid);

			if (node) return node.send(eventName, data, callback);

			this.messages.push({
				targetPid,
				eventName,
				data,
				callback
			});

		} catch (e) {
			console.error(e)
		}
	}

	broadcast(eventName, data, callback) {
		try {

			Object.keys(this.nodeList).forEach((pid) => {
				this.send(pid, eventName, data, callback);
			});

		} catch (e) {
			console.error(e)
		}
	}

};



exports = module.exports = Network;