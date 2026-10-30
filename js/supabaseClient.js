/* ===================================================
   FinOS AI - Supabase Client & Resilient Auth/Store SDK
   =================================================== */

import { CONFIG, DEFAULT_USER_PROFILE, INITIAL_TRANSACTIONS, INITIAL_SUBSCRIPTIONS, INITIAL_BUDGETS, INITIAL_GOALS, INITIAL_NOTIFICATIONS } from './config.js';

let supabase = null;

// Initialize Supabase if client library script loaded and valid credentials set
try {
  if (window.supabase && CONFIG.SUPABASE_URL.startsWith('https://') && !CONFIG.SUPABASE_URL.includes('xyzcompany')) {
    supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
  }
} catch (e) {
  console.warn('Supabase SDK initialization fallback to Local Store:', e.message);
}

// Local Storage Helper Initialization
function initLocalStorage() {
  if (!localStorage.getItem('finos_profile')) {
    localStorage.setItem('finos_profile', JSON.stringify(DEFAULT_USER_PROFILE));
  }
  if (!localStorage.getItem('finos_transactions')) {
    localStorage.setItem('finos_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
  }
  if (!localStorage.getItem('finos_subscriptions')) {
    localStorage.setItem('finos_subscriptions', JSON.stringify(INITIAL_SUBSCRIPTIONS));
  }
  if (!localStorage.getItem('finos_budgets')) {
    localStorage.setItem('finos_budgets', JSON.stringify(INITIAL_BUDGETS));
  }
  if (!localStorage.getItem('finos_goals')) {
    localStorage.setItem('finos_goals', JSON.stringify(INITIAL_GOALS));
  }
  if (!localStorage.getItem('finos_notifications')) {
    localStorage.setItem('finos_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
  }
}
initLocalStorage();

// Helper: ensure a profiles row exists for this auth user (required by FK constraints)
async function ensureProfileRow(userId, fullName) {
  if (!supabase || !userId) return;
  try {
    const { data: existing } = await supabase.from('profiles').select('id').eq('id', userId).single();
    if (!existing) {
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        full_name: fullName || 'New User'
      });
      if (error) console.warn('Profile row creation failed:', error.message);
    }
  } catch (e) {
    // .single() throws when no row found - attempt insert
    try {
      const { error } = await supabase.from('profiles').insert({
        id: userId,
        full_name: fullName || 'New User'
      });
      if (error) console.warn('Profile row creation failed:', error.message);
    } catch (e2) {
      console.warn('ensureProfileRow failed:', e2.message);
    }
  }
}

