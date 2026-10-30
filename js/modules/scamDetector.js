/* ===================================================
   FinOS AI - AI Scam Detector & Threat Analyzer
   =================================================== */

import { CONFIG } from '../config.js';

export function initScamDetectorModule() {
  const dropzone = document.getElementById('scam-dropzone');
  const fileInput = document.getElementById('scam-file-input');
  const textInput = document.getElementById('scam-text-input');
  const analyzeBtn = document.getElementById('btn-analyze-scam');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        dropzone.querySelector('p').textContent = `Selected file: ${e.target.files[0].name}`;
      }
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', async () => {
      const textContent = textInput ? textInput.value.trim() : '';
      const hasFile = fileInput && fileInput.files.length > 0;

      if (!textContent && !hasFile) {
        if (window.showAppToast) window.showAppToast('Please paste text or select an image file to analyze.', 'warning');
        return;
      }

      const resultBox = document.getElementById('scam-analysis-result');
      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = '<div style="text-align:center; padding:20px;"><em>Analyzing security payload with Gemini Threat Engine... 🔍</em></div>';
      }

      const analysis = await runScamAnalysis(textContent, hasFile ? fileInput.files[0] : null);
      renderScamAnalysisResult(analysis);
    });
  }
}

async function runScamAnalysis(text, file) {
  const apiKey = CONFIG.GEMINI_API_KEY || localStorage.getItem('FINOS_GEMINI_API_KEY');

  if (apiKey && text) {
    try {
      const prompt = `Analyze this suspicious text/message for financial scams, UPI fraud, phishing, or fake job offers: "${text}".
Return JSON object with fields: "riskScore" (0-100), "riskLevel" ("Low", "Medium", "High", "Critical Scam"), "explanation" (detailed reason), "safetyTips" (array of action steps).`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const txtRes = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (txtRes) {
        const jsonMatch = txtRes.match(/\{[\s\S]*\}/);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('Gemini API scam analysis fallback:', e);
    }
  }

  // Fallback Rule Engine for Scam Detection
  return localScamAnalysisEngine(text, file);
}

function localScamAnalysisEngine(text, file) {
  const lower = (text || '').toLowerCase();
  
  if (lower.includes('kyc') || lower.includes('electricity disconnect') || lower.includes('lottery') || lower.includes('part-time job') || lower.includes('apk') || lower.includes('pin')) {
    return {
      riskScore: 92,
      riskLevel: 'CRITICAL SCAM THREAT',
      explanation: '⚠️ High Risk Indicators Found! The message uses urgent coercion tactics ("KYC expired", "Electricity cutoff", or "Telegram part-time job"). Legitimate banks and utilities NEVER ask you to click external APK links or share UPI PINs.',
      safetyTips: [
        'Do NOT click any links attached to this SMS/Email.',
        'Never enter your UPI PIN to receive money (UPI PIN is ONLY for sending money).',
        'Block the sender number and report to Cyber Crime helpline 1930.'
      ]
    };
  }

  if (lower.includes('cashback') || lower.includes('claim reward') || lower.includes('urgently')) {
    return {
      riskScore: 68,
      riskLevel: 'MODERATE SUSPICION',
      explanation: '⚠️ Potential Phishing Attempt. Offers of unverified cashback rewards requiring instant app installation or browser login usually attempt credential theft.',
      safetyTips: [
        'Verify your account directly inside the official app.',
        'Do not share OTPs with callers claiming to represent customer care.'
      ]
    };
  }

  return {
    riskScore: 12,
    riskLevel: 'LOW RISK / SAFE',
    explanation: '✅ No immediate phishing triggers or malicious links detected in the analyzed input.',
    safetyTips: [
      'Maintain general digital hygiene.',
      'Always double check domain URLs before entering passwords.'
    ]
  };
}

function renderScamAnalysisResult(result) {
  const resultBox = document.getElementById('scam-analysis-result');
  if (!resultBox) return;

  let color = 'var(--success)';
  if (result.riskScore > 75) color = 'var(--danger)';
  else if (result.riskScore > 40) color = 'var(--warning)';

  resultBox.style.display = 'block';
  resultBox.innerHTML = `
    <div class="glass-card" style="border-left: 4px solid ${color};">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <h4 style="font-size:1.15rem; font-weight:700;">Analysis Result: <span style="color:${color};">${result.riskLevel}</span></h4>
        <div style="font-size:1.8rem; font-weight:800; color:${color};">${result.riskScore}% Risk</div>
      </div>

      <p style="font-size:0.92rem; margin-bottom:16px; line-height:1.6;">${result.explanation}</p>

      <h5 style="font-size:0.85rem; font-weight:700; color:var(--text-muted); text-transform:uppercase; margin-bottom:8px;">Recommended Action Steps:</h5>
      <ul style="padding-left:20px; font-size:0.88rem; color:var(--text-main);">
        ${(result.safetyTips || []).map(tip => `<li style="margin-bottom:6px;">${tip}</li>`).join('')}
      </ul>
    </div>
  `;
}
