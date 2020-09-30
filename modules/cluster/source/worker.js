const Emitter = require('events');
const network = require('../../network');
const tools = require('./tools.js');




class Worker extends Emitter {

	constructor(pid) {
		super();

		if( pid ){
			this.pid = pid;
			this.process = process;

		}else{
console.log(tools.isMaster(),'=[5]=');			
			this.process = tools.fork(); // =[5]=
			this.pid = this.process.pid;
		}

		// подключаем воркер к IPC серверу процесса, на который он указывает
		this.client = new network.Client(this.pid); // =[2,7,11,19]=

		// подключились к IPC серверу процесса
		this.client.once('network.ready', ()=>{ // =[2,7,11,19]=
console.log(tools.isMaster(),'=[2,7,11,19]=');
			if( pid == process.pid ){
console.log(tools.isMaster(),'=[3]=');
				this.emit('service.ready'); // =[3]=
			}else if(pid){
console.log(tools.isMaster(),'=[12,14,20]=');				
				this.emit('service.ready'); // =[12,20]=
				this.send('service.ready', process.pid ); // =[14]=
			}else{
console.log(tools.isMaster(),'=[8]=');
				// говорим поцессу на который ссылается воркер подключится к текущему процессу
				this.send('service.connect.to.parent', process.pid ); // =[8]=
			}


		});		

	}

	send(eventName, data) {
		this.client.send(eventName, data);
	}

	kill(signal = 'SIGTERM') {
	}
}

exports = module.exports = Worker;