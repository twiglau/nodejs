/**
 * @description jest server
 * @author lau
 */

const request = require('supertest')
const server = require('../src/app').callback()

module.exports = request(server)