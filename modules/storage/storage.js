/**
 * Модуль реализует автоматическое сохранение данных при выходе из программы (завершении процесса) и их восстановление при повторном запуске
 * 
 * Архитектура данного модуля реализует следующие принципы SOLID:
 * - [S] Принцип единственной ответственности (Модуль, как самостоятельный элемент сравнимый с классом инкапсулирует все ресурсы необходимые для своей работы)
 * - [O] Принцип открытости/закрытости (достигается за счет унификации API и использования defaults)
 * - [L] Принцип подстановки Лисков (достигается за счет того, что все реализации наследуются от прототипа DummyStorage и следуют соглашению/рекомендациям
 *   	 по переопределению методов класса DummyStorage)
 * - [I] Принцип разделения интерфейса (тут очевидно...)
 * - [D] Принцип инверсии зависимостей (Достигается за счет того, что класс DummyStorage по сути является абстракцией, не зависящей от реализаций)
 * 
 * @example
 * const storage = Storage();
 * const test = storage.create('test',[],true);
 * console.log(test); // [] - при первом запуске приложения
 *                    // ['eniItem'] - при втором запуске приложения
 *                    // ['eniItem','eniItem'] - при третьем запуске приложения
 * test.push('eniItem');
 * 
 * @example
 * const storage = Storage();
 * const test = storage.create('test',{},true);
 * console.log(test); // [] - при первом запуске приложения
 *                    // {'1000': 'eniItem'} - при втором запуске приложения
 *                    // {'1000': 'eniItem', '1001': 'eniItem'} - при третьем запуске приложения
 * test[process.pid] = 'eniItem';
 * 
 * @module modules/storage
 * 
 * @author Roman Surmanidze <lastuniverse@github.com>
 */

// используемая по умолчанию реализация хранения и восстановления данных
const defaults = {
	type: 'file',
	options: __dirname+'/store'
};


/**
 * Загружает класс-реализацию механизмов фонового сохранения и загрузки данных и создает объект от класса реализации
 * 
 * @class      Storage (name)
 * @param      {array}                  options  Набор произвольных параметров, передаваемых конструктору реализации
 *                                               Каждая реализация обладает своим набором параметров.
 * @return     {StorageImplementation}  объект класса-реализации
 */
function Storage(...options) {
    try {
        StorageImplementation = require(`./implementations/${defaults.type}-storage.js`);
    } catch (e) {
    	console.log(e);
        return console.warn(`Do not find '${defaults.type}' implementation of Storage`);
    }

    const storrage = new StorageImplementation(defaults.options);
    return storrage;
}


exports = module.exports = Storage;


