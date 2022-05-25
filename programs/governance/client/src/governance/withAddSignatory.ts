import {
  PublicKey,
  SYSVAR_RENT_PUBKEY,
  TransactionInstruction,
} from '@solana/web3.js';
import { serialize } from 'borsh';
import { AddSignatoryArgs } from './instructions';
import { getSignatoryRecordAddress } from './accounts';
import { SYSTEM_PROGRAM_ID } from '../tools';
import {GOVERNANCE_SCHEMA} from "./serialisation";

export const withAddSignatory = async (
  instructions: TransactionInstruction[],
  programId: PublicKey,
  programVersion: number,
  proposal: PublicKey,
  tokenOwnerRecord: PublicKey,
  governanceAuthority: PublicKey,
  signatory: PublicKey,
  payer: PublicKey,
) => {
  const args = new AddSignatoryArgs({ signatory });
  const data = Buffer.from(serialize(GOVERNANCE_SCHEMA, args));

  const signatoryRecordAddress = await getSignatoryRecordAddress(
    programId,
    proposal,
    signatory,
  );

  const keys = [
    {
      pubkey: proposal,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: tokenOwnerRecord,
      isWritable: false,
      isSigner: false,
    },
    {
      pubkey: governanceAuthority,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: signatoryRecordAddress,
      isWritable: true,
      isSigner: false,
    },
    {
      pubkey: payer,
      isWritable: false,
      isSigner: true,
    },
    {
      pubkey: SYSTEM_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
  ];

  instructions.push(
    new TransactionInstruction({
      keys,
      programId,
      data,
    }),
  );

  return signatoryRecordAddress;
};
