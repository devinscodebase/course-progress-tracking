import { Storage } from './storage.js';
import { EventBus } from './eventBus.js';

export const UIManager = {
  init() {
    this.setupClickHandlers();
  },

  async renderExistingProgress() {
    const data = await Storage.getLessonProgress();
    
    // Mark all completed lessons
    Object.keys(data || {}).forEach(courseKey => {
      const course = data[courseKey];
      if (!course || typeof course !== 'object') return;
      
      Object.keys(course).forEach(moduleKey => {
        const module = course[moduleKey];
        if (!module || typeof module !== 'object') return;
        
        Object.keys(module).forEach(lessonKey => {
          const lessonData = module[lessonKey];
          if (Storage.isLessonComplete(lessonData)) {
            const fullKey = `${courseKey}-${moduleKey}-${lessonKey}`;
            this.markLessonComplete(fullKey);
          }
        });
      });
    });

    // Update progress bars
    this.updateAllProgress(data);
  },

  setupClickHandlers() {
    document.addEventListener('click', async (e) => {
      const button = e.target.closest('[ms-code-mark-complete]');
      if (!button) return;
      
      e.preventDefault();
      const lessonKey = button.getAttribute('ms-code-mark-complete');
      const isComplete = button.classList.contains('yes');
      
      if (isComplete) {
        await this.toggleLesson(lessonKey, false);
      } else {
        await this.toggleLesson(lessonKey, true);
      }
    });
  },

  async toggleLesson(lessonKey, completed) {
    await Storage.saveLessonProgress(lessonKey, completed);
    
    if (completed) {
      this.markLessonComplete(lessonKey);
      EventBus.emit('lesson:completed', { lessonKey });
    } else {
      this.markLessonIncomplete(lessonKey);
    }
    
    const data = await Storage.getLessonProgress();
    this.updateAllProgress(data);
  },

  markLessonComplete(lessonKey) {
    document.querySelectorAll(`[ms-code-mark-complete="${lessonKey}"]`).forEach(el => {
      el.classList.add('yes');
      
      // Update button text if it's a button
      if (el.classList.contains('button') || el.tagName === 'A') {
        el.textContent = 'Ολοκληρώθηκε';
        el.style.backgroundColor = '#6c4cf9';
        el.style.color = 'white';
      }
      
      // Update checkbox
      const checkbox = el.querySelector('.chapter-menu_check');
      if (checkbox) checkbox.classList.add('yes');
    });
  },

  markLessonIncomplete(lessonKey) {
    document.querySelectorAll(`[ms-code-mark-complete="${lessonKey}"]`).forEach(el => {
      el.classList.remove('yes');
      
      if (el.classList.contains('button') || el.tagName === 'A') {
        el.textContent = 'ΟΛΟΚΛΗΡΩΣΕ ΤΟ ΜΑΘΗΜΑ';
        el.style.backgroundColor = '';
        el.style.color = '';
      }
      
      const checkbox = el.querySelector('.chapter-menu_check');
      if (checkbox) checkbox.classList.remove('yes');
    });
  },

  updateAllProgress(data) {
    const allButtons = document.querySelectorAll('[ms-code-mark-complete]');
    const courseKeys = new Set();
    allButtons.forEach(btn => {
      const key = btn.getAttribute('ms-code-mark-complete');
      if (key) courseKeys.add(key.split('-')[0]);
    });

    courseKeys.forEach(courseKey => {
      this.updateProgressBar(courseKey, data);
    });
  },

  updateProgressBar(courseKey, data) {
    const course = data?.[courseKey.toLowerCase()];
    let completed = 0;
    
    if (course) {
      Object.values(course).forEach(module => {
        if (module && typeof module === 'object') {
          Object.values(module).forEach(lesson => {
            if (Storage.isLessonComplete(lesson)) completed++;
          });
        }
      });
    }

    // Count total lessons for this course
    const allButtons = document.querySelectorAll(`[ms-code-mark-complete^="${courseKey}-"]`);
    const total = allButtons.length;
    
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Update progress bar
    const progressBar = document.querySelector('[data-ms-code="progress-bar"]');
    if (progressBar) {
      progressBar.style.width = progress + '%';
    }

    // Update progress text
    const progressText = document.querySelector('[data-ms-code="progress-text"]');
    if (progressText) {
      progressText.textContent = `${completed} από τα ${total} ΜΑΘΗΜΑΤΑ ΟΛΟΚΛΗΡΩΜΕΝΑ`;
    }

    // Update badge text
    const badgeText = document.querySelector('[data-ms-code="badge-text"]');
    if (badgeText) {
      if (progress === 0) {
        badgeText.textContent = 'Δεν ξεκίνησε';
      } else if (progress === 100) {
        badgeText.textContent = 'Το μάθημα ολοκληρώθηκε!';
      } else {
        badgeText.textContent = `${progress}% Complete`;
      }
    }
  }
};