import { describe, it, expect, beforeEach, vi } from 'vitest';
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
      <a ms-code-mark-complete="Course1-module1-lesson2" data-lesson-title="Next Lesson"></a>
    `;

    const nextTitle = Metadata.getNextLessonTitle('Course1-module1-lesson1');
    expect(nextTitle).toBe('Next Lesson');
  });

  it('should fallback to generic next lesson title', () => {
    const nextTitle = Metadata.getNextLessonTitle('Course1-module1-lesson5');
    expect(nextTitle).toBe('Μάθημα 6');
  });
});