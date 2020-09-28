const Cluster = require('./modules/cluster');
const express = require('express'),
	app = express(),
	os = require('os');
	// cluster = require('cluster')

const cluster = new Cluster();


const host = '127.0.0.1'
const port = 7000

app.use((req, res, next) => {
	if (cluster.isWorker) console.log(`Worker ${cluster.worker.id} handle request`)

	next()
})

app.get('/', (req, res) => res.send('Cluster mode.'))

if (cluster.isMaster) {
	let cpus = os.cpus().length

	for (let i = 0; i < cpus; i++) cluster.fork()

	cluster.on('exit', (worker, code) => {
		console.log(`Worker ${worker.id} finished. Exit code: ${code}`)

		app.listen(port, host, () => console.log(`Worker ${cluster.worker.id} launched`))
	});

} else app.listen(port, host, () => console.log(`Worker ${cluster.worker.id} launched`))

console.log(`\n\n\n`);
console.log(`Worker ${cluster.worker.id}`)

console.log(`\n\n\n`);


