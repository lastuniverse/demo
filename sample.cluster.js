const Cluster = require('./modules/cluster')

const cluster = new Cluster();


// console.log("isMaster",cluster.isMaster, process.pid);
if (cluster.isMaster) {
	const worker1 = cluster.fork();
	const worker2 = cluster.fork();


	cluster.on('cluster.ready', (pid) => {
		console.log('MASTER. cluster.ready', process.pid, pid);
	});

	worker1.on('worker.ready', () => {
		console.log('MASTER. worker1.ready');
		cluster.kill(worker1.pid);
	});

	worker1.on('worker.stop', () => {
		console.log('MASTER. worker1.stop', 'Самое страшное, это терять детей.');
	});

	worker2.on('worker.ready', () => {
		console.log('MASTER. worker2.ready');
		cluster.setAsMaster(worker2.pid);
	});
} else {
	cluster.on('cluster.ready', (pid) => {
		console.log('WORKER. cluster.ready', process.pid, pid);
	});


	cluster.on('cluster.setmaster', (pid) => {
		console.log('WORKER. cluster.setmaster', process.pid, pid, 'Упс, насяльника сменилась');
	});

	cluster.on('cluster.isMaster', (pid) => {
		console.log('WORKER. cluster.isMaster', process.pid, pid, 'Ураааа, я главный)))');
		// cluster.fork();
	});

	cluster.on('cluster.stop', (pid) => {
		console.log('WORKER. cluster.stop', process.pid, pid, 'А ведь я еще так молод!!!');
	});
}

