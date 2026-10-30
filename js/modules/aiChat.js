/* ===================================================
   FinOS AI - Gemini AI Financial Advisor & Chatbot
   =================================================== */

import { CONFIG } from '../config.js';
import { db } from '../supabaseClient.js';

export function initAIChatModule() {
  const chatForm = document.getElementById('chat-input-form');
  const chatInput = document.getElementById('chat-input-text');
  const chatMessages = document.getElementById('chat-messages');

  if (chatForm && chatInput) {
    chatForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      appendChatMessage(text, 'user');
      chatInput.value = '';

      const typingId = appendTypingIndicator();
      const reply = await queryGeminiFinancialAdvisor(text);
      removeTypingIndicator(typingId);

      appendChatMessage(reply, 'ai');
    });
  }

  // Shortcut Chips Handlers
  document.querySelectorAll('.shortcut-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const query = chip.textContent.trim();
      if (chatInput) {
        chatInput.value = query;
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  });
}

function appendChatMessage(msg, sender) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;
  bubble.innerHTML = sender === 'ai' 
    ? `<strong>FinOS AI Advisor:</strong><br>${formatMarkdownResponse(msg)}`
    : msg;

  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
}

function appendTypingIndicator() {
  const container = document.getElementById('chat-messages');
  if (!container) return null;
  const id = 'typing_' + Date.now();
  const bubble = document.createElement('div');
  bubble.id = id;
  bubble.className = 'chat-bubble ai';
  bubble.innerHTML = '<em>FinOS AI is analyzing your financial metrics... 🤖</em>';
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeTypingIndicator(id) {
  if (id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }
}

async function queryGeminiFinancialAdvisor(userPrompt) {
  const profile = await db.getProfile();
  const transactions = await db.getTransactions();
  const subscriptions = await db.getSubscriptions();

  const apiKey = CONFIG.GEMINI_API_KEY || localStorage.getItem('FINOS_GEMINI_API_KEY');

  const contextPrompt = `
You are FinOS AI, a Senior FinTech Advisor helping middle-class and lower-income families achieve financial stability.
User Financial Profile:
- Monthly Income: ₹${profile.monthly_income}
- Monthly Rent: ₹${profile.monthly_rent}
- Monthly EMI: ₹${profile.monthly_emi}
- Monthly Savings Target: ₹${profile.monthly_savings}
- Active Subscriptions Total: ₹${subscriptions.reduce((a,b)=>a+b.monthly_cost,0)}/mo
- Active Subscriptions List: ${subscriptions.map(s => s.name + ' (₹' + s.monthly_cost + ')').join(', ')}

User Question: "${userPrompt}"

Provide a highly personalized, practical, empathetic, and mathematically accurate financial response. Use bullet points and clear guidance.
`;

  if (apiKey) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: contextPrompt }] }]
        })
      });
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
      console.warn('Gemini API returned no candidates, response was:', data);
    } catch (err) {
      console.warn('Gemini API query error, using local fallback:', err);
    }
  }

  // Local Intelligent Fallback Engine
  return generateLocalSmartResponse(userPrompt, profile, subscriptions);
}

function generateLocalSmartResponse(prompt, profile, subscriptions) {
  const lower = prompt.toLowerCase();
  const income = parseFloat(profile.monthly_income || 65000);
  const rent = parseFloat(profile.monthly_rent || 18000);
  const emi = parseFloat(profile.monthly_emi || 12000);
  const freeMargin = income - rent - emi - 12000;

  if (lower.includes('iphone')) {
    return `Based on your monthly net cashflow margin of **₹${freeMargin.toLocaleString()}**:
- Buying an iPhone (approx ₹79,900) outright would consume **${Math.round((79900/income)*100)}%** of your monthly income.
- 💡 **AI Recommendation:** Avoid purchasing on high-interest EMI. If required for work, set up a dedicated goal saving **₹6,600/month** for 12 months in your FinOS Goals tab before buying.`;
  }
  
  if (lower.includes('spotify')) {
    const spotify = subscriptions.find(s => s.name.toLowerCase().includes('spotify'));
    return `Looking at your active subscriptions:
- Spotify Premium currently costs **₹119/month** (₹1,428/year).
- 💡 **AI Recommendation:** If you also use YouTube Premium or free ad tiers, cancelling Spotify saves ₹1,428 annually. Alternatively, switch to Spotify Family with friends to cut your share to **₹30/month**.`;
  }

  if (lower.includes('vacation')) {
    return `Trip affordability evaluation for your family (${profile.family_members} members):
- Your current monthly surplus is **₹${freeMargin.toLocaleString()}**.
- An estimated budget trip of ₹25,000 is feasible if funded by setting aside **₹4,200/month for 6 months**.
- 💡 **AI Recommendation:** Do not draw from your ₹75,000 Emergency Fund for leisure trips.`;
  }

  if (lower.includes('save') && (lower.includes('5000') || lower.includes('5,000'))) {
    return `Here is a step-by-step 30-day plan to save **₹5,000/month**:
1. ✂️ **Cancel Unused Gym & Redundant Subs:** Pause Gold Gym (₹2,000) & YouTube Premium (₹139) = **+₹2,139/mo**.
2. 🛒 **Grocery Smart List:** Switch supermarket purchases to local wholesalers = **+₹1,500/mo**.
3. ⚡ **Peak Hour Electricity:** Avoid high-power appliances during peak rate hours = **+₹400/mo**.
4. 🚗 **Car Pooling:** Car pool 2 days a week = **+₹1,000/mo**.
**Total Monthly Savings unlocked: ₹5,039!**`;
  }

  return `Thank you for asking! Based on your financial profile (Income: ₹${income.toLocaleString()}, Fixed Costs: ₹${(rent+emi).toLocaleString()}):
- Your financial health score is currently in good standing.
- To achieve your financial goal ("${profile.financial_goal}"), keep maintaining your monthly savings discipline of ₹${profile.monthly_savings}.`;
}

function formatMarkdownResponse(txt) {
  return txt
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}
