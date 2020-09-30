/**
 * Модуль реализует очереди (хранилища с соблюдением порядка очередности) с опциональной возможностью автоматически сохранять данные очереди при 
 * выходе из программы (завершении процесса) и восстанавливать их при последующих запусках
 * 
 * 
 * @example
 * const queue = new Queue('queue');
 * for(var i=0; i<3; i++){
 * 	queue.insert('enyData_'+i);	
 * }
 * // в очереди:
 * // { priority: 1, data: 'enyData_0' },
 * // { priority: 2, data: 'enyData_1' },
 * // { priority: 3, data: 'enyData_2' },
 * 
 * 
 * const list = [];
 * for(var i=0; i<2; i++){
 * 	list.push( queue.get() );
 * }
 * // в list:
 * // { priority: 1, data: 'enyData_0' },
 * // { priority: 2, data: 'enyData_1' },
 * 
 * // в очереди:
 * // { priority: 3, data: 'enyData_2' },
 * 
 * 
 * // !!! ВНИМАНИЕ !!!
 * 
 * const first = list[0];
 * 	queue.insert(first.data, first.priority);
 * 	queue.insert('otherEnyData');
 * // в очереди:
 * // { priority: 1, data: 'enyData_0' },
 * // { priority: 3, data: 'enyData_2' },
 * // { priority: 4, data: 'otherEnyData' },
 * 
 * 
 * const data = queue.get()
 * // в data:
 * // { priority: 1, data: 'enyData_0' }
 * 
 * // в очереди:
 * // { priority: 3, data: 'enyData_2' },
 * // { priority: 4, data: 'otherEnyData' },
 * 
 * 
 * @module modules/queue
 * 
 * @author Roman Surmanidze <lastuniverse@github.com>
 */

const Storage = require('../storage');
const storage = Storage();



/**
 * класс с реализацией очереди (хранилища с соблюдением порядка очередности)
 *
 * @class      Queue (name)
 */
class Queue {

	/**
	 * создает экземпляр хранилища
	 *
	 * @param      {string}   name      наименование очереди. Если задано, то будет создаваться автоматически сохраняемое и восстанавливаемое хранилище
	 */
	constructor(name) {
		this.list = name ? storage.create(name, [], true) : [];
		this.name = name || 'unnamed';
		this.counter = 0;
		if (name) {
			this.list.forEach(item => {
				if (this.counter < item.priority) this.counter = item.priority;
			});
		}
	}

	/**
	 * вставить данные в очередь
	 *
	 * @param      {<type>}  data      любые данные (если очередь с автосохранением, то любые данные приводимые к строке с помощью JSON.stringify(data))
	 * @param      {<type>}  priority  порядковый номер, по которому определяется приоритет данных в очереди, если не задан, то присваивается автоматически
	 */
	insert(data, priority) {

		this.list.push({
			priority: priority || ++this.counter,
			data: data
		});

		this.list.sort((a, b) => a.priority - b.priority);

	}

	/**
	 * Извлечь данные из очереди
	 *
	 * @type       {object} содержит свойства priority и data(поставленные в очередь данные)
	 */
	get() {

		return this.list.shift();
	}

}


exports = module.exports = Queue;