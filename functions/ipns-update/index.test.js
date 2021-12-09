import { test } from 'tap'
import { handler } from './index.js'

const makeEvent = (body, method = 'POST', isBase64Encoded = false) => ({
  httpMethod: method,
  body,
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
