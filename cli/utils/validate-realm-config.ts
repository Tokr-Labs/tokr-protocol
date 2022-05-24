import {isNumber, isString} from "underscore";

export const validateRealmConfig = (config: any) => {

    return !!(
        isString(config.cluster) &&
        isString(config.owner) &&
        isString(config.delegate) &&
        isString(config.name) &&
        isString(config.governanceProgramId) &&
        isString(config.usdcMint) &&
        isNumber(config.governance.voteThresholdPercentage) &&
        isNumber(config.governance.minCommunityTokensToCreateProposal) &&
        isNumber(config.governance.minInstructionHoldUpTime) &&
        isNumber(config.governance.maxVotingTime) &&
        isNumber(config.governance.voteTipping) &&
        isNumber(config.governance.proposalCoolOffTime) &&
        isNumber(config.governance.minCouncilTokensToCreateProposal)
    );

}