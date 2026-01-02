import { Storage } from './storage.js';
import { Config } from './config.js';

export const NextLessonDetector = {
  async init() {
    const courseId = this.getCurrentCourseId();
    if (!courseId) return;

    const nextLessonUrl = await this.findNextIncompleteLesson(courseId);
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

  async findNextIncompleteLesson(courseId) {
    // Get completion data from Storage
    const data = await Storage.getLessonProgress();
    const courseData = data[courseId] || {};
    
    // Get all lesson links in DOM order
    const lessonLinks = document.querySelectorAll('[data-lesson-link]');
    
    console.log(`🔍 Checking ${lessonLinks.length} lessons for first incomplete...`);
    
    // Find FIRST incomplete lesson
    for (const link of lessonLinks) {
      const lessonUrl = link.getAttribute('href');
      const lessonId = this.extractLessonIdFromUrl(lessonUrl);
      
      if (!lessonId) continue;
      
      // Check if this lesson is complete
      const isComplete = this.isLessonComplete(courseData, lessonId);
      
      if (!isComplete) {
        console.log(`✅ Found first incomplete lesson: ${lessonId}`);
        return link.href;
      }
    }
    
    console.log('🎉 All lessons complete!');
    return null;
  },

  extractLessonIdFromUrl(url) {
    // Extract lesson slug from URL
    // Example: /lessons/blockchain-kai-kryptonomismata-apo-to-a-o---lesson-1
    // Returns: lesson1 or the last part
    
    const parts = url.split('/').pop().split('---');
    if (parts.length > 1) {
      // Get the part after last "---" and clean it
      return parts[parts.length - 1].replace(/[^a-z0-9]/gi, '').toLowerCase();
    }
    
    return null;
  },

  isLessonComplete(courseData, lessonId) {
    // Check all modules for this lesson
    for (const moduleKey in courseData) {
      if (moduleKey === 'nextLessonUrl') continue;
      
      const module = courseData[moduleKey];
      if (typeof module !== 'object') continue;
      
      for (const lessonKey in module) {
        // Match lesson ID (case insensitive)
        if (lessonKey.toLowerCase().includes(lessonId.toLowerCase())) {
          return module[lessonKey].completed === true;
        }
      }
    }
    
    return false; // Not found = incomplete
  },

  async storeNextLessonUrl(courseId, url) {
    await Storage.storeNextLessonUrl(courseId, url);
    console.log(`✅ Stored nextLessonUrl for ${courseId}:`, url);
  }
};