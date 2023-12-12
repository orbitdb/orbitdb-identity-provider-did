import assert from 'assert'
import { rimraf } from 'rimraf'
import { createOrbitDB, Identities, useIdentityProvider } from '@orbitdb/core'
import OrbitDBIdentityProviderDID from '../src/index.js'
import KeyDidResolver from 'key-did-resolver'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import * as IPFS from 'ipfs-core'

describe('Use DID Identity Provider with OrbitDB', function () {
  this.timeout(10000)

  const didStr = 'did:key:z6MkpnTJwrrVuphNh1uKb5DB7eRxvqniVaSDUHU6jtGVmn3r'

  let ipfs
  let orbitdb
  let didProvider
  let provider

  beforeEach(async () => {
    ipfs = await IPFS.create({})

    const seed = new Uint8Array([157, 94, 116, 198, 19, 248, 93, 239, 173, 82, 245, 222, 199, 7, 183, 177, 123, 238, 83, 240, 143, 188, 87, 191, 33, 95, 58, 136, 46, 218, 219, 245])

    OrbitDBIdentityProviderDID.setDIDResolver(KeyDidResolver.getResolver())
    useIdentityProvider(OrbitDBIdentityProviderDID)

    didProvider = new Ed25519Provider(seed)
    provider = OrbitDBIdentityProviderDID({ didProvider })
  })

  afterEach(async () => {
    await orbitdb.stop()
    await ipfs.stop()
    await rimraf('./orbitdb')
  })

  it('should be passed using identity.provider', async () => {
    orbitdb = await createOrbitDB({ ipfs, identity: { provider } })
    assert.strictEqual(orbitdb.identity.id, didStr)
  })

  it('should be passed as a preconfigured identity', async () => {
    const identities = await Identities({ ipfs })
    const identity = await identities.createIdentity({ id: 'userA', provider })
    orbitdb = await createOrbitDB({ ipfs, identities, identity })

    assert.strictEqual(orbitdb.identity.id, didStr)
  })
})
