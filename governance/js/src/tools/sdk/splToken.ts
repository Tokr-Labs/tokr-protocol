import { PublicKey } from '@solana/web3.js';

export const TOKEN_PROGRAM_ID = new PublicKey(
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
);

export const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
    'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
);

// @TODO - Figure out how we can make this dynamic or always deploy with the same idv program id
export const IDENTITY_VERIFICATION_PROGRAM_ID = new PublicKey(
    '3YC2irJKAzmuqeg2Qf9v8YBb1ufGmYTuvggxqv4bCyST',
);
