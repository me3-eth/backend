'use strict'

const path = require('path')
const { promisify } = require('util')
const { finished, pipeline, Writable } = require('stream')

const { getFilesFromPath, File, Web3Storage } = require('web3.storage')
const uts46 = require('idna-uts46-hx')
const replacestream = require('replacestream')

const pipe = (...fns) => x => fns.reduce((v, fn) => fn(v), x)

const finishedAsync = promisify(finished)
const pipelineAsync = promisify(pipeline)

const cors = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST'
  },
  statusCode: 200,
  body: 'preflight'
}

const asciiEns = username => uts46.toAscii(username, { transitional: false, useStd3ASCII: true })
const onlyAlphanumeric = username => username.replace(/[^a-z0-9]/ig, '')
const formatLabel = pipe(onlyAlphanumeric, asciiEns)

const toFile = (name, finishCb) => {
  const writer = new Writable()

  const chunks = []
  writer._write = (chunk, enc, next) => {
    chunks.push(chunk)
    next()
  }

  writer.on('finish', () => {
    const f = new File(chunks, name)
    finishCb(f)
  })

  return writer
}

const prepareSite = async (template, replacements) => {
  const files = await getFilesFromPath(path.join(process.cwd(), 'templates', template))

  return files.map(async (file) => {
    // Only care about the bundle.js file, everything else remains unchanged
    if (!file.name.match(/bundle\.[a-z0-9]*\.[0-9]{1,3}\.js/g)) return file

    const reader = file.stream()
    let patchedFile
    const writer = toFile(file.name, (patched) => {
      patchedFile = patched
    })

    reader.on('close', () => writer.end())

    const replacers = Object.entries(replacements).map(([k, v]) => {
      return replacestream(k, v)
    })

    await pipelineAsync(
      reader,
      ...replacers,
      writer
    )

    await finishedAsync(writer)

    return patchedFile
  })
}

const parseBody = (body, isEncoded) => {
  const bodyJson = JSON.parse(isEncoded ? Buffer.from(body, 'base64').toString() : body)

  if (!bodyJson.version || bodyJson.version === '1.0') {
    const sanitizedSubdomain = `${formatLabel(bodyJson.subdomain.split('.')[0])}.ethonline2021char.eth`
    return { subdomain: sanitizedSubdomain, version: '1.0' }
  }

  if (bodyJson.version === '2.0') {
    const { subdomain, links, avatar } = bodyJson

    return {
      version: '2.0',
      subdomain: `${formatLabel(subdomain.split('.')[0])}.ethonline2021char.eth`,
      links: encodeURIComponent(JSON.stringify(links)),
      avatar
    }
  }
}

const templateSelector = {
  '1.0': 'onchain',
  '2.0': 'allinone'
}

const handler = async (event) => {
  const { httpMethod, body, isBase64Encoded } = event

  if (httpMethod === 'OPTIONS') return cors

  if (httpMethod !== 'POST') return { statusCode: 404, body: 'Route not found' }

  try {
    const { subdomain, links, avatar, version } = parseBody(body, isBase64Encoded)
    console.log('parsed', { links, avatar, subdomain, version })
    const files = await Promise.all(await prepareSite(
      templateSelector[version],
      {
        '{{USER_SUBDOMAIN}}': subdomain,
        '{{USER_LINKS}}': links,
        '{{USER_AVATAR}}': avatar,
      }
    ))

    const ipfsClient = new Web3Storage({ token: process.env.WEB3_STORAGE_API_KEY })

    const cid = await ipfsClient.put(files, {
      name: subdomain,
      maxRetries: 2,
      wrapWithDirectory: false
    })
    console.log(`Saved ${subdomain} as ${cid}`)

    return {
      statusCode: 200,
      body: JSON.stringify({ hash: cid }),
      isBase64Encoded: false,
      headers: cors.headers
    }
  } catch (error) {
    console.error('the error', error)
    return { statusCode: 500, body: error.toString() }
  }
}

module.exports = { handler }
