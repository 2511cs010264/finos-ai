/* ===================================================
   FinOS - Emergency Fund Planner Engine
   Calculates safety cushion based on rent, EMIs, & essentials
   =================================================== */

import { db } from '../apiClient.js';

export async function renderEmergencyFund() {
  const profile = await db.getProfile();
  const goals = await db.getGoals();

  const rent = parseFloat(profile.monthly_rent || 0);
  const emi = parseFloat(profile.monthly_emi || 0);
  const essentialEst = 10000; // groceries, utility bills baseline

  const monthlyEssentialTotal = rent + emi + essentialEst;
  const target3Months = monthlyEssentialTotal * 3;
  const target6Months = monthlyEssentialTotal * 6;

  // Check emergency goal savings
  const emgGoals = goals.filter(g => (g.category || '').toLowerCase() === 'emergency');
  const currentSaved = emgGoals.reduce((sum, g) => sum + parseFloat(g.current_amount || 0), 0);

  const percent3M = target3Months > 0 ? Math.min(100, Math.round((currentSaved / target3Months) * 100)) : 0;
  const percent6M = target6Months > 0 ? Math.min(100, Math.round((currentSaved / target6Months) * 100)) : 0;

  const rentEl = document.getElementById('emg-rent-display');
  const emiEl = document.getElementById('emg-emi-display');
  const essentialEl = document.getElementById('emg-essential-display');
  const monthlyTotalEl = document.getElementById('emg-monthly-total');
  
  const target3MEl = document.getElementById('emg-target-3m');
  const target6MEl = document.getElementById('emg-target-6m');
  const savedEl = document.getElementById('emg-current-saved');
  const percent3MEl = document.getElementById('emg-percent-3m');
  const progress3MBar = document.getElementById('emg-progress-3m-bar');

  const recEl = document.getElementById('emg-monthly-rec');

  if (rentEl) rentEl.textContent = `₹${rent.toLocaleString()}`;
  if (emiEl) emiEl.textContent = `₹${emi.toLocaleString()}`;
  if (essentialEl) essentialEl.textContent = `₹${essentialEst.toLocaleString()}`;
  if (monthlyTotalEl) monthlyTotalEl.textContent = `₹${monthlyEssentialTotal.toLocaleString()}`;

  if (target3MEl) target3MEl.textContent = `₹${target3Months.toLocaleString()}`;
  if (target6MEl) target6MEl.textContent = `₹${target6Months.toLocaleString()}`;
  if (savedEl) savedEl.textContent = `₹${currentSaved.toLocaleString()}`;
  if (percent3MEl) percent3MEl.textContent = `${percent3M}%`;
  if (progress3MBar) progress3MBar.style.width = `${percent3M}%`;

  if (recEl) {
    const deficit3M = Math.max(0, target3Months - currentSaved);
    const recMonthly6 = Math.round(deficit3M / 6);
    const recMonthly12 = Math.round(deficit3M / 12);

    recEl.innerHTML = deficit3M > 0
      ? `💡 To reach your 3-month safety cushion in 6 months, set aside <strong>₹${recMonthly6.toLocaleString()}/month</strong>. Or save <strong>₹${recMonthly12.toLocaleString()}/month</strong> over 12 months in your Emergency Goal.`
      : (target3Months > 0
        ? `🎉 Congratulations! Your 3-month emergency cushion is 100% funded! Continue expanding towards the 6-month safety pool (₹${target6Months.toLocaleString()}).`
        : `Please complete your profile details (Rent & EMI) in Settings to calculate your accurate Emergency Safety Cushion.`);
  }
}
