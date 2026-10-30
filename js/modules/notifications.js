/* ===================================================
   FinOS - Notification Center & Reminders
   =================================================== */

import { db } from '../apiClient.js';

export async function renderNotifications() {
  const notifications = await db.getNotifications();
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const countBadge = document.getElementById('topbar-unread-badge');
  if (countBadge) {
    countBadge.style.display = unreadCount > 0 ? 'block' : 'none';
  }

  const container = document.getElementById('notifications-list');
  if (container) {
    if (notifications.length === 0) {
      container.innerHTML = `<div style="text-align:center; padding:24px; color:var(--text-muted);">No new notifications.</div>`;
    } else {
      container.innerHTML = notifications.map(n => `
        <div class="glass-card" style="margin-bottom:12px; opacity:${n.is_read ? 0.65 : 1}; border-left: 4px solid ${n.type === 'subscription' ? 'var(--warning)' : 'var(--primary)'};">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <h5 style="font-weight:700; font-size:0.95rem;">${n.title}</h5>
            <span style="font-size:0.72rem; color:var(--text-dim);">${n.date || 'Just now'}</span>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted);">${n.message}</p>
        </div>
      `).join('');
    }
  }
}
