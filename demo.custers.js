const Cluster = require('./modules/cluster');


const cluster = new Cluster.Cluster();

console.log('cluster', cluster.isMaster ? "MASTER" : cluster.isWorker ? "WORKER" : "??????", process.pid);

if (cluster.isMaster) {
	try {

		const child1 = cluster.fork();

		// слушаем событие 'test'
		cluster.network.on('test', (data, reply) => {
			console.log("master", "message", process.pid, JSON.stringify(data));
			if (reply) reply({
				reply: data.data.test
			});
		});


		// тестируем метод send у узла (от сервера до клиента)
		child1.send('test', {test: '111'});


		// child1.send('test', {test: '222'}, (data) => {
		// 	console.log("master", "reply", process.pid, JSON.stringify(data));
		// });

	} catch (e) {
		console.error(e);
	}


} else {
	try {
		// слушаем событие 'test'
		cluster.network.on('test', (data, reply) => {
			console.log("child", "message", process.pid, JSON.stringify(data));
			if (reply) reply({
				reply: data.data.test
			});
		});

		//даем workeram время для подключения к мастерам
		setTimeout(() => {
			// тестируем метод send от списка воткеров на мастере (от сервера к клиенту)
			// cluster.getWorkers().send('test', {test: '333'});

			// cluster.getWorkers().send('test', {test: '444'}, (data) => {
			// 	console.log("child", "reply", process.pid, JSON.stringify(data));
			// });

			// тестируем метод broadcast у мастера (от сервера к клиентам)
			// node.broadcast('test', {child: '555'});

			// node.broadcast('test', {child: '666'}, (data) => {
			// 	console.log("child", "reply", process.pid, JSON.stringify(data));
			// });

		}, 3000)
	} catch (e) {
		// statements
		console.error(e);
	}

}