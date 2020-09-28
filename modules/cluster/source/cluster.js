const os = require('os');
//const cpus = os.cpus().length
const Emitter = require('events');


const Worker = require('./worker.js');
const Network = require('../../network');

const serviceListeners = {

	'cluster.worker.add': function(message) {
		message.data.forEach(pid=>{
			this.registerWorker(pid);
		});
	},

};

/**
 * реализовал подобие необходимой части API по образцу https://nodejs.org/api/cluster.html
 */
class Cluster extends Emitter {

	constructor() {
		try {
			super();

			this.network = new Network();

			if (process.argv[2] == 'child') {
				this.isWorker = true;
			} else {
				this.isMaster = true;
			}

			this.id = process.pid;

			this.workers = {};

			this.setupMaster();


			this.listeners = Object.keys(serviceListeners).reduce((acc, eventName) => {

				const listener = serviceListeners[eventName].bind(this);

				this.network.on(eventName, listener);

				acc[eventName] = listener;

				return acc;
			}, {});

			this.network.startServer(() => {

				if (this.isWorker) process.send("ready");
			});


		} catch (e) {
			console.error(e)
		}
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


	setupMaster(settings = {}) {
		try {
			this.settings = {
				// execArgv: settings.execArgv || process.execArgv,
				exec: settings.exec || process.argv[1],
				args: settings.args || process.argv.slice(2),
				silent: settings.silent || false
			};
		} catch (e) {
			console.error(e)
		}
	}

	registerWorker(pid, worker) {
		
		try {

			if(!worker) worker = new Worker(pid);

			if (worker.id == process.pid) return;

			if (this.getWorkerByID(worker.id)) return;
			this.network.connectToNode(worker.id, node=>{
	
				worker.setIPC(node);

				this.workers[pid] = worker;
			});

			return worker;

		} catch (e) {
			console.error(e)
		}
	}

	fork() {
		if (this.isWorker) throw ('Метод .fork() может быть вызван только из главного просесса');

		const worker = new Worker();

		worker.create(this.settings, () => {
			try {

				this.registerWorker(worker.id, worker);

				worker.send("cluster.worker.add", [this.id, ...Object.keys(this.workers)]);

				this.broadcast("cluster.worker.add", [worker.id]);
			} catch (e) {
				console.error(e)
			}

		});



		return worker;


	}

	broadcast(eventName, data, cb) {
		this.getWorkers().forEach(worker=>{
			worker.send("cluster.worker.add", data, cb);
		})
	}


};



exports = module.exports = Cluster;



