import { Config } from './config.js';

export const Metadata = {
  getCurrentLessonTitle(lessonKey) {
    const button = document.querySelector(`[ms-code-mark-complete="${lessonKey}"]`);
    return button?.getAttribute('data-lesson-title')?.trim() || 'Μάθημα';
  },
  
  getCourseNameGreek(lessonKey) {
    const button = document.querySelector(`[ms-code-mark-complete="${lessonKey}"]`);
    const courseFromAttr = button?.getAttribute('data-course-name-greek');
    if (courseFromAttr) return courseFromAttr.trim();
    
    const courseId = lessonKey.split('-')[0];
    const courseConfig = Config.courses[courseId.toLowerCase()];
    return courseConfig?.nameGreek || courseId;
  },
  
  getNextLessonTitle(lessonKey) {
    const button = document.querySelector(`[ms-code-mark-complete="${lessonKey}"]`);
    return button?.getAttribute('data-next-lesson-title')?.trim() || 'Επόμενο Μάθημα';
  },
  
  getNextLessonLink(lessonKey) {
    const button = document.querySelector(`[ms-code-mark-complete="${lessonKey}"]`);
    const slug = button?.getAttribute('data-next-lesson-link')?.trim(); // Changed from data-next-lesson-slug
    return slug ? `https://giannisandreou.com/lessons/${slug}` : '';
  }
};

