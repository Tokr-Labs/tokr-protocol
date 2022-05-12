import {Mint} from "@solana/spl-token";
import {PublicKey} from "@solana/web3.js";

export interface CapTableEntry {
    holderAddress: PublicKey
    tokensHeld: number
    commonEquivalent: number
    percentOwned: number
}

export interface CapTable {
    entries: CapTableEntry[]
}