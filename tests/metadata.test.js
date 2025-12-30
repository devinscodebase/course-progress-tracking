import { describe, it, expect, beforeEach } from 'vitest';
import { Metadata } from '../modules/metadata.js';

describe('Metadata', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should get course name from config', () => {
    const courseName = Metadata.getCourseNameGreek('Course1-module1-lesson1');
    expect(courseName).toBe('Βασικές Αρχές Blockchain');
  });

  it('should get next lesson title from button', () => {
    document.body.innerHTML = `
      <a ms-code-mark-complete="Course1-module1-lesson1" data-next-lesson-title="Next Lesson"></a>
    `;

    const nextTitle = Metadata.getNextLessonTitle('Course1-module1-lesson1');
    expect(nextTitle).toBe('Next Lesson');
  });

  it('should fallback to generic next lesson title', () => {
    const nextTitle = Metadata.getNextLessonTitle('Course1-module1-lesson5');
    expect(nextTitle).toBe('Επόμενο Μάθημα');
  });

  it('should build full next lesson link from slug', () => {
    document.body.innerHTML = `
      <a ms-code-mark-complete="Course1-module1-lesson1" data-next-lesson-slug="lesson-2"></a>
    `;

    const nextLink = Metadata.getNextLessonLink('Course1-module1-lesson1');
    expect(nextLink).toBe('https://giannisandreou.com/lessons/lesson-2');
  });
});