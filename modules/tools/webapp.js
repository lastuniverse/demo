// подключаем express
const express = require('express');
// подключаем дополнительный модуль устанавливающий безопасные настройки express-а
// const helmet = require('helmet');

const WS = require('../websocket');

function startWebApp(piblicPath, port) {
  // создаем объект нашего приложения
  const app = express();

  // подключаем к нему модуль защиты
  // app.use(helmet());

  // подключаем к нему обработку запросов к ститическому контенту
  // лежащему в папке /public
  app.use(express.static(piblicPath));

  const ws = new WS();

  // далее обработчики срабатывающие если ни один из
  // предидущих обработчиков не вернул ничего и вызвал next()

  // catch 404 and forward to error handler
  app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const err = new Error(`Not Found. ${ip}, ${req.hostname}, ${req.path}, ${req.params}`);
    err.status = 404;
    next(err);
  });

  // error handler
  app.use((err, req, res) => {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.send('error');
    // res.render('error');
  });

  ws.setExpressServer('/cluster', app, port);

  // app.listen(port, () => {
  //   console.log(`Example app listening at port: ${port}`)
  // });
  return ws;
}

// eslint-disable-next-line no-multi-assign
exports = module.exports = startWebApp;
