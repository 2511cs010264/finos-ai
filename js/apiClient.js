/* ===================================================
   FinOS - Spring Boot REST API Client & Persistent Data Store
   =================================================== */

import { CONFIG, INITIAL_USER_PROFILE } from './config.js';

const BASE_URL = CONFIG.API_BASE_URL;

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const defaultHeaders = {
    'Content-Type': 'application/json'
  };

  const config = {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
    credentials: 'include'
  };

  try {
    const res = await fetch(url, config);
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || `API Error: ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[apiClient] Backend request failed (${endpoint}):`, err.message);
    throw err;
  }
}

// Local Storage Fallback Store Helpers
function getLocal(key, defaultValue = null) {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
}

function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function getStoredUserSession() {
  return getLocal('finos_session', null);
}

function setStoredUserSession(sess) {
  setLocal('finos_session', sess);
}

export const db = {
  // --- AUTHENTICATION SERVICES ---
  async signUp(email, password, fullName) {
    try {
      const data = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName })
      });
      const sess = { user: { id: data.id, email: data.email, fullName: data.fullName } };
      setStoredUserSession(sess);
      return sess;
    } catch (e) {
      // Local fallback if backend server isn't reachable yet
      const userId = 'usr_' + Date.now();
      const sess = { user: { id: userId, email, fullName } };
      setStoredUserSession(sess);
      setLocal(`finos_profile_${userId}`, { ...INITIAL_USER_PROFILE, id: userId, full_name: fullName, email });
      return sess;
    }
  },

  async signInWithPassword(email, password) {
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      const sess = { user: { id: data.id, email: data.email, fullName: data.fullName } };
      setStoredUserSession(sess);
      return sess;
    } catch (e) {
      // Local fallback
      const sess = getStoredUserSession() || { user: { id: 1, email, fullName: 'Rahul Sharma' } };
      setStoredUserSession(sess);
      return sess;
    }
  },

  async signOut() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {}
    localStorage.removeItem('finos_session');
  },

  async getSession() {
    const sess = getStoredUserSession();
    if (!sess) return null;
    try {
      const serverSess = await request(`/auth/session?userId=${sess.user.id}`);
      if (serverSess.authenticated) {
        const updated = { user: { id: serverSess.userId, email: serverSess.email, fullName: serverSess.fullName } };
        setStoredUserSession(updated);
        return updated;
      }
    } catch (e) {}
    return sess;
  },

  // --- PROFILES API ---
  async getProfile() {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      const p = await request(`/profile?userId=${userId}`);
      return {
        id: p.userId,
        full_name: p.fullName || sess?.user?.fullName || 'User',
        city: p.city || '',
        occupation: p.occupation || '',
        monthly_income: p.monthlyIncome || 0,
        monthly_rent: p.monthlyRent || 0,
        monthly_emi: p.monthlyEmi || 0,
        family_members: p.familyMembers || 1,
        monthly_savings: p.monthlySavings || 0,
        financial_goal: p.financialGoal || '',
        preferred_language: p.preferredLanguage || 'en',
        currency: p.currency || '₹',
        onboarding_completed: p.onboardingCompleted || false
      };
    } catch (e) {
      return getLocal(`finos_profile_${userId}`, { ...INITIAL_USER_PROFILE, full_name: sess?.user?.fullName || 'User' });
    }
  },

  async updateProfile(updates) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    const payload = {
      fullName: updates.full_name,
      city: updates.city,
      occupation: updates.occupation,
      monthlyIncome: updates.monthly_income,
      monthlyRent: updates.monthly_rent,
      monthlyEmi: updates.monthly_emi,
      familyMembers: updates.family_members,
      monthlySavings: updates.monthly_savings,
      financialGoal: updates.financial_goal,
      preferredLanguage: updates.preferred_language,
      currency: updates.currency,
      onboardingCompleted: updates.onboarding_completed
    };

    try {
      const p = await request(`/profile?userId=${userId}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      return {
        id: p.userId,
        full_name: p.fullName,
        city: p.city,
        occupation: p.occupation,
        monthly_income: p.monthlyIncome,
        monthly_rent: p.monthlyRent,
        monthly_emi: p.monthlyEmi,
        family_members: p.familyMembers,
        monthly_savings: p.monthlySavings,
        financial_goal: p.financialGoal,
        preferred_language: p.preferredLanguage,
        currency: p.currency,
        onboarding_completed: p.onboardingCompleted
      };
    } catch (e) {
      const curr = await this.getProfile();
      const updated = { ...curr, ...updates };
      setLocal(`finos_profile_${userId}`, updated);
      return updated;
    }
  },

  // --- TRANSACTIONS API ---
  async getTransactions() {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      const list = await request(`/transactions?userId=${userId}`);
      return list.map(t => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        payment_method: t.paymentMethod,
        notes: t.notes
      }));
    } catch (e) {
      return getLocal(`finos_transactions_${userId}`, []);
    }
  },

  async addTransaction(tx) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    const payload = {
      type: tx.type,
      amount: tx.amount,
      category: tx.category,
      date: tx.date,
      paymentMethod: tx.payment_method,
      notes: tx.notes
    };

    try {
      const t = await request(`/transactions?userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return {
        id: t.id,
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date,
        payment_method: t.paymentMethod,
        notes: t.notes
      };
    } catch (e) {
      const list = await this.getTransactions();
      const newTx = { id: Date.now(), ...tx };
      list.unshift(newTx);
      setLocal(`finos_transactions_${userId}`, list);
      return newTx;
    }
  },

  async deleteTransaction(id) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      await request(`/transactions/${id}?userId=${userId}`, { method: 'DELETE' });
    } catch (e) {
      let list = await this.getTransactions();
      list = list.filter(t => t.id != id);
      setLocal(`finos_transactions_${userId}`, list);
    }
    return true;
  },

  // --- SUBSCRIPTIONS API ---
  async getSubscriptions() {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      const list = await request(`/subscriptions?userId=${userId}`);
      return list.map(s => ({
        id: s.id,
        name: s.name,
        monthly_cost: s.monthlyCost,
        annual_cost: s.annualCost,
        billing_cycle: s.billingCycle,
        next_renewal_date: s.nextRenewalDate,
        is_used_regularly: s.isUsedRegularly,
        category: s.category
      }));
    } catch (e) {
      return getLocal(`finos_subscriptions_${userId}`, []);
    }
  },

  async addSubscription(sub) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    const payload = {
      name: sub.name,
      monthlyCost: sub.monthly_cost,
      annualCost: sub.annual_cost,
      billingCycle: sub.billing_cycle,
      nextRenewalDate: sub.next_renewal_date,
      isUsedRegularly: sub.is_used_regularly,
      category: sub.category
    };

    try {
      const s = await request(`/subscriptions?userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return {
        id: s.id,
        name: s.name,
        monthly_cost: s.monthlyCost,
        annual_cost: s.annualCost,
        billing_cycle: s.billingCycle,
        next_renewal_date: s.nextRenewalDate,
        is_used_regularly: s.isUsedRegularly,
        category: s.category
      };
    } catch (e) {
      const list = await this.getSubscriptions();
      const newSub = { id: Date.now(), ...sub };
      list.push(newSub);
      setLocal(`finos_subscriptions_${userId}`, list);
      return newSub;
    }
  },

  async deleteSubscription(id) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      await request(`/subscriptions/${id}?userId=${userId}`, { method: 'DELETE' });
    } catch (e) {
      let list = await this.getSubscriptions();
      list = list.filter(s => s.id != id);
      setLocal(`finos_subscriptions_${userId}`, list);
    }
    return true;
  },

  // --- BUDGETS API ---
  async getBudgets() {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      const list = await request(`/budgets?userId=${userId}`);
      return list.map(b => ({
        id: b.id,
        category: b.category,
        allocated_amount: b.allocatedAmount
      }));
    } catch (e) {
      return getLocal(`finos_budgets_${userId}`, []);
    }
  },

  async updateBudget(category, allocatedAmount) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      await request(`/budgets?userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify({ category, allocatedAmount })
      });
    } catch (e) {
      let budgets = await this.getBudgets();
      const idx = budgets.findIndex(b => b.category === category);
      if (idx >= 0) {
        budgets[idx].allocated_amount = allocatedAmount;
      } else {
        budgets.push({ id: Date.now(), category, allocated_amount: allocatedAmount });
      }
      setLocal(`finos_budgets_${userId}`, budgets);
    }
    return this.getBudgets();
  },

  // --- GOALS API ---
  async getGoals() {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      const list = await request(`/goals?userId=${userId}`);
      return list.map(g => ({
        id: g.id,
        title: g.title,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        target_date: g.targetDate,
        monthly_contribution: g.monthlyContribution,
        category: g.category,
        status: g.status
      }));
    } catch (e) {
      return getLocal(`finos_goals_${userId}`, []);
    }
  },

  async addGoal(goal) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    const payload = {
      title: goal.title,
      targetAmount: goal.target_amount,
      currentAmount: goal.current_amount || 0,
      targetDate: goal.target_date,
      monthlyContribution: goal.monthly_contribution || 0,
      category: goal.category,
      status: 'active'
    };

    try {
      const g = await request(`/goals?userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      return {
        id: g.id,
        title: g.title,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        target_date: g.targetDate,
        monthly_contribution: g.monthlyContribution,
        category: g.category,
        status: g.status
      };
    } catch (e) {
      const list = await this.getGoals();
      const newGoal = { id: Date.now(), status: 'active', current_amount: 0, ...goal };
      list.push(newGoal);
      setLocal(`finos_goals_${userId}`, list);
      return newGoal;
    }
  },

  async updateGoalProgress(id, addAmount) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      await request(`/goals/${id}/deposit?userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify({ amount: addAmount })
      });
    } catch (e) {
      let goals = await this.getGoals();
      const idx = goals.findIndex(g => g.id == id);
      if (idx >= 0) {
        goals[idx].current_amount += parseFloat(addAmount);
        if (goals[idx].current_amount >= goals[idx].target_amount) {
          goals[idx].status = 'completed';
        }
        setLocal(`finos_goals_${userId}`, goals);
      }
    }
    return this.getGoals();
  },

  // --- GOVT ALERTS API ---
  async getGovtAlerts() {
    try {
      const list = await request('/govt-alerts');
      return list.map(a => ({
        id: a.id,
        title: a.title,
        category: a.category,
        date: a.date,
        severity: a.severity,
        summary: a.summary
      }));
    } catch (e) {
      return [
        { id: 1, title: 'LPG Domestic Cylinder Price Reduced by ₹50', category: 'LPG', date: new Date().toISOString().split('T')[0], severity: 'success', summary: 'Government announced a ₹50 reduction on 14.2kg domestic LPG cylinders.' },
        { id: 2, title: 'RBI Keeps Repo Rate Unchanged at 6.5%', category: 'RBI Updates', date: new Date().toISOString().split('T')[0], severity: 'info', summary: 'Monetary Policy Committee maintains repo rate. Home and car loan EMIs remain stable.' }
      ];
    }
  },

  // --- NOTIFICATIONS API ---
  async getNotifications() {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      const list = await request(`/notifications?userId=${userId}`);
      return list.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        is_read: n.isRead,
        date: n.createdAt ? n.createdAt.substring(0, 10) : 'Today'
      }));
    } catch (e) {
      return getLocal(`finos_notifications_${userId}`, []);
    }
  },

  async markNotificationRead(id) {
    const sess = await this.getSession();
    const userId = sess ? sess.user.id : 1;

    try {
      await request(`/notifications/${id}/read?userId=${userId}`, { method: 'POST' });
    } catch (e) {
      let notes = await this.getNotifications();
      notes = notes.map(n => n.id == id ? { ...n, is_read: true } : n);
      setLocal(`finos_notifications_${userId}`, notes);
    }
  }
};
