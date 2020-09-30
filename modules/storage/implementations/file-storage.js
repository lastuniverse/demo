const path = require("path");
const fs = require("fs");
const Storage = require('./dummy-storage.js');



/**
 * Реализация механизмов сохранения и загрузки данных в/из файлов.
 * 
 * Объект данного класса реализует фоновые:
 * - сохранение данных при завершении процесса
 * - загрузки данных при старте процесса
 *
 * @class      FileStorage (name)
 */
class FileStorage extends Storage {
	/**
	 * Создает новый объект класса
	 *
	 * @param      {string}  storragePath  Путь, по которому будут сохраняться файлы-хранилища
	 */
	constructor(storragePath) {
		super();

		this.path = path.normalize(storragePath || path.join(__dirname, "../store"));

		this.storelist = {};
	}

	/**
	 * Создает именованное сохраняемое и восстанавливаемое хранилище данных типа data с именем name. 
	 * 
	 * @param      {string}        name      наименование хранилища данных
	 * @param      {object|array}  data      пустой объект необходимого типа данных (массив или объект)
	 * @param      {boolean}       humanize  (true|false) сохранять данные в развернутом виде  
	 * @return     {object|array}  сохранаемое хранилище данных. Если данные уже были сохранены, то будет
	 * содержать их восстановленную копию. Во внешнем коде использующем данные нельзя работать с копией данных,
	 * так как данные из копий не будут сохраняться
	 */
	create(name = 'unnamed', data = {}, humanize = false) {
		const store = {
			name: name,
			humanize: humanize,
			filename: path.join(this.path, name + '.json'),
			data: data
		};

		this.storelist[name] = store;

		if (fs.existsSync(store.filename)) {
			this.restore(name);
		} else {
			this.store(name);
		}

		return store.data;
	}

	/**
	 * сохраняет в файл коллекцию данных с именем name (необходимо использовать только синхронные механизмы)
	 *
	 * @param      {string}        name    наименование хранилища данных
	 */
	store(name) {
		try {
			const store = this.storelist[name];
			if (!store) return console.warn('Storage.store(): не существует хранилища с именем', name);
			const stringifyArgs = store.humanize ? [null, ' '] : [];
			fs.writeFileSync(store.filename, JSON.stringify(store.data, ...stringifyArgs));
		} catch (e) {
			throw (e);
		}


	}

	/**
	 * сохраняет в файлах все именованые коллекции данных (необходимо использовать только синхронные механизмы)
	 * выполняется автоматически при завершениее процесса (программы)
	 */
	storeAll() {
		Object.keys(this.storelist).forEach(name => {
			this.store(name);
		});
	}

	/**
	 * читает из файла и возвращает сохраненные данные (если были сохранены) иначе возвращает ссылку
	 * на текущую копию данных
	 *
	 * @param      {string}        name    наименование хранилища данных
	 * @return     {object|array}  сохранаемое хранилище данных. Если данные уже были сохранены, то будет
	 * содержать их восстановленную копию. Во внешнем коде использующем данные нельзя работать с копией данных,
	 * так как данные из копий не будут сохраняться
	 */
	restore(name) {
		try {
			const store = this.storelist[name];
			if (!store) return console.warn('Storage.restore(): не существует хранилища с именем', name);

			const data = fs.readFileSync(store.filename, 'utf8');
			store.data = JSON.parse(data);
			return store.data;
		} catch (e) {
			throw (e);
		}
	}
};

exports = module.exports = FileStorage;