const Emitter = require('events');
const uuidv4 = require('../../uuidv4');



class Node extends Emitter {

    constructor(pid, socket) {
        try {
            super();

            this.id = pid;

            this.socket = socket;
        } catch (e) {
            console.error(e)
        }
    }

    send(eventName, data, callback) {

        try {

            const isQuery = typeof callback == 'function';

            const isReply = !eventName.indexOf('service.reply.');

            const message = {
                eventName: eventName,
                messageID: uuidv4(),
                from: process.pid, // не очень хорошо
                to: this.id,
                type: isQuery ? 'query' : isReply ? 'reply' : 'message',
                data: data
            };

            if (isQuery) {

                const replyEventName = `service.reply.${message.messageID}`;

                this.once(replyEventName, callback);

                setTimeout(() => {

                    this.removeListener(replyEventName, callback);

                    this.emit('service.reply.timeout', message);

                }, 30000);

            }

            this.socket.write(JSON.stringify(message) + '\r\n');
        } catch (e) {
            console.error(e)
        }
    }
}



exports = module.exports = Node;