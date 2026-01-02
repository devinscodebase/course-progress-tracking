import { Storage } from './storage.js';
import { Config } from './config.js';

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
    const hasProgress = this.hasAnyProgress(courseData);

    // Find the "View Lessons" button using custom attribute
    const viewButton = card.querySelector('[data-view-lessons-btn]');
    
    if (!viewButton) return;

    // If we have a stored nextLessonUrl, use it
    if (nextLessonUrl) {
      viewButton.href = nextLessonUrl;
      viewButton.textContent = 'Συνέχισε το Μάθημα';
      return;
    }

    // If user has progress but no nextLessonUrl (legacy data), 
    // keep button text updated but leave original href
    if (hasProgress) {
      viewButton.textContent = 'Συνέχισε το Μάθημα';
      // Button will use whatever href is set in Webflow (first lesson or course overview)
    }
    
    // If no progress, keep default text and href
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