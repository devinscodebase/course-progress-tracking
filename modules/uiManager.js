import { Storage } from './storage.js';
import { LessonTracker } from './lessonTracker.js';

export const UIManager = {
  init() {
    this.setupClickHandlers();
    this.initializeButtonText();
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
      
      e.preventDefault();
      const lessonKey = button.getAttribute('ms-code-mark-complete');
      const isComplete = button.classList.contains('yes');
      
      await this.toggleLesson(lessonKey, !isComplete);
    });
  },

  async toggleLesson(lessonKey, completed) {
    // Use LessonTracker instead of Storage directly
    if (completed) {
      await LessonTracker.markComplete(lessonKey);
      this.markLessonComplete(lessonKey);
    } else {
      await LessonTracker.markIncomplete(lessonKey);
      this.markLessonIncomplete(lessonKey);
    }
    
    const data = await Storage.getLessonProgress();
    this.updateAllProgress(data);
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
          div.textContent = 'Ολοκληρώθηκε';
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
          div.textContent = 'ΟΛΟΚΛΗΡΩΣΕ ΤΟ ΜΑΘΗΜΑ';
          el.style.backgroundColor = '';
          el.style.color = '';
        }
        
        const checkbox = el.querySelector('.chapter-menu_check');
        if (checkbox) checkbox.classList.remove('yes');
      }
    });
  },

  updateAllProgress(data) {
    const allButtons = document.querySelectorAll('[ms-code-mark-complete]');
    const courseKeys = new Set();
    allButtons.forEach(btn => {
      const key = btn.getAttribute('ms-code-mark-complete');
      if (key) courseKeys.add(key.split('-')[0].toLowerCase());
    });

    courseKeys.forEach(courseKey => this.updateProgressBar(courseKey, data));
  },

  updateProgressBar(courseKey, data) {
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

    const progressBar = document.querySelector('[data-ms-code="progress-bar"]');
    if (progressBar) progressBar.style.width = progress + '%';

    const progressText = document.querySelector('[data-ms-code="progress-text"]');
    if (progressText) progressText.textContent = `${completed} από τα ${total} ΜΑΘΗΜΑΤΑ ΟΛΟΚΛΗΡΩΜΕΝΑ`;

    const badgeText = document.querySelector('[data-ms-code="badge-text"]');
    if (badgeText) {
      if (progress === 0) badgeText.textContent = 'Δεν ξεκίνησε';
      else if (progress === 100) badgeText.textContent = 'Το μάθημα ολοκληρώθηκε!';
      else badgeText.textContent = `${progress}% Complete`;
    }
  }
};