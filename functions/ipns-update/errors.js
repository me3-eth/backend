'use strict'

class BadRequest extends Error {
  constructor (message) {
    super(message)
    this.statusCode = 400
    this.type = 'BadRequest'
  }
}

class Unauthorized extends Error {
  constructor (message) {
    super(message)
    this.statusCode = 401
    this.type = 'Unauthorized'
  }
}

class NotFound extends Error {
  constructor (message) {
    super(message)
    this.statusCode = 404
    this.type = 'BadRequest'
  }
}

function errResult (err) {
  const { statusCode, message, type } = err
  return {
    statusCode,
    body: JSON.stringify({ message, type }),
    headers: cors.headers
  }
}

module.exports = { errResult, BadRequest, Unauthorized, NotFound }
