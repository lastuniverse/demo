/* eslint-disable no-multi-assign */
/* eslint-disable no-console */
// const Emitter = require('events'); // какието косяки с событиями((((
const Emitter = require('../../tools/eventemitter.js');
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
    this.isReady = false;

    this.workers = {};

    this.server = new network.Server(); // =[0,6]=

    // запущен сервер
    this.server.on('service.message', (message) => { // =[0,6]=
      if (!message || !message.eventName) return;
      this.emit(message.eventName, ...message.data);
    });

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
    this.server.on('service.signal', (pid, signal, ...data) => {
      if (process.pid === pid) {
        this.isKilled = true;
        this.workers[pid].emit('worker.stop', ...data);
        this.emit('cluster.stop', ...data);
        process.kill(process.pid, signal);
      } else if (this.workers[pid]) {
        this.workers[pid].emit('worker.stop', ...data);
        this.workers[pid].client.emit('network.end');
        delete this.workers[pid];
      }
    });

    // установлен новый мастер
    this.server.on('service.set.as.master', (pid, ...data) => {
      console.log('service.set.as.master', pid);
      if (this.workers[pid]) {
        if (process.pid === pid) {
          this.isMaster = true;
          this.emit('cluster.isMaster', ...data);
        } else if (this.workers[pid]) {
          this.isMaster = false;
        }

        this.master = this.workers[pid];

        this.getWorkers().forEach((worker) => {
          // eslint-disable-next-line no-param-reassign
          worker.isMaster = false;
        });
        this.workers[pid].isMaster = true;
        this.emit('cluster.setmaster', pid, ...data);
      }
    });

    // отлавливаю CTRL+C - завершаем все процессы
    process.on('SIGINT', () => {
      // если SIGINT пришел НЕ с клавиатуры то this.isKilled==true
      if (!this.isKilled) {
        this.getWorkers().forEach((worker) => {
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
   * @param      {string|number}  pid     ID существующего процесса имеющего инстанс
   *                                      класса Cluster
   * @return     {Worker}  инстанс класса Worker, подключенный к управляемому процессу
   */
  fork(pid) {
    if (!pid && !this.isMaster) return console.warn('создавать дочерние процессы разрешено только мастерпроцессу');
    const worker = new Worker(pid);

    // ээх, не удержался. неявно добавлять методы и свойства к объектам это ... ай-ай-ай))))
    if (this.isMaster && worker.pid === process.pid) worker.isMaster = true;

    // eslint-disable-next-line no-underscore-dangle
    worker.__broadcast = this.broadcast.bind(this);
    this.workers[worker.pid] = worker;

    // проверка на наличие воркеров, еще не подключившихся к своим процессам
    const isAllWorkerReady = () => this.getWorkers().every((item) => item.isReady);

    const waitWorker = () => {
      worker.once('service.ready', () => {
        this.broadcast('service.update.pids', Object.keys(this.workers)); // =[16]=
        // если есть еще не подключившиеся к своим процессам воркеры, то ждем их
        if (!isAllWorkerReady()) {
          waitWorker();
        } else {
          // этот блок сработает только для воркеров, созданных скопом при запуске мастерпроцесса

          if (!this.isReady) {
            // console.log('упс 1', worker.pid, Object.keys(this.workers));
            // console.log('упс 4', worker.pid);
            this.emit('cluster.ready', process.pid);
          }
          this.isReady = true;
        }
      });
    };

    // ждем готовности всех запущенных воркеров
    waitWorker();

    return worker;
  }

  /**
   *
   *
   * @param      {string}  eventName  имя события. Одноименный обработчик будет вызван на
   *                                  принимающей стороне
   * @param      {Array}   data       любое количество передаваемых параметров.
   *                                  каждый из параметров должен соответсвовать условию:
   *                                  проходить процедуру JSON.parse(JSON.stringify(param))
   *                                  без потери данных и ошибок
   */
  broadcast(eventName, ...data) {
    this.getWorkers().forEach((worker) => {
      worker.send(eventName, ...data);
    });
  }

  /**
   * выдает массив с действующими (находящимися в состоянии 'worker.isRready') воркерами
   *
   * @return     {Array[Worker]}  массив действующих воркеров
   */
  getWorkers() {
    return Object.values(this.workers).filter((worker) => worker.isReady);
  }

  /**
   * выдает воркер по его pid
   *
   * @return     {Array[Worker]}  массив действующих воркеров
   */
  getWorker(pid) {
    return this.workers[pid];
  }

  send(pid, eventName, ...data) {
    const worker = this.getWorker(pid);
    if (worker) worker.send(eventName, ...data);
  }

  /**
   * Отправить процессу pid сигнал signal.
   *
   * @param      {string|number}  pid         ID процесса
   * @param      {string}  [signal='SIGINT']  Отправляемый сигнал (SIGINT или SIGTERM)
   * @param      {}        data   с убиваемым можно попрощаться, передав ему любое количество
   *                              параметров. каждый из параметров должен соответсвовать условию:
   *                              проходить процедуру JSON.parse(JSON.stringify(param)) без
   *                              потери данных и ошибок
   */
  kill(pid, signal = 'SIGINT', ...data) {
    setTimeout(() => {
      this.broadcast('service.signal', pid, signal, ...data);
    }, 3000);
  }

  /**
   * Назначить процесс pid мастером
   *
   * @param      {string|number}  pid         ID процесса
   * @param      {}        data       можно передать любое количество параметров.
   *                                  каждый из параметров должен соответсвовать условию:
   *                                  проходить процедуру JSON.parse(JSON.stringify(param))
   *                                  без потери данных и ошибок
   */
  setAsMaster(pid, ...data) {
    if (!this.workers[pid]) return;
    this.broadcast('service.set.as.master', pid, ...data);
  }
}

exports = module.exports = Cluster;
