/* eslint-disable global-require */
/* eslint-disable no-multi-assign */

/**
 * Модуль реализует сетевой механизм обмена сообщениями (событиями), передаваемыми
 * как ("eventName", enyData). Содержит реализацию серверной и клиентской частей
 * (классы Server и Client). Причиной отказа от механизмов межпроцесного взаимодействия
 * таких как redis и других вариантов sharedmemory послужило желание сделать более
 * универсальный механизм, позволяющий наладить взаимодействие между процессами,
 * расположенными на разных компьютерах, в идеале даже в браузере (через websocket-ы).
 * Но данная реализация в силу исgользуемых сокетов типа UNIX домен все еще
 * связанна рамками одного компьютера.
 *
 * Архитектура данного модуля реализует следующие принципы SOLID:
 * - [S] Принцип единственной ответственности (Модуль, как самостоятельный элемент
 *       сравнимый с классом инкапсулирует все ресурсы необходимые для своей работы)
 * - [I] Принцип разделения интерфейса (тут очевидно...)
 *
 * Почему не применялись следующие следующие принципы SOLID:
 * - [O] Принцип открытости/закрытости (API минимален и достаточен, не представляю
 *       ситуации требующей его расширения)
 * - [L] Принцип подстановки Лисков (можно было бы достичь, сделав абстракцию, на основе
 *       которой создать несколько реализаций используюших различные
 *       подходы к передаче информации (через websoket-ы, webRTC, sharedmemory и т.д.)
 *       но есть ли необходимость в данной задаче?)
 * - [D] Принцип инверсии зависимостей (Доводы теже что и в [L])
 *
 * @example
 * const server = new Server();
 * const client = new Client(process.pid);
 *
 * server.on('network.ready',()=>{
 *  console.log('server is ready');
 *  server.on('test',(message)=>{
 *    console.log(message);
 *  });
 * });
 *
 * client.on('network.ready', ()=>{
 *  console.log('client is ready');
 *  client.send('test',12345);
 * });
 *
 * @module modules/nerwork
 *
 * @author Roman Surmanidze <lastuniverse@github.com>*
 */

exports = module.exports = {
  Server: require('./source/server.js'),
  Client: require('./source/client.js'),
};
