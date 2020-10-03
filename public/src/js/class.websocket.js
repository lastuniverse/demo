import EventEmitter from './class.eventemitter.js';

// const test = new EventEmitter();
// test.on("test",(data,text)=>{
//   console.log(data,text);
// });
// test.emit("test",{test:"222"},111);


/**
 * Создаем класс для упрощения работы с веб сокетами
 */
export default class WS extends EventEmitter{
	/**
	 * @param  {String} url     Адрес сервера
	 * @param  {Number} timeout время отсрочки переподключения к серверу при потере связи
	 */
	constructor(url,timeout){
		super();
		this.url = url;
		this.timeout = 0;
		this.__timeout = timeout||30000;
		this.caсhe =[];
		this.isConnect = false;
		this.connect();
	}

	/**
	 * Функция отсрочки запуска подключения к интернету
	 */
	init(){
		setTimeout(()=>{
			console.log("Пытаюсь переподключиться к", this.url);
			this.connect();
		}, this.timeout);		
	}

	/**
	 * функция подключеня к серверу, инициализируюшая обработчики событий error, close, open, message
	 */
	connect(){
		if(this.connection) this.connection.close();
		this.connection = new WebSocket(this.url);
		this.connection.on = (event, listener)=>{
			this.connection["on"+event] = listener;
		};

		this.connection.on("error", error=>{
			this.isConnect = false;
			console.log("Ошибка подключения:", error);
			this.init();
		});
		this.connection.on("close", ()=>{
			this.isConnect = false;
			console.log("Соединение закрыто сервером");
			this.init();
		});			
		this.connection.on("open", ()=>{
			this.timeout = this.__timeout;
			this.isConnect = true;
			this.emit("connection")
			console.log("Подключился к", this.url);
			this.caсhe.forEach(data=>{
				this.connection.send(data);
			});
			this.caсhe = [];
		});
		this.connection.on("message", (event)=>{
			try {
				const json = JSON.parse(event.data)
				if(!json.action) return;
				this.emit(json.action, ...json.data);
			} catch(e) {
				// это не наш тип сообщений, просто игнорируем 
			}
		});
	}

	/**
	 * Отправить информацию (текст, число, массив, объект и т.д.) на сервер. При отсутствии подключения кэширует отправляемую информацию
	 * @param  {...} data отправляемая информация
	 * @return {Promise}      возвращает промис, который сработает, когда прийдет ответ с сервера именно на это сообщение
	 */
	send(action, ...data){
		const json = {
			action: action,
			data: data
		};
		const string = JSON.stringify(json);

		if(!this.isConnect || !this.connection){
			this.caсhe.push(string);
			return;
		}

		this.connection.send(string);
	}

}



