// Copyright 2018-2022 @polkadot/signer-cli authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { SignerOptions } from '@polkadot/api/submittable/types';
import type { Index } from '@polkadot/types/interfaces';

import { ApiPromise, WsProvider } from '@polkadot/api';

import RawSigner from './RawSigner';
import { getTx, mortalityOpts } from './util';

export default async function cmdSendOffline (account: string, blocks: number | undefined, endpoint = '', nonce: number | undefined | Index, [tx, ...params]: string[]): Promise<void> {
  // const provider = new WsProvider(endpoint);
  const types = {
    VersionedEventProof: {
      _enum: {
        sentinel: null,
          EventProof: "EventProof",
      },
    },
    EthyId: "[u8; 32]",
      EthyEventId: "u64",
      AccountId: 'EthereumAccountId',
      AccountId20: 'EthereumAccountId',
      AccountId32: 'EthereumAccountId',
      Address: 'AccountId',
      LookupSource: 'AccountId',
      Lookup0: 'AccountId',
  };
  const provider = new WsProvider('ws://127.0.0.1:9944/');
  const api = await ApiPromise.create({ provider, types: types });
  const options: Partial<SignerOptions> = { signer: new RawSigner() };

  if (!blocks && blocks !== 0) {
    blocks = 50;
  }

  if (!nonce && nonce !== 0) {
    options.nonce = (await api.derive.balances.account(account)).accountNonce;
  } else {
    options.nonce = nonce;
  }

  if (blocks === 0) {
    options.blockHash = api.genesisHash;
    options.era = 0;
  } else {
    await mortalityOpts(api, options, blocks);
  }

  const transaction = getTx(api, tx)(...params);

  await transaction.signAsync(account, options);

  console.log('\nSigned transaction:\n' + transaction.toJSON());
  process.exit(0);
}
