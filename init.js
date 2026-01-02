console.log('🚀 Course Progress System v2.0.0');

import { UIManager } from './modules/uiManager.js';
import { LessonTracker } from './modules/lessonTracker.js';
import { BadgeSystem } from './modules/badgeSystem.js';
import { ToastManager } from './modules/toastManager.js';
import { NextLessonDetector } from './modules/nextLessonDetector.js';
import { SidebarScroller } from './modules/sidebarScroller.js';

async function init() {
  console.log('1️⃣ Starting UIManager.init()...');
  UIManager.init();

  console.log('2️⃣ Starting renderExistingProgress()...');
  await UIManager.renderExistingProgress();

  console.log('3️⃣ Starting LessonTracker.init()...');
  LessonTracker.init();

  console.log('4️⃣ Starting BadgeSystem.init()...');
  BadgeSystem.init();

  console.log('5️⃣ Starting ToastManager.init()...');
  ToastManager.init();

  console.log('6️⃣ Starting NextLessonDetector.init()...');
  await NextLessonDetector.init();

  console.log('7️⃣ Starting SidebarScroller.init()...');
  SidebarScroller.init();

  console.log('✅ System ready');
}

init();