import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client setup strictly following @google/genai skill guidelines
const apiKey = process.env.GEMINI_API_KEY || '';
let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// In-memory + file-backed persistent session log store (transparent spreadsheet records)
const DATA_FILE = path.resolve(process.cwd(), 'data_records_store.json');

interface FinancialRecord {
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

let persistentRecords: FinancialRecord[] = [];

// Load records if file exists
try {
  if (fs.existsSync(DATA_FILE)) {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    persistentRecords = JSON.parse(raw);
  } else {
    // Seed initial records for instant BFSI demonstration
    persistentRecords = [
      {
        id: 'rec-101',
        timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        applicantName: 'Vikram Mehta',
        type: 'loan_check',
        category: 'Home Loan',
        monthlyIncome: 8500,
        existingEmis: 1200,
        creditScore: 785,
        requestedAmount: 350000,
        eligibleAmount: 420000,
        foirPercent: 38.5,
        dtiPercent: 14.1,
        approvalProbability: 94,
        riskRating: 'Prime',
        estimatedInterestRate: 6.85,
        monthlyEmi: 2294,
        keyInsights: [
          'Excellent credit score above 780 qualifies for prime benchmark pricing',
          'FOIR well within conservative 50% banking boundary',
          'Eligible for 100% of requested capital with fast-track underwriting'
        ],
        aiReasoning: 'Applicant Vikram displays exceptional debt-to-income balance. Credit utilization is historically below 18%. Low FOIR allows aggressive approval with preferred lending spreads.'
      },
      {
        id: 'rec-102',
        timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
        applicantName: 'Ananya Sharma',
        type: 'credit_analysis',
        category: 'Credit Health & CIBIL Check',
        monthlyIncome: 4500,
        existingEmis: 1450,
        creditScore: 670,
        requestedAmount: 25000,
        eligibleAmount: 18000,
        foirPercent: 44.2,
        dtiPercent: 32.2,
        approvalProbability: 68,
        riskRating: 'Near-Prime',
        estimatedInterestRate: 11.5,
        monthlyEmi: 615,
        keyInsights: [
          'Credit utilization is currently at 42% on revolving credit cards',
          'Zero 30+ day delinquency in the past 24 months',
          'Reducing credit card balances below 30% will jump score by +35 points'
        ],
        aiReasoning: 'Applicant qualifies for conditional near-prime personal loan. Interest rate adjusted upward by 200 bps to accommodate elevated credit utilization.'
      }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(persistentRecords, null, 2));
  }
} catch (err) {
  console.error('Failed to load persistent records:', err);
}

function saveRecordsToFile() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(persistentRecords, null, 2));
  } catch (err) {
    console.error('Error saving records:', err);
  }
}

// ======================== API ROUTES ========================

// 1. Get all stored records (Google Sheets persistent view)
app.get('/api/records', (req, res) => {
  res.json({ success: true, count: persistentRecords.length, records: persistentRecords });
});

