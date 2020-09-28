// const child_process = require('child_process');


// const net = require('net');
// server = net.createServer();

// const child1 = child_process.fork('child.js', ['child1'], {detached: true});
// const child2 = child_process.fork('child.js', ['child2'], {detached: true});

// child1.send('child', server);
// child2.send('child', server);

//child.on('close', code => console.log(`Child process exited. Code: ${code}`));


// const transport = require('./modules/transport');



// const node = new transport.IPC({
// 	node: child_process.fork('child.js', [JSON.stringify({name: 'child'})], {
// 		detached: true
// 	})
// });

// node.on('message', data => {
// 	console.log('in main', data);
// });

// node.send({
// 	from: 'main',
// 	text: '111'
// });


// const manager = new transport.Core();

// manager.addNode(node);





const Cluster = require('./modules/cluster');

const cluster = new Cluster.Cluster();

console.log('cluster', cluster.isMaster, cluster.isWorker);

if(cluster.isMaster){

	cluster.fork();
}else{
	

}



console.log('Worker', cluster.worker.id );



function getIPs() {
	const servers = process._getActiveHandles().filter(item=>{
		if(item instanceof Net.Server){
			console.log('server.address', item.address());
			return 	true;
		}else{
			const whotistis = {}.toString.call(item);
			console.log('??????????????', whotistis);
			return false;
		}
		
	});
	return servers;
}

