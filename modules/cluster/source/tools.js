/* eslint-disable camelcase */
/* eslint-disable no-multi-assign */

const childProcess = require('child_process');

function isMaster() {
  if (process.argv[2] === 'worker') return false;
  return true;
}

const forkSettings = {
  // execArgv: process.execArgv,
  exec: process.argv[1],
  args: isMaster() ? process.argv.slice(2) : process.argv.slice(3),
  silent: false,
};

function fork() {
  return childProcess.fork(
    forkSettings.exec, ['worker', ...forkSettings.args], {
      silent: forkSettings.silent,
      detached: true,
    },
  );
}

exports = module.exports = {
  fork,
  isMaster,
};
