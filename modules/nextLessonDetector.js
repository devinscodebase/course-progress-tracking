import { Storage } from './storage.js';
import { Config } from './config.js';

export const NextLessonDetector = {
  async init() {
    const courseId = this.getCurrentCourseId();
    if (!courseId) return;

    const nextLessonUrl = this.findNextIncompleteLesson(courseId);
    if (nextLessonUrl) {
      await this.storeNextLessonUrl(courseId, nextLessonUrl);
    }
  },

  getCurrentCourseId() {
    const courseIdentifier = document.querySelector('[data-course-id]');
    if (courseIdentifier) {
      return courseIdentifier.getAttribute('data-course-id').toLowerCase();
    }
    
    const bodyClasses = document.body.className;
    for (const courseKey in Config.courses) {
      if (bodyClasses.includes(courseKey)) {
        return courseKey;
      }
    }
    
    return null;
  },

  findNextIncompleteLesson(courseId) {
    // Get all lesson containers (parent divs that contain both button and link)
    const lessonContainers = document.querySelectorAll('.collection-item-2.w-dyn-item');
    
    console.log(`🔍 Checking ${lessonContainers.length} lessons for first incomplete...`);
    
    // Loop through each container
    for (const container of lessonContainers) {
      // Find the completion button in this container
      const button = container.querySelector(`[ms-code-mark-complete^="${courseId}-"]`);
      if (!button) continue;
      
      // Find the link in this container
      const link = container.querySelector('[data-lesson-link="true"]');
      if (!link) continue;
      
      // Check if incomplete (no 'yes' class)
      const isComplete = button.classList.contains('yes');
      
      if (!isComplete) {
        const lessonKey = button.getAttribute('ms-code-mark-complete');
        console.log(`✅ Found first incomplete lesson: ${lessonKey} at ${link.href}`);
        return link.href;
      }
    }
    
    console.log('🎉 All lessons complete!');
    return null;
  },

  async storeNextLessonUrl(courseId, url) {
    await Storage.storeNextLessonUrl(courseId, url);
    console.log(`✅ Stored nextLessonUrl for ${courseId}:`, url);
  }
};