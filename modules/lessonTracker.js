import { Storage } from './storage.js';
import { Webhooks } from './webhooks.js';
import { Metadata } from './metadata.js';
import { Config } from './config.js';
import { EventBus } from './eventBus.js';

export const LessonTracker = {
  memberstack: null,
  
  init(memberstackInstance) {
    this.memberstack = memberstackInstance;
  },
  
  async markComplete(lessonKey) {
    const [course, module, lesson] = lessonKey.split('-');
    
    Storage.setLessonComplete(course, module, lesson);
    await Storage.save();
    
    console.log(`✅ Lesson ${lessonKey} completed`);
    
    const metadata = {
      course,
      module,
      lesson,
      lessonKey,
      activeCourse: Metadata.getCourseNameGreek(lessonKey),
      nextLesson: Metadata.getNextLessonTitle(lessonKey)
    };
    
    EventBus.emit('lesson:completed', { lessonKey, ...metadata });
    
    await this._checkCourseCompletion(course, module, lesson);
    await this._sendWebhooks(metadata);
    
    return metadata;
  },
  
  async markIncomplete(lessonKey) {
    const [course, module, lesson] = lessonKey.split('-');
    
    Storage.setLessonIncomplete(course, module, lesson);
    await Storage.save();
    
    console.log(`❌ Lesson ${lessonKey} marked incomplete`);
    EventBus.emit('lesson:incompleted', { lessonKey, course, module, lesson });
    
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
      const currentMember = await this.memberstack.getCurrentMember();
      
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