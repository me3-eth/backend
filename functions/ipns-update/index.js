'use strict'

const { create }  = require('ipfs-http-client')
const {
  Unauthorized,
  BadRequest,
  NotFound,
  errResult
} = require('./errors')

const ipfs = create()

const cors = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST'
  },
  statusCode: 200,
  body: 'preflight'
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

async function updateIpns (cid, key) {
  const { name, value } = await ipfs.name.publish(
    `/ipfs/${cid}`,
    { key, lifetime: '365d' }
  )

  return name
}

async function handler ({ httpMethod, body, isBase64Encoded }) {
  if (httpMethod === 'OPTIONS') return cors
  if (httpMethod !== 'POST') return errResult(new NotFound('Route not found'))
}

module.exports = { handler }
