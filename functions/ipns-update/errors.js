export class BadRequest extends Error {
  constructor (message) {
    super(message)
    this.statusCode = 400
    this.type = 'BadRequest'
  }
}

export class Unauthorized extends Error {
  constructor (message) {
    super(message)
    this.statusCode = 401
    this.type = 'Unauthorized'
  }
}

export class NotFound extends Error {
  constructor (message) {
    super(message)
    this.statusCode = 404
    this.type = 'BadRequest'
  }
}

export function errResult (headers) {
  return function (err) {
    const { statusCode, message, type } = err
    return {
      statusCode,
      body: JSON.stringify({ message, type }),
      headers
    }
  }
}
