/* eslint-disable no-console */
const PathToRegex = require('path-to-regex');

class EventRouter {
  constructor(separator = '/') {
    this.handlers = [];
    this.separator = separator;
    // this.parser = new pathToRegex(':path*', { separators: '/.' });
  }

  use(path, ...handlers) {
    if (typeof path === 'function') {
      handlers.push(path);
      // eslint-disable-next-line no-param-reassign
      path = this.separator;
    }
    // eslint-disable-next-line no-param-reassign
    if (!path) path = this.separator;

    if (!handlers.length) return;

    // eslint-disable-next-line max-len
    const parser = (path === this.separator) ? ({ match: () => ({}) }) : new PathToRegex(path, { separators: this.separator });

    this.handlers.push({
      parser,
      handlers,
    });
  }

  parse(message) {
    if (!message && !message.eventName) return true;

    return this.handlers.every((item) => {
      const params = item.parser.match(message.eventName);

      const list = message.eventName.split(this.separator);
      const first = list.shift();

      // если парсер не подошел, продолжаем дальше
      if (!params && !item.parser.match(first)) return true;

      // если подошел - вызываем все обработчики
      return item.handlers.every((handler) => {
        let isNext = false;
        const next = () => {
          isNext = true;
        };

        if (handler instanceof EventRouter) {
          const data = { ...message };
          data.eventName = list.join(this.separator);
          return handler.parse(data);
        } if (typeof handler === 'function') {
          handler({ ...message, params }, next);
        }
        return isNext;
      });
    });
  }
}

const route_aaa = new EventRouter();
const route_bbb = new EventRouter();
const route_ccc = new EventRouter();

route_aaa.use((msg, next) => {
  console.log('route_aaa', undefined, msg);
  next();
});

route_aaa.use('/aaa', route_bbb);

route_bbb.use((msg, next) => {
  console.log('route_bbb', 'aaa', msg);
  next();
});

route_bbb.use('/bbb', route_ccc);

route_ccc.use((msg, next) => {
  console.log('route_ccc', 'aaa-bbb', msg);
  next();
});

route_ccc.use('/:action', (msg, next) => {
  console.log('route_ccc', 'aaa-bbb', msg);
  next();
});

// route_bbb.use('aaa',(msg, next)=>{
//   console.log("route_aaa", "aaa", msg);
//   next();
// });

// route_bbb.use('bbb',(msg, next)=>{
//   console.log("route_aaa", "bbb", msg);
//   next();
// });

route_aaa.parse({ eventName: 'aaa', data: 'aaa-bbb-ccc' });
route_aaa.parse({ eventName: 'aaa/bbb/ccc', data: 'aaa' });
