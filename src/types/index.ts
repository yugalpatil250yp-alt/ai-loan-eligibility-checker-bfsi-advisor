export type Currency = 'USD' | 'INR' | 'EUR' | 'GBP';

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  label: string;
  locale: string;
}

export type LoanType = 
  | 'Personal Loan'
  | 'Home Loan'
  | 'Auto Loan'
  | 'Business Loan'
  | 'Education Loan';

export type EmploymentType = 'Salaried' | 'Self-Employed Professional' | 'Business Owner' | 'Gig / Freelancer';

export interface ApplicantProfile {
  name: string;
  monthlyIncome: number;
  existingEmis: number;
  otherObligations: number;
  creditScore: number;
  loanType: LoanType;
  requestedAmount: number;
  tenureYears: number;
  employmentType: EmploymentType;
  workExperienceYears: number;
  hasCoApplicant: boolean;
  coApplicantIncome: number;
  coApplicantScore: number;
}

export interface BankOffer {
  bank: string;
  product: string;
  rate: string;
  maxLtv: string;
  verdict: string;
}

export interface LoanEligibilityResult {
  applicantName: string;
  monthlyIncome: number;
  existingEmis: number;
  creditScore: number;
  requestedAmount: number;
  tenureYears: number;
  loanType: LoanType;
  maxEligibleLoan: number;
  requestedMonthlyEmi: number;
  availableMonthlyCapacity: number;
  resultingFoir: number;
  currentDti: number;
  baseInterestRate: number;
  approvalProbability: number;
  riskRating: 'Prime' | 'Near-Prime' | 'Sub-Prime' | 'High Risk';
  aiReasoning: string;
  recommendations: string[];
  bankComparison: BankOffer[];
}

export interface CreditFactor {
  name: string;
  weight: string;
  status: 'Excellent' | 'Good' | 'Warning' | 'Danger';
  impactScore: number;
  detail: string;
}

export interface CreditAnalysisResult {
  score: number;
  tier: string;
  tierColor: string;
  executiveSummary: string;
  factors: CreditFactor[];
  potentialScoreGain: number;
  roadmap30Days: string[];
  roadmap90Days: string[];
  lenderPerception: string;
}

export interface AmortizationRow {
  year: number;
  openingBalance: number;
  emiPaid: number;
  principalPaid: number;
  interestPaid: number;
  closingBalance: number;
}

export interface FinancialRecord {
  id: string;
  timestamp: string;
  applicantName: string;
  type: 'loan_check' | 'credit_analysis' | 'emi_calc' | 'financial_plan';
  category: string;
  monthlyIncome: number;
  existingEmis: number;
  creditScore: number;
  requestedAmount?: number;
  eligibleAmount?: number;
  foirPercent?: number;
  dtiPercent?: number;
  approvalProbability?: number;
  riskRating: 'Prime' | 'Near-Prime' | 'Sub-Prime' | 'High Risk';
  estimatedInterestRate?: number;
  monthlyEmi?: number;
  keyInsights: string[];
  aiReasoning: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'yash';
  text: string;
  timestamp: string;
}