// 2. Add or update record
app.post('/api/records', (req, res) => {
  const newRec: FinancialRecord = {
    ...req.body,
    id: req.body.id || `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: req.body.timestamp || new Date().toISOString(),
  };
  persistentRecords.unshift(newRec);
  saveRecordsToFile();
  res.json({ success: true, record: newRec });
});

// 3. Clear or reset records
app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  persistentRecords = persistentRecords.filter(r => r.id !== id);
  saveRecordsToFile();
  res.json({ success: true });
});

// 4. AI Loan Eligibility Underwriting Engine
app.post('/api/ai/loan-eligibility', async (req, res) => {
  try {
    const {
      applicantName = 'Applicant',
      monthlyIncome = 5000,
      existingEmis = 800,
      requestedAmount = 100000,
      tenureYears = 5,
      loanType = 'Personal Loan',
      creditScore = 720,
      employmentType = 'Salaried',
      workExperienceYears = 4,
      existingObligations = 0,
    } = req.body;

    const income = Number(monthlyIncome) || 5000;
    const currentDebt = (Number(existingEmis) || 0) + (Number(existingObligations) || 0);
    const score = Number(creditScore) || 700;
    const amount = Number(requestedAmount) || 50000;
    const tenure = Number(tenureYears) || 5;

    // Standard BFSI FOIR Benchmark: usually 40% to 65% depending on income bracket
    let maxFoirRatio = 0.50;
    if (income >= 10000) maxFoirRatio = 0.60;
    else if (income < 3000) maxFoirRatio = 0.40;

    const maxAllowableMonthlyObligation = income * maxFoirRatio;
    const availableMonthlyEmiCapacity = Math.max(0, maxAllowableMonthlyObligation - currentDebt);

    // Baseline estimated interest rate according to credit score & loan type
    let baseRate = 8.5;
    if (loanType === 'Home Loan') baseRate = 7.2;
    else if (loanType === 'Auto Loan') baseRate = 8.0;
    else if (loanType === 'Business Loan') baseRate = 10.5;
    else if (loanType === 'Education Loan') baseRate = 8.8;

    // Credit score adjustments
    if (score >= 780) baseRate -= 0.6;
    else if (score >= 740) baseRate -= 0.2;
    else if (score >= 680) baseRate += 0.8;
    else if (score >= 620) baseRate += 2.0;
    else baseRate += 3.8;

    // Approximate Max Loan Calculation using present value formula
    const monthlyRate = (baseRate / 100) / 12;
    const totalMonths = tenure * 12;
    const maxEligibleLoan = availableMonthlyEmiCapacity > 0
      ? Math.round(availableMonthlyEmiCapacity * ((1 - Math.pow(1 + monthlyRate, -totalMonths)) / monthlyRate))
      : 0;

    // Requested EMI
    const requestedMonthlyEmi = Math.round(
      (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1)
    );

    const resultingFoir = Math.round(((currentDebt + requestedMonthlyEmi) / income) * 1000) / 10;
    const currentDti = Math.round((currentDebt / income) * 1000) / 10;

    let approvalScore = 50;
    if (score >= 750) approvalScore += 25;
    else if (score >= 700) approvalScore += 15;
    else if (score < 630) approvalScore -= 20;

    if (resultingFoir <= 40) approvalScore += 20;
    else if (resultingFoir <= 50) approvalScore += 10;
    else if (resultingFoir > 65) approvalScore -= 30;

    if (employmentType === 'Salaried' && workExperienceYears >= 3) approvalScore += 5;
    approvalScore = Math.max(5, Math.min(98, approvalScore));

    let riskRating: 'Prime' | 'Near-Prime' | 'Sub-Prime' | 'High Risk' = 'Prime';
    if (approvalScore >= 80) riskRating = 'Prime';
    else if (approvalScore >= 65) riskRating = 'Near-Prime';
    else if (approvalScore >= 45) riskRating = 'Sub-Prime';
    else riskRating = 'High Risk';

    let aiReasoning = '';
    let recommendations: string[] = [];
    let bankComparison: any[] = [];

    // Call Gemini API if available
    if (aiClient) {
      try {
        const prompt = `You are the Lead Underwriting Officer and BFSI Financial Expert.
Analyze this loan eligibility check:
- Applicant: ${applicantName} (${employmentType}, ${workExperienceYears} yrs experience)
- Monthly Income: $${income}
- Existing Monthly Obligations: $${currentDebt} (Current DTI: ${currentDti}%)
- Credit Score: ${score}
- Requested Loan: $${amount} (${loanType} for ${tenure} years)
- Calculated Resulting FOIR: ${resultingFoir}%
- Max Eligible Loan calculated: $${maxEligibleLoan}
- Estimated Rate: ${baseRate.toFixed(2)}%
- Approval Probability: ${approvalScore}% (${riskRating})

Return a JSON response with:
{
  "underwriterSummary": "A razor-sharp 2-3 sentence financial assessment",
  "approvalDecision": "Approved" | "Conditionally Approved" | "Refer / High Risk",
  "strengths": ["string", "string"],
  "riskFactors": ["string", "string"],
  "actionableSteps": ["string", "string", "string"],
  "bankOffers": [
    { "bank": "HDFC / Chase / SBI / Wells", "product": "string", "rate": "string", "maxLtv": "string", "verdict": "string" },
    { "bank": "string", "product": "string", "rate": "string", "maxLtv": "string", "verdict": "string" },
    { "bank": "string", "product": "string", "rate": "string", "maxLtv": "string", "verdict": "string" }
  ]
}`;

        const geminiRes = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const parsed = JSON.parse(geminiRes.text || '{}');
        aiReasoning = parsed.underwriterSummary || '';
        recommendations = parsed.actionableSteps || [];
        bankComparison = parsed.bankOffers || [];
      } catch (geminiErr) {
        console.warn('Gemini loan analysis fallback triggered:', geminiErr);
      }
    }

    if (!aiReasoning) {
      aiReasoning = `Based on a debt-to-income ratio of ${currentDti}% and a credit score of ${score}, applicant ${applicantName} exhibits ${riskRating.toLowerCase()} underwriting criteria. Monthly capacity of $${availableMonthlyEmiCapacity.toFixed(0)} supports a maximum loan threshold of $${maxEligibleLoan.toLocaleString()}.`;
      recommendations = [
        resultingFoir > 50
          ? 'Consider adding a co-applicant or extending tenure to lower monthly FOIR obligation below 50%.'
          : 'Maintain current revolving credit balance below 30% of card limits to protect prime pricing.',
        'Keep emergency funds liquid for at least 6 months of EMIs prior to formal loan disbursement.',
        'Avoid opening new lines of credit during the 90 days before final bank verification.'
      ];
      bankComparison = [
        { bank: 'Standard Chartered / Chase', product: 'Premier ' + loanType, rate: `${baseRate.toFixed(2)}%`, maxLtv: '85%', verdict: 'Strong match' },
        { bank: 'HDFC Bank / Wells Fargo', product: 'Flexi-Repay ' + loanType, rate: `${(baseRate + 0.35).toFixed(2)}%`, maxLtv: '90%', verdict: 'Instant pre-approval' },
        { bank: 'SBI / Bank of America', product: 'Advantage ' + loanType, rate: `${(baseRate - 0.2).toFixed(2)}%`, maxLtv: '80%', verdict: 'Lowest interest tier' },
      ];
    }

    const resultPayload = {
      applicantName,
      monthlyIncome: income,
      existingEmis: currentDebt,
      creditScore: score,
      requestedAmount: amount,
      tenureYears: tenure,
      loanType,
      maxEligibleLoan,
      requestedMonthlyEmi,
      availableMonthlyCapacity: Math.round(availableMonthlyEmiCapacity),
      resultingFoir,
      currentDti,
      baseInterestRate: Number(baseRate.toFixed(2)),
      approvalProbability: approvalScore,
      riskRating,
      aiReasoning,
      recommendations,
      bankComparison,
    };

    res.json({ success: true, ...resultPayload });
  } catch (error: any) {
    console.error('Error in loan eligibility:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// 5. AI Credit Score Deep Analyzer
app.post('/api/ai/credit-score', async (req, res) => {
  try {
    const {
      creditScore = 715,
      bureau = 'CIBIL / Experian',
      onTimePaymentPercent = 98,
      creditCardUtilization = 34,
      oldestAccountYears = 5,
      totalActiveAccounts = 4,
      hardInquiriesLast6Months = 2,
    } = req.body;

    const score = Number(creditScore) || 710;
    let tier = 'Good';
    let tierColor = 'emerald';
    if (score >= 790) { tier = 'Exceptional'; tierColor = 'emerald'; }
    else if (score >= 740) { tier = 'Very Good'; tierColor = 'teal'; }
    else if (score >= 670) { tier = 'Good'; tierColor = 'cyan'; }
    else if (score >= 580) { tier = 'Fair'; tierColor = 'amber'; }
    else { tier = 'Needs Work / Subprime'; tierColor = 'rose'; }

    let analysis: any = null;

    if (aiClient) {
      try {
        const prompt = `You are a certified BFSI Credit Score Strategist & Underwriter.
Analyze this credit profile:
- Score: ${score} (${bureau}) - Tier: ${tier}
- On-Time Payment History: ${onTimePaymentPercent}% (Weight: 35%)
- Credit Utilization Ratio: ${creditCardUtilization}% (Weight: 30%)
- Credit History Age: ${oldestAccountYears} years (Weight: 15%)
- Active Credit Accounts: ${totalActiveAccounts} (Weight: 10%)
- Hard Inquiries in past 6 months: ${hardInquiriesLast6Months} (Weight: 10%)

Return JSON:
{
  "executiveSummary": "2-3 crisp sentences detailing credit health and bank borrowing viability",
  "factors": [
    { "name": "Payment History", "weight": "35%", "status": "Excellent|Good|Warning|Danger", "impactScore": 95, "detail": "string" },
    { "name": "Credit Card Utilization", "weight": "30%", "status": "string", "impactScore": 75, "detail": "string" },
    { "name": "Credit Age & Vintage", "weight": "15%", "status": "string", "impactScore": 80, "detail": "string" },
    { "name": "Credit Mix", "weight": "10%", "status": "string", "impactScore": 85, "detail": "string" },
    { "name": "Hard Inquiries", "weight": "10%", "status": "string", "impactScore": 70, "detail": "string" }
  ],
  "potentialScoreGain": 45,
  "roadmap30Days": ["string", "string"],
  "roadmap90Days": ["string", "string"],
  "lenderPerception": "string"
}`;

        const geminiRes = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        analysis = JSON.parse(geminiRes.text || '{}');
      } catch (err) {
        console.warn('Gemini credit score fallback:', err);
      }
    }

    if (!analysis) {
      analysis = {
        executiveSummary: `Your credit score of ${score} puts you firmly in the ${tier} bracket. Prime institutional lenders consider this a dependable profile, though optimizing your ${creditCardUtilization}% utilization will yield substantial interest savings.`,
        factors: [
          { name: 'Payment History', weight: '35%', status: onTimePaymentPercent >= 99 ? 'Excellent' : 'Good', impactScore: onTimePaymentPercent, detail: `${onTimePaymentPercent}% on-time payments logged across all trade lines.` },
          { name: 'Credit Utilization', weight: '30%', status: creditCardUtilization <= 30 ? 'Excellent' : 'Warning', impactScore: Math.max(20, 100 - creditCardUtilization), detail: `Current utilization is ${creditCardUtilization}%. Ideal threshold is under 30%.` },
          { name: 'Credit Age', weight: '15%', status: oldestAccountYears >= 5 ? 'Good' : 'Fair', impactScore: Math.min(100, oldestAccountYears * 16), detail: `Oldest account is ${oldestAccountYears} years old, providing verified repayment history.` },
          { name: 'Credit Mix', weight: '10%', status: 'Good', impactScore: 80, detail: `${totalActiveAccounts} active accounts combining revolving cards and installment loans.` },
          { name: 'Recent Inquiries', weight: '10%', status: hardInquiriesLast6Months <= 2 ? 'Good' : 'Warning', impactScore: Math.max(30, 100 - hardInquiriesLast6Months * 20), detail: `${hardInquiriesLast6Months} inquiries recorded over the last 6 months.` },
        ],
        potentialScoreGain: creditCardUtilization > 30 ? 35 : 20,
        roadmap30Days: [
          'Pay down revolving credit card balances to bring utilization under 28%.',
          'Ensure all automated standing instructions (NACH / autopay) are active 3 days prior to due dates.'
        ],
        roadmap90Days: [
          'Request a credit limit increase on your oldest credit card without taking on new debt.',
          'Pause hard inquiry applications across credit cards or quick unsecured apps.'
        ],
        lenderPerception: 'Approved for most Tier-1 bank products with standard to preferred interest spreads.'
      };
    }

    res.json({ success: true, score, tier, tierColor, ...analysis });
  } catch (error: any) {
    console.error('Error analyzing credit score:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. AI Financial Strategies & Tips Engine
app.post('/api/ai/financial-tips', async (req, res) => {
  try {
    const {
      monthlyIncome = 6000,
      monthlyExpenses = 3200,
      totalDebt = 45000,
      savingsTarget = 20000,
      primaryGoal = 'Get Loan Ready',
      riskAppetite = 'Balanced',
    } = req.body;

    let tips: any = null;

    if (aiClient) {
      try {
        const prompt = `You are Yash, Lead BFSI Financial Advisor and Wealth Strategist.
Create a hyper-tailored personal financial strategy for an applicant with:
- Monthly Income: $${monthlyIncome}
- Monthly Fixed Expenses: $${monthlyExpenses} (Net Discretionary Surplus: $${monthlyIncome - monthlyExpenses})
- Outstanding Liabilities: $${totalDebt}
- Primary Financial Objective: ${primaryGoal}
- Risk Profile: ${riskAppetite}

Return JSON:
{
  "financialHealthScore": 78,
  "budgetAllocation": {
    "needsPercent": 50,
    "wantsPercent": 30,
    "savingsAndDebtPercent": 20
  },
  "coreStrategies": [
    {
      "title": "string",
      "category": "Debt Optimization | Tax Saving | Liquidity & Emergency | Wealth Acceleration",
      "impact": "High | Medium",
      "description": "string",
      "projectedAnnualSavings": "string"
    },
    {
      "title": "string",
      "category": "string",
      "impact": "string",
      "description": "string",
      "projectedAnnualSavings": "string"
    },
    {
      "title": "string",
      "category": "string",
      "impact": "string",
      "description": "string",
      "projectedAnnualSavings": "string"
    },
    {
      "title": "string",
      "category": "string",
      "impact": "string",
      "description": "string",
      "projectedAnnualSavings": "string"
    }
  ],
  "debtPayoffTechnique": {
    "recommended": "Debt Avalanche" | "Debt Snowball",
    "rationale": "string",
    "timelineMonths": 24
  },
  "yashTakeaway": "A motivating, high-conviction piece of advice directly from advisor Yash"
}`;

        const geminiRes = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        tips = JSON.parse(geminiRes.text || '{}');
      } catch (err) {
        console.warn('Gemini tips fallback:', err);
      }
    }

    if (!tips) {
      const surplus = monthlyIncome - monthlyExpenses;
      tips = {
        financialHealthScore: surplus > 1000 ? 82 : 65,
        budgetAllocation: { needsPercent: 50, wantsPercent: 28, savingsAndDebtPercent: 22 },
        coreStrategies: [
          {
            title: 'Refinance High-Interest Unsecured Lines',
            category: 'Debt Optimization',
            impact: 'High',
            description: 'Consolidate multiple high-APR credit cards into a single personal term loan at 10.5%, immediately dropping monthly cash outflow.',
            projectedAnnualSavings: '$1,850/yr'
          },
          {
            title: 'Build 4-Month Liquid Emergency Buffer',
            category: 'Liquidity & Emergency',
            impact: 'High',
            description: `Allocate $${Math.round(surplus * 0.4)}/month into high-yield liquid instruments so an unexpected shock never triggers missed loan EMIs.`,
            projectedAnnualSavings: 'Risk Mitigation'
          },
          {
            title: 'Prepayment Multiplier for Long-Term Mortgages',
            category: 'Debt Optimization',
            impact: 'High',
            description: 'Paying just 1 extra EMI every calendar year reduces a 25-year loan amortization tenure by roughly 4.5 years.',
            projectedAnnualSavings: '$12,400 interest saved'
          },
          {
            title: 'Maximize Pre-Tax Retirement & Insurance Deductions',
            category: 'Tax Saving',
            impact: 'Medium',
            description: 'Optimize Section 80C / 401(k) / IRA contributions to reduce taxable gross income, increasing net take-home cash flow.',
            projectedAnnualSavings: '$1,200/yr'
          }
        ],
        debtPayoffTechnique: {
          recommended: 'Debt Avalanche',
          rationale: 'Mathematically saves the highest quantum of compound interest by aggressively clearing highest-APR lines first.',
          timelineMonths: 28
        },
        yashTakeaway: `You currently generate $${surplus} in monthly surplus. By directing 60% of that into targeted loan amortization, your debt-free horizon will accelerate by over 3 years.`
      };
    }

    res.json({ success: true, ...tips });
  } catch (error: any) {
    console.error('Error generating financial tips:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Bot Yash - Interactive AI Financial Specialist & Advisor
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [], currentContext = {} } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let botResponse = '';

    if (aiClient) {
      try {
        const systemPrompt = `You are "Yash", the friendly, highly experienced Senior BFSI (Banking, Financial Services, and Insurance) Financial Advisor and Underwriting Specialist.
Your mission is to guide users through loan eligibility, credit score improvement (CIBIL/Experian/FICO), FOIR calculation, EMI optimization, bank product selection, and smart personal debt management.

Tone: Warm, authoritative yet accessible, sharp with financial calculations, ethical, and encouraging.
Formatting: Use clear bullet points, bold key figures, and practical step-by-step advice.

Active User Context (if available):
- Name: ${currentContext.applicantName || 'Applicant'}
- Monthly Income: ${currentContext.monthlyIncome ? '$' + currentContext.monthlyIncome : 'Not specified'}
- Existing EMIs: ${currentContext.existingEmis ? '$' + currentContext.existingEmis : 'Not specified'}
- Credit Score: ${currentContext.creditScore || 'Not specified'}
- Loan Category: ${currentContext.loanType || 'General loan'}
- Requested Loan: ${currentContext.requestedAmount ? '$' + currentContext.requestedAmount : 'Not specified'}

If the user asks questions like:
- "Will I get approved with 680 credit score?"
- "How can I reduce my FOIR from 55% to 40%?"
- "Should I prepay my loan or invest in mutual funds / stocks?"
- "Explain difference between Flat vs Reducing interest rate"
- "What happens if I miss an EMI?"
Provide detailed, mathematically sound, banking-grade explanations. Always sign off naturally as Yash.`;

        // Format conversation
        const contents: any[] = [];
        if (Array.isArray(conversationHistory) && conversationHistory.length > 0) {
          conversationHistory.slice(-8).forEach((item: any) => {
            contents.push({
              role: item.sender === 'user' ? 'user' : 'model',
              parts: [{ text: item.text }],
            });
          });
        }
        contents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const geminiRes = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
          },
        });

        botResponse = geminiRes.text || '';
      } catch (err) {
        console.warn('Bot Yash gemini chat fallback:', err);
      }
    }

    if (!botResponse) {
      botResponse = `Hello! I'm **Yash**, your BFSI Advisor. Regarding your question: "${message}"\n\nIn standard institutional banking, credit health and debt-to-income (FOIR) ratios dictate over 85% of underwriting approvals. Keeping your credit utilization below 30% and maintaining an emergency reserve of at least 6 monthly EMIs are the most proven steps to ensure prime interest rates. Feel free to run our **Loan Eligibility Checker** or **Credit Score Analyzer** above for instant mathematical modeling!`;
    }

    res.json({
      success: true,
      reply: botResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in Bot Yash chat:', error);
    res.status(500).json({ error: error.message });
  }
});

// 8. AI Loan Comparison & Scenario Engine
app.post('/api/ai/compare-loans', async (req, res) => {
  try {
    const { loanA, loanB, borrowerIncome = 7500 } = req.body;

    const calcDetails = (loan: any) => {
      const p = Number(loan.principal) || 100000;
      const r = Number(loan.rate) || 8.0;
      const t = Number(loan.tenureYears) || 15;
      const totalMonths = t * 12;
      const monthlyRate = (r / 100) / 12;
      const factor = Math.pow(1 + monthlyRate, totalMonths);
      const emi = Math.round((p * monthlyRate * factor) / (factor - 1));
      const totalPayment = emi * totalMonths;
      const totalInterest = totalPayment - p;
      const feePercent = Number(loan.processingFeePercent) || 0;
      const feeFlat = Number(loan.feeFlat) || 0;
      const totalFees = Math.round((p * (feePercent / 100)) + feeFlat);
      const netLifetimeCost = totalPayment + totalFees;

      return {
        label: loan.label || 'Loan Scenario',
        principal: p,
        rate: r,
        tenureYears: t,
        totalMonths,
        monthlyEmi: emi,
        totalInterest,
        totalFees,
        totalPayment,
        netLifetimeCost,
      };
    };

    const detailsA = calcDetails(loanA);
    const detailsB = calcDetails(loanB);

    const monthlyDifference = Math.abs(detailsA.monthlyEmi - detailsB.monthlyEmi);
    const interestDifference = Math.abs(detailsA.totalInterest - detailsB.totalInterest);
    const lifetimeCostDifference = Math.abs(detailsA.netLifetimeCost - detailsB.netLifetimeCost);

    let aiAnalysis: any = null;

    if (aiClient) {
      try {
        const prompt = `You are Yash, Lead BFSI Underwriting Specialist.
Compare these two loan options side-by-side for a borrower earning $${borrowerIncome}/month:

Option A ("${detailsA.label}"):
- Principal: $${detailsA.principal}
- Interest Rate: ${detailsA.rate}% APR
- Tenure: ${detailsA.tenureYears} Years (${detailsA.totalMonths} months)
- Monthly EMI: $${detailsA.monthlyEmi}
- Total Interest: $${detailsA.totalInterest}
- Processing Fees: $${detailsA.totalFees}
- Total Lifetime Cost: $${detailsA.netLifetimeCost}

Option B ("${detailsB.label}"):
- Principal: $${detailsB.principal}
- Interest Rate: ${detailsB.rate}% APR
- Tenure: ${detailsB.tenureYears} Years (${detailsB.totalMonths} months)
- Monthly EMI: $${detailsB.monthlyEmi}
- Total Interest: $${detailsB.totalInterest}
- Processing Fees: $${detailsB.totalFees}
- Total Lifetime Cost: $${detailsB.netLifetimeCost}

Mathematical Differences:
- Monthly Outflow Delta: $${monthlyDifference}/mo
- Total Interest Savings Delta: $${interestDifference}
- Net Lifetime Cost Delta: $${lifetimeCostDifference}

Return a valid JSON response:
{
  "winner": "loanA" | "loanB" | "situational",
  "headline": "A crisp, compelling executive summary sentence",
  "breakEvenAnalysis": "Short sentence explaining when Option B breaks even or how duration impacts cost",
  "prosA": ["string", "string"],
  "consA": ["string", "string"],
  "prosB": ["string", "string"],
  "consB": ["string", "string"],
  "cashFlowAdvice": "Recommendation for borrowers prioritizing low monthly commitment",
  "wealthMaximizerAdvice": "Recommendation for borrowers wanting to save maximum interest",
  "yashTakeaway": "A frank, sharp, 1-2 sentence final verdict from advisor Yash"
}`;

        const geminiRes = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        aiAnalysis = JSON.parse(geminiRes.text || '{}');
      } catch (err) {
        console.warn('Gemini loan comparison fallback:', err);
      }
    }

    if (!aiAnalysis) {
      const lowerInterestOption = detailsA.totalInterest < detailsB.totalInterest ? 'loanA' : 'loanB';
      const lowerEmiOption = detailsA.monthlyEmi < detailsB.monthlyEmi ? 'loanA' : 'loanB';

      aiAnalysis = {
        winner: detailsA.netLifetimeCost < detailsB.netLifetimeCost ? 'loanA' : 'loanB',
        headline: `${detailsA.totalInterest < detailsB.totalInterest ? detailsA.label : detailsB.label} saves $${interestDifference.toLocaleString()} in lifetime compound interest, but carries $${monthlyDifference.toLocaleString()}/mo difference in monthly cash outflow.`,
        breakEvenAnalysis: `Borrowers saving $${monthlyDifference}/month in cash flow pay a premium of $${interestDifference.toLocaleString()} in additional compound interest over the extra tenure years.`,
        prosA: [
          `Monthly payment is $${detailsA.monthlyEmi.toLocaleString()}`,
          `Total interest capped at $${detailsA.totalInterest.toLocaleString()}`
        ],
        consA: [
          detailsA.monthlyEmi > detailsB.monthlyEmi ? `Requires $${monthlyDifference}/mo higher monthly cash commitment` : 'Extended amortization timeline'
        ],
        prosB: [
          `Monthly payment is $${detailsB.monthlyEmi.toLocaleString()}`,
          `Total interest of $${detailsB.totalInterest.toLocaleString()}`
        ],
        consB: [
          detailsB.totalInterest > detailsA.totalInterest ? `Higher total interest burden by $${interestDifference.toLocaleString()}` : 'Higher monthly outflow'
        ],
        cashFlowAdvice: `${lowerEmiOption === 'loanA' ? detailsA.label : detailsB.label} preserves monthly liquidity and protects lower debt-to-income (FOIR) margins.`,
        wealthMaximizerAdvice: `${lowerInterestOption === 'loanA' ? detailsA.label : detailsB.label} builds equity fastest and eliminates borrowing liability years sooner.`,
        yashTakeaway: `If your monthly budget accommodates the higher EMI comfortably (FOIR < 45%), choose the shorter tenure or lower APR to bank $${interestDifference.toLocaleString()} in interest savings.`
      };
    }

    res.json({
      success: true,
      loanA: detailsA,
      loanB: detailsB,
      monthlyDifference,
      interestDifference,
      lifetimeCostDifference,
      analysis: aiAnalysis,
    });
  } catch (error: any) {
    console.error('Error in loan comparison:', error);
    res.status(500).json({ error: error.message || 'Loan comparison failed' });
  }
});

// 9. AI Loan Repayment & Surplus Acceleration Engine
app.post('/api/ai/repayment-plan', async (req, res) => {
  try {
    const {
      outstandingBalance = 200000,
      interestRate = 7.5,
      currentEmi = 1850,
      remainingMonths = 240,
      monthlySurplus = 800,
      prepaymentAmount = 500,
      annualLumpSum = 0,
      monthsSaved = 96,
      interestSaved = 58000,
    } = req.body;

    let aiAdvice: any = null;

    if (aiClient) {
      try {
        const prompt = `You are Yash, Lead BFSI Financial Underwriter and Wealth Strategist.
A borrower wants to accelerate their loan repayment using their monthly surplus:
- Outstanding Principal Balance: $${outstandingBalance}
- Interest Rate: ${interestRate}% APR
- Base Monthly EMI: $${currentEmi} (${Math.round(remainingMonths / 12)} years remaining)
- Total Monthly Surplus: $${monthlySurplus}
- Allocated Extra Prepayment: $${prepaymentAmount}/month
- Annual Lump Sum: $${annualLumpSum}/year
- Resulting Acceleration: Slashes ${monthsSaved} months (${(monthsSaved / 12).toFixed(1)} years) off the loan
- Guaranteed Compound Interest Saved: $${interestSaved}

Return a valid JSON object:
{
  "executiveSummary": "2 crisp sentences summarizing the power of this prepayment acceleration",
  "effectiveReturnOnInvestment": "Explanation of how saving ${interestRate}% risk-free compound interest compares to equities/bonds",
  "arbitrageVerdict": "Prepay Loan vs. Invest Surplus recommendation",
  "prepaymentTactics": [
    "string",
    "string",
    "string"
  ],
  "cautionaryNote": "Advice regarding maintaining liquid emergency buffer or checking floating vs fixed prepayment penalty clauses",
  "yashTakeaway": "An encouraging, high-impact concluding piece of advice directly from advisor Yash"
}`;

        const geminiRes = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        aiAdvice = JSON.parse(geminiRes.text || '{}');
      } catch (err) {
        console.warn('Gemini repayment advice fallback:', err);
      }
    }

    if (!aiAdvice) {
      aiAdvice = {
        executiveSummary: `By redirecting $${prepaymentAmount}/month into principal amortization, you eliminate ${Math.floor(monthsSaved / 12)} years and ${monthsSaved % 12} months of repayment and pocket $${interestSaved.toLocaleString()} in interest savings.`,
        effectiveReturnOnInvestment: `A guaranteed, risk-free, tax-exempt return equivalent to ${interestRate}% compound yield—beating high-grade debt and conservative fixed deposits.`,
        arbitrageVerdict: `Because your loan rate is ${interestRate}%, prepaying yields an immediate guaranteed return. If market index funds average 10-12%, a 70/30 split between prepayment and index SIP captures both certainty and wealth growth.`,
        prepaymentTactics: [
          'Request your lender to apply prepayments directly against principal reduction rather than advancing installment dates.',
          'Schedule extra monthly automated transfers on the day after salary credit to remove behavioral spending friction.',
          'Apply 50% of annual bonuses or tax refunds as periodic lump-sum principal paydowns.'
        ],
        cautionaryNote: 'Ensure you retain a minimum 4-6 month emergency reserve in high-yield liquid savings before aggressively accelerating loan prepayments.',
        yashTakeaway: `Eliminating debt years ahead of schedule not only saves $${interestSaved.toLocaleString()}, but permanently unlocks $${currentEmi}/month in future cash flow for retirement wealth creation.`
      };
    }

    res.json({ success: true, advice: aiAdvice });
  } catch (error: any) {
    console.error('Error generating repayment plan:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mount Vite or serve static assets
async function startServer() {
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Loan Eligibility Platform listening on port ${PORT}`);
  });
}

startServer();
