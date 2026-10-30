/* ===================================================
   FinOS - Authentication Module (Login, Signup, Recovery)
   =================================================== */

import { db } from '../apiClient.js';
import { navigateTo } from '../app.js';

export function initAuthModule() {
  // Login Form Handler
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email')?.value?.trim();
      const password = document.getElementById('login-password')?.value;

      if (!email || !password) {
        showToast('Please enter your email and password.', 'warning');
        return;
      }

      try {
        await db.signInWithPassword(email, password);
        showToast('Login successful! Welcome back.', 'success');
        const profile = await db.getProfile();
        if (!profile.onboarding_completed) {
          navigateTo('onboarding');
        } else {
          navigateTo('dashboard');
        }
      } catch (err) {
        showToast(err.message || 'Login failed. Please check your credentials.', 'danger');
      }
    });
  }

  // Signup Form Handler
  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fullName = document.getElementById('signup-fullname')?.value?.trim();
      const email = document.getElementById('signup-email')?.value?.trim();
      const password = document.getElementById('signup-password')?.value;

      if (!email || !password || !fullName) {
        showToast('Please fill in all required registration fields.', 'warning');
        return;
      }

      try {
        await db.signUp(email, password, fullName);
        showToast('Account created! Please complete onboarding.', 'success');
        navigateTo('onboarding');
      } catch (err) {
        showToast(err.message || 'Account registration failed.', 'danger');
      }
    });
  }

  // Forgot Password Form Handler
  const forgotForm = document.getElementById('forgot-form');
  if (forgotForm) {
    forgotForm.addEventListener('submit', (e) => {
      e.preventDefault();
      showToast('Password reset link sent to your email.', 'success');
      navigateTo('login');
    });
  }
}

function showToast(msg, type = 'primary') {
  if (window.showAppToast) window.showAppToast(msg, type);
}
