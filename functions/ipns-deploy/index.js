'use strict'

const { create }  = require('ipfs-http-client')
const ipfs = create()

async function updateIpns (cid, key) {
  const { name, value } = await ipfs.name.publish(
    `/ipfs/${cid}`,
    { key, lifetime: '365d' }
  )

  return name
}
