import { Storage } from './modules/storage.js';
import { UIManager } from './modules/uiManager.js';
import { LessonTracker } from './modules/lessonTracker.js';
import { Webhooks } from './modules/webhooks.js';
import { BadgeSystem } from './modules/badgeSystem.js';

console.log('🚀 Course Progress System v2.0.0');

async function init() {
  try {
    // Initialize UI manager
    UIManager.init();
    
    // Render existing progress from Memberstack
    await UIManager.renderExistingProgress();
    
    // Initialize other modules
    LessonTracker.init();
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