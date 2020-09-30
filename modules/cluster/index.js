/**
 * Модуль реализует механизм запуска дочерних процессов и управления ими посредством мультисерверного обмена сообщениями. 
 * В основу его архитектуры модуля легли следующие соглашения:
 * - каждый процесс, включая главный имеет свой сервер. Причиной для такого решения послужило множество факторов, связанных в основном с исключением
 * "слабого звена" (ситуации, когда падает главный процесс, через который происходит все взаимодействие)
 * - каждый процесс, включая главный имеет свой набор активных подключений к каждому из процессов, включая себя самого.
 * - все взаимодействие между процессами происходит через механизм отправки именованных событий путем установки их обработчиков
 * 
 * 
 * Архитектура данного модуля реализует следующие принципы SOLID:
 * - [S] Принцип единственной ответственности (Модуль, как самостоятельный элемент сравнимый с классом инкапсулирует все ресурсы необходимые для своей работы)
 * - [I] Принцип разделения интерфейса (Cluster, Worker)
 * 
 * Почему не применялись следующие следующие принципы SOLID:
 * - [O] Принцип открытости/закрытости (не представляю как его применить или неприменить в данном случае)
 * - [L] Принцип подстановки Лисков (Доводы теже что и в [O])
 * - [D] Принцип инверсии зависимостей (Доводы теже что и в [O])
 * 
 * @example
 * const server = new Server();
 * const client = new Client(process.pid);
 * 
 * server.on('network.ready',()=>{
 * 	console.log('server is ready');
 * 	server.on('test',(message)=>{
 * 		console.log(message);
 * 	});
 * });
 * 
 * client.on('network.ready', ()=>{
 * 	console.log('client is ready');
 * 	client.send('test',12345);
 * });
 * 
 * @module modules/nerwork
 * 
 * @author Roman Surmanidze <lastuniverse@github.com>* 
 */
exports = module.exports = {
	Cluster: require('./source/cluster.js'),
	Worker: require('./source/worker.js')
};


const cluster = new exports.Cluster();

// console.log("isMaster",cluster.isMaster, process.pid);
if (cluster.isMaster) {
	const worker1 = cluster.fork();
	// const worker2 = cluster.fork();


	cluster.on('cluster.ready', () => {
		console.log('MASTER. cluster.ready');
	});

	worker1.on('worker.ready', () => {
		console.log('MASTER. worker1.ready');
		cluster.kill(worker1.pid);
	});

	// worker2.on('worker.ready', () => {
	// 	console.log('MASTER. worker2.ready');
	// });



} else {
	cluster.on('cluster.ready', () => {
		console.log('WORKER. cluster.ready');
	});




}