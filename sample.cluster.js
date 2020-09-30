const Cluster = require('./modules/cluster')

const cluster = new Cluster();

// console.log("isMaster",cluster.isMaster, process.pid);
if (cluster.isMaster) {
	const worker1 = cluster.fork();
	const worker2 = cluster.fork();


	cluster.on('cluster.ready', () => {
		console.log('MASTER. cluster.ready');
	});
	
	worker1.on('worker.ready', () => {
		console.log('MASTER. worker1.ready');
		// setTimeout(() => {
		console.log('MASTER. kill worker');
		cluster.kill(worker1.pid);
		// }, 5000);
	});

	worker2.on('worker.ready', () => {
		console.log('MASTER. worker2.ready');
		// setTimeout(()=>{
		// console.log('MASTER. setAsMaster worker');
		// cluster.setAsMaster(worker2.pid);
		// },7000)
	});
} else {
	cluster.on('cluster.ready', () => {
		console.log('WORKER. cluster.ready');
	});


	cluster.on('cluster.setmaster', () => {
		console.log('WORKER. cluster.ready', cluster.isMaster);
	});



}