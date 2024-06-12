import assert from 'assert'
import path from 'path'
import { rimraf } from 'rimraf'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import KeyDidResolver from 'key-did-resolver'
import { KeyStore, Identities, useIdentityProvider } from '@orbitdb/core'
import DIDIdentityProvider from '../src/index.js'

const keypath = path.resolve('./test/keys')

let keystore

const seed = new Uint8Array([157, 94, 116, 198, 19, 248, 93, 239, 173, 82, 245, 222, 199, 7, 183, 177, 123, 238, 83, 240, 143, 188, 87, 191, 33, 95, 58, 136, 46, 218, 219, 245])
const didStr = 'did:key:z6MkpnTJwrrVuphNh1uKb5DB7eRxvqniVaSDUHU6jtGVmn3r'

let identities
let provider

describe('DID Identity Provider', function () {
  before(async () => {
    await rimraf(keypath)
    DIDIdentityProvider.setDIDResolver(KeyDidResolver.getResolver())
    useIdentityProvider(DIDIdentityProvider)
    keystore = await KeyStore({ path: keypath })
    identities = await Identities({ keystore })

    const didProvider = new Ed25519Provider(seed)
    provider = DIDIdentityProvider({ didProvider })
  })

  after(async () => {
    await keystore.close()
    await rimraf(keypath)
  })

  describe('create an DID identity', () => {
    let identity

    before(async () => {
      identity = await identities.createIdentity({ provider, keystore })
    })

    it('has the correct id', async () => {
      assert.strictEqual(identity.id, didStr)
    })

    it('created a key for id in keystore', async () => {
      const key = await keystore.getKey(didStr)
      assert.notStrictEqual(key, undefined)
    })

    it('has the correct public key', async () => {
      const signingKey = await keystore.getKey(didStr)
      assert.notStrictEqual(signingKey, undefined)
      assert.strictEqual(identity.publicKey, keystore.getPublic(signingKey))
    })

    it('has a signature for the id', async () => {
      const idSignature = await identities.sign(identity, didStr)
      const verifies = await identities.verify(idSignature, identity.publicKey, didStr)
      assert.strictEqual(verifies, true)
      assert.strictEqual(identity.signatures.id, idSignature)
    })

    it('has a signature for the publicKey', async () => {
      const idSignature = await identities.sign(identity, didStr)
      assert.notStrictEqual(idSignature, undefined)
    })
  })

  describe('verify identity', () => {
    let identity

    before(async () => {
      identity = await identities.createIdentity({ provider, keystore })
    })

    it('DID identity verifies', async () => {
      const verified = await identities.verifyIdentity(identity)
      assert.strictEqual(verified, true)
    })

    it('DID identity with incorrect id does not verify', async () => {
      const identity2 = {
        ...identity,
        id: 'NotAnId'
      }
      const verified = await identities.verifyIdentity(identity2)
      assert.strictEqual(verified, false)
    })

    it('Valid DID identity with fake publicKey does not verify', async () => {
      // HACKER part:
      // Create a completely new set of private keys
      const fakeSeed = new Uint8Array([100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 183, 177, 123, 238, 83, 240, 143, 188, 87, 191, 33, 95, 58, 136, 46, 218, 219, 245])
      const fakeDidProvider = new Ed25519Provider(fakeSeed)
      const fakeProvider = await DIDIdentityProvider({ didProvider: fakeDidProvider })()
      const fakeKeystore = await KeyStore({ path: path.join(keypath, 'fake') })
      const fakeIdentities = await Identities({ keystore: fakeKeystore })

      // Create an identity with all new keys, but with an ID from the
      // "admin" identity we want to use to get write access by utilizing
      // a modified version of the provider
      const fakeIdentity = await fakeIdentities.createIdentity({
        provider: () => ({
          ...fakeProvider,
          getId: () => identity.id
        }),
        keystore
      })

      // The ID of the fake identity is equal to the ID of an admin
      // account, but all the signatures and the hash are different.
      // This means that the entries produced by the fake identity's "identity"
      // field will point to a fake identity document in IPFS and the victim
      // will get a fake identity object.
      assert.strictEqual(fakeIdentity.id, identity.id)
      assert.notStrictEqual(fakeIdentity.hash, identity.hash)
      assert.notDeepStrictEqual(fakeIdentity.signatures, identity.signatures)

      // VICTIM part:
      // Using a normal didProvider try to validate the faked identity
      const verified = await identities.verifyIdentity(fakeIdentity)
      assert.strictEqual(verified, false)
    })
  })

  describe('sign data with an identity', () => {
    let identity
    const data = 'hello friend'

    before(async () => {
      identity = await identities.createIdentity({ provider, keystore })
    })

    it('sign data', async () => {
      const expectedSignature = await identities.sign(identity, data)
      const signature = await identity.sign(identity, data, keystore)
      assert.strictEqual(signature, expectedSignature)
    })

    it('throws an error if private key is not found from keystore', async () => {
      // Remove the key from the keystore (we're using a mock storage in these tests)
      const modifiedIdentity = { id: 'this id does not exist', publicKey: identity.publicKey, signature: identity.signatures, type: identity.type, sign: identities.sign, verify: identities.verify }
      let signature
      let err
      try {
        signature = await identity.sign(modifiedIdentity, data, keystore)
      } catch (e) {
        err = e.toString()
      }
      assert.strictEqual(signature, undefined)
      assert.strictEqual(err, 'Error: Private signing key not found from KeyStore')
    })

    describe('verify data signed by an identity', () => {
      const data = 'hello friend'
      let identity
      let signature

      before(async () => {
        identity = await identities.createIdentity({ provider, keystore })
        signature = await identity.sign(identity, data, keystore)
      })

      it('verifies that the signature is valid', async () => {
        const verified = await identity.verify(signature, identity.publicKey, data)
        assert.strictEqual(verified, true)
      })

      it('doesn\'t verify invalid signature', async () => {
        const verified = await identity.verify('invalid', identity.publicKey, data)
        assert.strictEqual(verified, false)
      })
    })
  })
})
