/* ===================================================
   FinOS - Financial Reports & Audit Export Module
   =================================================== */

import { db } from '../apiClient.js';

export async function renderReports() {
  const profile = await db.getProfile();
  const transactions = await db.getTransactions();

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((a, b) => a + parseFloat(b.amount || 0), 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((a, b) => a + parseFloat(b.amount || 0), 0);
  const netSavings = totalIncome - totalExpenses;

  const incEl = document.getElementById('report-total-income');
  const expEl = document.getElementById('report-total-expense');
  const savEl = document.getElementById('report-net-savings');
  const curr = profile.currency || '₹';

  if (incEl) incEl.textContent = `${curr}${totalIncome.toLocaleString()}`;
  if (expEl) expEl.textContent = `${curr}${totalExpenses.toLocaleString()}`;
  if (savEl) savEl.textContent = `${curr}${netSavings.toLocaleString()}`;

  // Export Buttons Handlers
  document.getElementById('btn-export-csv')?.addEventListener('click', () => exportTransactionsCSV(transactions));
  document.getElementById('btn-print-report')?.addEventListener('click', () => window.print());
}

function exportTransactionsCSV(transactions) {
  if (!transactions.length) {
    if (window.showAppToast) window.showAppToast('No transactions to export.', 'warning');
    return;
  }

  let csvContent = "data:text/csv;charset=utf-8,ID,Type,Amount,Category,Date,Payment Method,Notes\n";
  transactions.forEach(t => {
    csvContent += `"${t.id}","${t.type}","${t.amount}","${t.category}","${t.date || ''}","${t.payment_method || ''}","${t.notes || ''}"\n`;
  });
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `FinOS_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (window.showAppToast) window.showAppToast('Financial report CSV downloaded!', 'success');
}
