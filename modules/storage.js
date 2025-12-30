import { EventBus } from './eventBus.js';

export const Storage = {
  memberstack: null,
  memberData: null,
  
  async init(memberstackInstance) {
    this.memberstack = memberstackInstance;
    await this.load();
    return this.memberData;
  },
  
  async load() {
    try {
      const member = await this.memberstack.getMemberJSON();
      this.memberData = member.data || {};
      EventBus.emit('storage:loaded', this.memberData);
      return this.memberData;
    } catch (error) {
      console.error("Error loading member data:", error);
      this.memberData = {};
      return this.memberData;
    }
  },
  
  async save() {
    try {
      await this.memberstack.updateMemberJSON({ json: this.memberData });
      EventBus.emit('storage:saved', this.memberData);
      return true;
    } catch (error) {
      console.error("Error saving member data:", error);
      EventBus.emit('storage:error', error);
      return false;
    }
  },
  
  getLessonData(course, module, lesson) {
    const courseKey = this._findCourseKey(course);
    if (!courseKey) return null;
    return this.memberData[courseKey]?.[module]?.[lesson];
  },
  
  setLessonComplete(course, module, lesson, timestamp = new Date().toISOString()) {
    const courseKey = this._findCourseKey(course) || course.toLowerCase();
    
    if (!this.memberData[courseKey]) this.memberData[courseKey] = {};
    if (!this.memberData[courseKey][module]) this.memberData[courseKey][module] = {};
    
    this.memberData[courseKey][module][lesson] = {
      completed: true,
      completedAt: timestamp
    };
    
    return this.memberData;
  },
  
  setLessonIncomplete(course, module, lesson) {
    const courseKey = this._findCourseKey(course);
    if (!courseKey) return;
    
    if (this.memberData[courseKey]?.[module]?.[lesson]) {
      delete this.memberData[courseKey][module][lesson];
      
      if (Object.keys(this.memberData[courseKey][module]).length === 0) {
        delete this.memberData[courseKey][module];
      }
      if (Object.keys(this.memberData[courseKey]).length === 0) {
        delete this.memberData[courseKey];
      }
    }
    
    return this.memberData;
  },
  
  isLessonComplete(lessonData) {
    if (!lessonData) return false;
    if (lessonData === true) return true;
    if (typeof lessonData === 'object' && lessonData.completed === true) return true;
    return false;
  },
  
  countCompletedLessons(courseId) {
    const courseKey = this._findCourseKey(courseId);
    if (!courseKey) return 0;
    
    let count = 0;
    const course = this.memberData[courseKey];
    
    if (course && typeof course === 'object') {
      Object.entries(course).forEach(([moduleKey, module]) => {
        if (module && typeof module === 'object' && !Array.isArray(module)) {
          Object.values(module).forEach(lessonData => {
            if (this.isLessonComplete(lessonData)) count++;
          });
        }
      });
    }
    
    return count;
  },
  
  _findCourseKey(courseId) {
    const memberKeys = Object.keys(this.memberData || {});
    return memberKeys.find(key => key.toLowerCase() === courseId.toLowerCase());
  }
};