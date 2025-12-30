import { Storage } from './storage.js';
import { Config } from './config.js';
import { EventBus } from './eventBus.js';

export const BadgeSystem = {
  init() {
    EventBus.on('lesson:completed', (data) => this.updateBadge(data.course));
    EventBus.on('lesson:incompleted', (data) => this.updateBadge(data.course));
    EventBus.on('storage:loaded', () => this._updateAllBadges());
  },
  
  updateBadge(courseId) {
    const totalLessons = this._getTotalLessons();
    const completedLessons = Storage.countCompletedLessons(courseId);
    const progress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;
    
    this._updateBadgeText(progress);
    this._updateProgressBar(progress);
    this._updateProgressText(completedLessons, totalLessons);
    this._updateCompletionBadge(progress);
    
    EventBus.emit('badge:updated', { courseId, progress, completedLessons, totalLessons });
  },
  
  _getTotalLessons() {
    const element = document.querySelector(Config.ui.selectors.totalLessons);
    if (element) {
      const total = parseInt(element.textContent) || 0;
      if (total > 0) return total;
    }
    
    const allLessons = document.querySelectorAll(Config.ui.selectors.lessonButton);
    const uniqueKeys = new Set();
    allLessons.forEach(el => {
      const key = el.getAttribute('ms-code-mark-complete');
      if (key) uniqueKeys.add(key);
    });
    
    return uniqueKeys.size;
  },
  
  _updateBadgeText(progress) {
    const element = document.querySelector(Config.ui.selectors.badgeText);
    if (!element) return;
    
    if (progress === 0) {
      element.textContent = Config.progressText.notStarted;
    } else if (progress === 100) {
      element.textContent = Config.progressText.completed;
    } else {
      element.textContent = Config.progressText.inProgress(progress);
    }
  },
  
  _updateProgressBar(progress) {
    const element = document.querySelector(Config.ui.selectors.progressBar);
    if (!element) return;
    
    element.style.width = progress + '%';
    element.style.transition = 'width 0.5s ease';
  },
  
  _updateProgressText(completed, total) {
    const element = document.querySelector(Config.ui.selectors.progressText);
    if (!element) return;
    
    element.textContent = Config.progressText.lessonCount(completed, total);
  },
  
  _updateCompletionBadge(progress) {
    const element = document.querySelector(Config.ui.selectors.completionBadge);
    if (!element) return;
    
    if (progress >= 100) {
      element.classList.add('unlocked');
    } else {
      element.classList.remove('unlocked');
    }
  },
  
  _updateAllBadges() {
    const allLessons = document.querySelectorAll(Config.ui.selectors.lessonButton);
    const courses = new Set();
    
    allLessons.forEach(el => {
      const key = el.getAttribute('ms-code-mark-complete');
      if (key) courses.add(key.split('-')[0]);
    });
    
    courses.forEach(course => this.updateBadge(course));
  }
};