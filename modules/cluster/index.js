exports = module.exports = {
	Cluster: require('./source/cluster.js'),
	Worker: require('./source/worker.js')
};


const cluster = new exports.Cluster();

// console.log("isMaster",cluster.isMaster, process.pid);
if(cluster.isMaster){

	setTimeout(()=>{
		const worker = cluster.fork();

		cluster.on('cluster.ready', ()=>{
			console.log('MASTER. cluster.ready');
		})

		worker.on('worker.ready', ()=>{
			console.log('MASTER. worker.ready');
		})
		// console.log("THE END");
	},5000);

}else{
	cluster.on('cluster.ready', ()=>{
		console.log('WORKER. cluster.ready');
	})

}



