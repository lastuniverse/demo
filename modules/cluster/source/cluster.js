const Emitter = require('events');
const network = require('../../network');
const Worker = require('./worker');
const tools = require('./tools.js');


const ups = {};
/**
 * Интерфейс создания удаленных просессов и управления ими
 *
 * @class      Cluster (name)
 */
class Cluster extends Emitter {

    constructor() {
        super();
        this.isMaster = tools.isMaster();
        this.isReady = false;

        this.workers = {};

        this.server = new network.Server(); // =[0,6]=

        // запущен сервер
        this.server.on('network.ready', () => { // =[0,6]=
            this.fork(process.pid); // =[1]=
        });

        // команда на подключение к форкаюшему процессу
        this.server.once('service.connect.to.parent', (pid) => { // =[9]=
            this.master = this.fork(pid); // =[10]=
        });

        // обновляем воркеры
        this.server.on('service.update.pids', (pids) => { // =[17]=
            pids.forEach((pid) => {
                if (this.workers[pid]) return;
                this.fork(pid); // =[18]=
            });
        });

        // какойто из процессов был убит
        this.server.on('service.signal', (pid, signal) => {
            if (process.pid == pid) {
                this.isKilled = true;
                this.workers[pid].emit('worker.stop');
                this.emit('cluster.stop',process.pid);
                process.kill(process.pid, signal);
            } else if (this.workers[pid]) {
                this.workers[pid].emit('worker.stop');
                this.workers[pid].client.emit('network.end');
                delete this.workers[pid];
            }

        });

        // установлен новый мастер
        this.server.on('service.set.as.master', (pid) => {
            if (process.pid == pid) {
                this.isMaster = true;
                this.emit('cluster.isMaster',process.pid);
            } else if (this.workers[pid]) {
                this.isMaster = false;
            }
            this.master = this.workers[pid];
            this.emit('cluster.setmaster', pid);
        });


        // отлавливаю CTRL+C - завершаем все процессы
        process.on('SIGINT', () => {
            // если SIGINT пришел НЕ с клавиатуры то this.isKilled==true
            if (!this.isKilled) {
                this.getWorkers().forEach(worker => {
                    worker.kill();
                });                
            }
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

        if(!pid && !this.isMaster) return console.warn('создавать дочерние процессы разрешено только мастерпроцессу');

        const worker = new Worker(pid);
        this.workers[worker.pid] = worker;

        // ээх, не удержался. неявно добавлять методы к объектам это ... ай-ай-ай))))
        worker.__broadcast = this.broadcast.bind(this);


        // проверка на наличие воркеров, еще не подключившихся к своим процессам
        const isAllWorkerReady = () => this.getWorkers().every(worker => worker.isReady)

        const waitWorker = () => {
            worker.once('service.ready', () => {
                this.broadcast('service.update.pids', Object.keys(this.workers)); // =[16]= 
                // если есть еще не подключившиеся к своим процессам воркеры, то ждем их
                if (!isAllWorkerReady()){
                    waitWorker();
                }else{
                    // этот блок сработает только для воркеров, созданных скопом при запуске мастерпроцесса
                    if (!this.isReady) {
                        this.isReady = true;
                        this.emit('cluster.ready', process.pid);
                        this.emit('service.cluster.ready', process.pid);
                    }
                }
            });
        }

        // ждем готовности всех запущенных воркеров
        waitWorker();

        this.once('service.cluster.ready', ()=>{
            // это тоже должно сработать только 1 раз для каждого из багов
            worker.emit('worker.ready');
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
     * выдает массив с действующими (находящимися в состоянии 'worker.isRready') воркерами
     *
     * @return     {Array[Worker]}  массив действующих воркеров
     */
    getWorkers() {
        return Object.values(this.workers).filter(worker => worker.isReady);
    }

    /**
     * Отправить процессу pid сигнал signal.
     *
     * @param      {string|number}  pid         ID процесса
     * @param      {string}  [signal='SIGINT']  Отправляемый сигнал (SIGINT или SIGTERM)
     */
    kill(pid, signal = 'SIGINT') {
        setTimeout(()=>{
            this.broadcast('service.signal', pid, signal);
        },3000);
    }

    /**
     * Назначить процесс pid мастером
     *
     * @param      {string|number}  pid         ID процесса
     */
    setAsMaster(pid) {
        if (!this.workers[pid]) return
        this.broadcast('service.set.as.master', pid);
    }
};



exports = module.exports = Cluster;