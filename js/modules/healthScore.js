/* ===================================================
   FinOS - Financial Health Score Algorithm Engine
   Calculates 0-100 score based on 6 core pillars:
   1. Savings Ratio (25 pts)
   2. Debt-to-Income Ratio (25 pts)
   3. Emergency Fund Ratio (20 pts)
   4. Budget Discipline (15 pts)
   5. Subscription Health (10 pts)
   6. Bill Payment Reliability (5 pts)
   =================================================== */

export function calculateFinancialHealthScore(profile, transactions, subscriptions, budgets) {
  const income = parseFloat(profile.monthly_income) || 0;
  const rent = parseFloat(profile.monthly_rent) || 0;
  const emi = parseFloat(profile.monthly_emi) || 0;

  if (income === 0 && transactions.length === 0) {
    return {
      score: 0,
      statusText: 'No Data',
      statusColor: 'var(--text-muted)',
      recommendations: ['Complete your profile income details and log transactions to calculate your Financial Health Score.']
    };
  }
  
  // 1. Savings Ratio Score (Target: 20%+ of income saved)
  const savingsGoal = parseFloat(profile.monthly_savings) || 0;
  const savingsPercent = income > 0 ? (savingsGoal / income) * 100 : 0;
  let savingsRatioScore = Math.min(25, Math.round((savingsPercent / 20) * 25));

  // 2. Debt & Rent Ratio Score (Ideal: Debt + Rent <= 45% of income)
  const fixedObligations = rent + emi;
  const debtRatioPercent = income > 0 ? (fixedObligations / income) * 100 : 0;
  let debtRatioScore = 25;
  if (debtRatioPercent > 70) debtRatioScore = 5;
  else if (debtRatioPercent > 55) debtRatioScore = 12;
  else if (debtRatioPercent > 45) debtRatioScore = 18;

  // 3. Emergency Fund Coverage (Target: 3 months of fixed expenses)
  const monthlyEssentialExpense = rent + emi + 10000;
  const targetEmergency = monthlyEssentialExpense * 3;
  const currentEmergencySavings = savingsGoal * 3;
  const emergencyRatio = targetEmergency > 0 ? Math.min(1, currentEmergencySavings / targetEmergency) : 0;
  let emergencyFundScore = Math.round(emergencyRatio * 20);

  // 4. Budget Discipline
  let totalAllocated = 0;
  let totalSpent = 0;
  budgets.forEach(b => {
    totalAllocated += parseFloat(b.allocated_amount || 0);
  });
  transactions.filter(t => t.type === 'expense').forEach(t => {
    totalSpent += parseFloat(t.amount || 0);
  });

  let budgetDisciplineScore = 15;
  if (totalAllocated > 0 && totalSpent > totalAllocated) {
    const overspendRatio = (totalSpent - totalAllocated) / totalAllocated;
    budgetDisciplineScore = Math.max(2, Math.round(15 * (1 - overspendRatio)));
  }

  // 5. Subscription Health (Flag unused subscriptions)
  const totalSubsCost = subscriptions.reduce((sum, s) => sum + parseFloat(s.monthly_cost || 0), 0);
  const unusedSubs = subscriptions.filter(s => !s.is_used_regularly);
  let subscriptionHealthScore = 10;
  if (unusedSubs.length > 0) subscriptionHealthScore -= (unusedSubs.length * 3);
  if (income > 0 && totalSubsCost > income * 0.08) subscriptionHealthScore -= 3;
  subscriptionHealthScore = Math.max(0, subscriptionHealthScore);

  // 6. Bill Payment Reliability
  let billPaymentScore = 5;

  const totalScore = Math.min(100, Math.max(0, savingsRatioScore + debtRatioScore + emergencyFundScore + budgetDisciplineScore + subscriptionHealthScore + billPaymentScore));

  let statusText = 'Excellent';
  let statusColor = 'var(--success)';
  if (totalScore < 50) {
    statusText = 'Critical Risk';
    statusColor = 'var(--danger)';
  } else if (totalScore < 75) {
    statusText = 'Fair / Moderate';
    statusColor = 'var(--warning)';
  }

  return {
    score: totalScore,
    statusText,
    statusColor,
    recommendations: generateHealthRecommendations(totalScore, debtRatioPercent, unusedSubs, savingsPercent)
  };
}

function generateHealthRecommendations(score, debtRatioPercent, unusedSubs, savingsPercent) {
  const recs = [];
  if (debtRatioPercent > 45) {
    recs.push('⚠️ Fixed obligations (Rent + EMI) consume ' + debtRatioPercent.toFixed(1) + '% of your monthly income. Target keeping fixed costs below 40%.');
  }
  if (unusedSubs.length > 0) {
    recs.push('💡 Consider pausing unused subscriptions (' + unusedSubs.map(s => s.name).join(', ') + ') to save ₹' + unusedSubs.reduce((a,b)=>a+parseFloat(b.monthly_cost||0),0) + '/mo.');
  }
  if (savingsPercent < 15) {
    recs.push('🎯 Increase your monthly savings target to at least 20% of income to build a safety cushion.');
  }
  if (recs.length === 0) {
    recs.push('🌟 Financial metrics are well-balanced! Continue logging expenses and building your cushion.');
  }
  return recs;
}
