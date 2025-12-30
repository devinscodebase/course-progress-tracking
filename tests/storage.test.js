import { describe, it, expect, beforeEach } from 'vitest';
import { Storage } from '../modules/storage.js';

describe('Storage', () => {
  beforeEach(() => {
    Storage.memberData = {};
    Storage.memberstack = {
      getMemberJSON: async () => ({ data: {} }),
      updateMemberJSON: async () => true
    };
  });

  it('should mark lesson complete', () => {
    Storage.setLessonComplete('Course1', 'module1', 'lesson1');
    
    const lessonData = Storage.getLessonData('Course1', 'module1', 'lesson1');
    expect(lessonData.completed).toBe(true);
    expect(lessonData.completedAt).toBeDefined();
  });

  it('should mark lesson incomplete', () => {
    Storage.memberData = {
      course1: {
        module1: {
          lesson1: { completed: true, completedAt: '2025-01-01' }
        }
      }
    };

    Storage.setLessonIncomplete('Course1', 'module1', 'lesson1');
    
    const lessonData = Storage.getLessonData('Course1', 'module1', 'lesson1');
    expect(lessonData).toBeNull();
  });

  it('should count completed lessons', () => {
    Storage.memberData = {
      course1: {
        module1: {
          lesson1: { completed: true },
          lesson2: { completed: true }
        },
        module2: {
          lesson1: { completed: true }
        }
      }
    };

    const count = Storage.countCompletedLessons('Course1');
    expect(count).toBe(3);
  });

  it('should handle backward compatibility with boolean format', () => {
    const oldFormat = true;
    const newFormat = { completed: true };

    expect(Storage.isLessonComplete(oldFormat)).toBe(true);
    expect(Storage.isLessonComplete(newFormat)).toBe(true);
    expect(Storage.isLessonComplete(null)).toBe(false);
  });
});