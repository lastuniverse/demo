const Network = require('./modules/network');


// создаем сервер
const network = new Network()

network.startServer(() => {
	// слушаем событие 'test'
	network.on('test', (data, reply) => {
		console.log(data);
		if (reply) reply({ reply: data.data.test });
	})

	// подключаемся сами к себе (проще и нагляднее)
	network.connectToNode(process.pid,(node)=>{

		// тестируем метод send у узла (от клиента до сервера)
		node.send('test', {	test: '333' });

		node.send('test', {	test: '444' }, (data) => {
			console.log("reply", data);
		});

	});

	// тестируем метод send у сервера (от сервера к клиенту)
	network.send(process.pid, 'test', {	test: '111' });

	network.send(process.pid, 'test', {	test: '222' }, (data) => {
		console.log("reply", data);
	});

});



