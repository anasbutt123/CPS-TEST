class CPSTest {
    constructor() {
        this.duration = 5; 
        this.mode = 'timed';
        this.clicks = 0;
        this.startTime = null;
        this.timer = null;
        this.isRunning = false;
        this.isFinished = false;
        this.tool = this.determineTool();

        this.init();
    }

    determineTool() {
        const path = window.location.pathname;
        if (path.includes('kohi')) return 'kohi';
        if (path.includes('butterfly')) return 'butterfly';
        if (path.includes('jitter')) return 'jitter';
        if (path.includes('spacebar')) return 'spacebar';
        return 'home';
    }

    init() {
        this.clickArea = document.getElementById('click-area');
        this.resultDashboard = document.getElementById('results-dashboard');
        this.durationBtns = document.querySelectorAll('.btn-duration');
        this.modeBtns = document.querySelectorAll('.btn-tab');
        
        // Pick up initial state from HTML
        const activeDuration = document.querySelector('.btn-duration.active');
        if (activeDuration) this.duration = parseInt(activeDuration.dataset.seconds);
        
        const activeMode = document.querySelector('.btn-tab.active');
        if (activeMode) this.mode = activeMode.dataset.mode;

        // Live UI elements
        this.liveStats = document.querySelector('.live-stats');
        this.liveCount = document.getElementById('live-clicks-count');
        this.liveCpsDisplay = document.getElementById('live-cps-value');
        this.liveRemaining = document.getElementById('live-time-remaining');
        this.timeBarContainer = document.querySelector('.time-bar-container');
        this.timeBar = document.querySelector('.time-bar');
        this.clickHint = document.querySelector('.click-hint');
        this.clickIcon = document.querySelector('.click-icon');
        this.clickInstruction = document.querySelector('.click-instruction');
        this.durationSelector = document.getElementById('duration-selector');
        this.challengeMessage = document.getElementById('challenge-message');
        this.enduranceMessage = document.getElementById('endurance-message');
        this.enduranceChart = document.getElementById('endurance-chart');
        this.buckets = Array(12).fill(0);

        if (this.clickArea) {
            // Mouse/Touch events
            this.clickArea.addEventListener('mousedown', (e) => {
                if (this.tool !== 'spacebar') {
                    this.handleClick(e);
                }
            });
            this.clickArea.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (this.tool === 'spacebar') {
                    this.handleSpacebarDown();
                } else {
                    this.handleClick(e.touches[0]);
                }
            }, { passive: false });

            if (this.tool === 'spacebar') {
                this.clickArea.addEventListener('touchend', () => {
                    this.handleSpacebarUp();
                });
                this.clickArea.addEventListener('touchcancel', () => {
                    this.handleSpacebarUp();
                });
            }
        }

        // Spacebar events for spacebar tool
        if (this.tool === 'spacebar') {
            document.addEventListener('keydown', (e) => {
                if (e.code === 'Space' && !e.repeat) {
                    e.preventDefault(); // Prevent page scroll
                    this.handleSpacebarDown();
                }
            });
            document.addEventListener('keyup', (e) => {
                if (e.code === 'Space') {
                    this.handleSpacebarUp();
                }
            });
        }

        this.durationBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) return;
                this.setDuration(parseInt(btn.dataset.seconds));
                this.durationBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.reset();
            });
        });

        this.modeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.isRunning) return;
                this.mode = btn.dataset.mode;
                this.modeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Toggle UI based on mode
                if (this.mode === 'challenge') {
                    if (this.durationSelector) this.durationSelector.style.display = 'none';
                    if (this.challengeMessage) this.challengeMessage.style.display = 'flex';
                    if (this.enduranceMessage) this.enduranceMessage.style.display = 'none';
                } else if (this.mode === 'endurance') {
                    if (this.durationSelector) this.durationSelector.style.display = 'none';
                    if (this.challengeMessage) this.challengeMessage.style.display = 'none';
                    if (this.enduranceMessage) this.enduranceMessage.style.display = 'flex';
                    this.duration = 60; // Forced 60s
                } else {
                    if (this.durationSelector) this.durationSelector.style.display = 'flex';
                    if (this.challengeMessage) this.challengeMessage.style.display = 'none';
                    if (this.enduranceMessage) this.enduranceMessage.style.display = 'none';
                    
                    // Restore active duration
                    const activeDuration = document.querySelector('.btn-duration.active');
                    if (activeDuration) this.duration = parseInt(activeDuration.dataset.seconds);
                }

                this.reset();
            });
        });

        document.getElementById('restart-btn')?.addEventListener('click', () => this.reset());
        document.getElementById('mid-test-reset')?.addEventListener('click', () => this.reset());
        document.getElementById('share-btn')?.addEventListener('click', () => this.shareScore());

        // Initial UI Update
        this.updateRecentScoresUI();
        this.updatePersonalBestUI();
    }

    setDuration(seconds) {
        this.duration = seconds;
    }

    handleClick(e) {
        if (this.isFinished) return;

        if (!this.isRunning) {
            this.start();
        }

        this.clicks++;
        this.createClickEffect(e);
        this.updateUI();
        
        // Track Endurance Buckets
        if (this.mode === 'endurance' && this.isRunning) {
            const elapsed = (performance.now() - this.startTime) / 1000;
            const bucketIndex = Math.floor(elapsed / 5);
            if (bucketIndex >= 0 && bucketIndex < 12) {
                this.buckets[bucketIndex]++;
            }
        }

        this.clickArea.classList.add('active');
        setTimeout(() => this.clickArea.classList.remove('active'), 50);

        // Challenge Mode End Condition
        if (this.mode === 'challenge' && this.clicks >= 100) {
            this.finish();
        }
    }

    handleSpacebarDown() {
        if (this.isFinished) return;
        
        if (!this.isRunning) {
            this.start();
        }
        
        this.clicks++;
        
        // Add visual pressed state
        const spacebarKey = document.querySelector('.spacebar-key');
        if (spacebarKey) spacebarKey.classList.add('pressed');
        
        this.updateUI();
        
        // Track Endurance Buckets
        if (this.mode === 'endurance' && this.isRunning) {
            const elapsed = (performance.now() - this.startTime) / 1000;
            const bucketIndex = Math.floor(elapsed / 5);
            if (bucketIndex >= 0 && bucketIndex < 12) {
                this.buckets[bucketIndex]++;
            }
        }

        if (this.clickArea) {
            this.clickArea.classList.add('active');
        }

        if (this.mode === 'challenge' && this.clicks >= 100) {
            this.finish();
        }
    }

    handleSpacebarUp() {
        const spacebarKey = document.querySelector('.spacebar-key');
        if (spacebarKey) spacebarKey.classList.remove('pressed');
        if (this.clickArea) {
            this.clickArea.classList.remove('active');
        }
    }

    createClickEffect(e) {
        if (!this.clickArea) return;
        
        const rect = this.clickArea.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ripple = document.createElement('div');
        ripple.className = 'click-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        
        this.clickArea.appendChild(ripple);
        
        setTimeout(() => ripple.remove(), 600);
    }

    start() {
        this.isRunning = true;
        this.startTime = performance.now();
        
        // Hide initial instructions, show live stats
        if (this.clickIcon) this.clickIcon.style.display = 'none';
        if (this.clickInstruction) this.clickInstruction.style.display = 'none';
        if (this.clickHint) this.clickHint.style.display = 'none';
        if (this.liveStats) this.liveStats.style.display = 'flex';
        if (this.timeBarContainer) this.timeBarContainer.style.display = 'block';
        
        this.timer = setInterval(() => {
            const elapsed = (performance.now() - this.startTime) / 1000;
            
            if (this.mode === 'challenge') {
                // Progress based on clicks
                const progress = Math.min(100, (this.clicks / 100) * 100);
                if (this.liveRemaining) this.liveRemaining.textContent = `${elapsed.toFixed(2)}S ELAPSED`;
                if (this.timeBar) this.timeBar.style.width = `${progress}%`;
                if (this.liveCpsDisplay && elapsed > 0) {
                    this.liveCpsDisplay.textContent = (this.clicks / elapsed).toFixed(1);
                }
            } else {
                // Timed mode logic
                const remaining = Math.max(0, this.duration - elapsed);
                const progress = (remaining / this.duration) * 100;
                
                if (this.liveRemaining) this.liveRemaining.textContent = remaining.toFixed(2) + 'S REMAINING';
                if (this.timeBar) this.timeBar.style.width = `${progress}%`;
                if (this.liveCpsDisplay && elapsed > 0) {
                    this.liveCpsDisplay.textContent = (this.clicks / elapsed).toFixed(1);
                }

                if (remaining <= 0) {
                    this.finish();
                }
            }
        }, 10);
    }

    finish() {
        clearInterval(this.timer);
        this.isRunning = false;
        this.isFinished = true;
        
        const elapsed = (performance.now() - this.startTime) / 1000;
        let finalCps, finalTime;

        if (this.mode === 'challenge') {
            finalTime = elapsed;
            finalCps = (100 / elapsed).toFixed(2);
        } else {
            finalTime = this.duration;
            finalCps = (this.clicks / this.duration).toFixed(2);
        }

        this.finalCps = finalCps;
        this.finalTime = finalTime;

        this.showResults(finalCps, finalTime);
    }

    reset() {
        this.clicks = 0;
        this.isRunning = false;
        this.isFinished = false;
        this.startTime = null;
        clearInterval(this.timer);
        
        if (this.timeBar) this.timeBar.style.width = '100%';
        if (this.timeBarContainer) this.timeBarContainer.style.display = 'none';
        this.buckets = Array(12).fill(0);
        
        // Hide PB Banner and Charts on reset
        const pbBanner = document.getElementById('new-pb-banner');
        if (pbBanner) pbBanner.classList.remove('active');
        if (this.enduranceChart) this.enduranceChart.style.display = 'none';

        // Show instructions, hide live stats
        if (this.clickIcon) this.clickIcon.style.display = 'block';
        if (this.clickInstruction) {
            this.clickInstruction.style.display = 'block';
            this.clickInstruction.textContent = 'Click anywhere here to start';
        }
        if (this.clickHint) {
            this.clickHint.style.display = 'block';
            if (this.mode === 'challenge') {
                this.clickHint.textContent = `First click starts the timer • Hit 100 clicks as fast as you can`;
            } else if (this.mode === 'endurance') {
                this.clickHint.textContent = `First click starts the timer • Survive 60 seconds`;
            } else {
                this.clickHint.textContent = `First click starts the timer • You have ${this.duration} seconds`;
            }
        }
        if (this.liveStats) this.liveStats.style.display = 'none';

        // Ensure PB list updates if mode changed
        this.updatePersonalBestUI();
    }

    updateUI() {
        if (this.liveCount) {
            this.liveCount.textContent = this.clicks;
        }
    }

    showResults(cps, time) {
        // Update dashboard elements directly
        const resClicks = document.getElementById('res-clicks');
        const resTime = document.getElementById('res-time');
        const ratingValue = document.getElementById('res-rating-value');
        const ratingIcon = document.querySelector('.rating-card .icon');

        if (resClicks) resClicks.textContent = this.clicks;
        if (resTime) resTime.textContent = time.toFixed(2) + 's';
        
        const rank = this.getRank(cps);
        if (ratingValue) {
            ratingValue.textContent = rank.name;
            ratingValue.style.color = rank.color;
        }
        if (ratingIcon) {
            ratingIcon.textContent = rank.icon;
            ratingIcon.style.color = rank.color;
        }

        const isNewBest = this.saveScore(cps, time);
        const pbBanner = document.getElementById('new-pb-banner');
        if (pbBanner) {
            if (isNewBest) pbBanner.classList.add('active');
            else pbBanner.classList.remove('active');
        }

        // Show Chart for Endurance
        if (this.mode === 'endurance') {
            this.renderEnduranceChart();
            if (this.enduranceChart) this.enduranceChart.style.display = 'block';
        } else {
            if (this.enduranceChart) this.enduranceChart.style.display = 'none';
        }

        // Update UI panels
        this.updateRecentScoresUI();
        this.updatePersonalBestUI();
    }

    getRank(cps) {
        if (cps < 4) return { name: 'Slow', color: '#9ca3af', icon: '🐢' };
        if (cps < 6) return { name: 'Average', color: '#00f2ff', icon: '⚡' };
        if (cps < 8) return { name: 'Fast', color: '#10b981', icon: '🚀' };
        if (cps < 10) return { name: 'Very Fast', color: '#f59e0b', icon: '🔥' };
        if (cps < 12) return { name: 'Insane', color: '#f59e0b', icon: '🔥' };
        return { name: 'Godlike', color: '#ec4899', icon: '👑' };
    }

    saveScore(cps, time) {
        const scoreData = {
            cps: parseFloat(cps),
            clicks: this.clicks,
            duration: this.mode === 'challenge' ? parseFloat(time.toFixed(2)) : this.duration,
            mode: this.mode,
            tool: this.tool,
            date: new Date().toISOString()
        };

        // Save to Recent Scores (Tool Specific)
        const recentKey = `cps_recent_${this.tool}`;
        let recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
        recent.unshift(scoreData);
        recent = recent.slice(0, 5); // Keep last 5
        localStorage.setItem(recentKey, JSON.stringify(recent));

        // Save to Personal Best (Tool Specific)
        const bestsKey = `cps_bests_${this.tool}`;
        let bests = JSON.parse(localStorage.getItem(bestsKey) || '{}');
        
        let key, isNewBest = false;
        if (this.mode === 'challenge') {
            key = 'challenge_100clicks';
            // For challenge, higher CPS is better
            if (!bests[key] || parseFloat(cps) > bests[key]) {
                bests[key] = parseFloat(cps);
                bests[key + '_time'] = parseFloat(time.toFixed(2));
                isNewBest = true;
            }
        } else {
            key = `${this.mode}_${this.duration}s`;
            if (!bests[key] || parseFloat(cps) > bests[key]) {
                bests[key] = parseFloat(cps);
                isNewBest = true;
            }
        }
        
        if (isNewBest) {
            localStorage.setItem(bestsKey, JSON.stringify(bests));
        }
        
        return isNewBest;
    }

    updateRecentScoresUI() {
        const list = document.getElementById('recent-scores-list');
        if (!list) return;
        
        const recentKey = `cps_recent_${this.tool}`;
        const recent = JSON.parse(localStorage.getItem(recentKey) || '[]');
        list.innerHTML = '';
        
        if (recent.length === 0) {
            list.innerHTML = '<div class="score-row">No scores yet</div>';
            return;
        }

        recent.forEach(score => {
            const row = document.createElement('div');
            row.className = 'score-row';
            row.innerHTML = `
                <div class="mode-info">
                    <span>${score.mode.toUpperCase()}</span>
                    <span>•</span>
                    <span>${score.duration}s</span>
                </div>
                <div class="score-value">${score.cps.toFixed(2)} cps</div>
            `;
            list.appendChild(row);
        });
    }

    updatePersonalBestUI() {
        const list = document.getElementById('pb-list');
        const title = document.getElementById('pb-mode-title');
        if (!list) return;

        if (title) title.textContent = this.mode.toUpperCase();
        
        const bestsKey = `cps_bests_${this.tool}`;
        const bests = JSON.parse(localStorage.getItem(bestsKey) || '{}');
        list.innerHTML = '';

        if (this.mode === 'challenge') {
            const key = 'challenge_100clicks';
            if (bests[key]) {
                const row = document.createElement('div');
                row.className = 'score-row';
                row.innerHTML = `
                    <div class="mode-info">
                        <span>${bests[key + '_time'].toFixed(2)}s</span>
                    </div>
                    <div class="score-value pb-value">${bests[key].toFixed(2)} cps</div>
                `;
                list.appendChild(row);
            } else {
                list.innerHTML = '<div class="score-row">No records for this challenge</div>';
            }
        } else {
            // Durations to show in the list for Timed/Endurance
            const durations = [1, 5, 10, 15, 30, 60];
            let hasAny = false;

            durations.forEach(d => {
                const key = `${this.mode}_${d}s`;
                if (bests[key]) {
                    hasAny = true;
                    const row = document.createElement('div');
                    row.className = 'score-row';
                    row.innerHTML = `
                        <div class="mode-info">
                            <span>${d}s</span>
                        </div>
                        <div class="score-value pb-value">${bests[key].toFixed(2)} cps</div>
                    `;
                    list.appendChild(row);
                }
            });

            if (!hasAny) {
                list.innerHTML = '<div class="score-row">No records for this mode</div>';
            }
        }
    }

    renderEnduranceChart() {
        const wrapper = document.querySelector('#endurance-chart .bars-wrapper');
        if (!wrapper) return;
        wrapper.innerHTML = '';

        const maxCps = Math.max(...this.buckets.map(b => b / 5), 1); // 5s buckets

        this.buckets.forEach((clicks, i) => {
            const cps = (clicks / 5).toFixed(1);
            const height = (cps / (maxCps * 1.2)) * 100; // Leave some headroom
            const startTime = i * 5;
            const endTime = (i + 1) * 5;

            const barContainer = document.createElement('div');
            barContainer.style.flex = '1';
            barContainer.style.display = 'flex';
            barContainer.style.flexDirection = 'column';
            barContainer.style.alignItems = 'center';
            barContainer.style.justifyContent = 'flex-end';
            barContainer.style.height = '100%';

            barContainer.innerHTML = `
                <span style="font-size: 0.7rem; color: var(--accent-cyan); font-weight: 700; margin-bottom: 5px;">${cps}</span>
                <div style="width: 100%; height: ${height}%; background: linear-gradient(180deg, var(--accent-cyan), rgba(0, 242, 255, 0.2)); border-radius: 4px 4px 0 0; transition: height 1s ease-out;"></div>
                <span style="font-size: 0.6rem; color: var(--text-muted); margin-top: 10px; white-space: nowrap;">${startTime}-${endTime}s</span>
            `;
            wrapper.appendChild(barContainer);
        });
    }

    shareScore() {
        const cps = this.finalCps || "0.00";
        const timeVal = this.mode === 'challenge' ? (this.finalTime ? this.finalTime.toFixed(2) : "0") : this.duration;
        
        const page = window.location.pathname.split('/').pop() || '';
        const link = `cpstest.site/${page}`;
        
        const textToCopy = `I scored ${cps} CPS in ${timeVal}s! Beat me: ${link}`;
        
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                const shareBtn = document.getElementById('share-btn');
                if (shareBtn) {
                    const originalText = shareBtn.innerHTML;
                    shareBtn.innerHTML = '<span>✔️</span> COPIED!';
                    setTimeout(() => shareBtn.innerHTML = originalText, 2000);
                }
            }).catch(console.error);
        } else {
            // Fallback for older browsers or insecure contexts
            const textArea = document.createElement("textarea");
            textArea.value = textToCopy;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                const shareBtn = document.getElementById('share-btn');
                if (shareBtn) {
                    const originalText = shareBtn.innerHTML;
                    shareBtn.innerHTML = '<span>✔️</span> COPIED!';
                    setTimeout(() => shareBtn.innerHTML = originalText, 2000);
                }
            } catch (err) {
                console.error("Fallback clipboard copy failed", err);
            }
            document.body.removeChild(textArea);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.cpsApp = new CPSTest();
});
