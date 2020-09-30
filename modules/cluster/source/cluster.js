const Emitter = require('events');
const network = require('../../network');
const Worker = require('./worker');
const tools = require('./tools.js');

class Cluster extends Emitter {

	constructor() {
		super();
		this.isMaster = tools.isMaster();
		this.workers = {};

		this.server = new network.Server(); // =[0,6]=
console.log(tools.isMaster(),'=[0, 6]=');
		this.server.on('network.ready', () => { // =[0,6]=
console.log(tools.isMaster(),'=[1]=');
			this.fork(process.pid); // =[1]=
		});

		this.server.once('service.connect.to.parent', (pid) => { // =[9]=
console.log(tools.isMaster(),'=[9,10]=');
			this.fork(process.pid); // =[10]=
		});

		this.server.on('service.update.pids', (pids) => { // =[17]=
console.log(tools.isMaster(),'=[17]=');
			pids.forEach((pid) => {
				if (this.workers[pid]) return;
				this.fork(pid); // =[18]=
			});
		});
	}


	fork(pid) {
		const worker = new Worker(pid);

		const wait = (pid) => {
			if (pid != worker.pid) return;
console.log(tools.isMaster(),'=[15,16]=')
			this.workers[worker.pid] = worker; // =[15]=
			worker.emit('worker.ready',worker);
			this.server.removeListener('service.ready', wait);
			this.broadcast('service.update.pids', Object.keys(this.workers)); // =[16]=
		};
		this.server.on('service.ready', wait); // =[15]=



		worker.once('service.ready', (pid) => {
console.log(tools.isMaster(),'=[4,13,21]=');
			this.workers[worker.pid] = worker; // =[4,13,21]=
			this.emit('cluster.ready');
			worker.emit('worker.ready',worker);
		});

		return worker;
	}

	broadcast(eventName, data) {
		this.getWorkers().forEach(worker => {
			//worker.send(eventName, data);
		})
	}

	getWorkers() {
		return Object.values(this.workers);
	}

	getWorkerByID(id) {
		try {
			return this.workers[id];
		} catch (e) {
			console.error(e)
		}
	}
};



exports = module.exports = Cluster;