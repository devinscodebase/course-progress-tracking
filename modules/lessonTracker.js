import { Storage } from './storage.js';
import { Webhooks } from './webhooks.js';
import { Metadata } from './metadata.js';
import { Config } from './config.js';
import { EventBus } from './eventBus.js';

export const LessonTracker = {
  init() {
    // Nothing to initialize
  },
  
  // Just send webhooks, don't save (saving handled by UIManager)
  async sendWebhooksOnly(lessonKey) {
    const [course, module, lesson] = lessonKey.split('-');
    
    const metadata = {
      course,
      module,
      lesson,
      lessonKey,
      activeCourse: Metadata.getCourseNameGreek(lessonKey),
      nextLesson: Metadata.getNextLessonTitle(lessonKey)
    };
    
    await this._checkCourseCompletion(course, module, lesson);
    await this._sendWebhooks(metadata);
  },
  
  async markComplete(lessonKey) {
    const [course, module, lesson] = lessonKey.split('-');
    
    await Storage.saveLessonProgress(lessonKey, true);
    
    console.log(`✅ Lesson ${lessonKey} completed`);
    
    const metadata = {
      course,
      module,
      lesson,
      lessonKey,
      activeCourse: Metadata.getCourseNameGreek(lessonKey),
      nextLesson: Metadata.getNextLessonTitle(lessonKey)
    };
    
    await this._checkCourseCompletion(course, module, lesson);
    await this._sendWebhooks(metadata);
    
    return metadata;
  },
  
  async markIncomplete(lessonKey) {
    const [course, module, lesson] = lessonKey.split('-');
    
    await Storage.saveLessonProgress(lessonKey, false);
    
    console.log(`❌ Lesson ${lessonKey} marked incomplete`);
    
    return { lessonKey, course, module, lesson };
  },
  
  async _checkCourseCompletion(course, module, lesson) {
    const courseConfig = Config.courses[course.toLowerCase()];
    if (!courseConfig) return;
    
    const isFinalLesson = module === courseConfig.finalModule && 
                          lesson === courseConfig.finalLesson;
    
    if (isFinalLesson) {
      console.log(`🎓 ${course} completed!`);
      EventBus.emit('course:completed', { course, module, lesson });
    }
  },
  
  async _sendWebhooks(metadata) {
    try {
      const currentMember = await window.$memberstackDom.getCurrentMember();
      
      const memberInfo = {
        email: currentMember?.data?.auth?.email || currentMember?.auth?.email || 'unknown@email.com',
        firstName: currentMember?.data?.customFields?.['first-name'] || currentMember?.customFields?.['first-name'] || '',
        lastName: currentMember?.data?.customFields?.['last-name'] || currentMember?.customFields?.['last-name'] || '',
        memberId: currentMember?.data?.id || currentMember?.id || 'unknown',
        ...metadata
      };
      
      await Webhooks.sendLessonActivity(memberInfo);
      
      const courseConfig = Config.courses[metadata.course.toLowerCase()];
      if (courseConfig && 
          metadata.module === courseConfig.finalModule && 
          metadata.lesson === courseConfig.finalLesson) {
        memberInfo.courseCompleted = metadata.course;
        await Webhooks.sendCourseCompletion(memberInfo);
      }
    } catch (error) {
      console.error('Error sending webhooks:', error);
    }
  }
};