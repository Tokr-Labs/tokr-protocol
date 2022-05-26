import { PublicKey, TransactionInstruction } from '@solana/web3.js';
import { MintMaxVoteWeightSource } from './accounts';
import BN from 'bn.js';
import { withSetRealmConfig } from './withSetRealmConfig';

export async function createSetRealmConfig(
  programId: PublicKey,
  realm: PublicKey,
  realmAuthority: PublicKey,
  councilMint: PublicKey | undefined,
  communityMintMaxVoteWeightSource: MintMaxVoteWeightSource,
  minCommunityTokensToCreateGovernance: BN,
  communityVoterWeightAddin: PublicKey | undefined,
  maxCommunityVoterWeightAddin: PublicKey | undefined,
  payer: PublicKey,
) {
  const instructions: TransactionInstruction[] = [];
  await withSetRealmConfig(
    instructions,
    programId,
    realm,
    realmAuthority,
    councilMint,
    communityMintMaxVoteWeightSource,
    minCommunityTokensToCreateGovernance,
    communityVoterWeightAddin,
    maxCommunityVoterWeightAddin,
    payer,
  );

  return instructions[0];
}
