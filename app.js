const path = require('path');

const fs = require("fs");

const Cluster = require('./modules/cluster');

const Storage = require('./modules/storage');

const startWebApp = require('./modules/tools/webapp.js');

const config = require('./config.json');

// создаем кластер
const cluster = new Cluster();



// использовал для логирования, но предназначенаа для других целей
// const storage = Storage(path.join(__dirname, "/logs"));
// создаем хранилище для автозаписи логовж
// const log = storage.create(process.pid+'.log', {
// 	generated: {}, // сюда заносим pid-ы процессов, и отправленные&&обработтанныt данные для каждого из pid
// 	processed: [], // сюда заносим обработтанные данные в этом процессе
// });

// логирую просто в файлы с именем {pid}.log в папке ./logs
const logFfileName = path.join(__dirname, "/logs", process.pid+".log");
const fd = fs.openSync(logFfileName, 'a');

// это вместо редиса)) пересылается при смене мастера, отправляется в интерфейс через ws
let workers = {};
let info = {
	generated: 0,
	processed: 0,
};

// помогает запускать и останавливать генерацию данных для обработки (начиная с 257 строки и до конца генерация и обработка данных)
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




if (cluster.isMaster) {
	// данный блок кода будет выполнен единожды, в мастер процессе при первом его запуске
	// при передачи прав мастерпроцесса воркерам, данный блок в воркере выполнен не будет
	start(cluster);

	// 	запускаем воркеры (количество указанно в конфиге ./config.json)
	for (var i = 0; i < config.workers; i++) {
		cluster.fork();
	}

	// ожидаем от кластера подтверждения о готовности (запущен ipc сервер на мастере, все воркеры, запускаемые в этой секции готовы, 
	// запустили свои IPC сервера, подключились к мастерпроцессу, мастер процесс подключился к каждому из воркеров)
	cluster.on('cluster.ready', (pid) => {
		// производим первичную инициализацию клобального ассоциативного массива workers
		cluster.getWorkers().forEach((worker) => {
			storeWorker(worker.pid);
		});
	});

} else {
	// данный блок кода будет выполнен единожды, в в каждом запускаемом точернем процессе

	cluster.on('cluster.setmaster', (pid) => {});

	cluster.on('cluster.ready', (pid) => {});

	// перед тем как передать мастера, сервер кидает инфу
	cluster.on("task.fullinfo", (w, i, pid) => {
		workers = w;
		info = i;
		cluster.send(pid, "task.isReady", true);
	});

	// получаем мастера
	cluster.on('cluster.isMaster', (from) => {
		start(cluster);
		cluster.send(from, "task.isMaster", true);
		ws.broadcast("worker.list", workers);
		// пишем в лог
		fs.write(fd, `set as master from ${from}\n`,()=>{});
	});

}


function storeWorker(pid, opt = {}) {
	if (!pid) return;
	const worker = cluster.getWorker(pid);
	const current = workers[pid] || {};
	const alive = (typeof opt.alive == 'boolean') ? opt.alive : worker ? true : false;
	workers[pid] = {
		pid: pid,
		generated: opt.generated || current.generated || 0,
		processed: opt.processed || current.processed || 0,
		status: opt.status ? opt.status : worker.isMaster ? 'master' : 'worker',

		alive: alive
	};
}

