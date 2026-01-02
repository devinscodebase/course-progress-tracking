import { Storage } from './storage.js';
import { EventBus } from './eventBus.js';
import { Webhooks } from './webhooks.js';
import { Metadata } from './metadata.js';
import { ToastManager } from './toastManager.js';
import { NextLessonDetector } from './nextLessonDetector.js';

export const UIManager = {
  progressBar: null,
  progressText: null,
  completeButton: null,
  isProcessing: false,
  loadingSpinner: null,

  init() {
    Storage.init();
    
    this.progressBar = document.querySelector('[data-ms-code="progress-bar"]');
    this.progressText = document.querySelector('[data-ms-code="progress-text"]');
    this.completeButton = document.querySelector('[data-lesson-complete]');
    this.loadingSpinner = document.querySelector('[data-loading-spinner]');
    
    if (this.completeButton) {
      this.completeButton.addEventListener('click', (e) => this.handleCompleteClick(e));
    }

    EventBus.on('lessonCompleted', (data) => this.onLessonCompleted(data));
    EventBus.on('progressUpdated', (data) => this.updateProgressUI(data));
  },

  async renderExistingProgress() {
    const data = await Storage.getLessonProgress();
    const lessonId = document.querySelector('[data-lesson-id]')?.getAttribute('data-lesson-id');
    const courseId = document.querySelector('[data-course-id]')?.getAttribute('data-course-id')?.toLowerCase();
    const moduleId = document.querySelector('[data-module-id]')?.getAttribute('data-module-id');

    if (!lessonId || !courseId || !moduleId) return;

    const lessonKey = `${courseId}_${moduleId}_${lessonId}`;
    const isComplete = data?.[courseId]?.[moduleId]?.[lessonKey]?.completed || false;

    if (isComplete && this.completeButton) {
      this.completeButton.classList.add('is-completed');
      this.completeButton.textContent = '✓ Ολοκληρώθηκε';
    }

    this.updateProgressUI({ courseId });
  },

  async handleCompleteClick(e) {
    e.preventDefault();

    if (this.isProcessing) return;
    this.isProcessing = true;

    const lessonId = e.target.closest('[data-lesson-complete]').getAttribute('data-lesson-id');
    const courseId = document.querySelector('[data-course-id]')?.getAttribute('data-course-id')?.toLowerCase();
    const moduleId = document.querySelector('[data-module-id]')?.getAttribute('data-module-id');

    if (!lessonId || !courseId || !moduleId) {
      this.isProcessing = false;
      return;
    }

    this.showLoadingSpinner();
    
    await this.markLessonComplete(lessonId, courseId, moduleId);
    
    this.hideLoadingSpinner();
    this.isProcessing = false;
  },

  async markLessonComplete(lessonId, courseId, moduleId) {
    const data = await Storage.getLessonProgress();

    if (!data[courseId]) data[courseId] = {};
    if (!data[courseId][moduleId]) data[courseId][moduleId] = {};

    const lessonKey = `${courseId}_${moduleId}_${lessonId}`;
    
    data[courseId][moduleId][lessonKey] = {
      completed: true,
      completedAt: new Date().toISOString()
    };

    const savePromise = Storage.saveLessonProgress(data);
    const delayPromise = new Promise(resolve => setTimeout(resolve, 300));
    
    await Promise.all([savePromise, delayPromise]);

    // Update next lesson URL ONLY after completing a lesson
    await NextLessonDetector.init();

    setTimeout(() => {
      Webhooks.sendLessonActivity({
        lessonId,
        courseId,
        moduleId,
        action: 'completed',
        timestamp: new Date().toISOString(),
        metadata: Metadata.collect()
      });
    }, 0);

    EventBus.emit('lessonCompleted', { lessonId, courseId, moduleId });
    ToastManager.show('Το μάθημα ολοκληρώθηκε!', 'success');
  },

  onLessonCompleted(data) {
    if (this.completeButton) {
      this.completeButton.classList.add('is-completed');
      this.completeButton.textContent = '✓ Ολοκληρώθηκε';
    }

    EventBus.emit('progressUpdated', { courseId: data.courseId });
  },

  async updateProgressUI({ courseId }) {
    const data = await Storage.getLessonProgress();
    const course = data?.[courseId];
    
    if (!course) return;

    let completedCount = 0;
    for (const moduleKey in course) {
      if (moduleKey === 'nextLessonUrl') continue;
      
      const module = course[moduleKey];
      if (typeof module !== 'object') continue;
      
      for (const lessonKey in module) {
        const lesson = module[lessonKey];
        if (Storage.isLessonComplete(lesson)) {
          completedCount++;
        }
      }
    }

    if (this.progressText) {
      this.progressText.textContent = `${completedCount} μαθήματα ολοκληρωμένα`;
    }

    if (this.progressBar) {
      const totalLessons = this.getTotalLessons(courseId);
      const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      this.progressBar.style.width = `${progress}%`;
    }
  },

  getTotalLessons(courseId) {
    const totals = {
      'course1': 30,
      'course2': 14,
      'course3': 51
    };
    return totals[courseId] || 0;
  },

  showLoadingSpinner() {
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = 'flex';
    }
    if (this.completeButton) {
      this.completeButton.style.opacity = '0.6';
      this.completeButton.style.pointerEvents = 'none';
    }
  },

  hideLoadingSpinner() {
    if (this.loadingSpinner) {
      this.loadingSpinner.style.display = 'none';
    }
    if (this.completeButton) {
      this.completeButton.style.opacity = '1';
      this.completeButton.style.pointerEvents = 'auto';
    }
  }
};