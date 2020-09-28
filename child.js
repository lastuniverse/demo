
// process.on('message', (m, node) => {
//   if( m == "child" ){
//   	nodeList.push(node);
//   }else{ 
//   	console.log(`process got message "${m}"`);
//   }
// });




// const transport = require('./modules/transport');

// const node = new transport.IPC({
// 	node: process
// });

// node.on("message", data => {
// 	console.log("in child", data);
// });

// node.send({
// 	from: "child",
// 	text: "222"
// });


// const manager = new transport.Core();

// manager.addNode(node, true);


const Cluster = require('./modules/cluster');

const cluster = new Cluster();