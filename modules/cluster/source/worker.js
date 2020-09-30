const Emitter = require('events');
const network = require('../../network');
const tools = require('./tools.js');



/**
 * Интерфейс отправки сообщений удаленному процессу
 *
 * @class      Worker (name)
 */
class Worker extends Emitter {

    /**
     * @param      {string|number}  pid     ID процесса, c которым необходимо связать интерфейс
     */
    constructor(pid) {
        super();

        if (pid) {
            this.pid = pid;
            this.process = process;

        } else {
            // console.log(tools.isMaster(), '[5]');
            this.process = tools.fork(); // =[5]=
            this.pid = this.process.pid;
        }

        // подключаем воркер к IPC серверу процесса, на который он указывает
        this.client = new network.Client(this.pid); // =[2,7,11,19]=

        // подключились к IPC серверу процесса
        this.client.once('network.ready', () => { // =[2,7,11,19]=
            // console.log(tools.isMaster(), '[2,7,11,19] (', pid, '|', process.pid, '|', this.pid, ')');
            if (pid == process.pid) {
                // console.log(tools.isMaster(), '[3]');
                this.emit('service.ready'); // =[3]=
            } else if (pid) {
                // console.log(tools.isMaster(), '[12,20]');
                this.emit('service.ready'); // =[12,20]=
                // console.log(tools.isMaster(), '[14]');
                this.send('service.ready', process.pid); // =[14]=
            } else {
                // говорим поцессу на который ссылается воркер подключится к текущему процессу
                // console.log(tools.isMaster(), '[8]');
                this.send('service.connect.to.parent', process.pid); // =[8]=
            }
        });
    }

    /**
     * Отправить связанному удаленному процессу сообщение (у объекта модуля Cluster в удаленном процессе будут вызваны обработчики одноименного события)
     *
     * @param      {string}  eventName  имя события
     * @param      {boolean|number|string|array|object}  data       передаваемые данные
     */
    send(eventName, ...data) {
        this.client.send(eventName, ...data);
    }
}

exports = module.exports = Worker;