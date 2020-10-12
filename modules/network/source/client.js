/* eslint-disable no-multi-assign */
/* eslint-disable no-console */
const net = require('net');
const Emitter = require('events');
const tools = require('./tools.js');

/**
 * Реализация минимального сетевого клиента,
 *
 * @class      Client (name)
 */
class Client extends Emitter {
  /**
     * @param      {string||nimber}  pid     ID процесса, к которому необходимо подключится
     */
  constructor(pid) {
    super();

    this.pid = pid;

    this.on('network.end', () => {
      this.socket.end();
      this.socket.destroy();
    });

    this.connect();
  }

  /**
     * Подключается к серверу и устанавливает минимум необходимых обработчиков событий
     */
  connect() {
    this.socket = net.createConnection({
      path: tools.socketFileNameByPid(this.pid),
    }, () => {
      // console.log('Process', process.pid, 'connected to server', this.pid);
      this.emit('network.ready', {
        from: process.pid,
        to: this.pid,
      });
    });

    this.socket.on('end', () => {
      // console.log('Process', process.pid, 'disconnected from server', this.pid);
    });

    this.socket.on('error', () => {
      console.log('Process', process.pid, 'error connect to server', this.pid);

      this.socket.destroy();
      setTimeout(() => {
        this.connect(this.pid);
      }, 1000);
    });
  }

  /**
   * производит отправку события(сообщения)
   *
   * @param      {string}  eventName  имя события (обработчики события с этим именем будут вызваны
   *                                  на стороне сервера)
   * @param      {boolean|number|string|array|object}  data       передаваемые обработчику данные
   */
  send(eventName, ...data) {
    try {
      const message = {
        from: process.pid,
        to: this.pid,
        eventName,
        data,
      };
      this.socket.write(`${JSON.stringify(message)}\r\n`);
    } catch (e) {
      console.log(e);
    }
  }
}

exports = module.exports = Client;
