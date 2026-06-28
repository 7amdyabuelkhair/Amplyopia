(() => {
    const video = document.getElementById('vt-video');
    const startBtn = document.getElementById('vt-start');
    const retryBtn = document.getElementById('vt-retry');
    const distanceStatus = document.getElementById('distance-status');
    const attentionEl = document.getElementById('attention-status');
    const warningEl = document.getElementById('vt-warning');
    const stageEl = document.getElementById('vt-stage');
    const letterEl = document.getElementById('vt-letter');
    const resultEl = document.getElementById('vt-result');
    const toggleCamBtn = document.getElementById('toggle-camera');
    const eyeBadge = document.getElementById('vt-eye-badge');
    const eyeBadgeText = document.getElementById('vt-eye-badge-text');
    const levelProgress = document.getElementById('vt-level-progress');
    const levelLabel = document.getElementById('vt-level-label');
    const questionLabel = document.getElementById('vt-question-label');
    const eyeModal = document.getElementById('vt-eye-modal');
    const modalTitle = document.getElementById('vt-modal-title');
    const modalText = document.getElementById('vt-modal-text');
    const modalSteps = document.getElementById('vt-modal-steps');
    const modalConfirm = document.getElementById('vt-modal-confirm');
    const modalAvatar = document.getElementById('vt-modal-avatar');
    const aiLoading = document.getElementById('vt-ai-loading');
    const aiNotes = document.getElementById('vt-ai-notes');

    if (!video || !startBtn || !distanceStatus || !stageEl || !letterEl) return;

    const SYMBOLS_PER_LEVEL = 5;
    const PASS_THRESHOLD = 0.8;
    const idealMin = 0.30;
    const idealMax = 0.50;

    const levels = window.VisionStats?.buildAcuityLevels?.() || [];
    const rotations = { up: 270, right: 0, down: 90, left: 180 };

    let streamActive = false;
    let testActive = false;
    let model = null;
    let detectionRunning = false;
    let direction = 'up';
    let currentEye = 'right';
    let currentLevelIndex = 0;
    let levelQuestionIndex = 0;
    let levelCorrectCount = 0;
    let questionShownAt = null;
    let modalResolve = null;

    const questionHistory = [];
    const levelResultsByEye = { right: [], left: [] };
    let rightEyeFeatures = null;
    let leftEyeFeatures = null;
    let overallFeatures = null;
    let aiAnalysis = null;

    (function ensureChildInfo() {
        const userName = localStorage.getItem('userName');
        const userAge = localStorage.getItem('userAge');
        if (!userName || !userAge) {
            console.warn('Child profile not found in storage. Open the main page and complete sign-in/profile first.');
        }
        applyVisionTheme();
    })();

    function applyVisionTheme() {
        const gender = String(localStorage.getItem('userGender') || '').toLowerCase();
        const theme = gender === 'boy' ? 'boy' : gender === 'girl' ? 'girl' : 'guest';
        document.body.classList.remove('vt-theme-guest', 'vt-theme-boy', 'vt-theme-girl');
        document.body.classList.add(`vt-theme-${theme}`);
        document.documentElement.classList.remove('vt-theme-guest', 'vt-theme-boy', 'vt-theme-girl');
        document.documentElement.classList.add(`vt-theme-${theme}`);

        if (gender && window.Profile?.applyThemeFromGender) {
            window.Profile.applyThemeFromGender(gender);
        }
        if (gender && window.Branding?.applyFromGender) {
            window.Branding.applyFromGender(gender);
        }

        const charLeft = document.querySelector('.vt-deco--char-left-img');
        const charRight = document.querySelector('.vt-deco--char-right-img');
        const avatar = document.querySelector('.vt-info-avatar');

        const assets = {
            guest: { left: 'images/logo/giraffe.png', right: 'images/logo/lion.png', avatar: 'vision-img/boy-avatar.png' },
            boy: { left: 'vision-img/rocket.png', right: 'images/boy.png', avatar: 'vision-img/boy-avatar.png' },
            girl: { left: 'images/girl.png', right: 'vision-img/bunny.png', avatar: 'vision-img/girl-avatar.png' }
        };
        const pack = assets[theme] || assets.guest;
        if (charLeft) charLeft.src = pack.left;
        if (charRight) charRight.src = pack.right;
        if (avatar) avatar.src = pack.avatar;
        if (modalAvatar) modalAvatar.src = pack.avatar;

        document.querySelectorAll('.vt-theme-guest-only').forEach(el => {
            el.style.display = theme === 'guest' ? '' : 'none';
        });
        document.querySelectorAll('.vt-theme-boy-only').forEach(el => {
            el.style.display = theme === 'boy' ? '' : 'none';
        });
        document.querySelectorAll('.vt-theme-girl-only').forEach(el => {
            el.style.display = theme === 'girl' ? '' : 'none';
        });
    }

    window.addEventListener('storage', (e) => {
        if (e.key === 'userGender') applyVisionTheme();
    });

    function parseDistanceMeters() {
        const text = distanceStatus?.textContent || '';
        const match = text.match(/([0-9]+\.[0-9]+)/);
        return match ? parseFloat(match[1]) : null;
    }

    function parseAttentionPct() {
        const text = attentionEl?.textContent || '';
        const match = text.match(/([0-9]+\.?[0-9]*)/);
        return match ? parseFloat(match[1]) : null;
    }

    function pickDirection() {
        const dirs = ['up', 'down', 'left', 'right'];
        direction = dirs[Math.floor(Math.random() * dirs.length)];
        letterEl.textContent = 'C';
        letterEl.style.transform = `rotate(${rotations[direction]}deg)`;
        questionShownAt = performance.now();
    }

    function setSymbolSize() {
        const step = levels[currentLevelIndex];
        if (!step || !letterEl) return;
        letterEl.style.fontSize = step.symbolSizePx + 'px';
    }

    function updateProgressUI() {
        const step = levels[currentLevelIndex];
        if (levelLabel) levelLabel.textContent = step ? `Level ${currentLevelIndex + 1} · ${step.acuityTarget}` : '';
        if (questionLabel) questionLabel.textContent = `Question ${levelQuestionIndex + 1} of ${SYMBOLS_PER_LEVEL}`;
    }

    function updateEyeBadge() {
        if (!eyeBadge || !eyeBadgeText) return;
        eyeBadge.hidden = !testActive;
        const coverEye = currentEye === 'right' ? 'left' : 'right';
        eyeBadgeText.textContent = `Testing ${currentEye} eye — cover your ${coverEye} eye`;
    }

    const readyBadge = document.getElementById('ready-badge');
    function setReadyState(isReady) {
        if (!readyBadge) return;
        readyBadge.textContent = isReady ? 'Ready' : 'Adjust';
        readyBadge.classList.toggle('ready', isReady);
        readyBadge.classList.toggle('adjust', !isReady);
    }

    function updateDistanceStatus(distanceMeters) {
        if (!Number.isFinite(distanceMeters)) {
            distanceStatus.textContent = 'Distance: No face detected';
            distanceStatus.classList.remove('distance-ok', 'distance-bad');
            setReadyState(false);
            return;
        }
        distanceStatus.textContent = `Distance: ${distanceMeters.toFixed(2)} m`;
        const inRange = distanceMeters >= idealMin && distanceMeters <= idealMax;
        distanceStatus.classList.toggle('distance-ok', inRange);
        distanceStatus.classList.toggle('distance-bad', !inRange);
        if (!testActive) {
            if (!inRange) {
                warningEl.textContent = 'Please move farther or closer to the screen to start the test.';
                setReadyState(false);
            } else {
                warningEl.textContent = '';
                setReadyState(true);
            }
        }
    }

    function showEyeModal(testEye) {
        return new Promise((resolve) => {
            modalResolve = resolve;
            const coverEye = testEye === 'right' ? 'left' : 'right';
            const coverSide = coverEye === 'left' ? 'Left' : 'Right';
            const testSide = testEye === 'right' ? 'Right' : 'Left';

            if (modalTitle) modalTitle.textContent = testEye === 'right' ? 'Right Eye First!' : 'Left Eye Next!';
            if (modalText) {
                modalText.textContent = testEye === 'right'
                    ? 'We will test your right eye first. Please cover your left eye completely.'
                    : 'Great job! Now we will test your left eye. Please cover your right eye completely.';
            }
            if (modalSteps) {
                modalSteps.innerHTML = [
                    `Close or cover your ${coverSide} eye with your hand`,
                    'Keep the uncovered eye looking at the screen',
                    `Press the button when you are ready to start the ${testSide} eye test`
                ].map(s => `<li>${s}</li>`).join('');
            }
            if (eyeModal) eyeModal.hidden = false;
        });
    }

    function hideEyeModal() {
        if (eyeModal) eyeModal.hidden = true;
        if (modalResolve) {
            modalResolve();
            modalResolve = null;
        }
    }

    modalConfirm?.addEventListener('click', hideEyeModal);

    async function waitForVideoReady() {
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) return;
        await new Promise((resolve) => {
            video.addEventListener('loadedmetadata', resolve, { once: true });
        });
    }

    async function enableCamera() {
        try {
            if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
                warningEl.textContent = 'Camera requires HTTPS. Please enable SSL on your domain.';
                return;
            }
            if (!navigator.mediaDevices?.getUserMedia) {
                warningEl.textContent = 'Camera API not available in this browser.';
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
                audio: false
            });
            video.srcObject = stream;
            streamActive = true;
            document.querySelector('.vt-camera').style.display = 'block';
            warningEl.textContent = '';
            try { await video.play(); } catch (_) {}
            await waitForVideoReady();

            if (!model && window.faceLandmarksDetection && window.tf) {
                try {
                    await tf.ready();
                    model = await faceLandmarksDetection.load(
                        faceLandmarksDetection.SupportedPackages.mediapipeFacemesh
                    );
                } catch (e) {
                    console.warn('Face model optional load failed:', e);
                }
            }
            detectionLoop();
        } catch (e) {
            console.error('Camera access error:', e);
            if (e?.name === 'NotAllowedError' || e?.name === 'SecurityError') {
                warningEl.textContent = 'Camera permission denied. Click Toggle Camera and allow access.';
            } else {
                warningEl.textContent = `Unable to access camera: ${e.message || e.name || 'Unknown error'}.`;
            }
        }
    }

    function disableCamera() {
        const stream = video.srcObject;
        if (stream?.getTracks) stream.getTracks().forEach(t => t.stop());
        video.srcObject = null;
        streamActive = false;
        const cam = document.querySelector('.vt-camera');
        if (cam) cam.style.display = 'none';
    }

    function estimateDistance(face) {
        const focalLength = 4.15;
        const sensorWidth = 6.4;
        const faceWidth = 160;
        const imageFaceWidth = Math.max(1, face.right - face.left);
        const cameraResolutionWidth = video.videoWidth || 640;
        const distanceMm = (faceWidth * focalLength) / (imageFaceWidth * (sensorWidth / cameraResolutionWidth));
        return distanceMm / 1000;
    }

    function estimateGazeForward(face) {
        const cx = (face.left + face.right) / 2;
        const cy = (face.top + face.bottom) / 2;
        const nx = cx / (video.videoWidth || 640) - 0.5;
        const ny = cy / (video.videoHeight || 480) - 0.5;
        const centered = Math.abs(nx) < 0.18 && Math.abs(ny) < 0.18;
        const w = face.right - face.left;
        const h = face.bottom - face.top;
        const ratio = w / Math.max(1, h);
        return centered && ratio > 0.7 && ratio < 1.4;
    }

    function toFaceBox(pred) {
        if (pred.box?.topLeft && pred.box?.bottomRight) {
            const tl = pred.box.topLeft;
            const br = pred.box.bottomRight;
            return { left: tl[0], top: tl[1], right: br[0], bottom: br[1] };
        }
        if (pred.topLeft && pred.bottomRight) {
            const tl = Array.isArray(pred.topLeft) ? pred.topLeft : [pred.topLeft[0], pred.topLeft[1]];
            const br = Array.isArray(pred.bottomRight) ? pred.bottomRight : [pred.bottomRight[0], pred.bottomRight[1]];
            return { left: tl[0], top: tl[1], right: br[0], bottom: br[1] };
        }
        const pts = pred.scaledMesh || pred.mesh || [];
        if (pts.length) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const p of pts) {
                if (p[0] < minX) minX = p[0];
                if (p[1] < minY) minY = p[1];
                if (p[0] > maxX) maxX = p[0];
                if (p[1] > maxY) maxY = p[1];
            }
            return { left: minX, top: minY, right: maxX, bottom: maxY };
        }
        return { left: 0, top: 0, right: 0, bottom: 0 };
    }

    function detectionLoop() {
        if (!model || !streamActive || detectionRunning) return;
        detectionRunning = true;
        const step = async () => {
            if (!model || !streamActive) { detectionRunning = false; return; }
            try {
                const predictions = await model.estimateFaces({ input: video, returnTensors: false, flipHorizontal: false, predictIrises: false });
                if (predictions?.length > 0) {
                    const face = toFaceBox(predictions[0]);
                    const distance = estimateDistance(face);
                    updateDistanceStatus(distance);
                    const looking = estimateGazeForward(face);
                    if (!looking && !testActive) {
                        warningEl.textContent = 'Please face the camera for accurate results.';
                        setReadyState(false);
                    } else if (!testActive) {
                        const ok = Number.isFinite(distance) && distance >= idealMin && distance <= idealMax;
                        if (ok) warningEl.textContent = '';
                        setReadyState(ok);
                    }
                } else if (!testActive) {
                    updateDistanceStatus(NaN);
                    warningEl.textContent = 'No face detected. Make sure your face is visible.';
                    setReadyState(false);
                }
            } catch (e) {
                console.error('Face detection error:', e);
            }
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    }

    toggleCamBtn?.addEventListener('click', () => {
        if (streamActive) disableCamera();
        else enableCamera();
    });

    window.addEventListener('load', () => {
        if (startBtn) startBtn.disabled = false;
    });

    function resetTestState() {
        questionHistory.length = 0;
        levelResultsByEye.right = [];
        levelResultsByEye.left = [];
        rightEyeFeatures = null;
        leftEyeFeatures = null;
        overallFeatures = null;
        aiAnalysis = null;
        currentLevelIndex = 0;
        levelQuestionIndex = 0;
        levelCorrectCount = 0;
    }

    function beginEyeSession() {
        currentLevelIndex = 0;
        levelQuestionIndex = 0;
        levelCorrectCount = 0;
        levelResultsByEye[currentEye] = [];
        if (levelProgress) levelProgress.hidden = false;
        updateEyeBadge();
        setSymbolSize();
        updateProgressUI();
        pickDirection();
    }

    async function startTest() {
        resetTestState();
        testActive = false;
        startBtn.hidden = true;
        retryBtn.hidden = true;
        resultEl.hidden = true;
        if (aiNotes) aiNotes.hidden = true;
        currentEye = 'right';

        await showEyeModal('right');
        testActive = true;
        beginEyeSession();
    }

    function recordAnswer(answer) {
        const step = levels[currentLevelIndex];
        const responseTime = questionShownAt != null
            ? Math.round(((performance.now() - questionShownAt) / 1000) * 100) / 100
            : null;
        const correct = answer === direction;

        const record = {
            eye: currentEye,
            level: currentLevelIndex,
            acuityTarget: step?.acuityTarget ?? '',
            logmarTarget: step?.logmarTarget ?? null,
            symbolSizePx: step?.symbolSizePx ?? null,
            symbolSizeMm: step?.symbolSizeMm ?? null,
            direction,
            answer,
            correct,
            responseTime,
            viewingDistance: parseDistanceMeters(),
            attention: parseAttentionPct(),
            timestamp: Date.now()
        };
        questionHistory.push(record);

        if (correct) levelCorrectCount += 1;
        levelQuestionIndex += 1;

        if (levelQuestionIndex >= SYMBOLS_PER_LEVEL) {
            finishLevel();
        } else {
            updateProgressUI();
            pickDirection();
        }
    }

    function finishLevel() {
        const step = levels[currentLevelIndex];
        const accuracy = levelCorrectCount / SYMBOLS_PER_LEVEL;
        const levelResult = {
            level: currentLevelIndex,
            acuityTarget: step.acuityTarget,
            logmarTarget: step.logmarTarget,
            correct: levelCorrectCount,
            total: SYMBOLS_PER_LEVEL,
            accuracy,
            passThreshold: PASS_THRESHOLD
        };
        levelResultsByEye[currentEye].push(levelResult);

        const passed = accuracy >= PASS_THRESHOLD;
        const isLastLevel = currentLevelIndex >= levels.length - 1;

        if (passed && !isLastLevel) {
            currentLevelIndex += 1;
            levelQuestionIndex = 0;
            levelCorrectCount = 0;
            setSymbolSize();
            updateProgressUI();
            pickDirection();
        } else {
            endEyeTest();
        }
    }

    async function endEyeTest() {
        if (currentEye === 'right') {
            testActive = false;
            if (levelProgress) levelProgress.hidden = true;
            if (eyeBadge) eyeBadge.hidden = true;

            await showEyeModal('left');
            currentEye = 'left';
            testActive = true;
            beginEyeSession();
        } else {
            await endTest();
        }
    }

    function fmtNum(v, digits = 2) {
        return Number.isFinite(v) ? v.toFixed(digits) : '—';
    }

    function classifyScreening(logmar) {
        if (!Number.isFinite(logmar)) return '—';
        if (logmar <= 0.1) return 'Within normal screening range';
        if (logmar <= 0.3) return 'Mild reduction detected';
        return 'Moderate reduction detected';
    }

    async function endTest() {
        testActive = false;
        startBtn.hidden = false;
        retryBtn.hidden = false;
        resultEl.hidden = false;
        if (levelProgress) levelProgress.hidden = true;
        if (eyeBadge) eyeBadge.hidden = true;

        rightEyeFeatures = window.VisionStats.computeEyeFeatures(
            'right', questionHistory, levelResultsByEye.right, levels
        );
        leftEyeFeatures = window.VisionStats.computeEyeFeatures(
            'left', questionHistory, levelResultsByEye.left, levels
        );
        overallFeatures = window.VisionStats.computeOverallFeatures(
            rightEyeFeatures, leftEyeFeatures, questionHistory
        );

        const patientAge = parseInt(localStorage.getItem('userAge') || '0', 10) || null;
        const testData = {
            patientAge,
            rightEyeFeatures,
            leftEyeFeatures,
            overallFeatures,
            completeQuestionHistory: questionHistory
        };

        if (aiLoading) aiLoading.hidden = false;
        const geminiResult = await window.GeminiVision?.analyzeVisionTest?.(testData);
        if (aiLoading) aiLoading.hidden = true;

        aiAnalysis = geminiResult?.ok ? geminiResult.analysis : geminiResult?.fallback;
        renderResults(testData, geminiResult);

        const payload = {
            when: new Date().toISOString(),
            rightEye: aiAnalysis?.rightEyeAcuityEstimate || rightEyeFeatures.estimatedAcuity,
            leftEye: aiAnalysis?.leftEyeAcuityEstimate || leftEyeFeatures.estimatedAcuity,
            rightLogmar: aiAnalysis?.rightLogmarEstimate ?? rightEyeFeatures.estimatedLogmar,
            leftLogmar: aiAnalysis?.leftLogmarEstimate ?? leftEyeFeatures.estimatedLogmar,
            rightEyeFeatures,
            leftEyeFeatures,
            overallFeatures,
            completeQuestionHistory: questionHistory,
            aiAnalysis
        };

        try {
            await window.VisionDB?.saveVisionResult(payload);
            await window.Score?.addPoints?.({
                game_id: 'vision-test:completed',
                points: 10,
                meta: { rightEye: payload.rightEye, leftEye: payload.leftEye }
            });
        } catch (e) {
            console.error('Error saving vision result:', e);
        }
    }

    function renderResults(testData, geminiResult) {
        const summaryEl = document.getElementById('result-summary');
        const tableContainer = document.getElementById('results-table-container');
        const r = testData.rightEyeFeatures;
        const l = testData.leftEyeFeatures;
        const ai = aiAnalysis || {};

        const rightAcuity = ai.rightEyeAcuityEstimate || r.estimatedAcuity;
        const leftAcuity = ai.leftEyeAcuityEstimate || l.estimatedAcuity;
        const rightLogmar = ai.rightLogmarEstimate ?? r.estimatedLogmar;
        const leftLogmar = ai.leftLogmarEstimate ?? l.estimatedLogmar;

        if (summaryEl) {
            summaryEl.textContent = ai.screeningSummary
                || 'Test complete. Review the screening report below.';
        }

        if (aiNotes) {
            const notes = [];
            if (ai.recommendations?.length) {
                notes.push('<strong>Recommendations:</strong><ul>' +
                    ai.recommendations.map(n => `<li>${n}</li>`).join('') + '</ul>');
            }
            if (ai.dataQualityAssessment) {
                notes.push(`<strong>Data quality:</strong> ${ai.dataQualityAssessment}`);
            }
            if (ai.clinicalNotes) {
                notes.push(`<em>${ai.clinicalNotes}</em>`);
            }
            if (!geminiResult?.ok && geminiResult?.error) {
                notes.push(`<small>AI note: ${geminiResult.error}</small>`);
            }
            aiNotes.innerHTML = notes.join('');
            aiNotes.hidden = notes.length === 0;
        }

        if (tableContainer) {
            tableContainer.hidden = false;
            const now = new Date();
            document.getElementById('test-date').textContent = `Date: ${now.toISOString().split('T')[0]}`;
            document.getElementById('test-time').textContent = `Time: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

            document.getElementById('right-distance').textContent = fmtNum(r.viewingDistanceAverage);
            document.getElementById('left-distance').textContent = fmtNum(l.viewingDistanceAverage);
            document.getElementById('right-acuity').textContent = rightAcuity;
            document.getElementById('left-acuity').textContent = leftAcuity;
            document.getElementById('right-logmar').textContent = fmtNum(rightLogmar, 2);
            document.getElementById('left-logmar').textContent = fmtNum(leftLogmar, 2);
            document.getElementById('right-accuracy').textContent = fmtNum(r.accuracy * 100, 0);
            document.getElementById('left-accuracy').textContent = fmtNum(l.accuracy * 100, 0);
            document.getElementById('right-attention').textContent = fmtNum(r.attentionScore, 1);
            document.getElementById('left-attention').textContent = fmtNum(l.attentionScore, 1);
            document.getElementById('right-response').textContent = fmtNum(r.averageResponseTime);
            document.getElementById('left-response').textContent = fmtNum(l.averageResponseTime);

            const rightOverall = ai.weakerEye === 'right'
                ? 'Weaker eye (screening)'
                : classifyScreening(rightLogmar);
            const leftOverall = ai.weakerEye === 'left'
                ? 'Weaker eye (screening)'
                : classifyScreening(leftLogmar);
            document.getElementById('right-overall').textContent = rightOverall;
            document.getElementById('left-overall').textContent = leftOverall;
        }
    }

    startBtn.addEventListener('click', async () => {
        if (!streamActive && navigator.mediaDevices?.getUserMedia) {
            try { await enableCamera(); } catch (_) {}
        }
        await startTest();
    });

    retryBtn.addEventListener('click', async () => {
        if (!streamActive && navigator.mediaDevices?.getUserMedia) {
            try { await enableCamera(); } catch (_) {}
        }
        await startTest();
    });

    document.querySelectorAll('.vt-controls .btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (!testActive) return;
            const answer = btn.getAttribute('data-dir');
            recordAnswer(answer);
        });
    });
})();
