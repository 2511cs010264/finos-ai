/* ===================================================
   FinOS - Master Application Controller & Router
   =================================================== */

import { db } from './apiClient.js';
import { initAuthModule } from './modules/auth.js';
import { initOnboardingModule } from './modules/onboarding.js';
import { renderDashboard } from './modules/dashboard.js';
import { initExpenseModule } from './modules/expenses.js';
import { initSubscriptionModule } from './modules/subscriptions.js';
import { initBudgetModule } from './modules/budget.js';
import { initGoalsModule } from './modules/goals.js';
import { renderEmergencyFund } from './modules/emergency.js';
import { renderFutureWallet } from './modules/futureWallet.js';
import { renderGovtAlerts } from './modules/govtAlerts.js';
import { renderNotifications } from './modules/notifications.js';
import { renderReports } from './modules/reports.js';
import { initProfileModule } from './modules/profile.js';

let currentRoute = 'landing';

// Toast Notification Helper
window.showAppToast = function(message, type = 'primary') {
  const container = document.getElementById('global-toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

// Route Switcher / Protected Routes Engine
export async function navigateTo(routeId) {
  currentRoute = routeId;

  // Protected Route Enforcement
  const publicRoutes = ['landing', 'login', 'signup', 'forgot-password'];
  const session = await db.getSession();
  
  if (!session && !publicRoutes.includes(routeId)) {
    routeId = 'login';
    window.showAppToast('Please login to access protected modules.', 'warning');
  }

  // Toggle App Shell (Hide Sidebar/Topbar on Auth & Landing pages)
  const sidebar = document.getElementById('sidebar-navigation');
  const topbar = document.getElementById('topbar-navigation');
  const mainContent = document.getElementById('main-content');

  if (publicRoutes.includes(routeId)) {
    if (sidebar) sidebar.style.display = 'none';
    if (topbar) topbar.style.display = 'none';
    if (mainContent) {
      mainContent.style.marginLeft = '0';
      mainContent.style.width = '100%';
    }
  } else {
    if (sidebar) sidebar.style.display = 'flex';
    if (topbar) topbar.style.display = 'flex';
    if (mainContent) {
      mainContent.style.marginLeft = '';
      mainContent.style.width = '';
    }
  }

  // Switch View Visibility
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });

  const targetView = document.getElementById(`view-${routeId}`);
  if (targetView) {
    targetView.classList.add('active');
  }

  // Update Nav Item Active State
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
    if (item.getAttribute('data-route') === routeId) {
      item.classList.add('active');
    }
  });

  // Render View Module Content
  renderViewModule(routeId);

  // Re-initialize Lucide icons if loaded
  if (window.lucide) {
    window.lucide.createIcons();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function renderViewModule(route) {
  switch (route) {
    case 'dashboard':
      await renderDashboard();
      break;
    case 'expenses':
      await initExpenseModule();
      break;
    case 'subscriptions':
      await initSubscriptionModule();
      break;
    case 'budget':
      await initBudgetModule();
      break;
    case 'goals':
      await initGoalsModule();
      break;
    case 'emergency':
      await renderEmergencyFund();
      break;
    case 'future-wallet':
      await renderFutureWallet();
      break;
    case 'govt-alerts':
      await renderGovtAlerts();
      break;
    case 'notifications':
      await renderNotifications();
      break;
    case 'reports':
      await renderReports();
      break;
    case 'profile':
    case 'settings':
      await initProfileModule();
      break;
  }
}

// App Master Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Navigation Click Handlers
  document.querySelectorAll('[data-route]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const route = el.getAttribute('data-route');
      navigateTo(route);

      // Close mobile drawer if open
      document.getElementById('sidebar-navigation')?.classList.remove('open');
    });
  });

  // 2. Mobile Menu Toggle
  document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
    document.getElementById('sidebar-navigation')?.classList.toggle('open');
  });

  // 3. Modal Handlers
  document.querySelectorAll('[data-modal-target]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-modal-target');
      document.getElementById(modalId)?.classList.add('active');
    });
  });

  document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
    el.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-close')) {
        document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      }
    });
  });

  // 4. Logout Handler
  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    await db.signOut();
    window.showAppToast('Logged out safely.', 'success');
    navigateTo('landing');
  });

  // 5. Initialize Core Auth & Onboarding Modules
  initAuthModule();
  initOnboardingModule();

  // 6. Check Auth Session
  const session = await db.getSession();
  if (session) {
    const profile = await db.getProfile();
    if (!profile.onboarding_completed) {
      navigateTo('onboarding');
    } else {
      navigateTo('dashboard');
    }
  } else {
    navigateTo('landing');
  }

  // 7. Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
