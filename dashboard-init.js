import { DashboardProgress } from './modules/dashboardProgress.js';
import { DashboardButtons } from './modules/dashboardButtons.js';

console.log('📊 Dashboard Progress System');

async function init() {
  await DashboardProgress.init();
  await DashboardButtons.init();
  console.log('✅ Dashboard ready');
}

init();