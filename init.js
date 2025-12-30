import { Config } from './modules/config.js';
import { Storage } from './modules/storage.js';
import { LessonTracker } from './modules/lessonTracker.js';
import { UIManager } from './modules/uiManager.js';
import { BadgeSystem } from './modules/badgeSystem.js';

document.addEventListener('DOMContentLoaded', async () => {
  console.log(`🚀 Course Progress System v${Config.version}`);
  
  const memberstack = window.$memberstackDom;
  
  if (!memberstack) {
    console.error('❌ Memberstack not found');
    return;
  }
  
  try {
    await Storage.init(memberstack);
    LessonTracker.init(memberstack);
    UIManager.init();
    BadgeSystem.init();
    
    console.log('✅ System ready');
  } catch (error) {
    console.error('❌ Init failed:', error);
  }
});