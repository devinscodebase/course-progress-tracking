import { Storage } from './storage.js';
import { LessonTracker } from './lessonTracker.js';
import { Config } from './config.js';
import { EventBus } from './eventBus.js';

export const UIManager = {
  init() {
    this._setupEventListeners();
    this._setupMutationObserver();
  },
  
  _setupEventListeners() {
    EventBus.on('storage:loaded', () => this.updateAllLessons());
    EventBus.on('lesson:completed', (data) => this.updateLessonUI(data.lessonKey, true));
    EventBus.on('lesson:incompleted', (data) => this.updateLessonUI(data.lessonKey, false));
    
    document.addEventListener('click', async (event) => {
      const target = event.target.closest(Config.ui.selectors.lessonButton);
      if (target) {
        event.preventDefault();
        await this._handleLessonClick(target);
      }
    });
  },
  
  _setupMutationObserver() {
    const elements = document.querySelectorAll(Config.ui.selectors.lessonButton);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => this._syncCheckbox(mutation.target));
    });
    
    elements.forEach(el => {
      observer.observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  },
  
  async _handleLessonClick(element) {
    const lessonKey = element.getAttribute('ms-code-mark-complete');
    const isComplete = element.classList.contains('yes');
    
    if (isComplete) {
      await LessonTracker.markIncomplete(lessonKey);
    } else {
      await LessonTracker.markComplete(lessonKey);
    }
  },
  
  updateAllLessons() {
    document.querySelectorAll(Config.ui.selectors.lessonButton).forEach(element => {
      const lessonKey = element.getAttribute('ms-code-mark-complete');
      if (!lessonKey) return;
      
      const [course, module, lesson] = lessonKey.split('-');
      const lessonData = Storage.getLessonData(course, module, lesson);
      const isComplete = Storage.isLessonComplete(lessonData);
      
      this.updateLessonUI(lessonKey, isComplete);
    });
  },
  
  updateLessonUI(lessonKey, isComplete) {
    document.querySelectorAll(`[ms-code-mark-complete="${lessonKey}"]`).forEach(element => {
      if (isComplete) {
        element.classList.add('yes');
        this._styleCompleteButton(element);
      } else {
        element.classList.remove('yes');
        this._styleIncompleteButton(element);
      }
      this._syncCheckbox(element);
    });
  },
  
  _styleCompleteButton(element) {
    if (!this._isButton(element)) return;
    
    const message = this._getRandomItem(Config.ui.encouragingMessages);
    const bgColor = this._getRandomItem(Config.ui.buttonColors);
    const textColor = this._getTextColor(bgColor);
    
    element.textContent = message;
    element.style.backgroundColor = bgColor;
    element.style.color = textColor;
    element.classList.add('is-complete');
  },
  
  _styleIncompleteButton(element) {
    if (!this._isButton(element)) return;
    
    element.textContent = "ΟΛΟΚΛΗΡΩΣΕ ΤΟ ΜΑΘΗΜΑ";
    element.style.backgroundColor = "";
    element.style.color = "";
    element.classList.remove('is-complete');
  },
  
  _syncCheckbox(element) {
    const checkbox = element.querySelector(Config.ui.selectors.checkbox);
    if (checkbox) {
      checkbox.classList.toggle('yes', element.classList.contains('yes'));
    }
  },
  
  _isButton(element) {
    return element.tagName.toLowerCase() === 'a' && 
           (element.classList.contains('button') || 
            element.classList.contains('w-button') || 
            element.classList.contains('lesson-button'));
  },
  
  _getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  },
  
  _getTextColor(bgColor) {
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? 'black' : 'white';
  }
};