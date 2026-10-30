/* ===================================================
   FinOS - Application Configuration & REST API Endpoints
   =================================================== */

export const CONFIG = {
  API_BASE_URL: 'http://localhost:8080/api',
  APP_NAME: 'FinOS',
  TAGLINE: 'Predict. Plan. Protect.',
  DEFAULT_CURRENCY: '₹'
};

export const INITIAL_USER_PROFILE = {
  id: null,
  full_name: '',
  city: '',
  occupation: '',
  monthly_income: 0,
  monthly_rent: 0,
  monthly_emi: 0,
  family_members: 1,
  monthly_savings: 0,
  financial_goal: '',
  preferred_language: 'en',
  theme: 'dark',
  currency: '₹',
  onboarding_completed: false
};