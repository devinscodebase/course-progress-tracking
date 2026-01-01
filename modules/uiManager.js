import { Storage } from './storage.js';
import { LessonTracker } from './lessonTracker.js';
import { EventBus } from './eventBus.js';

export const UIManager = {
  init() {
    this.setupClickHandlers();
    this.initializeButtonText();
    this.injectSpinnerStyles();
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
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: #ffffff;
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

  async renderExistingProgress() {
    const data = await Storage.getLessonProgress();
    
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
          }
        });
      });
    });

    this.updateAllProgress(data);
  },

  setupClickHandlers() {
    document.addEventListener('click', async (e) => {
      const button = e.target.closest('[ms-code-mark-complete]');
      if (!button) return;
      
      if (button.classList.contains('button-loading')) return;
      
      e.preventDefault();
      const lessonKey = button.getAttribute('ms-code-mark-complete');
      const isComplete = button.classList.contains('yes');
      
      await this.toggleLesson(lessonKey, !isComplete, button);
    });
  },

  async toggleLesson(lessonKey, completed, buttonElement) {
    this.setButtonLoading(buttonElement, true);
    
    try {
      console.log('💾 Saving to Memberstack...');
      await Storage.saveLessonProgress(lessonKey, completed);
      console.log('✅ Saved to Memberstack');
      
      // Small delay to ensure Memberstack persistence
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get fresh data
      console.log('📊 Fetching fresh data...');
      const data = await Storage.getLessonProgress();
      console.log('📦 Fresh data:', data);
      
      // Update UI
      if (completed) {
        this.markLessonComplete(lessonKey);
      } else {
        this.markLessonIncomplete(lessonKey);
      }
      
      // Update progress
      console.log('📈 Updating progress...');
      this.updateAllProgress(data);
      
      // Emit events for toast
      if (completed) {
        EventBus.emit('lesson:completed', { lessonKey });
      } else {
        EventBus.emit('lesson:incompleted', { lessonKey });
      }
      
      // Send webhooks in background
      if (completed) {
        this.sendWebhooks(lessonKey).catch(err => console.error('Webhook error:', err));
      }
      
    } catch (error) {
      console.error('Error toggling lesson:', error);
    } finally {
      this.setButtonLoading(buttonElement, false);
    }
  },

  async sendWebhooks(lessonKey) {
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
      
    } catch (error) {
      console.error('Error sending webhooks:', error);
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
  },

  updateAllProgress(data) {
    console.log('🔄 updateAllProgress called with:', data);
    const allButtons = document.querySelectorAll('[ms-code-mark-complete]');
    const courseKeys = new Set();
    allButtons.forEach(btn => {
      const key = btn.getAttribute('ms-code-mark-complete');
      if (key) courseKeys.add(key.split('-')[0].toLowerCase());
    });

    console.log('📚 Course keys found:', Array.from(courseKeys));
    courseKeys.forEach(courseKey => this.updateProgressBar(courseKey, data));
  },

  updateProgressBar(courseKey, data) {
    console.log(`📊 Updating progress bar for ${courseKey}`);
    const course = data?.[courseKey.toLowerCase()];
    let completed = 0;
    
    if (course) {
      Object.values(course).forEach(module => {
        if (!module || typeof module !== 'object' || Array.isArray(module)) return;
        Object.values(module).forEach(lesson => {
          if (Storage.isLessonComplete(lesson)) completed++;
        });
      });
    }

    const allButtons = document.querySelectorAll('[ms-code-mark-complete]');
    const total = Array.from(allButtons).filter(btn => 
      btn.getAttribute('ms-code-mark-complete').toLowerCase().startsWith(courseKey.toLowerCase() + '-')
    ).length;
    
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    console.log(`📈 Progress: ${completed}/${total} = ${progress}%`);

    const progressBar = document.querySelector('[data-ms-code="progress-bar"]');
    if (progressBar) {
      progressBar.style.width = progress + '%';
      console.log('✅ Progress bar updated');
    } else {
      console.warn('⚠️ Progress bar element not found');
    }

    const progressText = document.querySelector('[data-ms-code="progress-text"]');
    if (progressText) {
      progressText.textContent = `${completed} από τα ${total} ΜΑΘΗΜΑΤΑ ΟΛΟΚΛΗΡΩΜΕΝΑ`;
      console.log('✅ Progress text updated');
    } else {
      console.warn('⚠️ Progress text element not found');
    }

    const badgeText = document.querySelector('[data-ms-code="badge-text"]');
    if (badgeText) {
      if (progress === 0) badgeText.textContent = 'Δεν ξεκίνησε';
      else if (progress === 100) badgeText.textContent = 'Το μάθημα ολοκληρώθηκε!';
      else badgeText.textContent = `${progress}% Complete`;
      console.log('✅ Badge text updated');
    } else {
      console.warn('⚠️ Badge text element not found');
    }
  }
};