const path = require('path');

const Cluster = require('./modules/cluster');

const Storage = require('./modules/storage');

const startWebApp = require('./modules/tools/webapp.js');

const config = require('./config.json');

const storage = Storage(path.join(__dirname, "/logs"));

// создаем хранилище для автозаписи логовж
const log = storage.create(process.pid+'.log', {
	generated: {}, // сюда заносим pid-ы процессов, и отправленные&&обработтанныt данные для каждого из pid
	processed: [], // сюда заносим обработтанные данные в этом процессе
});


const cluster = new Cluster();

let workers = {};
let info = {
	generated: 0,
	processed: 0,
};

// помогает запускать и останавливать генерацию данных для обработки
class DataProcess{
	constructor(){
		this.isStarted = false;
		this.timers = [];
	}
	start(cb,timeout=0){
		const timer = setInterval(cb, timeout);
		this.timers.push(timer);
	}
	stop(){
		this.timers.forEach((timer)=>{
			clearInterval(timer);
		});
		this.timers=[];	
	}
};

const dataProcess = new DataProcess(1000);


// console.log("isMaster",cluster.isMaster, process.pid);
if (cluster.isMaster) {

	start(cluster);

	for (var i = 0; i < config.workers; i++) {
		cluster.fork();
	}

	cluster.on('cluster.ready', (pid) => {
		cluster.getWorkers().forEach((worker) => {
			storeWorker(worker.pid);
		});
	});

} else {

	cluster.on('cluster.setmaster', (pid) => {});

	cluster.on('cluster.ready', (pid) => {

	});

	cluster.on("task.fullinfo", (w, i, pid) => {
		workers = w;
		info = i;
		cluster.send(pid, "task.isReady", true);
	});

	cluster.on('cluster.isMaster', (from) => {
		console.log("2222", workers);
		start(cluster);
		cluster.send(from, "task.isMaster", true);
		ws.broadcast("worker.list", workers);
	});

}


function storeWorker(pid, opt = {}) {
	if (!pid) return;
	const worker = cluster.getWorker(pid);
	const current = workers[pid] || {};
	workers[pid] = {
		pid: pid,
		generated: opt.generated || current.generated || 0,
		processed: opt.processed || current.processed || 0,
		status: opt.status || (worker ? worker.isMaster ? 'master' : 'worker' : 'death'),
		alive: (typeof opt.alive == 'boolean') ? opt.alive : worker ? true : false
	};
}


function start(cluster) {

	
	ws = startWebApp(path.join(__dirname, 'public'), config.port);

	cluster.on('cluster.ready', (pid) => {
		ws.broadcast("worker.list", workers);
	});



	ws.on("connection", (reply) => {
		reply("worker.list", workers);
		reply("cluster.info", info);
	});


	ws.on("worker.getfullinfo", (reply) => {
		reply("worker.list", workers);
		reply("cluster.info", info);
	});

	ws.on("worker.kill", (reply, pid) => {

		const list = cluster.getWorkers();
		if (list.length == 1) {
			reply('message', 'Извините, но я последний боец в этом окопе!!!');
			return;
		}

		const worker = cluster.getWorker(pid);
		if (!worker) {
			reply('message', 'воркер уже был мертв))))');
			workers[pid].alive = false;
			ws.broadcast("worker.list", workers);
		} else {

			if (pid === process.pid) {
				reply('message', 'Эхх, подстрелили командира?');
				
				dataProcess.stop();

				nextMaster = list.filter((item) => item.pid != worker.pid)[0];


				storeWorker(pid, { status: "death",	alive: false });
				storeWorker(nextMaster.pid, { status: "master",	alive: true });

				ws.broadcast("worker.list", workers);

				cluster.on("task.isReady", () => {
					ws.stop();
					nextMaster.setAsMaster(pid);
				});

				cluster.on("task.isMaster", () => {
					worker.kill();
				});

				cluster.on("cluster.stop", () => {

					process.exit();
					process.kill(process.pid);
				});

				nextMaster.send("task.fullinfo", workers, info, pid);

			} else {
				workers[pid].alive = false;
				worker.kill();
				ws.broadcast("worker.list", workers);
			}
		}
	});

	ws.on("worker.killall", (reply) => {
		reply('message', 'мы так не договаривались))))');

	});

	ws.on("worker.fork", (reply) => {
		if (Object.keys(workers).length > 3) {
			reply('message', 'пожалейте мой компьютер');
			return;
		}

		const worker = cluster.fork();

		worker.on("worker.ready", () => {

			storeWorker(worker.pid);

			ws.broadcast("worker.list", workers);
			ws.broadcast("cluster.info", info);
		});
	});

	// даем время запустится web серверу
	setTimeout(()=>{

		log.generated[process.pid] = [];
		// 	генерируем и рассылаем данные
		dataProcess.start(()=>{
			const number = Math.floor(Math.random()*1000);
			const pids = Object.values(workers).filter(worker=>worker.alive).map(worker=>worker.pid);
			if(pids.length==0) return;
			const r = Math.floor(Math.random()*pids.length);
			const pid = pids[r];
			const worker = cluster.getWorker(pid);
			console.log(pids, pid, worker.pid);
			info.generated++;
			workers[process.pid].generated++;
			worker.send("process.data", process.pid, number);
		},50);

		// 	кидаем инфу браузерным клиентам
		dataProcess.start(()=>{
			ws.broadcast("worker.list", workers);
			ws.broadcast("cluster.info", info);		
		},5000);

	},5000);

}


// если мы генерировали данные нам и учитывать их)
cluster.on("process.data.ready", (pid, number)=>{
	log.generated[process.pid].push(number);
	info.processed++;
	workers[pid].processed++;
});

// обрабатываем входящие данные (пишем в файл лога)
cluster.on("process.data", (pid, number)=>{
	log.processed.push(number);
	// подтверждаем обработку
	cluster.send(pid,"process.data.ready", process.pid, number);
});