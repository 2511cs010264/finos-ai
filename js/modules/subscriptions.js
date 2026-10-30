/* ===================================================
   FinOS - Subscription Manager & Unused Wastage Detector
   =================================================== */

import { db } from '../apiClient.js';

export async function initSubscriptionModule() {
  renderSubscriptions();

  // Add Subscription Form Handler
  const subForm = document.getElementById('add-sub-form');
  if (subForm) {
    const newSubForm = subForm.cloneNode(true);
    subForm.parentNode.replaceChild(newSubForm, subForm);

    newSubForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('sub-name').value?.trim();
      const monthly_cost = parseFloat(document.getElementById('sub-monthly-cost').value);
      const billing_cycle = document.getElementById('sub-billing-cycle').value;
      const annual_cost = billing_cycle === 'yearly' ? monthly_cost : monthly_cost * 12;
      const next_renewal_date = document.getElementById('sub-renewal-date').value;
      const is_used_regularly = document.getElementById('sub-used-regularly').checked;

      try {
        await db.addSubscription({ name, monthly_cost, annual_cost, billing_cycle, next_renewal_date, is_used_regularly });
        if (window.showAppToast) window.showAppToast('Subscription added!', 'success');
        newSubForm.reset();
        document.getElementById('add-sub-modal')?.classList.remove('active');
        renderSubscriptions();
      } catch (err) {
        if (window.showAppToast) window.showAppToast('Failed to save subscription: ' + err.message, 'danger');
      }
    });
  }
}

export async function renderSubscriptions() {
  const subscriptions = await db.getSubscriptions();

  // Totals
  const totalMonthly = subscriptions.reduce((a, b) => a + parseFloat(b.monthly_cost || 0), 0);
  const totalAnnual = subscriptions.reduce((a, b) => a + parseFloat(b.annual_cost || 0), 0);
  const unusedCount = subscriptions.filter(s => !s.is_used_regularly).length;
  const potentialSavings = subscriptions.filter(s => !s.is_used_regularly).reduce((a, b) => a + parseFloat(b.monthly_cost || 0), 0);

  const monthlyEl = document.getElementById('sub-total-monthly');
  const annualEl = document.getElementById('sub-total-annual');
  const unusedEl = document.getElementById('sub-unused-count');
  const savingsEl = document.getElementById('sub-potential-savings');

  if (monthlyEl) monthlyEl.textContent = `₹${totalMonthly.toLocaleString()}`;
  if (annualEl) annualEl.textContent = `₹${totalAnnual.toLocaleString()}`;
  if (unusedEl) unusedEl.textContent = unusedCount;
  if (savingsEl) savingsEl.textContent = `₹${potentialSavings.toLocaleString()}/mo`;

  // Render Grid
  const grid = document.getElementById('subscriptions-grid');
  if (grid) {
    if (subscriptions.length === 0) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding:30px; color:var(--text-muted);">No subscriptions added yet. Click '+ Add Subscription' to track your recurring expenses.</div>`;
    } else {
      grid.innerHTML = subscriptions.map(s => `
        <div class="glass-card sub-card" style="border-left: 4px solid ${s.is_used_regularly ? 'var(--primary)' : 'var(--warning)'};">
          <div class="sub-header">
            <div class="sub-logo">${(s.name || 'Sub').substring(0, 2).toUpperCase()}</div>
            <div>
              <h4 style="font-size:1.05rem; font-weight:700;">${s.name}</h4>
              <span class="badge ${s.is_used_regularly ? 'badge-success' : 'badge-warning'}">
                ${s.is_used_regularly ? 'Used Regularly' : '⚠️ Low Usage Flag'}
              </span>
            </div>
            <button class="btn-delete-sub btn btn-sm btn-secondary" data-id="${s.id}" style="margin-left:auto; padding:4px 8px;">🗑️</button>
          </div>

          <div style="display:flex; justify-content:space-between; margin-top: 10px; padding: 10px; background:var(--bg-glass-input); border-radius: var(--radius-sm);">
            <div>
              <div style="font-size:0.75rem; color:var(--text-dim);">Monthly</div>
              <div style="font-weight:700;">₹${parseFloat(s.monthly_cost || 0).toLocaleString()}</div>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-dim);">Annual</div>
              <div style="font-weight:700;">₹${parseFloat(s.annual_cost || 0).toLocaleString()}</div>
            </div>
            <div>
              <div style="font-size:0.75rem; color:var(--text-dim);">Renewal</div>
              <div style="font-weight:600; color:var(--warning);">${s.next_renewal_date || '-'}</div>
            </div>
          </div>

          <div style="font-size:0.8rem; padding: 8px 12px; background: rgba(245, 158, 11, 0.08); border-radius: 6px; color: var(--text-main); margin-top:10px;">
            💡 <strong>Insight:</strong> ${s.is_used_regularly ? 'Active subscription. Keep tracking renewal dates.' : `Unused service. Pausing can save ₹${(parseFloat(s.monthly_cost || 0) * 12).toLocaleString()}/year.`}
          </div>
        </div>
      `).join('');

      // Attach Delete Listeners
      grid.querySelectorAll('.btn-delete-sub').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = btn.getAttribute('data-id');
          await db.deleteSubscription(id);
          if (window.showAppToast) window.showAppToast('Subscription removed.', 'warning');
          renderSubscriptions();
        });
      });
    }
  }
}
