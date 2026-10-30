/* ===================================================
   FinOS - Budget Planner & Category Allocation Module
   =================================================== */

import { db } from '../apiClient.js';

export async function initBudgetModule() {
  renderBudgetPlanner();

  // Add/Edit Category Budget Form
  const budgetForm = document.getElementById('set-budget-form');
  if (budgetForm) {
    const newBudgetForm = budgetForm.cloneNode(true);
    budgetForm.parentNode.replaceChild(newBudgetForm, budgetForm);

    newBudgetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const category = document.getElementById('budget-category').value;
      const allocated_amount = parseFloat(document.getElementById('budget-amount').value);

      try {
        await db.updateBudget(category, allocated_amount);
        if (window.showAppToast) window.showAppToast('Category budget limit updated!', 'success');
        newBudgetForm.reset();
        document.getElementById('set-budget-modal')?.classList.remove('active');
        renderBudgetPlanner();
      } catch (err) {
        if (window.showAppToast) window.showAppToast('Failed to update budget: ' + err.message, 'danger');
      }
    });
  }
}

export async function renderBudgetPlanner() {
  const budgets = await db.getBudgets();
  const transactions = await db.getTransactions();

  // Calculate actual spent per category from transaction log
  const actualSpentMap = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    actualSpentMap[t.category] = (actualSpentMap[t.category] || 0) + parseFloat(t.amount || 0);
  });

  let totalAllocated = 0;
  let totalSpent = 0;

  const budgetListEl = document.getElementById('budget-categories-list');
  if (budgetListEl) {
    if (budgets.length === 0) {
      budgetListEl.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No budget categories allocated yet. Click '+ Allocate Budget' to define monthly spending limits.</div>`;
    } else {
      budgetListEl.innerHTML = budgets.map(b => {
        const spent = actualSpentMap[b.category] || 0;
        const allocated = parseFloat(b.allocated_amount || 1);
        const percent = Math.min(100, Math.round((spent / allocated) * 100));
        const remaining = allocated - spent;

        totalAllocated += allocated;
        totalSpent += spent;

        let statusClass = 'success';
        if (percent > 100) statusClass = 'danger';
        else if (percent >= 80) statusClass = 'warning';

        return `
          <div class="glass-card" style="margin-bottom: 16px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
              <div>
                <h4 style="font-size:1.05rem; font-weight:700;">${b.category}</h4>
                <span class="badge badge-${statusClass}">
                  ${percent > 100 ? `⚠️ Exceeded by ₹${Math.abs(remaining).toLocaleString()}` : `${percent}% Budget Spent`}
                </span>
              </div>
              <div style="text-align:right;">
                <div style="font-size:1.1rem; font-weight:800; color:var(--text-white);">₹${spent.toLocaleString()} / ₹${allocated.toLocaleString()}</div>
                <div style="font-size:0.75rem; color:var(--text-muted);">${remaining >= 0 ? `₹${remaining.toLocaleString()} remaining` : 'Over limit!'}</div>
              </div>
            </div>

            <div class="progress-container">
              <div class="progress-bar ${statusClass}" style="width: ${percent}%;"></div>
            </div>
          </div>
        `;
      }).join('');
    }
  }

  // Summary Tiles
  const allocatedEl = document.getElementById('budget-total-allocated');
  const spentEl = document.getElementById('budget-total-spent');
  const remainingEl = document.getElementById('budget-total-remaining');

  if (allocatedEl) allocatedEl.textContent = `₹${totalAllocated.toLocaleString()}`;
  if (spentEl) spentEl.textContent = `₹${totalSpent.toLocaleString()}`;
  if (remainingEl) {
    const totalRem = totalAllocated - totalSpent;
    remainingEl.textContent = `₹${totalRem.toLocaleString()}`;
    remainingEl.style.color = totalRem >= 0 ? 'var(--success)' : 'var(--danger)';
  }
}
