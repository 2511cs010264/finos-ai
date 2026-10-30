/* ===================================================
   FinOS - Government Alerts & Policy Monitor Module
   =================================================== */

import { db } from '../apiClient.js';

export async function renderGovtAlerts() {
  const container = document.getElementById('govt-alerts-feed');
  if (!container) return;

  const alerts = await db.getGovtAlerts();

  if (alerts.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">No policy alerts currently logged.</div>`;
    return;
  }

  container.innerHTML = alerts.map(alert => `
    <div class="glass-card alert-card ${alert.severity}" style="margin-bottom:18px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <span class="badge badge-primary">${alert.category}</span>
        <span style="font-size:0.75rem; color:var(--text-dim);">${alert.date}</span>
      </div>
      <h4 style="font-size:1.1rem; font-weight:700; margin-bottom:6px;">${alert.title}</h4>
      <p style="font-size:0.88rem; color:var(--text-muted); line-height:1.5;">${alert.summary}</p>
    </div>
  `).join('');
}
