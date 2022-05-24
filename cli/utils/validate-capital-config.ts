import {isNumber, isString} from "underscore";

export const validateDepositCapitalConfig = (config: any) => {

    return !!(
        isString(config.cluster) &&
        isString(config.owner) &&
        isString(config.governanceProgramId) &&
        isString(config.identityVerificationProgramId) &&
        isString(config.usdcMint) &&
        isString(config.realm) &&
        isString(config.lpGovernance) &&
        isString(config.lpMint) &&
        isString(config.delegateMintGovernance) &&
        isString(config.delegateTokenMint) &&
        isNumber(config.amount)
    );

}