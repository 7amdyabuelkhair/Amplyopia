document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('report-content');
    const btnVision = document.getElementById('btn-report-vision');
    const btnLazy = document.getElementById('btn-report-lazy');
    const userNameEl = document.getElementById('report-user-name');

    if (!container || !btnVision || !btnLazy) return;

    let currentUserName = '';

    function setActive(button) {
        [btnVision, btnLazy].forEach(b => b.classList.remove('primary'));
        if (button) button.classList.add('primary');
    }

    function displayVisionReport(latest, title = 'Vision Test') {
        const when = latest.when ? new Date(latest.when) : new Date();

        const rightLog = Number(latest.rightLogmar ?? NaN);
        const leftLog = Number(latest.leftLogmar ?? NaN);

        const rightOverall = Number.isFinite(rightLog)
            ? (rightLog <= 0.1 ? 'Normal' : rightLog <= 0.3 ? 'Mild Amblyopia' : 'Moderate Amblyopia')
            : 'N/A';
        const leftOverall = Number.isFinite(leftLog)
            ? (leftLog <= 0.1 ? 'Normal' : leftLog <= 0.3 ? 'Mild Amblyopia' : 'Moderate Amblyopia')
            : 'N/A';

        const weakerEye =
            Number.isFinite(rightLog) && Number.isFinite(leftLog)
                ? (rightLog > leftLog ? 'Right eye' : leftLog > rightLog ? 'Left eye' : 'Both eyes similar')
                : '—';

        const diff =
            Number.isFinite(rightLog) && Number.isFinite(leftLog)
                ? Math.abs(rightLog - leftLog) * 100
                : null;

        let summaryText = '';
        if (!Number.isFinite(rightLog) || !Number.isFinite(leftLog)) {
            summaryText = 'Vision test summary available, but detailed values are incomplete.';
        } else if (Math.abs(rightLog - leftLog) < 0.1) {
            summaryText =
                'Both eyes show similar visual acuity. Continue regular eye exercises to maintain good vision.';
        } else {
            const strongerEye = rightLog > leftLog ? 'Left eye' : 'Right eye';
            summaryText = `${weakerEye} is approximately ${diff.toFixed(
                0
            )}% weaker than the ${strongerEye}. Training games can be focused on the weaker eye to improve its strength.`;
        }

        const dateStr = when.toISOString().split('T')[0];
        const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const patientAge = latest.patientAge ? ` (Age: ${latest.patientAge})` : '';

        container.innerHTML = `
            <div class="vt-result" style="margin:0;">
                <div class="result-summary">${summaryText}</div>
                <div class="results-table-container">
                    <h3>${title}${patientAge}</h3>
                    <div class="test-info">
                        <span>Date: ${dateStr}</span>
                        <span>Time: ${timeStr}</span>
                    </div>
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Right Eye</th>
                                <th>Left Eye</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Visual Acuity</td>
                                <td>${latest.rightEye ?? '-'}</td>
                                <td>${latest.leftEye ?? '-'}</td>
                            </tr>
                            <tr>
                                <td>Visual Acuity (LogMAR)</td>
                                <td>${Number.isFinite(rightLog) ? rightLog.toFixed(1) : '-'}</td>
                                <td>${Number.isFinite(leftLog) ? leftLog.toFixed(1) : '-'}</td>
                            </tr>
                            <tr class="overall-result">
                                <td><strong>Overall Result</strong></td>
                                <td>${rightOverall}</td>
                                <td>${leftOverall}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    function displayVisionGraph(results) {
        const sortedResults = [...results].sort((a, b) => new Date(a.when || 0) - new Date(b.when || 0));

        const labels = sortedResults.map(r => {
            const date = new Date(r.when || Date.now());
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const rightLogmarData = sortedResults.map(r => {
            const val = Number(r.rightLogmar);
            return Number.isFinite(val) ? val : null;
        });

        const leftLogmarData = sortedResults.map(r => {
            const val = Number(r.leftLogmar);
            return Number.isFinite(val) ? val : null;
        });

        if (window.visionChartInstance) {
            window.visionChartInstance.destroy();
        }

        container.innerHTML = `
            <div class="vt-result" style="margin:0;">
                <div class="results-table-container">
                    <h3>Vision Test Progress</h3>
                    <p style="margin-bottom: 20px; color: var(--text-muted);">
                        Lower LogMAR values indicate better vision. This graph shows your personal results over time.
                    </p>
                    <canvas id="visionChart" style="max-height: 400px;"></canvas>
                </div>
            </div>
        `;

        const ctx = document.getElementById('visionChart').getContext('2d');
        window.visionChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: 'Right Eye (LogMAR)',
                        data: rightLogmarData,
                        borderColor: 'rgb(255, 99, 132)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        tension: 0.4,
                        fill: false
                    },
                    {
                        label: 'Left Eye (LogMAR)',
                        data: leftLogmarData,
                        borderColor: 'rgb(54, 162, 235)',
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        tension: 0.4,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: 'Your Vision Test Results Over Time',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: { display: true, position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: { display: true, text: 'LogMAR (Lower is Better)' }
                    },
                    x: {
                        title: { display: true, text: 'Test Date' }
                    }
                }
            }
        });
    }

    async function loadVisionReport() {
        if (!currentUserName) {
            container.innerHTML = '<p>Please sign in to view your reports.</p>';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = '<p>Loading your vision test results…</p>';

        try {
            if (window.VisionDB?.initFirebase) window.VisionDB.initFirebase();

            const results = await window.VisionDB?.getVisionResultsByPatientName(currentUserName);
            if (!results || results.length === 0) {
                container.innerHTML =
                    '<p>No vision tests found for your profile yet. Complete a vision test to see results here.</p>';
                return;
            }

            window.currentSearchResults = results;

            if (results.length > 1) {
                displayVisionGraph(results);
                const listHtml = results.map((result, index) => {
                    const when = result.when ? new Date(result.when) : new Date();
                    const dateStr = when.toISOString().split('T')[0];
                    const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    return `
                        <div class="test-date-item">
                            <div class="test-date-info">
                                <span class="test-date">${dateStr}</span>
                                <span class="test-time">${timeStr}</span>
                            </div>
                            <button type="button" class="btn-view-report" data-result-index="${index}">View Report</button>
                        </div>
                    `;
                }).join('');

                container.insertAdjacentHTML('beforeend', `
                    <div class="results-table-container" style="margin-top:24px;">
                        <h3>All Vision Tests</h3>
                        <div class="test-dates-list">${listHtml}</div>
                    </div>
                `);

                container.querySelectorAll('.btn-view-report').forEach(btn => {
                    btn.addEventListener('click', function () {
                        const index = parseInt(this.getAttribute('data-result-index'), 10);
                        displayVisionReport(results[index], 'Vision Test Report');
                    });
                });
            } else {
                displayVisionReport(results[0], 'Latest Vision Test');
            }
        } catch (e) {
            console.error('Error loading vision results:', e);
            container.innerHTML = '<p>Could not load your vision test results. Please try again later.</p>';
        }
    }

    async function displayLazyEyeGraph() {
        try {
            if (window.LazyDB?.initLazyFirebase) window.LazyDB.initLazyFirebase();

            const results = await window.LazyDB?.getLazySessionsByPatientName(currentUserName);
            if (!results || results.length === 0) return;

            const sortedResults = [...results].sort((a, b) => new Date(a.when || 0) - new Date(b.when || 0));
            const labels = sortedResults.map(r => {
                const date = new Date(r.when || Date.now());
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            const totalScores = sortedResults.map(r => (typeof r.sessionTotal === 'number' ? r.sessionTotal : 0));

            if (window.lazyChartInstance) window.lazyChartInstance.destroy();

            const graphBlock = document.createElement('div');
            graphBlock.style.marginTop = '24px';
            graphBlock.innerHTML = `
                <div class="results-table-container">
                    <h3>Training Progress</h3>
                    <canvas id="lazyChart" style="max-height: 400px;"></canvas>
                </div>
            `;
            container.appendChild(graphBlock);

            const ctx = document.getElementById('lazyChart').getContext('2d');
            window.lazyChartInstance = new Chart(ctx, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Total Score',
                        data: totalScores,
                        borderColor: 'rgb(75, 192, 192)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Your Lazy Eye Training Scores Over Time',
                            font: { size: 16, weight: 'bold' }
                        }
                    },
                    scales: {
                        y: { beginAtZero: true, title: { display: true, text: 'Total Score' } },
                        x: { title: { display: true, text: 'Session Date' } }
                    }
                }
            });
        } catch (e) {
            console.warn('Could not load lazy eye graph:', e);
        }
    }

    async function loadLazyReport() {
        if (!currentUserName) {
            container.innerHTML = '<p>Please sign in to view your reports.</p>';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = '<p>Loading your lazy eye training results…</p>';

        try {
            if (window.LazyDB?.initLazyFirebase) window.LazyDB.initLazyFirebase();

            const sessions = await window.LazyDB?.getLazySessionsByPatientName(currentUserName);
            if (!sessions || sessions.length === 0) {
                container.innerHTML =
                    '<p>No lazy eye training sessions found for your profile yet. Complete the Lazy Eye games to see results here.</p>';
                return;
            }

            const latest = sessions[0];
            const when = latest.when ? new Date(latest.when) : new Date();
            const games = Array.isArray(latest.games) ? latest.games : [];
            const sessionTotal = typeof latest.sessionTotal === 'number'
                ? latest.sessionTotal
                : games.reduce((sum, g) => sum + (typeof g.score === 'number' ? g.score : 0), 0);

            const dateStr = when.toISOString().split('T')[0];
            const timeStr = when.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

            const rows = games.map(g => `
                <tr>
                    <td>Level ${g.level ?? '-'}</td>
                    <td>${g.gameName ?? '-'}</td>
                    <td>${typeof g.score === 'number' ? g.score : '-'}</td>
                </tr>
            `).join('');

            container.innerHTML = `
                <div class="vt-result" style="margin:0;">
                    <div class="result-summary">
                        Your most recent lazy eye training session. Total score across all games: <strong>${sessionTotal}</strong>.
                    </div>
                    <div class="results-table-container">
                        <h3>Latest Lazy Eye Session</h3>
                        <div class="test-info">
                            <span>Date: ${dateStr}</span>
                            <span>Time: ${timeStr}</span>
                        </div>
                        <table class="results-table">
                            <thead>
                                <tr>
                                    <th>Level</th>
                                    <th>Game</th>
                                    <th>Score</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rows || '<tr><td colspan="3">No game scores found.</td></tr>'}
                                <tr class="overall-result">
                                    <td colspan="2"><strong>Total Score</strong></td>
                                    <td><strong>${sessionTotal}</strong></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            if (sessions.length > 1) await displayLazyEyeGraph();
        } catch (e) {
            console.error('Error loading lazy eye session:', e);
            container.innerHTML = '<p>Could not load your lazy eye training results. Please try again later.</p>';
        }
    }

    btnVision.addEventListener('click', () => {
        setActive(btnVision);
        loadVisionReport();
    });

    btnLazy.addEventListener('click', () => {
        setActive(btnLazy);
        loadLazyReport();
    });

    document.getElementById('back-btn')?.addEventListener('click', () => {
        if (window.history.length > 1) window.history.back();
        else window.location.href = 'dashboard.html';
    });

    async function init() {
        const yearEl = document.getElementById('year');
        if (yearEl) yearEl.textContent = String(new Date().getFullYear());

        const session = await window.SupabaseApp?.waitForSession?.(20, 400);
        if (!session?.user?.id) {
            window.location.replace('index.html');
            return;
        }

        let profile = null;
        try {
            profile = await window.SupabaseApp.getProfile(session.user.id);
        } catch (_) {}

        window.AuthProfile?.cacheProfile?.(profile);
        currentUserName = profile?.name || localStorage.getItem('userName') || '';
        const gender = profile?.gender || localStorage.getItem('userGender');
        if (gender) {
            window.Profile?.applyThemeFromGender?.(gender);
            window.Branding?.applyFromGender?.(gender);
        }

        if (userNameEl) userNameEl.textContent = currentUserName || 'your account';

        setActive(btnVision);
        await loadVisionReport();
    }

    init();
});
