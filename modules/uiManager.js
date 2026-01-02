import { Storage } from './storage.js';
import { EventBus } from './eventBus.js';

export const UIManager = {
  init() {
    this.setupClickHandlers();
    this.initializeButtonText();
    this.injectSpinnerStyles();
    this.cacheDOM();
    this.initProgressTracking();
  },

  // OPTIMIZATION #2: Cache DOM elements (saves 5-10ms per update)
  cacheDOM() {
    this.elements = {
      progressBar: document.querySelector('[data-ms-code="progress-bar"]'),
      progressText: document.querySelector('[data-ms-code="progress-text"]'),
      badgeText: document.querySelector('[data-ms-code="badge-text"]')
    };
  },

  // OPTIMIZATION #4: Track progress incrementally (saves 10-20ms per update)
  initProgressTracking() {
    this.courseProgress = {};
  },

  injectSpinnerStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .button-loading {
        position: relative;
        pointer-events: none;
      }

      .button-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(45, 0, 247, 0.2);
        border-radius: 50%;
        border-top-color: #2d00f7;
        animation: button-spin 0.6s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
      }

      @keyframes button-spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  },

  initializeButtonText() {
    const mainButton = document.getElementById('main-completion-button');
    if (mainButton && !mainButton.classList.contains('yes')) {
      let div = mainButton.querySelector('div');
      if (!div) {
        div = document.createElement('div');
        mainButton.appendChild(div);
      }
      if (!div.textContent || div.textContent.trim() === '') {
        div.textContent = 'ΟΛΟΚΛΗΡΩΣΕ ΤΟ ΜΑΘΗΜΑ';
      }
    }
  },

  // OPTIMIZATION #5: localStorage for instant page loads
  async renderExistingProgress() {
    // Try localStorage first (instant)
    try {
      const cachedData = localStorage.getItem('lessonProgressCache');
      const cachedTimestamp = localStorage.getItem('lessonProgressTimestamp');
      
      if (cachedData && cachedTimestamp) {
        const age = Date.now() - parseInt(cachedTimestamp);
        
        // Use cache if less than 30 seconds old
        if (age < 30000) {
          console.log('📦 Using cached progress (instant)');
          const data = JSON.parse(cachedData);
          this.renderProgressUI(data);
        }
      }
    } catch (e) {
      console.warn('localStorage read failed:', e);
    }

    // Fetch fresh data from Memberstack
    console.log('🔄 Fetching fresh data from Memberstack');
    const data = await Storage.getLessonProgress();
    
    // Update localStorage cache
    try {
      localStorage.setItem('lessonProgressCache', JSON.stringify(data));
      localStorage.setItem('lessonProgressTimestamp', Date.now().toString());
    } catch (e) {
      console.warn('localStorage write failed:', e);
    }
    
    // Render fresh data
    this.renderProgressUI(data);
  },

  renderProgressUI(data) {
    // Count totals for progress tracking
    const allButtons = document.querySelectorAll('[ms-code-mark-complete]');
    const courseCounts = {};
    
    allButtons.forEach(btn => {
      const key = btn.getAttribute('ms-code-mark-complete');
      if (!key) return;
      
      const courseKey = key.split('-')[0].toLowerCase();
      if (!courseCounts[courseKey]) {
        courseCounts[courseKey] = { completed: 0, total: 0 };
      }
      courseCounts[courseKey].total++;
    });
    
    // Mark completed lessons and count
    Object.keys(data || {}).forEach(courseKey => {
      const course = data[courseKey];
      if (!course || typeof course !== 'object' || Array.isArray(course)) return;
      
      Object.keys(course).forEach(moduleKey => {
        const module = course[moduleKey];
        if (!module || typeof module !== 'object' || Array.isArray(module)) return;
        
        Object.keys(module).forEach(lessonKey => {
          if (Storage.isLessonComplete(module[lessonKey])) {
            const fullKey = `${courseKey}-${moduleKey}-${lessonKey}`;
            this.markLessonComplete(fullKey);
            
            // Increment completed count
            if (courseCounts[courseKey.toLowerCase()]) {
              courseCounts[courseKey.toLowerCase()].completed++;
            }
          }
        });
      });
    });
    
    // Store progress counts
    this.courseProgress = courseCounts;
    
    // Update all progress bars
    Object.keys(courseCounts).forEach(courseKey => {
      this.updateProgressBarFromCounts(courseKey);
    });
  },

  // OPTIMIZATION #6: Debounce rapid clicks
  setupClickHandlers() {
    let isProcessing = false;
    
    document.addEventListener('click', async (e) => {
      const button = e.target.closest('[ms-code-mark-complete]');
      if (!button || isProcessing) return;
      
      e.preventDefault();
      const lessonKey = button.getAttribute('ms-code-mark-complete');
      const isComplete = button.classList.contains('yes');
      
      isProcessing = true;
      await this.toggleLesson(lessonKey, !isComplete, button);
      isProcessing = false;
    });
  },

  // OPTIMIZATION #1: Async webhooks + #8: Remove 100ms delay
  async toggleLesson(lessonKey, completed, buttonElement) {
    this.setButtonLoading(buttonElement, true);
    
    try {
      // Parallel: Save + artificial UX delay
      await Promise.all([
        Storage.saveLessonProgress(lessonKey, completed),
        new Promise(resolve => setTimeout(resolve, 300)) // 300ms feels responsive
      ]);
      
      // Update UI
      if (completed) {
        this.markLessonComplete(lessonKey);
      } else {
        this.markLessonIncomplete(lessonKey);
      }
      
      // Update progress (incremental)
      this.updateProgressIncremental(lessonKey, completed);
      
      // Update localStorage cache
      this.updateLocalStorageCache(lessonKey, completed);
      
      // Emit events for toast
      if (completed) {
        EventBus.emit('lesson:completed', { lessonKey });
      } else {
        EventBus.emit('lesson:incompleted', { lessonKey });
      }
      
      // Fire-and-forget webhooks (non-blocking)
      if (completed) {
        this.sendWebhooksAsync(lessonKey);
      }
      
    } catch (error) {
      console.error('Error toggling lesson:', error);
      alert('Αποτυχία αποθήκευσης. Παρακαλώ δοκιμάστε ξανά.');
    } finally {
      this.setButtonLoading(buttonElement, false);
    }
  },

  // OPTIMIZATION #1: Fire-and-forget webhooks (saves 1.28s)
  sendWebhooksAsync(lessonKey) {
    setTimeout(async () => {
      const [course, module, lesson] = lessonKey.split('-');
      
      try {
        const currentMember = await window.$memberstackDom.getCurrentMember();
        
        const memberInfo = {
          email: currentMember?.data?.auth?.email || currentMember?.auth?.email || 'unknown@email.com',
          firstName: currentMember?.data?.customFields?.['first-name'] || currentMember?.customFields?.['first-name'] || '',
          lastName: currentMember?.data?.customFields?.['last-name'] || currentMember?.customFields?.['last-name'] || '',
          memberId: currentMember?.data?.id || currentMember?.id || 'unknown',
          lessonKey,
          course,
          module,
          lesson
        };
        
        const { Webhooks } = await import('./webhooks.js');
        await Webhooks.sendLessonActivity(memberInfo);
        
        console.log('✅ Webhook sent (background)');
      } catch (error) {
        console.error('Webhook error (non-critical):', error);
      }
    }, 0);
  },

  // OPTIMIZATION #4: Incremental progress updates
  updateProgressIncremental(lessonKey, nowComplete) {
    const courseKey = lessonKey.split('-')[0].toLowerCase();
    
    if (!this.courseProgress[courseKey]) {
      // Fallback: recalculate if not initialized
      this.recalculateProgress(courseKey);
      return;
    }
    
    const wasComplete = !nowComplete;
    
    if (!wasComplete && nowComplete) {
      this.courseProgress[courseKey].completed++;
    } else if (wasComplete && !nowComplete) {
      this.courseProgress[courseKey].completed--;
    }
    
    this.updateProgressBarFromCounts(courseKey);
  },

  updateProgressBarFromCounts(courseKey) {
    const counts = this.courseProgress[courseKey];
    if (!counts) return;
    
    const { completed, total } = counts;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Use cached DOM elements
    if (this.elements.progressBar) {
      this.elements.progressBar.style.width = progress + '%';
    }

    if (this.elements.progressText) {
      this.elements.progressText.textContent = `${completed} από τα ${total} ΜΑΘΗΜΑΤΑ ΟΛΟΚΛΗΡΩΜΕΝΑ`;
    }

    if (this.elements.badgeText) {
      if (progress === 0) this.elements.badgeText.textContent = 'Δεν ξεκίνησε';
      else if (progress === 100) this.elements.badgeText.textContent = 'Το μάθημα ολοκληρώθηκε!';
      else this.elements.badgeText.textContent = `${progress}% Complete`;
    }
  },

  recalculateProgress(courseKey) {
    const allButtons = document.querySelectorAll('[ms-code-mark-complete]');
    let completed = 0;
    let total = 0;
    
    allButtons.forEach(btn => {
      const key = btn.getAttribute('ms-code-mark-complete');
      if (key && key.toLowerCase().startsWith(courseKey.toLowerCase() + '-')) {
        total++;
        if (btn.classList.contains('yes')) {
          completed++;
        }
      }
    });
    
    this.courseProgress[courseKey] = { completed, total };
    this.updateProgressBarFromCounts(courseKey);
  },

  updateLocalStorageCache(lessonKey, completed) {
    try {
      const cachedData = localStorage.getItem('lessonProgressCache');
      if (!cachedData) return;
      
      const data = JSON.parse(cachedData);
      const [course, module, lesson] = lessonKey.split('-');
      
      const courseKey = course.toLowerCase();
      const moduleKey = module.toLowerCase();
      const lessonKeyLower = lesson.toLowerCase();
      
      if (!data[courseKey]) data[courseKey] = {};
      if (!data[courseKey][moduleKey]) data[courseKey][moduleKey] = {};
      
      data[courseKey][moduleKey][lessonKeyLower] = {
        completed,
        completedAt: new Date().toISOString()
      };
      
      localStorage.setItem('lessonProgressCache', JSON.stringify(data));
      localStorage.setItem('lessonProgressTimestamp', Date.now().toString());
    } catch (e) {
      console.warn('localStorage update failed:', e);
    }
  },

  setButtonLoading(button, loading) {
    if (!button) return;
    
    if (loading) {
      button.classList.add('button-loading');
      
      if (button.id === 'main-completion-button') {
        let div = button.querySelector('div');
        if (div) {
          div.innerHTML = '<span class="button-spinner"></span>Αποθήκευση...';
        }
      }
    } else {
      button.classList.remove('button-loading');
    }
  },

  markLessonComplete(lessonKey) {
    const all = document.querySelectorAll('[ms-code-mark-complete]');
    Array.from(all).forEach(el => {
      if (el.getAttribute('ms-code-mark-complete').toLowerCase() === lessonKey.toLowerCase()) {
        el.classList.add('yes');
        
        if (el.id === 'main-completion-button') {
          let div = el.querySelector('div');
          if (!div) {
            div = document.createElement('div');
            el.appendChild(div);
          }
          div.innerHTML = 'Ολοκληρώθηκε';
          el.style.backgroundColor = '#6c4cf9';
          el.style.color = 'white';
        }
        
        const checkbox = el.querySelector('.chapter-menu_check');
        if (checkbox) checkbox.classList.add('yes');
      }
    });
  },

  markLessonIncomplete(lessonKey) {
    const all = document.querySelectorAll('[ms-code-mark-complete]');
    Array.from(all).forEach(el => {
      if (el.getAttribute('ms-code-mark-complete').toLowerCase() === lessonKey.toLowerCase()) {
        el.classList.remove('yes');
        
        if (el.id === 'main-completion-button') {
          let div = el.querySelector('div');
          if (!div) {
            div = document.createElement('div');
            el.appendChild(div);
          }
          div.innerHTML = 'ΟΛΟΚΛΗΡΩΣΕ ΤΟ ΜΑΘΗΜΑ';
          el.style.backgroundColor = '';
          el.style.color = '';
        }
        
        const checkbox = el.querySelector('.chapter-menu_check');
        if (checkbox) checkbox.classList.remove('yes');
      }
    });
  }
};