import { Storage } from './storage.js';

export const DashboardProgress = {
  async init() {
    await this.updateAllCourseCards();
  },

  async updateAllCourseCards() {
    // Get lesson progress data (from new location: lessonProgress)
    const data = await Storage.getLessonProgress();
    
    // Find all course cards on dashboard
    const courseCards = document.querySelectorAll('[data-course-id]');
    
    courseCards.forEach(card => {
      const courseId = card.getAttribute('data-course-id');
      const totalLessons = parseInt(card.getAttribute('data-total-lessons') || '0');
      
      if (!courseId) return;
      
      // Count completed lessons for this course
      const courseData = data[courseId.toLowerCase()];
      let completed = 0;
      
      if (courseData) {
        Object.values(courseData).forEach(module => {
          if (!module || typeof module !== 'object' || Array.isArray(module)) return;
          
          Object.values(module).forEach(lesson => {
            if (Storage.isLessonComplete(lesson)) {
              completed++;
            }
          });
        });
      }
      
      const progress = totalLessons > 0 ? Math.round((completed / totalLessons) * 100) : 0;
      
      // Update progress bar
      const progressBar = card.querySelector('[data-ms-code="progress-bar"]');
      if (progressBar) {
        progressBar.style.width = progress + '%';
      }
      
      // Update progress text
      const progressText = card.querySelector('[data-ms-code="progress-text"]');
      if (progressText) {
        progressText.textContent = `${completed} από τα ${totalLessons} ΜΑΘΗΜΑΤΑ ΟΛΟΚΛΗΡΩΜΕΝΑ`;
      }
      
      // Update badge text
      const badgeText = card.querySelector('[data-ms-code="badge-text"]');
      if (badgeText) {
        if (progress === 0) {
          badgeText.textContent = 'Δεν ξεκίνησε';
        } else if (progress === 100) {
          badgeText.textContent = 'Το μάθημα ολοκληρώθηκε!';
        } else {
          badgeText.textContent = `${progress}% Complete`;
        }
      }
      
      // Update completion badge (the number badge)
      const completionBadge = card.querySelector('[data-ms-code="completion-badge"]');
      if (completionBadge) {
        completionBadge.textContent = completed;
      }
    });
  }
};