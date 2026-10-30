/* ===================================================
   FinOS - Multi-Step Onboarding Module
   =================================================== */

import { db } from '../apiClient.js';
import { navigateTo } from '../app.js';

let currentStep = 1;

export function initOnboardingModule() {
  const wizardForm = document.getElementById('onboarding-wizard-form');
  if (!wizardForm) return;

  const nextBtn = document.getElementById('onboarding-next-btn');
  const prevBtn = document.getElementById('onboarding-prev-btn');

  function updateWizardUI() {
    document.querySelectorAll('.wizard-step-content').forEach((el, index) => {
      el.style.display = (index + 1 === currentStep) ? 'block' : 'none';
    });

    document.querySelectorAll('.wizard-step-item').forEach((item, index) => {
      const stepNum = index + 1;
      item.classList.remove('active', 'completed');
      if (stepNum === currentStep) {
        item.classList.add('active');
      } else if (stepNum < currentStep) {
        item.classList.add('completed');
      }
    });

    if (prevBtn) prevBtn.style.visibility = (currentStep === 1) ? 'hidden' : 'visible';
    if (nextBtn) {
      nextBtn.textContent = (currentStep === 3) ? 'Complete Setup 🚀' : 'Next Step →';
    }
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', async () => {
      if (currentStep < 3) {
        currentStep++;
        updateWizardUI();
      } else {
        // Save Onboarding Profile
        const formData = {
          full_name: document.getElementById('ob-name').value?.trim() || 'User',
          city: document.getElementById('ob-city').value?.trim() || '',
          occupation: document.getElementById('ob-occupation').value?.trim() || '',
          monthly_income: parseFloat(document.getElementById('ob-income').value) || 0,
          monthly_rent: parseFloat(document.getElementById('ob-rent').value) || 0,
          monthly_emi: parseFloat(document.getElementById('ob-emi').value) || 0,
          family_members: parseInt(document.getElementById('ob-family').value) || 1,
          monthly_savings: parseFloat(document.getElementById('ob-savings').value) || 0,
          financial_goal: document.getElementById('ob-goal').value?.trim() || 'Emergency Fund',
          preferred_language: document.getElementById('ob-language').value || 'en',
          onboarding_completed: true
        };

        try {
          await db.updateProfile(formData);
          if (window.showAppToast) window.showAppToast('Financial profile created successfully!', 'success');
          navigateTo('dashboard');
        } catch (err) {
          if (window.showAppToast) window.showAppToast('Failed to save profile: ' + err.message, 'danger');
        }
      }
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateWizardUI();
      }
    });
  }

  updateWizardUI();
}
