(() => {
  function mean(arr) {
    if (!arr.length) return null;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  function median(arr) {
    if (!arr.length) return null;
    const s = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
  }

  function variance(arr) {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return arr.reduce((s, v) => s + (v - m) ** 2, 0) / arr.length;
  }

  function stdDev(arr) {
    return Math.sqrt(variance(arr));
  }

  function logmarToSnellen(logmar) {
    if (!Number.isFinite(logmar)) return '—';
    const denom = Math.round(6 * 10 ** logmar);
    return `6/${denom}`;
  }

  function interpolateThreshold(levelResults, levels) {
    let bestPassed = null;
    let firstFailed = null;

    for (const lr of levelResults) {
      if (lr.accuracy >= lr.passThreshold) bestPassed = lr;
      else if (!firstFailed) firstFailed = lr;
    }

    if (!bestPassed && !firstFailed) {
      return { estimatedLogmar: levels[0]?.logmarTarget ?? 1.0, estimatedAcuity: levels[0]?.acuityTarget ?? '6/60' };
    }

    if (bestPassed && !firstFailed) {
      return {
        estimatedLogmar: bestPassed.logmarTarget,
        estimatedAcuity: bestPassed.acuityTarget
      };
    }

    if (!bestPassed && firstFailed) {
      const acc = firstFailed.accuracy;
      const prev = levels[Math.max(0, firstFailed.level - 1)];
      const lo = prev?.logmarTarget ?? firstFailed.logmarTarget + 0.15;
      const hi = firstFailed.logmarTarget;
      const est = lo + (hi - lo) * acc;
      return { estimatedLogmar: est, estimatedAcuity: logmarToSnellen(est) };
    }

    const lo = bestPassed.logmarTarget;
    const hi = firstFailed.logmarTarget;
    const acc = firstFailed.accuracy;
    const est = lo + (hi - lo) * acc;
    return { estimatedLogmar: est, estimatedAcuity: logmarToSnellen(est) };
  }

  function computeEyeFeatures(eye, questionHistory, levelResults, levels) {
    const rows = questionHistory.filter(q => q.eye === eye);
    const correct = rows.filter(q => q.correct);
    const wrong = rows.filter(q => !q.correct);
    const responseTimes = rows.map(q => q.responseTime).filter(Number.isFinite);
    const distances = rows.map(q => q.viewingDistance).filter(Number.isFinite);
    const attentions = rows.map(q => q.attention).filter(Number.isFinite);

    let longestCorrect = 0;
    let longestWrong = 0;
    let streak = 0;
    let lastCorrect = null;
    for (const q of rows) {
      if (q.correct) {
        streak = lastCorrect === true ? streak + 1 : 1;
        longestCorrect = Math.max(longestCorrect, streak);
      } else {
        streak = lastCorrect === false ? streak + 1 : 1;
        longestWrong = Math.max(longestWrong, streak);
      }
      lastCorrect = q.correct;
    }

    const passedLevels = levelResults.filter(l => l.accuracy >= l.passThreshold);
    const failedLevels = levelResults.filter(l => l.accuracy < l.passThreshold);
    const bestSuccessful = passedLevels.length ? passedLevels[passedLevels.length - 1] : null;
    const highestFailed = failedLevels.length ? failedLevels[0] : null;

    const threshold = interpolateThreshold(levelResults, levels);

    const accuracy = rows.length ? correct.length / rows.length : 0;
    const attMean = mean(attentions);
    const attStd = stdDev(attentions);
    const distMean = mean(distances);
    const distStd = stdDev(distances);

    const rtTrend = rows.length >= 4
      ? mean(rows.slice(-Math.ceil(rows.length / 2)).map(r => r.responseTime)) -
        mean(rows.slice(0, Math.floor(rows.length / 2)).map(r => r.responseTime))
      : 0;

    let confidenceScore = 0.3;
    if (rows.length >= 8) confidenceScore += 0.2;
    if (distMean != null && distMean >= 0.3 && distMean <= 0.5) confidenceScore += 0.15;
    if ((attMean ?? 0) >= 60) confidenceScore += 0.15;
    if (accuracy >= 0.6) confidenceScore += 0.1;
    if (levelResults.length >= 2) confidenceScore += 0.1;
    confidenceScore = Math.min(0.95, confidenceScore);

    return {
      eye,
      totalQuestions: rows.length,
      totalCorrect: correct.length,
      totalWrong: wrong.length,
      accuracy,
      averageResponseTime: mean(responseTimes),
      responseTimeVariance: variance(responseTimes),
      medianResponseTime: median(responseTimes),
      attentionScore: attMean,
      attentionStability: attStd != null ? Math.max(0, 100 - attStd) : null,
      viewingDistanceAverage: distMean,
      viewingDistanceStability: distStd != null ? Math.max(0, 1 - distStd) : null,
      bestSuccessfulLevel: bestSuccessful?.level ?? null,
      highestFailedLevel: highestFailed?.level ?? null,
      longestCorrectStreak: longestCorrect,
      longestWrongStreak: longestWrong,
      confidenceScore,
      performanceTrend: rtTrend,
      estimatedLogmar: threshold.estimatedLogmar,
      estimatedAcuity: threshold.estimatedAcuity,
      levelResults
    };
  }

  function computeOverallFeatures(rightFeatures, leftFeatures, questionHistory) {
    const allRt = questionHistory.map(q => q.responseTime).filter(Number.isFinite);
    const allAcc = questionHistory.map(q => (q.correct ? 1 : 0));
    const logmarDiff = Math.abs((rightFeatures.estimatedLogmar ?? 0) - (leftFeatures.estimatedLogmar ?? 0));
    const eyeConsistency = Math.max(0, 1 - logmarDiff);

    const distOk = [rightFeatures, leftFeatures].every(f =>
      f.viewingDistanceAverage >= 0.3 && f.viewingDistanceAverage <= 0.5
    );
    const attOk = [rightFeatures, leftFeatures].every(f =>
      (f.attentionScore ?? 0) >= 60
    );
    const enoughData = questionHistory.length >= 12;
    let confidence = 0.35;
    if (enoughData) confidence += 0.2;
    if (distOk) confidence += 0.15;
    if (attOk) confidence += 0.15;
    if (eyeConsistency > 0.85) confidence += 0.05;
    confidence = Math.min(0.95, confidence);

    return {
      totalQuestions: questionHistory.length,
      overallAccuracy: allAcc.length ? mean(allAcc) : 0,
      averageResponseTime: mean(allRt),
      eyeConsistency,
      confidenceScore: confidence,
      performanceTrend: mean([rightFeatures.performanceTrend ?? 0, leftFeatures.performanceTrend ?? 0])
    };
  }

  function buildAcuityLevels() {
    const levels = [];
    for (let i = 0; i <= 20; i++) {
      const logmar = Math.round((1.0 - i * 0.05) * 100) / 100;
      const px = Math.max(12, Math.round(44 * 10 ** (logmar - 0.3)));
      const mm = Math.round(17.4 * 10 ** (logmar - 0.3) * 10) / 10;
      const denom = Math.max(6, Math.round(6 * 10 ** logmar));
      levels.push({
        level: i,
        acuityTarget: `6/${denom}`,
        logmarTarget: logmar,
        symbolSizePx: px,
        symbolSizeMm: mm
      });
    }
    return levels;
  }

  window.VisionStats = {
    buildAcuityLevels,
    computeEyeFeatures,
    computeOverallFeatures,
    logmarToSnellen
  };
})();
