const Emitter = require('events');
const child_process = require('child_process');



const cap = () => {};



class Worker extends Emitter {

	constructor(pid) {
		try {

			super();

			this.id = pid;

			this.messages = [];

		} catch (e) {
			console.error(e)
		}
	}

	create(settings, cb = cap) {

		try {
			const child = child_process.fork(
				settings.exec, ['child', ...settings.args], {
					silent: settings.silent,
					detached: true
				}
			);

			this.id = child.pid;

			child.on('message', (message) => {
				if (message == 'ready') cb();
			});

		} catch (e) {
			console.error(e)
		}

	}

	setIPC(node) {
		try {
			this.node = node;

			while (this.messages.length) {
				try {
					const {
						eventName,
						data,
						callback
					} = this.messages.shift()
					this.node.send(eventName, data, callback);
				} catch (e) {
					// statements
					console.log(e);
				}
			}
			
		} catch (e) {
			// statements
			console.log(e);
		}

	}

	send(eventName, data, callback) {
		if (this.node) return this.node.send(eventName, data, callback);

		this.messages.push({
			eventName,
			data,
			callback
		});
	}

	kill(signal = 'SIGTERM') {
		try {

		} catch (e) {
			console.error(e)
		}
	}
}

exports = module.exports = Worker;