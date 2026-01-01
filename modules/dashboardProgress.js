import { Storage } from './storage.js';

export const DashboardProgress = {
  async init() {
    await this.updateAllCourseCards();
  },

  async updateAllCourseCards() {
    const data = await Storage.getLessonProgress();
    const cards = document.querySelectorAll('[data-course-id]');

    cards.forEach(card => {
      const courseId = card.getAttribute('data-course-id');
      const totalLessons = parseInt(card.getAttribute('data-total-lessons')) || 0;
      this.updateCourseCard(card, courseId, totalLessons, data);
    });
  },

  updateCourseCard(card, courseId, totalLessons, data) {
    const course = data?.[courseId.toLowerCase()];
    let completed = 0;

    if (course) {
      Object.values(course).forEach(module => {
        if (!module || typeof module !== 'object' || Array.isArray(module)) return;
        Object.values(module).forEach(lesson => {
          if (Storage.isLessonComplete(lesson)) completed++;
        });
      });
    }

    const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;

    // Update UI elements
    const progressBar = card.querySelector('[data-ms-code="progress-bar"]');
    if (progressBar) {
      progressBar.style.width = progress + '%';
      progressBar.style.transition = 'width 0.4s ease';
    }

    const badgeText = card.querySelector('[data-ms-code="badge-text"]');
    if (badgeText) {
      if (progress === 0) {
        badgeText.textContent = 'Δεν ξεκίνησε';
      } else if (progress === 100) {
        badgeText.textContent = 'Ολοκληρώθηκε!';
      } else {
        badgeText.textContent = `${progress}% ολοκλήρωση`;
      }
    }

    const progressText = card.querySelector('[data-ms-code="progress-text"]');
    if (progressText) {
      progressText.textContent = `${completed} of ${totalLessons} μαθήματα ολοκληρωμένα`;
    }

    const completionBadge = card.querySelector('[data-ms-code="completion-badge"]');
    if (completionBadge) {
      if (progress >= 100 && totalLessons > 0) {
        completionBadge.classList.add('unlocked');
      } else {
        completionBadge.classList.remove('unlocked');
      }
    }
  }
};