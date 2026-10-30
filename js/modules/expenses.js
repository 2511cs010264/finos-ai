/* ===================================================
   FinOS - Expense Tracker & Category Analytics
   =================================================== */

import { db } from '../apiClient.js';

let expensePieChart = null;
let expenseBarChart = null;

export async function initExpenseModule() {
  renderExpenseList();

  // Add Transaction Form Handler
  const txForm = document.getElementById('add-transaction-form');
  if (txForm) {
    // Replace listener to prevent duplicate submissions
    const newTxForm = txForm.cloneNode(true);
    txForm.parentNode.replaceChild(newTxForm, txForm);

    newTxForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const type = document.getElementById('tx-type').value;
      const amount = parseFloat(document.getElementById('tx-amount').value);
      const category = document.getElementById('tx-category').value;
      const date = document.getElementById('tx-date').value || new Date().toISOString().split('T')[0];
      const payment_method = document.getElementById('tx-method').value;
      const notes = document.getElementById('tx-notes').value;

      try {
        await db.addTransaction({ type, amount, category, date, payment_method, notes });
        if (window.showAppToast) window.showAppToast('Transaction added successfully!', 'success');
        newTxForm.reset();
        document.getElementById('add-tx-modal')?.classList.remove('active');
        renderExpenseList();
      } catch (err) {
        if (window.showAppToast) window.showAppToast('Failed to add transaction: ' + err.message, 'danger');
      }
    });
  }

  // Filter & Search Controls
  document.getElementById('tx-search-input')?.addEventListener('input', renderExpenseList);
  document.getElementById('tx-filter-category')?.addEventListener('change', renderExpenseList);
  document.getElementById('tx-filter-type')?.addEventListener('change', renderExpenseList);
}

export async function renderExpenseList() {
  const transactions = await db.getTransactions();
  const search = document.getElementById('tx-search-input')?.value.toLowerCase() || '';
  const filterCat = document.getElementById('tx-filter-category')?.value || 'all';
  const filterType = document.getElementById('tx-filter-type')?.value || 'all';

  const filtered = transactions.filter(t => {
    const matchesSearch = (t.category || '').toLowerCase().includes(search) || (t.notes && t.notes.toLowerCase().includes(search));
    const matchesCat = filterCat === 'all' || t.category === filterCat;
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesCat && matchesType;
  });

  const tableBody = document.getElementById('expense-table-body');
  if (tableBody) {
    if (filtered.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 24px; color:var(--text-muted);">No transactions match your search filter.</td></tr>`;
    } else {
      tableBody.innerHTML = filtered.map(t => `
        <tr>
          <td>
            <span class="badge ${t.type === 'income' ? 'badge-success' : 'badge-danger'}">
              ${t.type === 'income' ? 'Income' : 'Expense'}
            </span>
          </td>
          <td style="font-weight:600;">${t.category}</td>
          <td>${t.notes || '-'}</td>
          <td>${t.date || '-'}</td>
          <td><span class="badge badge-primary">${t.payment_method || 'UPI'}</span></td>
          <td style="font-weight:700; color:${t.type === 'income' ? 'var(--success)' : 'var(--text-white)'}; text-align:right;">
            ${t.type === 'income' ? '+' : '-'}₹${parseFloat(t.amount || 0).toLocaleString()}
          </td>
          <td style="text-align:center;">
            <button class="btn-delete-tx btn btn-sm btn-secondary" data-id="${t.id}" style="padding:4px 8px;">🗑️</button>
          </td>
        </tr>
      `).join('');

      // Attach Delete Handlers
      tableBody.querySelectorAll('.btn-delete-tx').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await db.deleteTransaction(id);
          if (window.showAppToast) window.showAppToast('Transaction deleted.', 'warning');
          renderExpenseList();
        });
      });
    }
  }

  // Update Expense Charts
  renderExpenseCharts(filtered);
}

function renderExpenseCharts(transactions) {
  const pieCtx = document.getElementById('expense-pie-chart')?.getContext('2d');
  const barCtx = document.getElementById('expense-bar-chart')?.getContext('2d');

  const categories = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categories[t.category] = (categories[t.category] || 0) + parseFloat(t.amount || 0);
  });

  const labels = Object.keys(categories);
  const data = Object.values(categories);

  if (pieCtx && window.Chart) {
    if (expensePieChart) expensePieChart.destroy();
    expensePieChart = new window.Chart(pieCtx, {
      type: 'pie',
      data: {
        labels: labels.length ? labels : ['No expense data'],
        datasets: [{
          data: data.length ? data : [1],
          backgroundColor: labels.length
            ? ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#818CF8', '#EC4899', '#06B6D4', '#8B5CF6']
            : ['#3f3f46']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { color: '#94A3B8' } } }
      }
    });
  }

  if (barCtx && window.Chart) {
    if (expenseBarChart) expenseBarChart.destroy();
    expenseBarChart = new window.Chart(barCtx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No expense data'],
        datasets: [{
          label: 'Expenses (₹)',
          data: data.length ? data : [0],
          backgroundColor: 'rgba(79, 70, 229, 0.7)',
          borderColor: '#4F46E5',
          borderWidth: 1,
          borderRadius: 6
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
