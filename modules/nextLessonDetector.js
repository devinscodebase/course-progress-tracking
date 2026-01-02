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
    // Look for course identifier in page
    const courseIdentifier = document.querySelector('[data-course-id]');
    if (courseIdentifier) {
      return courseIdentifier.getAttribute('data-course-id').toLowerCase();
    }
    
    // Fallback: detect from URL or page metadata
    const bodyClasses = document.body.className;
    for (const courseKey in Config.courses) {
      if (bodyClasses.includes(courseKey)) {
        return courseKey;
      }
    }
    
    return null;
  },

  findNextIncompleteLesson(courseId) {
    // Find all lesson links using custom attribute
    const lessonLinks = document.querySelectorAll('[data-lesson-link]');
    
    const currentUrl = window.location.pathname;
    let foundCurrent = false;
    let nextLessonUrl = null;

    lessonLinks.forEach(link => {
      const linkHref = link.getAttribute('href');
      
      // Check if this is the current lesson
      if (linkHref === currentUrl || link.href.includes(currentUrl)) {
        foundCurrent = true;
        return;
      }

      // If we've found current lesson, this is the next one
      if (foundCurrent && !nextLessonUrl) {
        nextLessonUrl = link.href;
      }
    });

    return nextLessonUrl;
  },

  async storeNextLessonUrl(courseId, url) {
    const data = await Storage.getLessonProgress();
    
    if (!data[courseId]) {
      data[courseId] = {};
    }

    data[courseId].nextLessonUrl = url;
    
    await Storage.storeNextLessonUrl(courseId, nextLessonUrl);

  }
};