/**
 * AI Service — Modular provider strategy pattern.
 * Switch providers by setting AI_PROVIDER env var: mock | openai | gemini
 */

import fs from 'fs';
import path from 'path';

/* ─── Mock Provider ──────────────────────────────────────────────────────── */
class MockAIProvider {
  async extractText(_filePath, _mimeType) {
    return 'Extracted text: Patient Name: John Doe. Medication: Metformin 500mg twice daily. Allergy: Penicillin. Diagnosis: Type 2 Diabetes Mellitus. Date: 2024-01-15.';
  }

  async analyzeDocument(text) {
    return {
      medicines: ['Metformin 500mg', 'Amlodipine 5mg'],
      allergies: ['Penicillin', 'Sulfa drugs'],
      diseases: ['Type 2 Diabetes Mellitus', 'Hypertension'],
      conditions: ['Elevated HbA1c', 'Mild hypertension'],
      warnings: ['Avoid NSAIDs — potential renal risk with Metformin'],
      summary: 'Patient is on oral hypoglycemic therapy for Type 2 Diabetes. Blood pressure management with Amlodipine. Known allergy to Penicillin-class antibiotics.',
      rawText: text
    };
  }

  async generateEmergencySummary(profile) {
    const allergies = profile?.allergies?.length > 0 ? profile.allergies.join(', ') : 'None documented';
    const medications = profile?.currentMedications?.length > 0 ? profile.currentMedications.join(', ') : 'None documented';
    const diseases = profile?.chronicDiseases?.length > 0 ? profile.chronicDiseases.join(', ') : 'None documented';

    return `EMERGENCY SUMMARY — AI Generated
Blood Group: ${profile?.bloodGroup || 'Unknown'}
Critical Allergies: ${allergies}
Chronic Conditions: ${diseases}
Current Medications: ${medications}
Emergency Info: ${profile?.emergencyInfo || 'None provided'}
⚠ This summary is AI-generated and should be verified with full medical records.`;
  }

  async generateMedicalSummary(profile, records) {
    const allergies = profile?.allergies?.join(', ') || 'None';
    const medications = profile?.currentMedications?.join(', ') || 'None';
    const diseases = profile?.chronicDiseases?.join(', ') || 'None';
    const recordCount = records?.length || 0;

    return `AI Medical Summary
Patient: ${profile?.fullName || 'Unknown'}
Blood Group: ${profile?.bloodGroup || 'Not specified'}
Known Allergies: ${allergies}
Chronic Conditions: ${diseases}
Current Medications: ${medications}
Total Records on File: ${recordCount}
Last Updated: ${new Date().toLocaleDateString()}
⚠ This summary is AI-generated from available records. Always consult healthcare professionals.`;
  }
}

/* ─── OpenAI Provider ────────────────────────────────────────────────────── */
class OpenAIProvider {
  constructor() {
    this.apiKey = process.env.AI_API_KEY;
    this.model = 'gpt-4o';
  }

  async extractText(filePath, mimeType) {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: this.apiKey });

      if (mimeType.startsWith('image/')) {
        const imageData = fs.readFileSync(filePath);
        const base64 = imageData.toString('base64');
        const response = await openai.chat.completions.create({
          model: this.model,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: 'Extract all text from this medical document. Return the raw text only.' },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
            ]
          }],
          max_tokens: 2000
        });
        return response.choices[0]?.message?.content || '';
      }

      return 'Text extraction for PDF requires a PDF parsing library. Please use the image format for OCR.';
    } catch (err) {
      console.error('OpenAI OCR error:', err.message);
      throw new Error('AI OCR failed: ' + err.message);
    }
  }

  async analyzeDocument(text) {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: this.apiKey });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'You are a medical document analyzer. Extract structured information from medical text. Return JSON only.'
        }, {
          role: 'user',
          content: `Analyze this medical text and return JSON with keys: medicines (array), allergies (array), diseases (array), conditions (array), warnings (array), summary (string). Text: ${text}`
        }],
        response_format: { type: 'json_object' },
        max_tokens: 1000
      });

      return JSON.parse(response.choices[0]?.message?.content || '{}');
    } catch (err) {
      console.error('OpenAI analysis error:', err.message);
      throw new Error('AI analysis failed: ' + err.message);
    }
  }

  async generateEmergencySummary(profile) {
    if (!this.apiKey) throw new Error('OpenAI API key not configured');
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({ apiKey: this.apiKey });

      const profileText = JSON.stringify({
        bloodGroup: profile?.bloodGroup,
        allergies: profile?.allergies,
        chronicDiseases: profile?.chronicDiseases,
        currentMedications: profile?.currentMedications,
        emergencyInfo: profile?.emergencyInfo
      });

      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: 'Generate a concise emergency medical summary for first responders. Be brief, clear, and critical-information-first. Include a disclaimer that this is AI-generated.'
        }, {
          role: 'user',
          content: `Patient profile: ${profileText}`
        }],
        max_tokens: 500
      });

      return response.choices[0]?.message?.content || '';
    } catch (err) {
      console.error('OpenAI emergency summary error:', err.message);
      throw new Error('AI emergency summary failed: ' + err.message);
    }
  }

  async generateMedicalSummary(profile, records) {
    const mock = new MockAIProvider();
    return mock.generateMedicalSummary(profile, records);
  }
}

