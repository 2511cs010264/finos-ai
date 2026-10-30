/* ===================================================
   FinOS - Future Wallet 30/60/90 Day Cash Flow Engine
   =================================================== */

import { db } from '../apiClient.js';

let futureChart = null;

export async function renderFutureWallet() {
  const profile = await db.getProfile();
  const transactions = await db.getTransactions();
  const subscriptions = await db.getSubscriptions();

  const income = parseFloat(profile.monthly_income || 0);
  const rent = parseFloat(profile.monthly_rent || 0);
  const emi = parseFloat(profile.monthly_emi || 0);
  const subsCost = subscriptions.reduce((a, b) => a + parseFloat(b.monthly_cost || 0), 0);
  
  // Baseline estimated monthly expenditure (Rent + EMI + Subscriptions + 10,000 groceries/bills)
  const estimatedMonthlyExpense = rent + emi + subsCost + (income > 0 ? 10000 : 0);
  const netMonthlyCashflow = income - estimatedMonthlyExpense;

  const currentBalance = transactions.reduce((acc, t) => acc + (t.type === 'income' ? parseFloat(t.amount || 0) : -parseFloat(t.amount || 0)), 0);

  // 30 Days Prediction
  const exp30Balance = currentBalance + netMonthlyCashflow;
  const exp30Expense = estimatedMonthlyExpense;
  const exp30Savings = netMonthlyCashflow;

  // 60 Days Prediction
  const exp60Balance = currentBalance + (netMonthlyCashflow * 2);
  const exp60Expense = estimatedMonthlyExpense * 2;
  const exp60Savings = netMonthlyCashflow * 2;

  // 90 Days Prediction
  const exp90Balance = currentBalance + (netMonthlyCashflow * 3);
  const exp90Expense = estimatedMonthlyExpense * 3;
  const exp90Savings = netMonthlyCashflow * 3;

  // Update DOM Elements
  const bal30 = document.getElementById('fw-30-balance');
  const exp30 = document.getElementById('fw-30-expense');
  const sav30 = document.getElementById('fw-30-savings');

  const bal60 = document.getElementById('fw-60-balance');
  const exp60 = document.getElementById('fw-60-expense');
  const sav60 = document.getElementById('fw-60-savings');

  const bal90 = document.getElementById('fw-90-balance');
  const exp90 = document.getElementById('fw-90-expense');
  const sav90 = document.getElementById('fw-90-savings');

  const curr = profile.currency || '₹';

  if (bal30) bal30.textContent = `${curr}${exp30Balance.toLocaleString()}`;
  if (exp30) exp30.textContent = `${curr}${exp30Expense.toLocaleString()}`;
  if (sav30) sav30.textContent = `${curr}${exp30Savings.toLocaleString()}`;

  if (bal60) bal60.textContent = `${curr}${exp60Balance.toLocaleString()}`;
  if (exp60) exp60.textContent = `${curr}${exp60Expense.toLocaleString()}`;
  if (sav60) sav60.textContent = `${curr}${exp60Savings.toLocaleString()}`;

  if (bal90) bal90.textContent = `${curr}${exp90Balance.toLocaleString()}`;
  if (exp90) exp90.textContent = `${curr}${exp90Expense.toLocaleString()}`;
  if (sav90) sav90.textContent = `${curr}${exp90Savings.toLocaleString()}`;

  // Potential Risks Analysis
  const riskBox = document.getElementById('fw-risk-analysis');
  if (riskBox) {
    const risks = [];
    if (income === 0) {
      risks.push('ℹ️ Complete your monthly income details in Settings for accurate cashflow forecasting.');
    } else {
      if (netMonthlyCashflow < 5000) {
        risks.push(`⚠️ Tight Margin: Net monthly cashflow buffer is ₹${netMonthlyCashflow.toLocaleString()}. Watch out for unexpected expenses.`);
      }
      if (subsCost > income * 0.08) {
        risks.push(`⚠️ Subscription Creep: Subscriptions consume ₹${subsCost.toLocaleString()}/mo (${((subsCost/income)*100).toFixed(1)}% of income).`);
      }
      if (risks.length === 0) {
        risks.push('✅ Low Liquidity Risk: Positive cashflow projection sustained across the 90-day horizon.');
      }
    }

    riskBox.innerHTML = risks.map(r => `
      <div style="padding:12px; background:rgba(239,68,68,0.08); border-left:3px solid var(--primary); border-radius:6px; margin-bottom:8px; font-size:0.86rem; color:var(--text-main);">
        ${r}
      </div>
    `).join('');
  }

  // Render Line Prediction Chart
  initFutureChart(currentBalance, exp30Balance, exp60Balance, exp90Balance);
}

function initFutureChart(now, b30, b60, b90) {
  const ctx = document.getElementById('future-wallet-chart')?.getContext('2d');
  if (ctx && window.Chart) {
    if (futureChart) futureChart.destroy();
    futureChart = new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Today', '30 Days', '60 Days', '90 Days'],
        datasets: [{
          label: 'Projected Net Liquidity (₹)',
          data: [now, b30, b60, b90],
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.15)',
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94A3B8' } } },
        scales: {
          x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
          y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.05)' } }
        }
      }
    });
  }
}
