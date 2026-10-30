/* ===================================================
   FinOS - User Profile & Settings Manager
   =================================================== */

import { db } from '../apiClient.js';

export async function initProfileModule() {
  renderProfileData();

  // Save Profile Form
  const profileForm = document.getElementById('profile-edit-form');
  if (profileForm) {
    const newProfileForm = profileForm.cloneNode(true);
    profileForm.parentNode.replaceChild(newProfileForm, profileForm);

    newProfileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const updates = {
        full_name: document.getElementById('prof-name').value?.trim(),
        city: document.getElementById('prof-city').value?.trim(),
        occupation: document.getElementById('prof-occupation').value?.trim(),
        monthly_income: parseFloat(document.getElementById('prof-income').value) || 0,
        monthly_rent: parseFloat(document.getElementById('prof-rent').value) || 0,
        monthly_emi: parseFloat(document.getElementById('prof-emi').value) || 0,
        financial_goal: document.getElementById('prof-goal').value?.trim(),
        preferred_language: document.getElementById('prof-language').value || 'en'
      };

      try {
        await db.updateProfile(updates);
        if (window.showAppToast) window.showAppToast('Profile details updated!', 'success');
        renderProfileData();
      } catch (err) {
        if (window.showAppToast) window.showAppToast('Failed to save profile: ' + err.message, 'danger');
      }
    });
  }
}

export async function renderProfileData() {
  const profile = await db.getProfile();

  const nameInput = document.getElementById('prof-name');
  const cityInput = document.getElementById('prof-city');
  const occInput = document.getElementById('prof-occupation');
  const incInput = document.getElementById('prof-income');
  const rentInput = document.getElementById('prof-rent');
  const emiInput = document.getElementById('prof-emi');
  const goalInput = document.getElementById('prof-goal');
  const langInput = document.getElementById('prof-language');

  if (nameInput) nameInput.value = profile.full_name || '';
  if (cityInput) cityInput.value = profile.city || '';
  if (occInput) occInput.value = profile.occupation || '';
  if (incInput) incInput.value = profile.monthly_income || 0;
  if (rentInput) rentInput.value = profile.monthly_rent || 0;
  if (emiInput) emiInput.value = profile.monthly_emi || 0;
  if (goalInput) goalInput.value = profile.financial_goal || '';
  if (langInput) langInput.value = profile.preferred_language || 'en';
}
