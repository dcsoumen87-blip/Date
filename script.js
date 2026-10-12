const app = {
    state: {
        date: '',
        time: '',
        location: '',
        activity: '',
        message: ''
    },
    
    currentStep: 1,

    init() {
        this.setupActivityListeners();
        this.startBackgroundAnimation();
    },

    goToStep(step) {
        // Hide current step
        const currentEl = document.getElementById(`step-${this.currentStep}`);
        currentEl.classList.remove('active');
        
        // Timeout to allow css transition to finish before hiding display
        setTimeout(() => {
            currentEl.classList.add('hidden');
            
            // Show new step
            this.currentStep = step;
            const nextEl = document.getElementById(`step-${step}`);
            nextEl.classList.remove('hidden');
            
            // Tiny delay to trigger CSS transition for opacity/transform
            setTimeout(() => {
                nextEl.classList.add('active');
            }, 10);
            
        }, 300); // 300ms should roughly match CSS transition times (adjusted for feel)
    },

    validateStep2() {
        const dateInput = document.getElementById('date-input').value;
        const timeInput = document.getElementById('time-input').value;
        const errorMsg = document.getElementById('step-2-error');

        if (!dateInput || !timeInput) {
            errorMsg.style.display = 'block';
            return;
        }

        errorMsg.style.display = 'none';
        this.state.date = dateInput;
        this.state.time = timeInput;
        this.state.location = document.getElementById('location-input').value || 'To be decided';
        
        this.goToStep(3);
    },

    setupActivityListeners() {
        const cards = document.querySelectorAll('.activity-card');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                // Deselect all
                cards.forEach(c => {
                    c.classList.remove('selected');
                    c.setAttribute('aria-pressed', 'false');
                });
                
                // Select clicked
                card.classList.add('selected');
                card.setAttribute('aria-pressed', 'true');
                this.state.activity = card.dataset.activity;
                
                // Hide error if present
                document.getElementById('step-3-error').style.display = 'none';
            });
        });
    },

    validateStep3() {
        const errorMsg = document.getElementById('step-3-error');
        if (!this.state.activity) {
            errorMsg.style.display = 'block';
            return;
        }
        errorMsg.style.display = 'none';
        this.goToStep(4);
    },

    generateSummary() {
        this.state.message = document.getElementById('message-input').value;
        
        // Format Date
        const dateObj = new Date(this.state.date);
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = dateObj.toLocaleDateString(undefined, options);

        // Format Time
        const timeParts = this.state.time.split(':');
        const timeObj = new Date();
        timeObj.setHours(timeParts[0], timeParts[1]);
        const formattedTime = timeObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

        const summaryHTML = `
            <p><strong>📅 Date:</strong> ${formattedDate}</p>
            <p><strong>⏰ Time:</strong> ${formattedTime}</p>
            <p><strong>✨ Activity:</strong> ${this.state.activity}</p>
            <p><strong>📍 Location:</strong> ${this.state.location}</p>
            ${this.state.message ? `<p class="summary-message">"${this.state.message}"</p>` : ''}
        `;

        document.getElementById('summary-content').innerHTML = summaryHTML;
        this.goToStep(5);
    },

    copyPlan() {
        const dateObj = new Date(this.state.date);
        const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
        
        const timeParts = this.state.time.split(':');
        const timeObj = new Date();
        timeObj.setHours(timeParts[0], timeParts[1]);
        const formattedTime = timeObj.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit', hour12: true });

        let planText = `Hey! Here is our date plan: ✨\n\n`;
        planText += `📅 When: ${formattedDate} at ${formattedTime}\n`;
        planText += `🎯 What: ${this.state.activity}\n`;
        planText += `📍 Where: ${this.state.location}\n`;
        if (this.state.message) {
            planText += `\n💌 Note: ${this.state.message}`;
        }

        const feedbackEl = document.getElementById('copy-feedback');

        // Clipboard API with Fallback
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(planText)
                .then(() => this.showCopySuccess(feedbackEl))
                .catch(() => this.fallbackCopyTextToClipboard(planText, feedbackEl));
        } else {
            this.fallbackCopyTextToClipboard(planText, feedbackEl);
        }
    },

    fallbackCopyTextToClipboard(text, feedbackEl) {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess(feedbackEl);
            } else {
                feedbackEl.innerText = 'Failed to copy. Please copy manually.';
            }
        } catch (err) {
            feedbackEl.innerText = 'Copy not supported on this browser.';
        }

        document.body.removeChild(textArea);
    },

    showCopySuccess(feedbackEl) {
        feedbackEl.innerText = 'Plan copied to clipboard! 💖';
        const btn = document.getElementById('copy-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '✅ Copied!';
        btn.style.background = '#4CAF50';
        
        setTimeout(() => {
            feedbackEl.innerText = '';
            btn.innerHTML = originalText;
            btn.style.background = 'var(--primary-pink)';
        }, 3000);
    },

    restart() {
        // Reset state
        this.state = { date: '', time: '', location: '', activity: '', message: '' };
        
        // Reset Form Inputs
        document.getElementById('date-input').value = '';
        document.getElementById('time-input').value = '';
        document.getElementById('location-input').value = '';
        document.getElementById('message-input').value = '';
        
        // Reset Activities
        const cards = document.querySelectorAll('.activity-card');
        cards.forEach(c => {
            c.classList.remove('selected');
            c.setAttribute('aria-pressed', 'false');
        });

        // Hide Errors & Feedback
        document.getElementById('step-2-error').style.display = 'none';
        document.getElementById('step-3-error').style.display = 'none';
        document.getElementById('copy-feedback').innerText = '';

        this.goToStep(1);
    },

    startBackgroundAnimation() {
        // Respect prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const container = document.getElementById('animation-container');
        const emojis = ['💖', '✨', '💕', '🌸', '🥂'];

        setInterval(() => {
            const el = document.createElement('div');
            el.classList.add('floating-heart');
            el.innerText = emojis[Math.floor(Math.random() * emojis.length)];
            
            // Randomize position, size, and duration
            el.style.left = Math.random() * 100 + 'vw';
            el.style.fontSize = (Math.random() * 20 + 10) + 'px';
            el.style.animationDuration = (Math.random() * 4 + 4) + 's';
            
            container.appendChild(el);

            // Clean up DOM
            setTimeout(() => {
                el.remove();
            }, 8000);
        }, 600); // Generate new element every 600ms
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
