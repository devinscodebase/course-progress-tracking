import { Storage } from './storage.js';

export const DashboardButtons = {
  async init() {
    await this.updateAllCourseButtons();
  },

  async updateAllCourseButtons() {
    const data = await Storage.getLessonProgress();
    const cards = document.querySelectorAll('[data-course-id]');

    cards.forEach(card => {
      const courseId = card.getAttribute('data-course-id').toLowerCase();
      this.updateCourseButton(card, courseId, data);
    });
  },

  updateCourseButton(card, courseId, data) {
    const courseData = data?.[courseId];
    const nextLessonUrl = courseData?.nextLessonUrl;

    // Find the "View Lessons" button using custom attribute
    const viewButton = card.querySelector('[data-view-lessons-btn]');
    
    if (viewButton && nextLessonUrl) {
      // Update button to point to next lesson
      viewButton.href = nextLessonUrl;
      
      // Optional: Change button text if there's progress
      const hasProgress = this.hasAnyProgress(courseData);
      if (hasProgress) {
        viewButton.textContent = 'Συνέχισε το Μάθημα'; // "Continue Lesson"
      }
    }
  },

  hasAnyProgress(courseData) {
    if (!courseData) return false;
    
    // Check if there are any completed lessons
    for (const moduleKey in courseData) {
      if (moduleKey === 'nextLessonUrl') continue;
      
      const module = courseData[moduleKey];
      if (typeof module !== 'object') continue;
      
      for (const lessonKey in module) {
        const lesson = module[lessonKey];
        if (Storage.isLessonComplete(lesson)) {
          return true;
        }
      }
    }
    
    return false;
  }
};