export const db = {
  // --- AUTH SERVICES (Resilient & Seamless Demo/Cloud Fallback) ---
  async signUp(email, password, fullName) {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } }
        });
        if (error) throw error;

        // Required: create matching profiles row (transactions/subscriptions/etc. all reference it)
        if (data.user) {
          await ensureProfileRow(data.user.id, fullName);
        }

        return data;
      } catch (err) {
        console.warn('Supabase signup fallback:', err.message);
      }
    }
    const profile = { ...DEFAULT_USER_PROFILE, full_name: fullName || 'Demo User', email };
    localStorage.setItem('finos_user_session', JSON.stringify({ user: { email, id: 'usr_local_1' } }));
    localStorage.setItem('finos_profile', JSON.stringify(profile));
    return { user: { email, id: 'usr_local_1' } };
  },

  async signInWithPassword(email, password) {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data.user) {
          await ensureProfileRow(data.user.id, data.user.user_metadata?.full_name);
        }
        return data;
      } catch (err) {
        console.warn('Supabase login fallback:', err.message);
      }
    }
    // Seamless local authentication fallback for demo & offline
    const currentProfile = JSON.parse(localStorage.getItem('finos_profile')) || DEFAULT_USER_PROFILE;
    const profile = { ...currentProfile, email: email || currentProfile.email };
    localStorage.setItem('finos_user_session', JSON.stringify({ user: { email: profile.email, id: 'usr_local_1' } }));
    localStorage.setItem('finos_profile', JSON.stringify(profile));
    return { user: { email: profile.email, id: 'usr_local_1' } };
  },

  async signInWithOTP(email) {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase OTP fallback:', err.message);
      }
    }
    localStorage.setItem('finos_pending_otp_email', email);
    return { message: 'OTP code sent to email successfully (Demo Code: 123456)' };
  },

  async verifyOTP(email, token) {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.verifyOtp({ email, token, type: 'magiclink' });
        if (error) throw error;
        if (data.user) {
          await ensureProfileRow(data.user.id, data.user.user_metadata?.full_name);
        }
        return data;
      } catch (err) {
        console.warn('Supabase verify OTP fallback:', err.message);
      }
    }
    const profile = JSON.parse(localStorage.getItem('finos_profile')) || DEFAULT_USER_PROFILE;
    localStorage.setItem('finos_user_session', JSON.stringify({ user: { email, id: 'usr_local_1' } }));
    localStorage.setItem('finos_profile', JSON.stringify({ ...profile, email }));
    return { user: { email, id: 'usr_local_1' } };
  },

  async signInWithGoogle() {
    if (supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase Google OAuth fallback:', err.message);
      }
    }
    const profile = { ...DEFAULT_USER_PROFILE, full_name: 'Rahul Sharma (Google)', email: 'rahul.google@finos.ai' };
    localStorage.setItem('finos_user_session', JSON.stringify({ user: { email: 'rahul.google@finos.ai', id: 'usr_google_1' } }));
    localStorage.setItem('finos_profile', JSON.stringify(profile));
    return { user: { email: 'rahul.google@finos.ai' } };
  },

  async signOut() {
    if (supabase) {
      try { await supabase.auth.signOut(); } catch (e) {}
    }
    localStorage.removeItem('finos_user_session');
  },

  async getSession() {
    if (supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) return data.session;
      } catch (e) {}
    }
    const sess = localStorage.getItem('finos_user_session');
    return sess ? JSON.parse(sess) : null;
  },

  // --- PROFILES TABLE ---
  async getProfile() {
    const session = await this.getSession();
    if (!session) return DEFAULT_USER_PROFILE;

    if (supabase) {
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
        if (!error && data) return data;
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem('finos_profile')) || DEFAULT_USER_PROFILE;
  },

  async updateProfile(updates) {
    const session = await this.getSession();
    if (supabase && session) {
      try {
        await supabase.from('profiles').upsert({ id: session.user.id, ...updates, updated_at: new Date() });
      } catch (e) {}
    }
    const current = await this.getProfile();
    const updated = { ...current, ...updates };
    localStorage.setItem('finos_profile', JSON.stringify(updated));
    return updated;
  },

  // --- TRANSACTIONS TABLE ---
  async getTransactions() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
        if (!error && data) return data;
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem('finos_transactions')) || INITIAL_TRANSACTIONS;
  },

  async addTransaction(tx) {
    const newTx = { id: 'tx_' + Date.now(), ...tx };
    if (supabase) {
      try {
        const session = await this.getSession();
        if (session) {
          await supabase.from('transactions').insert([{ ...tx, user_id: session.user.id }]);
        }
      } catch (e) {
        console.warn('addTransaction Supabase insert failed:', e.message);
      }
    }
    const txs = await this.getTransactions();
    txs.unshift(newTx);
    localStorage.setItem('finos_transactions', JSON.stringify(txs));
    return newTx;
  },

  async deleteTransaction(id) {
    if (supabase) {
      try { await supabase.from('transactions').delete().eq('id', id); } catch (e) {}
    }
    let txs = await this.getTransactions();
    txs = txs.filter(t => t.id !== id);
    localStorage.setItem('finos_transactions', JSON.stringify(txs));
    return true;
  },

  // --- SUBSCRIPTIONS TABLE ---
  async getSubscriptions() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('subscriptions').select('*');
        if (!error && data) return data;
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem('finos_subscriptions')) || INITIAL_SUBSCRIPTIONS;
  },

  async addSubscription(sub) {
    const newSub = { id: 'sub_' + Date.now(), ...sub };
    if (supabase) {
      try {
        const session = await this.getSession();
        if (session) {
          await supabase.from('subscriptions').insert([{ ...sub, user_id: session.user.id }]);
        }
      } catch (e) {
        console.warn('addSubscription Supabase insert failed:', e.message);
      }
    }
    const subs = await this.getSubscriptions();
    subs.push(newSub);
    localStorage.setItem('finos_subscriptions', JSON.stringify(subs));
    return newSub;
  },

  async deleteSubscription(id) {
    if (supabase) {
      try { await supabase.from('subscriptions').delete().eq('id', id); } catch (e) {}
    }
    let subs = await this.getSubscriptions();
    subs = subs.filter(s => s.id !== id);
    localStorage.setItem('finos_subscriptions', JSON.stringify(subs));
    return true;
  },

  // --- BUDGETS TABLE ---
  async getBudgets() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('budgets').select('*');
        if (!error && data) return data;
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem('finos_budgets')) || INITIAL_BUDGETS;
  },

  async updateBudget(category, allocatedAmount) {
    if (supabase) {
      try {
        const session = await this.getSession();
        if (session) {
          const monthYear = new Date().toISOString().slice(0, 7); // 'YYYY-MM'
          await supabase.from('budgets').upsert({
            user_id: session.user.id,
            category,
            allocated_amount: allocatedAmount,
            month_year: monthYear
          }, { onConflict: 'user_id,category,month_year' });
        }
      } catch (e) {
        console.warn('updateBudget Supabase upsert failed:', e.message);
      }
    }
    let budgets = await this.getBudgets();
    const idx = budgets.findIndex(b => b.category === category);
    if (idx >= 0) {
      budgets[idx].allocated_amount = allocatedAmount;
    } else {
      budgets.push({ id: 'b_' + Date.now(), category, allocated_amount: allocatedAmount, spent_amount: 0 });
    }
    localStorage.setItem('finos_budgets', JSON.stringify(budgets));
    return budgets;
  },

  // --- GOALS TABLE ---
  async getGoals() {
    if (supabase) {
      try {
        const { data, error } = await supabase.from('goals').select('*');
        if (!error && data) return data;
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem('finos_goals')) || INITIAL_GOALS;
  },

  async addGoal(goal) {
    const newGoal = { id: 'g_' + Date.now(), status: 'active', current_amount: 0, ...goal };
    if (supabase) {
      try {
        const session = await this.getSession();
        if (session) {
          await supabase.from('goals').insert([{ ...goal, status: 'active', current_amount: 0, user_id: session.user.id }]);
        }
      } catch (e) {
        console.warn('addGoal Supabase insert failed:', e.message);
      }
    }
    let goals = await this.getGoals();
    goals.push(newGoal);
    localStorage.setItem('finos_goals', JSON.stringify(goals));
    return newGoal;
  },

  async updateGoalProgress(id, addAmount) {
    let goals = await this.getGoals();
    const idx = goals.findIndex(g => g.id === id);
    if (idx >= 0) {
      goals[idx].current_amount += parseFloat(addAmount);
      if (goals[idx].current_amount >= goals[idx].target_amount) {
        goals[idx].status = 'completed';
      }
      if (supabase) {
        try {
          const session = await this.getSession();
          if (session) {
            await supabase.from('goals').update({
              current_amount: goals[idx].current_amount,
              status: goals[idx].status
            }).eq('id', id);
          }
        } catch (e) {
          console.warn('updateGoalProgress Supabase update failed:', e.message);
        }
      }
    }
    localStorage.setItem('finos_goals', JSON.stringify(goals));
    return goals;
  },

  // --- NOTIFICATIONS TABLE ---
  async getNotifications() {
    if (supabase) {
      try {
        const session = await this.getSession();
        if (session) {
          const { data, error } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
          if (!error && data) return data;
        }
      } catch (e) {}
    }
    return JSON.parse(localStorage.getItem('finos_notifications')) || INITIAL_NOTIFICATIONS;
  },

  async markNotificationRead(id) {
    if (supabase) {
      try {
        await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      } catch (e) {
        console.warn('markNotificationRead Supabase update failed:', e.message);
      }
    }
    let notes = await this.getNotifications();
    notes = notes.map(n => n.id === id ? { ...n, is_read: true } : n);
    localStorage.setItem('finos_notifications', JSON.stringify(notes));
    return notes;
  }
};