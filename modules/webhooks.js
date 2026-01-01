import { Config } from './config.js';

export const Webhooks = {
  async sendCourseCompletion(data) {
    return this._sendToProxy('courseComplete', data);
  },

  async sendLessonActivity(data) {
    return this._sendToProxy('lessonActivity', data);
  },

  async _sendToProxy(endpoint, payload) {
    try {
      const response = await fetch(Config.webhookProxy, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, payload })
      });
      
      const result = await response.json();
      if (result.success) {
        console.log(`✅ ${endpoint} sent`);
        return true;
      } else {
        console.error(`❌ ${endpoint} failed`);
        return false;
      }
    } catch (error) {
      console.error('❌ Webhook proxy error:', error);
      return false;
    }
  }
};