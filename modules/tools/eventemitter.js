class EventEmitter {
	constructor(mode = "async") {
		this.m = mode;
		this.e = {};
	}


	/**
	 * Устанавливает обработчик listener события event
	 * @param  {String}   event    название события
	 * @param  {Function} listener обработчик события
	 */
	on(event, listener) {
		if (typeof this.e[event] !== 'object') {
			this.e[event] = [];
		}

		this.e[event].push(listener);
		return listener;
	}

	/**
	 * Удаляет обработчик listener события event
	 * @param  {String}   event    название события
	 * @param  {Function} listener обработчик события
	 */
	removeListener(event, listener) {
		const list = this.e[event];

		if (typeof list !== 'object')
			return;

		const idx = list.indexOf(listener);
		if (idx < 0)
			return;

		list.splice(idx, 1);
		
		if(!list.length)
			delete this.e[event];
	}


	/**
	 * Создает событие event вызывая все 
	 * зарегестрированные для него обработчики
	 * @param  {String}   event    название события
	 * @param  {...[type]} args  аргументы для обработчиков событий
	 */
	emit(event, ...args) {
		const list = this.e[event];
		if (typeof list !== 'object')
			return;
		if(this.m === "sync"){
			list.forEach(listener => listener(...args));
		}else{
		 	list.forEach(listener=>setImmediate(()=>listener(...args)));
		}
	}

	/**
	 * Устанавливает одноразовый обработчик listener события event
	 * @param  {String}   event    название события
	 * @param  {Function} listener обработчик события
	 */
	once(event, listener) {
		const g = (...args)=>{
			this.removeListener(event, g);
			listener(...args);
		}			
		this.on(event, g);
		return listener;
	}
}

// var events = new EventEmitter();
// events.on("test",()=>{let a=1;});


exports = module.exports = EventEmitter;
