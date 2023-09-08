import * as u8a from 'uint8arrays'
import { DID } from 'dids'

const type = 'did'

let didResolver = null

const setDIDResolver = resolver => {
  if (!didResolver) {
    didResolver = new DID({ resolver })
  } else {
    didResolver.setResolver(resolver)
  }
}

const verifyIdentity = async identity => {
  if (!didResolver) {
    throw new Error('The DID resolver must first be set with setDIDResolver()')
  }

  const { publicKey, signatures } = identity
  const data = publicKey + signatures.id

  try {
    const payload = u8a.toString(u8a.fromString(data, 'base16'), 'base64url')
    const [header, signature] = signatures.publicKey.split('..')
    const jws = [header, payload, signature].join('.')
    didResolver.verifyJWS(jws)
      .then(() => {
        // do nothing
      })
      .catch((error) => {
        throw error
      })
  } catch (e) {
    return false
  }

  return true
}

const OrbitDBIdentityProviderDID = ({ didProvider }) => async () => {
  if (!didResolver) {
    throw new Error('The DID resolver must first be set with setDIDResolver()')
  }

  if (!didProvider) {
    throw new Error('DIDIdentityProvider requires a didProvider parameter')
  }

  const did = new DID({
    resolver: didResolver._resolver,
    provider: didProvider
  })

  const getId = async () => {
    if (!did.authenticated) {
      await did.authenticate()
    }
    return did.id
  }

  const signIdentity = async (data) => {
    if (!did.authenticated) {
      await did.authenticate()
    }
    const payload = u8a.toString(u8a.fromString(data, 'base16'), 'base64url')
    const { signatures } = await did.createJWS(payload)
    // encode as JWS with detached payload
    return `${signatures[0].protected}..${signatures[0].signature}`
  }

  return {
    type,
    getId,
    signIdentity
  }
}

OrbitDBIdentityProviderDID.type = type
OrbitDBIdentityProviderDID.verifyIdentity = verifyIdentity
OrbitDBIdentityProviderDID.setDIDResolver = setDIDResolver

export default OrbitDBIdentityProviderDID
