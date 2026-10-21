import { AnalysisInput, Evidence } from './models';

export function emptyEvidence(): Evidence {
  return {
    source: null,
    basis: null,
    period: null,
    assessedOn: null,
    missingReason: null,
  };
}

export function emptyAnalysis(): AnalysisInput {
  return {
    title: 'Новый анализ',
    enterpriseName: null,
    region: null,
    activity: null,
    projectStartDate: null,
    financialPeriod: null,
    activitiesPeriod: null,
    forecastPeriod: null,
    totalRevenue: null,
    currency: 'RUB',
    accountingBasis: null,
    revenueEvidence: emptyEvidence(),
    remainderExplanation: null,
    nomenclatureComplete: false,
    completenessEvidence: emptyEvidence(),
    participants: [],
    enterpriseInn: null,
    familyConclusions: null,
    rankingConclusions: null,
    laborPeriod: null,
  };
}
