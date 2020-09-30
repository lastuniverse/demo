const child_process = require('child_process');

const forkSettings = {
    // execArgv: process.execArgv,
    exec: process.argv[1],
    args: isMaster() ? process.argv.slice(2) : process.argv.slice(3),
    silent: false
};


function fork() {
    return child_process.fork(
        forkSettings.exec, ['worker', ...forkSettings.args], {
            silent: forkSettings.silent,
            detached: true
        }
    );

};


function isMaster() {
    if (process.argv[2] == 'worker')
        return false;
    return true;
}

exports = module.exports = {
    fork: fork,
    isMaster: isMaster
};