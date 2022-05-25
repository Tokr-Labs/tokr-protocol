import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { GovernanceConfig } from './accounts';
import { SetGovernanceConfigArgs } from './instructions';
import { serialize } from 'borsh';
import {GOVERNANCE_SCHEMA} from "./serialisation";

export function createSetGovernanceConfig(
  programId: PublicKey,
  governance: PublicKey,
  governanceConfig: GovernanceConfig,
) {
  const args = new SetGovernanceConfigArgs({ config: governanceConfig });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const keys = [
    {
      pubkey: governance,
      isWritable: true,
      isSigner: true,
    },
  ];

  return new TransactionInstruction({
    keys,
    programId,
    data,
  });
}