// эта функция вызывается процессом, который становится мастером
// - запускает express в связке websocker сервером
// - обрабатывает события от интерфейса
// - запускает генерацию и рассылку рандомных данных
// 
function start(cluster) {

	
	ws = startWebApp(path.join(__dirname, 'public'), config.port);

	// далее в основном обработка событий, названия которых говорят сами за себя
	cluster.on('cluster.ready', (pid) => {
		ws.broadcast("worker.list", workers);
	});

	// если клиент подключился, скидываем ему актуальную информацию
	ws.on("connection", (reply) => {
		reply("worker.list", workers);
		reply("cluster.info", info);
	});

	// иногда клиент может и сам попросить актуальную информацию
	ws.on("worker.getfullinfo", (reply) => {
		reply("worker.list", workers);
		reply("cluster.info", info);
	});

	let isProcessTerminated = false;
	// клиент хочет когото убить
	ws.on("worker.kill", (reply, pid) => {

		if(isProcessTerminated){
			reply('message', 'попробуйте убить процесс через несколько секунд');
			return;
		} 

		isProcessTerminated=true;
		setTimeout(()=>{
			isProcessTerminated=false;
		},10000);

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
				
				// прекращаем генерацию данных
				dataProcess.stop();

				// 	выбираем процесс для передачи ему мАстерских полномочий
				nextMaster = list.filter((item) => item.pid != worker.pid)[0];

				storeWorker(pid, { status: "worker",	alive: false });
				storeWorker(nextMaster.pid, { status: "master",	alive: true });

				ws.broadcast("worker.list", workers);

				// выбранный стать мастером воркер говорит что получил инфу
				cluster.on("task.isReady", () => {
					ws.stop();
					nextMaster.setAsMaster(pid);
				});

				// выбранный стать мастером воркер говорит что уже стал им (прощается))
				cluster.on("task.isMaster", () => {
					// убиваем сами себя
					worker.kill(null,process.pid);
				});

				// перед смертью чтото делаем, притом синхронно (специфика выхода по process.exit() )
				cluster.on("cluster.stop", (pid) => {
					fs.write(fd, `kill from ${pid}\n`,()=>{});					
					fs.closeSync(fd);
					// process.exit();
					// process.kill(process.pid);
				});

				// перед тем как сделать выбранный воркер мастером отправляем ему текущую инфу
				nextMaster.send("task.fullinfo", workers, info, pid);

			} else {
				workers[pid].alive = false;
				worker.kill(null,process.pid);
				ws.broadcast("worker.list", workers);
			}
		}
	});

	// 	нет, хотя бы одного бойца надо оставить
	ws.on("worker.killall", (reply) => {
		reply('message', 'мы так не договаривались))))');

	});


	let isProcessStarted = false;
	// принимаем от интерфейса команду на создание дочернего процесса
	ws.on("worker.fork", (reply) => {
		console.log('fork 01');
		
		if(isProcessStarted){
			reply('message', 'попробуйте запустить процесс чуть позже');
			return;
		} 
		console.log('fork 02');

		isProcessStarted=true;
		setTimeout(()=>{
			isProcessStarted=false;
		},5000);

		if (Object.values(workers).filter(worker=>worker.alive).length > 7) {
			reply('message', 'пожалейте мой компьютер');
			return;
		}
		console.log('fork 03');

		const worker = cluster.fork();
        // дочерний процесс готов (запустил IPC сервер, подключился к мастеру а мастер подключился к дочернему процессу)
		worker.on("worker.ready", () => {
			storeWorker(worker.pid);
			ws.broadcast("worker.list", workers);
			ws.broadcast("cluster.info", info);
		});
	});

	// даем время запустится web серверу
	setTimeout(()=>{

		// 	генерируем и рассылаем данные
		dataProcess.start(()=>{
			const number = Math.floor(Math.random()*1000);
			const pids = Object.values(workers).filter(worker=>worker.alive).map(worker=>worker.pid);
			if(pids.length==0) return;
			const r = Math.floor(Math.random()*pids.length);
			const pid = pids[r];
			const worker = cluster.getWorker(pid);

			if(!worker) return;

			info.generated++;
			workers[process.pid].generated++;

			// отправляем выбранному процессу данные на обработку 
			worker.send("process.data", process.pid, number);
	
			// пишем в лог сгенерированныечисла
			fs.write(fd, `${number} generated for ${pid}\n`,()=>{});
			// log.generated[process.pid].push(number);
		},500);

		// 	кидаем инфу браузерным клиентам
		dataProcess.start(()=>{
			ws.broadcast("worker.list", workers);
			ws.broadcast("cluster.info", info);		
		},500);

	},5000);

}

// эти обработчики предназначены для обработки данных и висят вне зависимости от мастер/воркер
// т.е. данные могут обрабатывать и мастер и воркеры

// если мы генерировали данные нам и учитывать их)
cluster.on("process.data.ready", (pid, number)=>{
	info.processed++;
	workers[pid].processed++;
});

// обрабатываем входящие данные (пишем в файл лога)
cluster.on("process.data", (pid, number)=>{
	// пишем в лог обработанные ечисла
	fs.write(fd, `${number} from ${pid}\n`,()=>{});
	//log.processed.push(number);

	// подтверждаем обработку
	cluster.send(pid,"process.data.ready", process.pid, number);
});