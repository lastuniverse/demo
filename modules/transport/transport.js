/**
 * некая абстракция, цель которой предоставить стандартизирированный (для модулей программы) интерфейс (API) для передачи информации
 * между узлами, независящий от конкретной реализации транспортного протокола (IPC, socket, websocket, webRTS)
 * СОГЛАШЕНИЕ: Для этого, любой подключаемый транспортный протокол должен быть объектом класса, унаследованного от класса Protocol, и использующим в качестве своего API его методы
 */

const Emitter = require("events");
const uuidv4 = require("../uuidv4");




class Core extends Emitter {

	constructor() {

		super();

		this.nodeList = [];

		this.ID = uuidv4();

		this.on("service.handshake", message => {
			message.reply({
				ID: this.ID
			});
		});
	}

	setAsMaster(){
		this.isMaster = true;
	}

	setMasterNode(nodeID){
		this.master = this.getNode(nodeID);
	}

	removeNode(node) {

	}

	addNode(node) {
		if (!(node instanceof Protocol))
			return console.warn(`transport.Сore.addNode: объект узела должен быть принадлежать классу унаследованному от Protocol`);

		node.setMessageHandler(message => {
			if (message.type == "query") {
				const replyName = `service.reply.${message.messageID}`;
				message.reply = data => this.send(node, replyName, data);
				message.node = node;
				// this.emit(replyName, message);
			}
			this.emit(message.eventName, message);
		});

		this.send(node, "service.handshake", {
			ID: this.ID
		}, message => {
			if(this.getNode(message.data.ID))
				return;
			
			node.ID = message.data.ID;

			this.nodeList.push(node);
		});
	}

	broadcast(eventName, data, replyListener) {
		this.nodeList.forEach(node=>{
			this.send(node, eventName, data, replyListener);
		});
	}

	send(nodeID, eventName, data, replyListener) {

		const target = this.getNode(nodeID);

		if (!target)
			return console.warn(`transport.Сore.send: у меня нет ноды с ID = "${nodeID}"`, eventName, data);

		const packet = this.createPacket(eventName, data);

		if (typeof replyListener != "function")
			return target.send(packet);

		packet.type = "query";

		const replyName = `service.reply.${packet.messageID}`;

		this.once(replyName, replyListener);

		target.send(packet)

		setTimeout(() => {
			this.removeListener(replyName, replyListener);
		}, 60000);


	}

	getNode(nodeID) {

		if (nodeID instanceof Protocol)
			return nodeID;

		return this.nodeList.find(node => node.ID == nodeID);
	}

	createPacket(eventName, data) {

		return {
			from: this.ID,
			eventName: eventName,
			data: data,
			type: "message",
			messageID: uuidv4()
		};
	}
};


/**
 * Шаблон для классов-оберток над протоколами передачи данных, реализующий преобразование передаваемой информации в JSON и обратно
 */
class Protocol extends Emitter {
	/**
	 * @param  {Object} параметры:
	 *     - options.node объект реализующий связь с узлом
	 */
	constructor({
		node
	}) {

		super();

		if (!node)
			throw "transport.Protocol.constructor: Узел должен быть определен";

		this.node = node;

		this.node.on("message", data => {
			let message = {};
			try {
				message = JSON.parse(data);
			} catch (e) {
				console.warn("transport.Protocol.constructor: не могу спарсить json из строки", typeof data, data);
			}
			this.emit("message", message);
		});

	}

	setMessageHandler(handler) {
		if (this.handler) return;
		this.handler = handler;
		this.on("message", handler);
	}

	removeMessageHandler() {
		this.removeListener("message", this.handler);
	}
	send(data) {
		this.node.send(JSON.stringify(data));
	}

};

/**
 * класс обертка, реализующий связь с процессами посредствам IPC
 * (Для IPC достаточно методов родительского класса Protocol, поэтому тут пусто)
 */
class IPC extends Protocol {
	constructor(...args) {
		super(...args);
	}
};


exports = module.exports = {
	Core: Core,
	Protocol: Protocol,
	IPC: IPC
};