/* ===================================================
   FinOS - Financial Goals Tracker Module
   =================================================== */

import { db } from '../apiClient.js';

export async function initGoalsModule() {
  renderGoalsList();

  // Add Goal Form Handler
  const goalForm = document.getElementById('add-goal-form');
  if (goalForm) {
    const newGoalForm = goalForm.cloneNode(true);
    goalForm.parentNode.replaceChild(newGoalForm, goalForm);

    newGoalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('goal-title').value?.trim();
      const target_amount = parseFloat(document.getElementById('goal-target-amount').value);
      const target_date = document.getElementById('goal-target-date').value;
      const monthly_contribution = parseFloat(document.getElementById('goal-monthly-contrib').value) || 0;
      const category = document.getElementById('goal-category').value;

      try {
        await db.addGoal({ title, target_amount, target_date, monthly_contribution, category });
        if (window.showAppToast) window.showAppToast('Financial goal created!', 'success');
        newGoalForm.reset();
        document.getElementById('add-goal-modal')?.classList.remove('active');
        renderGoalsList();
      } catch (err) {
        if (window.showAppToast) window.showAppToast('Failed to add goal: ' + err.message, 'danger');
      }
    });
  }
}

export async function renderGoalsList() {
  const goals = await db.getGoals();

  const container = document.getElementById('goals-cards-grid');
  if (container) {
    if (goals.length === 0) {
      container.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">No goals created yet. Click '+ Set New Goal' to define your financial milestones!</div>`;
    } else {
      container.innerHTML = goals.map(g => {
        const current = parseFloat(g.current_amount || 0);
        const target = parseFloat(g.target_amount || 1);
        const percent = Math.min(100, Math.round((current / target) * 100));

        return `
          <div class="glass-card" style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
              <div>
                <span class="badge badge-primary">${g.category || 'Savings'}</span>
                <h4 style="font-size:1.15rem; font-weight:700; margin-top:6px;">${g.title}</h4>
              </div>
              <div style="font-size:1.3rem; font-weight:800; color:var(--primary);">${percent}%</div>
            </div>

            <div style="display:flex; justify-content:space-between; font-size:0.88rem;">
              <span style="color:var(--text-muted);">Saved: <strong>₹${current.toLocaleString()}</strong></span>
              <span style="color:var(--text-muted);">Target: <strong>₹${target.toLocaleString()}</strong></span>
            </div>

            <div class="progress-container">
              <div class="progress-bar ${percent >= 100 ? 'success' : ''}" style="width: ${percent}%;"></div>
            </div>

            <div style="display:flex; justify-content:space-between; align-items:center; pt-2; border-top:1px solid var(--border-color); font-size:0.8rem;">
              <span style="color:var(--text-dim);">Target Date: ${g.target_date || '-'}</span>
              <button class="btn-deposit-goal btn btn-sm btn-outline" data-id="${g.id}">+ Deposit</button>
            </div>
          </div>
        `;
      }).join('');

      // Deposit Handlers
      container.querySelectorAll('.btn-deposit-goal').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          const amount = prompt('Enter deposit amount (₹):', '1000');
          if (amount && !isNaN(amount) && parseFloat(amount) > 0) {
            await db.updateGoalProgress(id, parseFloat(amount));
            if (window.showAppToast) window.showAppToast('Deposit recorded towards your goal!', 'success');
            renderGoalsList();
          }
        });
      });
    }
  }
}
