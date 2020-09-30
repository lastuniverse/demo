const Emitter = require('events');



// хранилище всех объектов созданных от класса DummyStorage или классов унаследованных от DummyStorage
const storages = [];



/**
 * Данный класс является чемто типа интерфейса. Реализации механизмов сохранения и загрузки должны
 * насследоваться от данного класса, могут переопределять методы data:create(name, data), store(name), storeAll() и restore(name)
 * не изменяя порядок и смысл их входных и выходных данных
 * 
 * Объект данного класса реализует фоновые:
 * - сохранение данных при завершении процесса
 * - загрузки данных при старте процесса
 *
 * В реализациях, для успешного выполнения сохранения данных (в методах store(name), storeAll()) должны использоваться только синхронные процессы. Это
 * обусловленно спецификой работы обработчиков сигнала 'exit'
 * 
 * @class      DummyStorage (name)
 */
class DummyStorage extends Emitter {
	/**
	 * Constructs a new instance.
	 */
	constructor() {
		super();
		this.storage = {}
		storages.push(this);
	}

	/**
	 * Создает именованное сохраняемое и восстанавливаемое хранилище данных типа data с именем name. 
	 * 
	 * @param      {string}        name    наименование хранилища данных
	 * @param      {object|array}  data    пустой объект необходимого типа данных (массив или объект)
	 * @return     {object|array}  сохранаемое хранилище данных. Если данные уже были сохранены, то будет
	 * содержать их восстановленную копию. Во внешнем коде использующем данные нельзя работать с копией данных,
	 * так как данные из копий не будут сохраняться
	 */
	create(name, data) {
		console.warn('Method .create(name, data) is dummy')
		storage[name] = data;
		return storage[name];
	}

	/**
	 * сохраняет коллекцию данных с именем name (необходимо использовать только синхронные механизмы)
	 *
	 * @param      {string}        name    наименование хранилища данных
	 */
	store(name) {
		console.warn('Method .store() is dummy')
	}

	/**
	 * сохраняет в файлах все именованые коллекции данных (необходимо использовать только синхронные механизмы)
	 * выполняется автоматически при завершениее процесса (программы)
	 */
	storeAll() {
		console.warn('Method .storeAll() is dummy')
	}


	/**
	 * восстанавливает и возвращает сохраненные данные (если были сохранены) иначе возвращает ссылку
	 * на текущую копию данных
	 *
	 * @param      {string}        name    наименование хранилища данных
	 * @return     {object|array}  сохранаемое хранилище данных. Если данные уже были сохранены, то будет
	 * содержать их восстановленную копию. Во внешнем коде использующем данные нельзя работать с копией данных,
	 * так как данные из копий не будут сохраняться
	 */
	restore(name) {
		console.warn('Method .restore() is dummy')
		return storage[name];
	}
}



// словарь перехватываемых сигналов
const signalEvents = [
	// SIGINT из терминала поддерживается на всех платформах и может быть сгенерирован посредством CTRL+C (можно перенастроить). 
	// Не генерируется, когда включен «сырой» режим терминала.
	// Если один этот сигнал имеет установленный слушатель, его поведение по умолчанию будет удалено (Node.js больше не будет завершаться).
	{
		signal: 'SIGINT',
		exit: true
	},

	// SIGTERM не поддерживается на Windows, может иметь слушатель.
	// Если один этот сигнал имеет установленный слушатель, его поведение по умолчанию будет удалено (Node.js больше не будет завершаться).
	{
		signal: 'SIGTERM',
		exit: true
	},

	// SIGHUP генерируется на Windows, когда закрывается окно консоли, на других платформах также при подобных условиях (см. signal(7)). 
	// Он может иметь установленный слушатель, однако, Node.js будет закрыт Windows спустя 10 секунд. 
	// На отличных от Windows платформах поведение SIGHUP по умолчанию заключается в принудительном завершении Node.js, 
	// но с установкой слушателя это поведение удаляется.
	{
		signal: 'SIGHUP',
		exit: true
	},

	// SIGBREAK работает на Windows, когда нажато <Ctrl> + <Break>, на не-Windows платформах его можно слушать, но нельзя отправить или сгенерировать.
	{
		signal: 'SIGBREAK',
		exit: true
	},

	// Добавлено в v0.11.12
	// Событие ‘beforeExit’ генерируется тогда, когда Node.js исчерпывает цикл событий и не имеет другой назначенной работы.
	// Обычно процесс Node.js завершается, когда нет назначенной работы, но слушатель, зарегестрированный в событии ‘beforeExit’ 
	// может совершать асинхронные вызовы, и тем самым побудить процесс Node.js продолжаться.
	// Функция обратного вызова слушателя имеет значение process.exitCode, которое передается в качестве единственного аргумента.
	// Событие ‘beforeExit’ не генерируется при условиях, которые служат причиной явного прекращения процесса, таких, например, 
	// как process.exit() или неотслеженные исключения.
	// ‘beforeExit’ не должно использоваться как альтернатива событию ‘exit’, за исключением случаев, когда нужно назначить дополнительную работу.
	// {
	// 	signal: 'beforeExit',
	// 	alias: 'beforeExit'
	// },

	// Событие ‘exit’ генерируется, когда процесс Node.js закрывается, вследствие следующего:
	// метод process.exit() был вызван явно
	// цикл событий Node.js больше не содержит дополнительной работы
	// Нет способов предотвратить выход из цикла событий в таком случ
	// ае, и, когда все слушатели ‘exit’ завершаются, процесс Node.js будет прекращен.
	// Функции слушателей должны выполнять исключительно синхронные операции. Процесс Node.js завершается непосредственно после вызова слушателей 
	// события ‘exit’, которые заставляют процесс не обращать внимания на любую дополнительную работу в очереди. 
	{
		signal: 'exit'
	}
];


// устанавливаем обработчики возможных сигналов завершения процесса
let isHandled = false;

signalEvents.forEach(item => {
	process.on(item.signal, () => {

		// console.log(`Recived signal ‘${item.signal}’`);

		if (isHandled) return;

		isHandled = true;

		storages.forEach(storage => storage.storeAll());

		if (!item.exit) return;

		process.exit();
	});
});



exports = module.exports = DummyStorage;