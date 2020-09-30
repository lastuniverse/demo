const net = require('net');
const Emitter = require('events');
const tools = require('./tools.js');
const processEvents = require('../../tools/process-events.js');

/**
 * Реализация минимального сервера
 *
 * @class      Server (name)
 */
class Server extends Emitter {

    constructor() {
        super();

        this.descriptor = tools.socketFileNameByPid(process.pid);

        this.startServer();
    }

    /**
     * Запускает сервер и устанавливает минимум необходимых обработчиков, парсит входящий поток
     * данных и генерирует из них события
     */
    startServer() {

        this.server = net.createServer(socket => {
            socket.on('data', (data) => {
                data.toString()
                    .split(/\r\n/)
                    .forEach((text) => {
                        if (!text) return
                        const message = JSON.parse(text);
                        if (!message || !message.eventName) return;
                        this.emit(message.eventName, ...message.data);

                    });
            });
        });

        this.server.on('error', (error) => {
            if (error.code !== 'EADDRINUSE') throw error;

            setTimeout(() => {
                this.server.close();
                this.server.listen(this.descriptor, () => {
                    console.log('Process', process.pid, 'opened server on', this.server.address());
                    this.emit('network.ready');
                });
            }, 1000);
        });

        this.server.listen(this.descriptor, () => {

            console.log('Process', process.pid, 'opened server on', this.server.address());
            this.emit('network.ready');
        });

        processEvents.on('beforeExit', ()=>{
            this.server.close();
        });

    }



};

exports = module.exports = Server;