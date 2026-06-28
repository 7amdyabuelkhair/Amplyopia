(() => {
  const GEMINI_API_KEY = 'PUT_API_KEY_HERE';
  const GEMINI_MODEL = 'gemini-2.0-flash';

  const SYSTEM_PROMPT = `You are an AI vision screening assistant for a pediatric online vision test app.
This is NOT medical diagnosis — it is AI-powered vision screening support only.

Analyze the structured performance data and estimate visual acuity as accurately as possible given online screening limitations.

Return ONLY valid JSON with this exact shape:
{
  "screeningSummary": "2-3 sentence plain-language summary for parents",
  "rightEyeAcuityEstimate": "e.g. 6/9",
  "leftEyeAcuityEstimate": "e.g. 6/12",
  "rightLogmarEstimate": 0.18,
  "leftLogmarEstimate": 0.30,
  "confidenceLevel": "low|medium|high",
  "confidenceScore": 0.0,
  "recommendations": ["bullet 1", "bullet 2"],
  "clinicalNotes": "brief note that this is screening only, not a diagnosis",
  "weakerEye": "right|left|none|similar",
  "dataQualityAssessment": "comment on attention, distance stability, response patterns"
}`;

  async function analyzeVisionTest(testData) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'PUT_API_KEY_HERE') {
      return {
        ok: false,
        error: 'Gemini API key not configured. Add your key to js/gemini.js',
        fallback: buildLocalFallback(testData)
      };
    }

    const userPayload = JSON.stringify(testData, null, 2);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${SYSTEM_PROMPT}\n\nAnalyze this vision test performance profile:\n${userPayload}` }]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = JSON.parse(text);
      return { ok: true, analysis: parsed, raw: data };
    } catch (e) {
      console.warn('Gemini analysis failed:', e);
      return {
        ok: false,
        error: e?.message || 'Gemini request failed',
        fallback: buildLocalFallback(testData)
      };
    }
  }

  function buildLocalFallback(testData) {
    const r = testData?.rightEyeFeatures || {};
    const l = testData?.leftEyeFeatures || {};
    return {
      screeningSummary: 'AI analysis unavailable. Showing statistical estimates from your test performance.',
      rightEyeAcuityEstimate: r.estimatedAcuity || '—',
      leftEyeAcuityEstimate: l.estimatedAcuity || '—',
      rightLogmarEstimate: r.estimatedLogmar ?? null,
      leftLogmarEstimate: l.estimatedLogmar ?? null,
      confidenceLevel: testData?.overallFeatures?.confidenceScore >= 0.7 ? 'medium' : 'low',
      confidenceScore: testData?.overallFeatures?.confidenceScore ?? 0.5,
      recommendations: ['Repeat the test in good lighting with steady device distance.', 'Consult an eye care professional for clinical assessment.'],
      clinicalNotes: 'This is a screening tool only, not a medical diagnosis.',
      weakerEye: r.estimatedLogmar > l.estimatedLogmar ? 'right' : l.estimatedLogmar > r.estimatedLogmar ? 'left' : 'similar',
      dataQualityAssessment: 'Based on local statistical model only.'
    };
  }

  window.GeminiVision = {
    analyzeVisionTest,
    isConfigured: () => GEMINI_API_KEY && GEMINI_API_KEY !== 'PUT_API_KEY_HERE'
  };
})();
