/* eslint-disable no-multi-assign */
const path = require('path');

const socketDir = '/tmp';

function socketFileNameByPid(pid) {
  return path.normalize(path.join(socketDir || __dirname, `cluster.${pid}.sock`));
}
exports = module.exports = {
  socketFileNameByPid,
};
