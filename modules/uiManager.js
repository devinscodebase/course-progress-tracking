import { Storage } from './storage.js';
import { EventBus } from './eventBus.js';

export const UIManager = {
  init() {
    console.log('🎨 UIManager.init()');
    this.setupClickHandlers();
  },

  async renderExistingProgress() {
    console.log('📊 renderExistingProgress() started');
    const data = await Storage.getLessonProgress();
    console.log('📦 Loaded data:', data);
    console.log('📦 Data keys:', Object.keys(data || {}));
    
    let totalMarked = 0;
    
    Object.keys(data || {}).forEach(courseKey => {
      const course = data[courseKey];
      console.log(`🔍 Checking ${courseKey}:`, typeof course, course);
      
      if (!course || typeof course !== 'object' || Array.isArray(course)) {
        console.log(`⏭️ Skipping ${courseKey}`);
        return;
      }
      
      Object.keys(course).forEach(moduleKey => {
        const module = course[moduleKey];
        if (!module || typeof module !== 'object' || Array.isArray(module)) return;
        
        Object.keys(module).forEach(lessonKey => {
          const lessonData = module[lessonKey];
          if (Storage.isLessonComplete(lessonData)) {
            const fullKey = `${courseKey}-${moduleKey}-${lessonKey}`;
            console.log(`✅ Marking: ${fullKey}`);
            this.markLessonComplete(fullKey);
            totalMarked++;
          }
        });
      });
    });

    console.log(`✅ Total marked: ${totalMarked}`);
    this.updateAllProgress(data);
  },

  setupClickHandlers() {
    document.addEventListener('click', async (e) => {
      const button = e.target.closest('[ms-code-mark-complete]');
      if (!button) return;
      
      e.preventDefault();
      const lessonKey = button.getAttribute('ms-code-mark-complete');
      const isComplete = button.classList.contains('yes');
      
      console.log(`🖱️ Click: ${lessonKey} (${isComplete ? 'complete' : 'incomplete'})`);
      
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
    let elements = document.querySelectorAll(`[ms-code-mark-complete="${lessonKey}"]`);
    
    if (elements.length === 0) {
      const allButtons = document.querySelectorAll('[ms-code-mark-complete]');
      elements = Array.from(allButtons).filter(btn => 
        btn.getAttribute('ms-code-mark-complete').toLowerCase() === lessonKey.toLowerCase()
      );
    }
    
    console.log(`🎯 Found ${elements.length} elements for ${lessonKey}`);
    
    elements.forEach(el => {
      el.classList.add('yes');
      
      if (el.classList.contains('button') || el.tagName === 'A') {
        let textContainer = el.querySelector('div');
        if (textContainer) {
          textContainer.textContent = 'Ολοκληρώθηκε';
        } else {
          el.innerHTML = '<div>Ολοκληρώθηκε</div>';
        }
        el.style.backgroundColor = '#6c4cf9';
        el.style.color = 'white';
      }
      
      const checkbox = el.querySelector('.chapter-menu_check');
      if (checkbox) checkbox.classList.add('yes');
    });
  },

  markLessonIncomplete(lessonKey) {
    let elements = document.querySelectorAll(`[ms-code-mark-complete="${lessonKey}"]`);
    
    if (elements.length === 0) {
      const allButtons = document.querySelectorAll('[ms-code-mark-complete]');
      elements = Array.from(allButtons).filter(btn => 
        btn.getAttribute('ms-code-mark-complete').toLowerCase() === lessonKey.toLowerCase()
      );
    }
    
    elements.forEach(el => {
      el.classList.remove('yes');
      
      if (el.classList.contains('button') || el.tagName === 'A') {
        let textContainer = el.querySelector('div');
        if (textContainer) {
          textContainer.textContent = 'ΟΛΟΚΛΗΡΩΣΕ ΤΟ ΜΑΘΗΜΑ';
        } else {
          el.innerHTML = '<div>ΟΛΟΚΛΗΡΩΣΕ ΤΟ ΜΑΘΗΜΑ</div>';
        }
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
      if (key) courseKeys.add(key.split('-')[0].toLowerCase());
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
    console.log(`📈 ${courseKey}: ${completed}/${total} = ${progress}%`);

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