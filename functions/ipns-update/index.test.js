import { test } from 'tap'
import nock from 'nock'

import { handler } from './index.js'

const makeEvent = (body, method = 'POST', isBase64Encoded = false) => ({
  httpMethod: method,
  body: JSON.stringify(body),
  isBase64Encoded 
})

test('returns CORS headers when an OPTIONS request is sent', async ({ same }) => {
  const event = makeEvent({}, 'OPTIONS')
  const response = await handler(event)

  same(Object.keys(response.headers), [
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods'
  ])
})

test('returns 404 when request is not a POST or OPTIONS', async ({ equal }) => {
  const event = makeEvent(null, 'GET')
  const response = await handler(event)

  equal(response.statusCode, 404)
})

test('return 400 when body is missing elements', async ({ equal }) => {
  const missingHash = makeEvent({ subdomain: 'lol' })
  const hashResponse = await handler(missingHash)

  equal(hashResponse.statusCode, 400)

  const missingSubdomain = makeEvent({ ipfsHash: 'lol' })
  const subdomainResponse = await handler(missingSubdomain)

  equal(subdomainResponse.statusCode, 400)
})

test('generate new key and update IPNS', async ({ equal }) => {
  const ipfsNode = nock('http://localhost:5001', {"encodedQueryParams":true})
    // Key list
    .post('/api/v0/key/list')
    .reply(200, { "Keys": [] })
    // Key generation
    .post('/api/v0/key/gen')
    .query({"type":"ed25519","arg":"wee.me3.eth"})
    .reply(200, {"Name":"wee.me3.eth","Id":"k51qzi5uqu5di0tro50duiuaur4htjfp7ufcp3g2yitbbohf7a3dyqd1ur8fm7"})
    // Publish to IPNS
    .post('/api/v0/name/publish')
    .query({"key":"wee.me3.eth","lifetime":"24h","arg":"/ipfs/QmTye6k2H42QAJYuz4yefMDeBQVWqPoKE52FHGAFudra2G"})
    .reply(200, { Name: 'wee.me3.eth', Value: 'k51qzi5uqu5dkdh3b3p49ah43mfah8u9t2ss4wv1epdtio0vrp9bd6h0sucs80' })

  const ev = makeEvent({ subdomain: 'wee.me3.eth', ipfsHash: 'QmTye6k2H42QAJYuz4yefMDeBQVWqPoKE52FHGAFudra2G' })
  const response = await handler(ev)

  equal(response.statusCode, 200)
  equal(response.body, JSON.stringify({ ipnsHash: 'k51qzi5uqu5dkdh3b3p49ah43mfah8u9t2ss4wv1epdtio0vrp9bd6h0sucs80' }))
})

test('use existing key and update IPNS', async ({ equal }) => {
  const ipfsNode = nock('http://localhost:5001', {"encodedQueryParams":true})
    // Key list
    .post('/api/v0/key/list')
    .reply(200, { "Keys": [
      { Name: 'wee.me3.eth', Id: 'k51qzi5uqu5di0tro50duiuaur4htjfp7ufcp3g2yitbbohf7a3dyqd1ur8fm7' }
    ] })
    // Key generation
    .post('/api/v0/key/gen')
    .query({"type":"ed25519","arg":"wee.me3.eth"})
    .reply(200, {"Name":"wee.me3.eth","Id":"k51qzi5uqu5di0tro50duiuaur4htjfp7ufcp3g2yitbbohf7a3dyqd1ur8fm7"})
    // Publish to IPNS
    .post('/api/v0/name/publish')
    .query({"key":"wee.me3.eth","lifetime":"24h","arg":"/ipfs/QmTye6k2H42QAJYuz4yefMDeBQVWqPoKE52FHGAFudra2G"})
    .reply(200, { Name: 'wee.me3.eth', Value: 'k51qzi5uqu5dkdh3b3p49ah43mfah8u9t2ss4wv1epdtio0vrp9bd6h0sucs80' })

  const ev = makeEvent({ subdomain: 'wee.me3.eth', ipfsHash: 'QmTye6k2H42QAJYuz4yefMDeBQVWqPoKE52FHGAFudra2G' })
  const response = await handler(ev)

  equal(response.statusCode, 200)
  equal(response.body, JSON.stringify({ ipnsHash: 'k51qzi5uqu5dkdh3b3p49ah43mfah8u9t2ss4wv1epdtio0vrp9bd6h0sucs80' }))
})
