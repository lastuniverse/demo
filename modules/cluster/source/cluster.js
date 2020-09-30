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
            
        })     

    }


    fork(pid) {

        const worker = new Worker(pid);

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

    broadcast(eventName, ...data) {

        this.getWorkers().forEach(worker => {
            worker.send(eventName, ...data);
        })

    }

    getWorkers() {
        return Object.values(this.workers);
    }


    kill(pid, signal = 'SIGINT') {
        this.broadcast('service.signal', pid, signal);
    }

    setAsMaster() {
        this.send('service.set.as.master', signal);
    }
};



exports = module.exports = Cluster;