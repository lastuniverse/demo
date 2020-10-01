// подключаем дополнительный модуль работающий с путями
const path = require('path');
// подключаем express
const express = require('express');
// подключаем дополнительный модуль устанавливающий безопасные настройки express-а
const helmet = require('helmet');

const Cluster = require('./modules/cluster');

const cluster = new Cluster();

const port = 3000;

// console.log("isMaster",cluster.isMaster, process.pid);
if (cluster.isMaster) {

	cluster.on('cluster.ready', (pid) => {
	});

	const worker = cluster.fork();
	worker.on('worker.ready', () => {
		// worker.kill();
	});
	worker.on('worker.stop', () => {
	});

} else {
	cluster.on('cluster.ready', (pid) => {
		startExpress();
	});

	cluster.on('cluster.setmaster', (pid) => {
	});

	cluster.on('cluster.isMaster', (pid) => {
	});

	cluster.on('cluster.stop', (pid) => {
	});
}

function startExpress() {
	// создаем объект нашего приложения
	const app = express();

	// подключаем к нему модуль защиты
	// app.use(helmet());

	// подключаем к нему обработку запросов к ститическому контенту
	// лежащему в папке /public
	app.use(express.static(path.join(__dirname, 'public')));





	// далее обработчики срабатывающие если ни один из
	// предидущих обработчиков не вернул ничего и вызвал next()

	// catch 404 and forward to error handler
	app.use(function(req, res, next) {
	  var err = new Error('Not Found');
	  err.status = 404;
	  next(err);
	});

	// error handler
	app.use(function(err, req, res, next) {
	  // set locals, only providing error in development
	  res.locals.message = err.message;
	  res.locals.error = req.app.get('env') === 'development' ? err : {};

	  // render the error page
	  res.status(err.status || 500);
	  res.send('error');
	  //res.render('error');
	});

	app.listen(port, () => {
	  console.log(`Example app listening at port: ${port}`)
	});
}