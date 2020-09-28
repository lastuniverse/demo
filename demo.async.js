class Thenable1 {
	constructor(num) {
		this.num = num;
	}
	ready(resolve) {
		resolve(this);
	}
	then(resolve, reject) {
		console.log('xxx')
		setTimeout(() => {
			this.ready(resolve);
		}, 3000); // (*)
	}
};


new Thenable1(1).then(data=>{
	console.log('Thenable1', data);
});

async function f() {
	// код будет ждать 1 секунду,
	// после чего значение result станет равным 2
	let result = await new Thenable1(2);
	console.log('Thenable1', result);
}

f();