/* ─── Gemini Provider ────────────────────────────────────────────────────── */
class GeminiProvider {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
  }

  async extractText(filePath, mimeType) {
    if (!this.apiKey) throw new Error('Gemini API key not configured');
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      if (mimeType.startsWith('image/')) {
        const imageData = fs.readFileSync(filePath);
        const base64 = imageData.toString('base64');
        const result = await model.generateContent([
          'Extract all text from this medical document. Return the raw text only.',
          { inlineData: { mimeType, data: base64 } }
        ]);
        return result.response.text();
      }

      return 'PDF text extraction requires a PDF parsing library.';
    } catch (err) {
      console.error('Gemini OCR error:', err.message);
      throw new Error('Gemini OCR failed: ' + err.message);
    }
  }

  async analyzeDocument(text) {
    if (!this.apiKey) throw new Error('Gemini API key not configured');
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Analyze this medical text and return a JSON object with keys: medicines (array of strings), allergies (array), diseases (array), conditions (array), warnings (array), summary (string). Medical text: ${text}`;
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch (err) {
      console.error('Gemini analysis error:', err.message);
      throw new Error('Gemini analysis failed: ' + err.message);
    }
  }

  async generateEmergencySummary(profile) {
    if (!this.apiKey) throw new Error('Gemini API key not configured');
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(this.apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `Generate a concise emergency medical summary for first responders from this patient profile. Be brief, critical-information-first. Profile: ${JSON.stringify(profile)}`;
      const result = await model.generateContent(prompt);
      return result.response.text() + '\n\n⚠ AI-generated. Verify with medical records.';
    } catch (err) {
      console.error('Gemini emergency summary error:', err.message);
      throw new Error('Gemini emergency summary failed: ' + err.message);
    }
  }

  async generateMedicalSummary(profile, records) {
    const mock = new MockAIProvider();
    return mock.generateMedicalSummary(profile, records);
  }
}

/* ─── Factory ────────────────────────────────────────────────────────────── */
function getProvider() {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();
  switch (provider) {
    case 'openai': return new OpenAIProvider();
    case 'gemini': return new GeminiProvider();
    default: return new MockAIProvider();
  }
}

const aiService = {
  /**
   * Extract text from an uploaded medical document (OCR).
   * @param {string} filePath — absolute path to the file
   * @param {string} mimeType — file MIME type
   */
  async extractText(filePath, mimeType) {
    return getProvider().extractText(filePath, mimeType);
  },

  /**
   * Analyze extracted text and return structured medical information.
   * @param {string} text — raw extracted text
   */
  async analyzeDocument(text) {
    return getProvider().analyzeDocument(text);
  },

  /**
   * Generate a concise emergency summary for first responders.
   * @param {object} profile — PatientProfile document
   */
  async generateEmergencySummary(profile) {
    return getProvider().generateEmergencySummary(profile);
  },

  /**
   * Generate a full medical summary for the patient dashboard.
   * @param {object} profile — PatientProfile document
   * @param {Array} records — MedicalRecord documents
   */
  async generateMedicalSummary(profile, records) {
    return getProvider().generateMedicalSummary(profile, records);
  }
};

export default aiService;
