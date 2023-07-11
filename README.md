# OrbitDB DID Identity Provider

<p align="left">
  <img src="https://github.com/orbitdb/orbit-db/blob/main/images/orbit_db_logo_color.png" width="256" />
</p>

[![Matrix](https://img.shields.io/matrix/orbit-db:matrix.org?label=chat%20on%20matrix)](https://app.element.io/#/room/#orbit-db:matrix.org) [![npm version](https://badge.fury.io/js/orbit-db.svg)](https://www.npmjs.com/package/orbit-db-identity-provider-did) [![node](https://img.shields.io/node/v/orbit-db.svg)](https://www.npmjs.com/package/orbit-db-identity-provider-did)

Create and sign OrbitDB identities using a Decentralized IDentifier (DID). See https://www.w3.org/TR/did-core/.

#### Project status & support

* Status: **in active development**
* Compatible with **orbit-db versions >= 1.0.0**

## Install

This project uses [npm](http://npmjs.com/) and [nodejs](https://nodejs.org/).

```sh
npm i orbit-db-identity-provider-did
```

## Usage

Use [addIdentityProvider](https://api.orbitdb.org/module-Identities.html#.addIdentityProvider) to make the DID identity provider available to OrbitDB, then pass the `type` param to [createIdentity](https://api.orbitdb.org/module-Identities-Identities.html#createIdentity) with the identity provider name "did":

```js
// Fill out with actual use case
import * as OrbitDBIdentityProviderDID from 'orbit-db-identity-provider-did'
import { create } from 'ipfs-core'
import { Identities, addIdentityProvider } from 'orbit-db'

const ipfs = await create()

addIdentityProvider(OrbitDBIdentityProviderDID)

const identities = await Identities({ ipfs })

const identity = await identities.createIdentity({ id: 'userA', type: 'ethereum' }) // you can now use this with your OrbitDB databases.
```

## Contributing

**Take a look at our organization-wide [Contributing Guide](https://github.com/orbitdb/welcome/blob/master/contributing.md).** You'll find most of your questions answered there. Some questions may be answered in the [FAQ](FAQ.md), as well.

If you want to code but don't know where to start, check out the issues labelled ["help wanted"](https://github.com/orbitdb/orbit-db/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22+sort%3Areactions-%2B1-desc).

## License

[MIT](LICENSE) Haja Networks Oy, OrbitDB Community