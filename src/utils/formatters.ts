import { Currency, CurrencyConfig, AmortizationRow, ApplicantProfile } from '../types';

export const CURRENCIES: Record<Currency, CurrencyConfig> = {
  USD: { code: 'USD', symbol: '$', label: 'USD ($)', locale: 'en-US' },
  INR: { code: 'INR', symbol: '₹', label: 'INR (₹)', locale: 'en-IN' },
  EUR: { code: 'EUR', symbol: '€', label: 'EUR (€)', locale: 'de-DE' },
  GBP: { code: 'GBP', symbol: '£', label: 'GBP (£)', locale: 'en-GB' },
};

export function formatCurrency(amount: number, currency: Currency = 'USD', compact = false): string {
  const config = CURRENCIES[currency] || CURRENCIES.USD;
  if (compact && Math.abs(amount) >= 100000) {
    if (currency === 'INR') {
      if (Math.abs(amount) >= 10000000) {
        return `${config.symbol}${(amount / 10000000).toFixed(2)} Cr`;
      }
      return `${config.symbol}${(amount / 100000).toFixed(2)} Lakh`;
    }
    if (Math.abs(amount) >= 1000000) {
      return `${config.symbol}${(amount / 1000000).toFixed(2)}M`;
    }
    return `${config.symbol}${(amount / 1000).toFixed(1)}k`;
  }
  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function calculateEmi(principal: number, annualRatePercent: number, tenureMonths: number): number {
  if (principal <= 0 || tenureMonths <= 0) return 0;
  if (annualRatePercent <= 0) return Math.round(principal / tenureMonths);

  const monthlyRate = (annualRatePercent / 100) / 12;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

export function generateAmortizationSchedule(
  principal: number,
  annualRatePercent: number,
  tenureYears: number,
  prepaymentMonthly: number = 0
): { schedule: AmortizationRow[]; totalInterest: number; totalPayment: number; monthsSaved: number; interestSaved: number } {
  const totalMonths = tenureYears * 12;
  const monthlyRate = (annualRatePercent / 100) / 12;
  const standardEmi = calculateEmi(principal, annualRatePercent, totalMonths);
  const actualMonthlyPayment = standardEmi + prepaymentMonthly;

  let balance = principal;
  let totalInterest = 0;
  let monthsElapsed = 0;
  const yearlyData: Record<number, { principal: number; interest: number; emi: number; closing: number; opening: number }> = {};

  for (let m = 1; m <= totalMonths; m++) {
    if (balance <= 0) break;
    monthsElapsed++;
    const currentYear = Math.ceil(m / 12);
    const interestPart = balance * monthlyRate;
    let principalPart = Math.min(balance, actualMonthlyPayment - interestPart);

    if (principalPart < 0) principalPart = 0;
    const paidThisMonth = principalPart + interestPart;
    const openingBal = balance;
    balance = Math.max(0, balance - principalPart);
    totalInterest += interestPart;

    if (!yearlyData[currentYear]) {
      yearlyData[currentYear] = {
        opening: openingBal,
        principal: 0,
        interest: 0,
        emi: 0,
        closing: balance,
      };
    }

    yearlyData[currentYear].principal += principalPart;
    yearlyData[currentYear].interest += interestPart;
    yearlyData[currentYear].emi += paidThisMonth;
    yearlyData[currentYear].closing = balance;
  }

  // Standard non-prepaid interest for comparison
  const standardTotalInterest = (standardEmi * totalMonths) - principal;
  const interestSaved = Math.max(0, Math.round(standardTotalInterest - totalInterest));
  const monthsSaved = Math.max(0, totalMonths - monthsElapsed);

  const schedule: AmortizationRow[] = Object.entries(yearlyData).map(([yearStr, val]) => ({
    year: Number(yearStr),
    openingBalance: Math.round(val.opening),
    emiPaid: Math.round(val.emi),
    principalPaid: Math.round(val.principal),
    interestPaid: Math.round(val.interest),
    closingBalance: Math.round(val.closing),
  }));

  return {
    schedule,
    totalInterest: Math.round(totalInterest),
    totalPayment: Math.round(principal + totalInterest),
    monthsSaved,
    interestSaved,
  };
}

export const PRESET_PROFILES: { label: string; icon: string; description: string; data: ApplicantProfile }[] = [
  {
    label: 'Corporate Tech Lead',
    icon: '💻',
    description: 'High income, low existing obligations, 785 credit score',
    data: {
      name: 'Rohan Deshmukh',
      monthlyIncome: 9500,
      existingEmis: 850,
      otherObligations: 200,
      creditScore: 785,
      loanType: 'Home Loan',
      requestedAmount: 450000,
      tenureYears: 20,
      employmentType: 'Salaried',
      workExperienceYears: 7,
      hasCoApplicant: false,
      coApplicantIncome: 0,
      coApplicantScore: 0,
    },
  },
  {
    label: 'Self-Employed Founder',
    icon: '🚀',
    description: 'Entrepreneur with active business line & multiple credit lines',
    data: {
      name: 'Priya Narang',
      monthlyIncome: 14000,
      existingEmis: 2800,
      otherObligations: 1200,
      creditScore: 710,
      loanType: 'Business Loan',
      requestedAmount: 250000,
      tenureYears: 5,
      employmentType: 'Self-Employed Professional',
      workExperienceYears: 6,
      hasCoApplicant: false,
      coApplicantIncome: 0,
      coApplicantScore: 0,
    },
  },
  {
    label: 'First-Time Homebuyer',
    icon: '🏡',
    description: 'Couple applying jointly with co-applicant income',
    data: {
      name: 'Amit & Neha Verma',
      monthlyIncome: 6500,
      existingEmis: 950,
      otherObligations: 300,
      creditScore: 740,
      loanType: 'Home Loan',
      requestedAmount: 320000,
      tenureYears: 25,
      employmentType: 'Salaried',
      workExperienceYears: 4,
      hasCoApplicant: true,
      coApplicantIncome: 4200,
      coApplicantScore: 755,
    },
  },
  {
    label: 'Early Career Professional',
    icon: '🎓',
    description: 'First auto loan, building initial credit profile',
    data: {
      name: 'Karan Joshi',
      monthlyIncome: 3800,
      existingEmis: 350,
      otherObligations: 150,
      creditScore: 660,
      loanType: 'Auto Loan',
      requestedAmount: 35000,
      tenureYears: 4,
      employmentType: 'Salaried',
      workExperienceYears: 2,
      hasCoApplicant: false,
      coApplicantIncome: 0,
      coApplicantScore: 0,
    },
  },
];
