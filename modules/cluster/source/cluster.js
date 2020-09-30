const Emitter = require('events');
const network = require('../../network');
const Worker = require('./worker');
const tools = require('./tools.js');

/**
 * Интерфейс создания удаленных просессов и управления ими
 *
 * @class      Cluster (name)
 */
class Cluster extends Emitter {

    constructor() {
        super();
        this.isMaster = tools.isMaster();
        this.workers = {};

        // console.log(tools.isMaster(), '[0,6]');
        this.server = new network.Server(); // =[0,6]=

        this.server.on('network.ready', () => { // =[0,6]=
            // console.log(tools.isMaster(), '[1]');
            this.fork(process.pid); // =[1]=


        });

        this.server.once('service.connect.to.parent', (pid) => { // =[9]=
            // console.log(tools.isMaster(), '[9,10]', pid);
            this.master = this.fork(pid); // =[10]=


        });

        this.server.on('service.update.pids', (pids) => { // =[17]=
            // console.log(tools.isMaster(), '[17,18]', pids);
            pids.forEach((pid) => {

                if (this.workers[pid]) return;
                this.fork(pid); // =[18]=


            });
        });

        this.server.on('service.signal', (pid,signal) => { 
            console.log('kill', process.pid,pid,signal);
            if(process.pid==pid){
                process.kill(process.pid, signal);
            }else{
                this.workers[pid].client.emit('network.end');
                delete this.workers[pid];
            }
            
        });

        this.server.on('service.set.as.master', (pid) => { 
            if(process.pid==pid){
                this.isMaster=true;
            }else{
                this.isMaster=false
            }
            this.master = this.workers[pid];
            this.emit('cluster.setmaster',pid);
        });

        // если CTRL+C - завершаем все процессы
        process.on('SIGINT',()=>{
            if(this.isMaster) this.getWorkers().forEach(worker=>{
                if( process.pid != worker.pid )   worker.kill()
            });
        });
        

    }

    /**
     * создает объект worker являющийся интерфейсом управления процессом.
     * worker подключающийся к процессу с заданным pid через сокет типа UNIX домен.
     * если pid не задан, создается новый процесс после чего worker подключается к нему.
     *
     * @param      {string|number}  pid     ID существующего процесса имеющего инстанс класса Cluster
     * @return     {Worker}  инстанс класса Worker, подключенный к управляемому процессу
     */
    fork(pid) {

        const worker = new Worker(pid);


        worker.__broadcast = this.broadcast.bind(this); // ээх, не удержался))))


        const wait = (pid) => {

            // console.log(tools.isMaster(), '[15]', pid, process.pid, worker.pid);
            if (pid != worker.pid) return;
            this.workers[worker.pid] = worker; // =[15]=
            worker.emit('worker.ready', worker);
            this.server.removeListener('service.ready', wait);
            // console.log(tools.isMaster(), '[16]');
            this.broadcast('service.update.pids', Object.keys(this.workers)); // =[16]=


        };
        this.server.on('service.ready', wait); // =[15]=



        worker.once('service.ready', (pid) => {
            // console.log(tools.isMaster(), '[4,13,21]', pid, process.pid);


            this.workers[worker.pid] = worker; // =[4,13,21]=
            this.emit('cluster.ready');
            worker.emit('worker.ready', worker);

        });

        return worker;

    }

    /**
     * 
     *
     * @param      {string}  eventName  имя события. Одноименный обработчик будет вызван на принимающей стороне
     * @param      {Array}   data       любое количество передаваемых параметров.
     *                                  каждый из параметров должен соответсвовать условию: 
     *                                  проходить процедуру JSON.parse(JSON.stringify(param)) без потери данных и ошибок
     */
    broadcast(eventName, ...data) {

        this.getWorkers().forEach(worker => {
            worker.send(eventName, ...data);
        })

    }

    /**
     * выдает массив с действующими (находящимися в состоянии 'worker.ready') воркерами
     *
     * @return     {Array[Worker]}  массив действующих воркеров
     */
    getWorkers() {
        return Object.values(this.workers);
    }

    /**
     * Отправить процессу pid сигнал signal.
     *
     * @param      {string|number}  pid         ID процесса
     * @param      {string}  [signal='SIGINT']  Отправляемый сигнал (SIGINT или SIGTERM)
     */
    kill(pid, signal = 'SIGINT') {
        this.broadcast('service.signal', pid, signal);
    }

    /**
     * Назначить процесс pid мастером
     *
     * @param      {string|number}  pid         ID процесса
     */
    setAsMaster(pid) {
        if( !this.workers[pid] ) return
        this.broadcast('service.set.as.master', pid);
    }
};



exports = module.exports = Cluster;