import { Connection, PublicKey } from '@solana/web3.js';

import {
  getBorshProgramAccounts,
  MemcmpFilter,
  pubkeyFilter,
} from '../core/api';
import { ChatMessage, GOVERNANCE_CHAT_PROGRAM_ID } from './accounts';

import { GOVERNANCE_CHAT_SCHEMA } from './serialisation';

export function getGovernanceChatMessages(
  connection: Connection,
  chatProgramId: PublicKey,
  proposal: PublicKey,
) {
  return getBorshProgramAccounts(
    connection,
    chatProgramId,
    _ => GOVERNANCE_CHAT_SCHEMA,
    ChatMessage,
    [pubkeyFilter(1, proposal) as MemcmpFilter],
  );
}

export function getGovernanceChatMessagesByVoter(
  connection: Connection,
  chatProgramId: PublicKey,
  voter: PublicKey,
) {
  return getBorshProgramAccounts(
    connection,
    chatProgramId,
    _ => GOVERNANCE_CHAT_SCHEMA,
    ChatMessage,
    [pubkeyFilter(33, voter) as MemcmpFilter],
  );
}
