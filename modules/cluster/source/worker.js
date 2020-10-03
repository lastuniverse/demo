// const Emitter = require('events'); // какието косяки с событиями((((
const Emitter = require('../../tools/eventemitter.js');
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
        this.isReady = false;
        this.isMaster = false;

        if (pid) {
            this.pid = pid;
            this.process = process;

        } else {
            this.process = tools.fork(); // =[5]=
            this.pid = this.process.pid;
        }

        // подключаем воркер к IPC серверу процесса, на который он указывает
        this.client = new network.Client(this.pid); // =[2,7,11,19]=

        // подключились к IPC серверу процесса
        this.client.once('network.ready', () => { // =[2,7,11,19]=
            this.isReady=true;
            setTimeout(()=>{
                this.emit('service.ready'); // =[3]=
                this.emit('worker.ready',true);
            },1000);

            if (!pid) {
                // говорим поцессу на который ссылается воркер подключится к текущему процессу
                this.send('service.connect.to.parent', process.pid); // =[8]=
            }
        });
    }

    /**
     * Отправить связанному удаленному процессу сообщение (у объекта модуля Cluster в удаленном процессе будут вызваны обработчики одноименного события)
     *
     * @param      {string}  eventName  имя события
     * @param      {Array}   data       любое количество передаваемых параметров.
     *                                  каждый из параметров должен соответсвовать условию: 
     *                                  проходить процедуру JSON.parse(JSON.stringify(param)) без потери данных и ошибок
     */
    send(eventName, ...data) {
        this.client.send(eventName, ...data);
    }

    /**
     * Отправить процессу сигнал signal.
     *
     * @param      {string}  [signal='SIGINT']  Отправляемый сигнал (SIGINT или SIGTERM)
     * @param      {}        data       с убиваемым можно попрощаться, передав ему любое количество параметров.
     *                                  каждый из параметров должен соответсвовать условию: 
     *                                  проходить процедуру JSON.parse(JSON.stringify(param)) без потери данных и ошибок
     */
    kill(signal = 'SIGINT', ...data) {
        this.__broadcast('service.signal', this.pid, signal, ...data);
    }

    /**
     * Назначить процесс pid мастером
     *
     * @param      {string|number}  pid         ID процесса
     * @param      {}        data       можно передать любое количество параметров.
     *                                  каждый из параметров должен соответсвовать условию: 
     *                                  проходить процедуру JSON.parse(JSON.stringify(param)) без потери данных и ошибок
     */
    setAsMaster(...data) {
        this.__broadcast('service.set.as.master', this.pid, ...data);
    }    
}

exports = module.exports = Worker;