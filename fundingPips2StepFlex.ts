// Backward-compatible entrypoint.
// The FundingPips 2 Step Flex rules live in src/fundingPips2StepFlex.ts.
// Keeping a single source of truth prevents the dashboard, account detail,
// and evaluation engine from drifting apart.
export {
  FUNDING_PIPS_RULES,
  FUNDING_PIPS_FLEX_SIZES,
  getFundingPipsPhaseTarget,
  getFundingPipsMaxLossLimit,
  getFundingPipsProfitConcentrationLimit,
  getFundingPipsProfitableDayMinimum,
} from './src/fundingPips2StepFlex';
