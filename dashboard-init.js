import { DashboardProgress } from './modules/dashboardProgress.js';

console.log('📊 Dashboard Progress System');

async function init() {
  await DashboardProgress.init();
  console.log('✅ Dashboard ready');
}

init();