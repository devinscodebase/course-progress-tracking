import { Config } from './config.js';

export const Metadata = {
  getCourseNameGreek(lessonKey) {
    // Try data attribute
    const button = document.querySelector(`[ms-code-mark-complete="${lessonKey}"]`);
    const courseFromAttr = button?.getAttribute('data-course-name-greek');
    if (courseFromAttr) return courseFromAttr.trim();
    
    // Try config
    const courseId = lessonKey.split('-')[0];
    const courseConfig = Config.courses[courseId.toLowerCase()];
    if (courseConfig) return courseConfig.nameGreek;
    
    // Try h1
    const h1 = document.querySelector('h1');
    if (h1) return h1.textContent.trim();
    
    return courseId;
  },
  
  getNextLessonTitle(lessonKey) {
    const [course, module, lesson] = lessonKey.split('-');
    const nextLessonNum = parseInt(lesson.replace('lesson', '')) + 1;
    const nextLessonKey = `${course}-${module}-lesson${nextLessonNum}`;
    
    // Try to find next lesson button
    const nextButton = document.querySelector(`[ms-code-mark-complete="${nextLessonKey}"]`);
    
    if (nextButton) {
      const title = nextButton.getAttribute('data-lesson-title');
      if (title) return title.trim();
    }
    
    // Fallback
    return `Μάθημα ${nextLessonNum}`;
  }
};