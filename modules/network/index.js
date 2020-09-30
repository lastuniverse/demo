exports = module.exports = {
	Server: require('./source/server.js'),
	Client: require('./source/client.js')
};





// // проверка
// const Server = exports.server;
// const Client = exports.client;


// const server = new Server();
// const client = new Client(process.pid);

// server.on('network.ready',()=>{
// 	console.log('server is ready');
// 	server.on('test',(message)=>{
// 		console.log(message);
// 	});


// 	client.on('network.ready', ()=>{
// 		console.log('client is ready');
// 		client.send('test',12345);
// 	});
// });
