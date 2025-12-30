import { UIManager } from './modules/uiManager.js';
import { LessonTracker } from './modules/lessonTracker.js';
import { BadgeSystem } from './modules/badgeSystem.js';

console.log('🚀 Course Progress System v2.0.0');

async function init() {
  try {
    console.log('1️⃣ Starting UIManager.init()...');
    UIManager.init();
    
    console.log('2️⃣ Starting renderExistingProgress()...');
    await UIManager.renderExistingProgress();
    
    console.log('3️⃣ Starting LessonTracker.init()...');
    LessonTracker.init();
    
    console.log('4️⃣ Starting BadgeSystem.init()...');
    BadgeSystem.init();
    
    console.log('✅ System ready');
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}