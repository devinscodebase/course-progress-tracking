import { Storage } from './storage.js';
import { EventBus } from './eventBus.js';

export const BadgeSystem = {
  init() {
    EventBus.on('lesson:completed', async (payload) => {
      const data = await Storage.getLessonProgress();
      const courseId = payload.lessonKey.split('-')[0];
      this.updateBadge(courseId, data);
    });
    
    EventBus.on('lesson:incompleted', async (payload) => {
      const data = await Storage.getLessonProgress();
      const courseId = payload.lessonKey.split('-')[0];
      this.updateBadge(courseId, data);
    });
  },

  updateBadge(courseId, data) {
    const completed = Storage.countCompletedLessons(data, courseId);
    const total = this.getTotalLessons(courseId);
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    this.updateUI(progress, completed, total);
  },

  getTotalLessons(courseId) {
    const buttons = document.querySelectorAll('[ms-code-mark-complete]');
    const uniqueKeys = new Set();
    
    Array.from(buttons).forEach(btn => {
      const key = btn.getAttribute('ms-code-mark-complete');
      if (key && key.toLowerCase().startsWith(courseId.toLowerCase() + '-')) {
        uniqueKeys.add(key.toLowerCase());
      }
    });
    
    return uniqueKeys.size;
  },

  updateUI(progress, completed, total) {
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