/* ===================================================
   FinOS - Dashboard Module
   Renders real per-user financial data pulled from Spring Boot API
   =================================================== */

import { db } from '../apiClient.js';
import { calculateFinancialHealthScore } from './healthScore.js';

let cashflowChartInstance = null;
let categoryChartInstance = null;

export async function renderDashboard() {
  const profile = await db.getProfile();
  const transactions = await db.getTransactions();
  const subscriptions = await db.getSubscriptions();
  const budgets = await db.getBudgets();

  // --- Welcome header & sidebar user info ---
  const firstName = (profile.full_name || 'User').split(' ')[0];
  const welcomeEl = document.getElementById('dash-user-welcome');
  if (welcomeEl) welcomeEl.textContent = firstName;

  const sidebarName = document.getElementById('sidebar-user-name');
  if (sidebarName) sidebarName.textContent = profile.full_name || 'User';

  const sidebarAvatar = document.getElementById('sidebar-user-avatar');
  if (sidebarAvatar) {
    const initials = (profile.full_name || 'U')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0].toUpperCase())
      .join('');
    sidebarAvatar.textContent = initials || 'U';
  }

  // --- Core totals from real transactions ---
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const netBalance = totalIncome - totalExpense;

  const balanceEl = document.getElementById('dash-current-balance');
  if (balanceEl) balanceEl.textContent = formatCurrency(netBalance, profile.currency);

  const savingsEl = document.getElementById('dash-monthly-savings');
  if (savingsEl) savingsEl.textContent = formatCurrency(profile.monthly_savings || 0, profile.currency);

  // --- Subscriptions cost ---
  const totalSubsCost = subscriptions.reduce((sum, s) => sum + parseFloat(s.monthly_cost || 0), 0);
  const unusedCount = subscriptions.filter(s => !s.is_used_regularly).length;

  const subsCostEl = document.getElementById('dash-subscriptions-cost');
  if (subsCostEl) subsCostEl.textContent = formatCurrency(totalSubsCost, profile.currency);

  const subsSubEl = document.querySelector('#dash-subscriptions-cost')?.closest('.glass-card')?.querySelector('.metric-sub');
  if (subsSubEl) {
    subsSubEl.textContent = unusedCount > 0 ? `⚠️ ${unusedCount} Unused flagged` : `${subscriptions.length} active subscriptions`;
  }

  // --- Financial Health Score ---
  const health = calculateFinancialHealthScore(profile, transactions, subscriptions, budgets);

  const scoreNumberEl = document.getElementById('dash-score-number');
  if (scoreNumberEl) scoreNumberEl.textContent = health.score;

  const scoreStatusEl = document.getElementById('dash-score-status');
  if (scoreStatusEl) scoreStatusEl.textContent = health.statusText;

  const scoreRingEl = document.getElementById('dash-score-ring');
  if (scoreRingEl) {
    const circumference = 377; // matches the SVG's stroke-dasharray base
    const filled = (health.score / 100) * circumference;
    scoreRingEl.setAttribute('stroke-dasharray', `${filled}, ${circumference}`);
    scoreRingEl.setAttribute('stroke', health.statusColor);
  }

  // --- Financial Recommendations & Insights ---
  const aiTipsEl = document.getElementById('dash-ai-tips');
  if (aiTipsEl) {
    aiTipsEl.innerHTML = health.recommendations.length
      ? health.recommendations
          .map(tip => `<div style="padding:10px 0; border-bottom:1px solid var(--border-color); font-size:0.85rem;">${tip}</div>`)
          .join('')
      : `<div style="padding:10px 0; font-size:0.85rem; color:var(--text-muted);">Add your transactions and income to generate smart financial health insights.</div>`;
  }

  // --- Recent Transactions Table ---
  const recentBody = document.getElementById('dash-recent-transactions');
  if (recentBody) {
    const recent = [...transactions]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    recentBody.innerHTML = recent.length
      ? recent.map(t => `
        <tr>
          <td>${t.category}</td>
          <td>${formatDate(t.date)}</td>
          <td>${t.payment_method || '-'}</td>
          <td style="text-align:right; color:${t.type === 'income' ? 'var(--success)' : 'var(--danger)'};">
            ${t.type === 'income' ? '+' : '-'}${formatCurrency(t.amount, profile.currency)}
          </td>
        </tr>
      `).join('')
      : `<tr><td colspan="4" style="text-align:center; color:var(--text-muted); padding:20px;">No transactions logged yet. Click '+ Add Expense' to record your first entry!</td></tr>`;
  }

  // --- Charts ---
  renderCashflowChart(transactions);
  renderCategoryChart(transactions);
}

function renderCashflowChart(transactions) {
  const canvas = document.getElementById('dash-cashflow-chart');
  if (!canvas || !window.Chart) return;

  // Group by month
  const monthly = {};
  transactions.forEach(t => {
    const monthKey = (t.date || '').slice(0, 7); // 'YYYY-MM'
    if (!monthKey) return;
    if (!monthly[monthKey]) monthly[monthKey] = { income: 0, expense: 0 };
    if (t.type === 'income') monthly[monthKey].income += parseFloat(t.amount || 0);
    else monthly[monthKey].expense += parseFloat(t.amount || 0);
  });

  const labels = Object.keys(monthly).sort();
  const incomeData = labels.map(l => monthly[l].income);
  const expenseData = labels.map(l => monthly[l].expense);

  if (cashflowChartInstance) cashflowChartInstance.destroy();

  cashflowChartInstance = new window.Chart(canvas, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [
        {
          label: 'Income',
          data: incomeData.length ? incomeData : [0],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34,197,94,0.1)',
          tension: 0.35,
          fill: true
        },
        {
          label: 'Expenses',
          data: expenseData.length ? expenseData : [0],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          tension: 0.35,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#a1a1aa' } } },
      scales: {
        x: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
        y: { ticks: { color: '#a1a1aa' }, grid: { color: 'rgba(255,255,255,0.05)' } }
      }
    }
  });
}

function renderCategoryChart(transactions) {
  const canvas = document.getElementById('dash-category-chart');
  if (!canvas || !window.Chart) return;

  const categoryTotals = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + parseFloat(t.amount || 0);
    });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);
  const colors = ['#6366f1', '#22c55e', '#eab308', '#ef4444', '#06b6d4', '#a855f7', '#f97316'];

  if (categoryChartInstance) categoryChartInstance.destroy();

  categoryChartInstance = new window.Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: labels.length ? labels : ['No expenses recorded'],
      datasets: [{
        data: data.length ? data : [1],
        backgroundColor: labels.length ? colors.slice(0, labels.length) : ['#3f3f46']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', boxWidth: 12 } } }
    }
  });
}

function formatCurrency(amount, currency = '₹') {
  const num = parseFloat(amount) || 0;
  return `${currency}${num.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}
