/* eslint-disable no-console */
const EventEmitter = require('events');
const WebSocket = require('ws');
const http = require('http');
const url = require('url');

/**
 * Создаем класс для упрощения работы с веб сокетами
 */
class WS extends EventEmitter {
  /**
   * @param  {Number} port порт сервера
   */
  constructor(port) {
    super();
    this.port = port;
    if (this.port) {
      this.wss = new WebSocket.Server({ port: this.port });
    } else {
      this.wss = new WebSocket.Server({ noServer: true }); // clientTracking: false
    }
    this.wss.on('connection', (client) => {
      const send = (action, ...data) => {
        try {
          const string = JSON.stringify({
            action,
            data,
          });
          client.send(string);
        } catch (e) {
          // console.log(e);
        }
      };

      this.emit('connection', send, client);

      client.on('message', (message) => {
        try {
          const json = JSON.parse(message);
          if (!json.action) return;
          this.emit(json.action, send, ...json.data);
        } catch (e) {
          console.log(e);
          client.terminate();
        }
      });
    });
  }

  stop() {
    if (this.server) {
      this.server.close();
    } else {
      this.wss.terminate();
    }
  }

  setExpressServer(path, app, port) {
    this.server = http.createServer(app);

    this.server.on('upgrade', (request, socket, head) => {
      const { pathname } = url.parse(request.url);
      if (pathname === path) {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });
    this.server.listen(port, () => {
      console.log(`Listening on http://localhost:${port}`);
    });
  }

  /**
   * Отправить информацию (текст, число, массив, объект и т.д.) на сервер.
   * При отсутствии подключения кэширует отправляемую информацию
   * @param  {...} data отправляемая информация
   */
  broadcast(action, ...data) {
    // console.log('send:',data);
    const json = {
      action,
      data,
    };
    const string = JSON.stringify(json);
    const { clients } = this.wss;// || this.server.clients;
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(string);
      }
    });
  }
}

// eslint-disable-next-line no-multi-assign
exports = module.exports = WS;

// Пример:
// const WS = require("./modules/websocket.js");
// const ws = new WS("8080");
// ws.on("message",(reply, data)=>{
//   // Обрабатываем данные data
//
//   // отправляем результат клиенту
//   reply("имя.cобытия", "любые данные");
//
//   // кидаем данные всем клиентам
//   ws.broadcast(("имя.cобытия", "любые данные");
// });
