'use strict'

const cors = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST'
  },
  statusCode: 200,
  body: 'preflight'
}

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

function parseBody (body, options) {
  if (options.isBase64Encoded) {
    return JSON.parse(Buffer.from(body, 'base64').toString())
  }

  return JSON.parse(body)
}

function validateBody (body) {
  const { subdomain, ipfsHash } = body

  if (!subdomain) throw new BadRequest('Missing subdomain')
  if (!ipfsHash) throw new BadRequest('Missing IPFS hash')
}

function validateAuthorization (header) {
  const [type, token] = header.split(' ')
  
  if (!type || type !== 'Bearer') throw new Unauthorized('Unable to authenticate')
  if (!token) throw new Unauthorized('No token provided')

  const decoded = Buffer.from(token, 'base64').toString()
  if (decoded !== process.env.INCOMING_API_KEY) throw new Unauthorized('Invalid credentials')
}

function errResult (err) {
  const { statusCode, message, type } = err
  return {
    statusCode,
    body: JSON.stringify({ message, type }),
    headers: cors.headers
  }
}
    

async function handler ({ httpMethod, body, isBase64Encoded }) {
  if (httpMethod === 'OPTIONS') return cors
  if (httpMethod !== 'POST') return errResult(new NotFound('Route not found'))
}

module.exports = { handler }
