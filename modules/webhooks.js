import { Config } from './config.js';
import { EventBus } from './eventBus.js';

export const Webhooks = {
  async sendLessonActivity(memberInfo) {
    const url = Config.webhooks.lessonActivity;
    if (!url) return false;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          email: memberInfo.email,
          firstName: memberInfo.firstName,
          lastName: memberInfo.lastName,
          timestamp: Date.now(),
          activeCourse: memberInfo.activeCourse,
          nextLesson: memberInfo.nextLesson,
          lessonKey: memberInfo.lessonKey
        })
      });
      
      if (response.ok) {
        console.log('✅ Lesson activity tracked:', memberInfo.lessonKey);
        EventBus.emit('webhook:lessonActivity:success', memberInfo);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Lesson activity error:', error);
      return false;
    }
  },
  
  async sendCourseCompletion(memberInfo) {
    const url = Config.webhooks.courseComplete;
    if (!url) return false;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: JSON.stringify({
          email: memberInfo.email,
          firstName: memberInfo.firstName,
          lastName: memberInfo.lastName,
          courseCompleted: memberInfo.courseCompleted,
          lesson: memberInfo.lesson,
          module: memberInfo.module,
          completedAt: new Date().toISOString(),
          memberId: memberInfo.memberId
        })
      });
      
      if (response.ok) {
        console.log('✅ Course completion sent:', memberInfo.courseCompleted);
        EventBus.emit('webhook:courseComplete:success', memberInfo);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Course completion error:', error);
      return false;
    }
  }
};