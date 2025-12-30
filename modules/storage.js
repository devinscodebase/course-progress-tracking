export const Storage = {
  async getLessonProgress() {
    try {
      const member = await window.$memberstackDom.getMemberJSON();
      return member.data || {};
    } catch (error) {
      console.error('Error loading progress:', error);
      return {};
    }
  },

  async saveLessonProgress(lessonKey, completed) {
    try {
      const [course, module, lesson] = lessonKey.split('-');
      const member = await window.$memberstackDom.getMemberJSON();
      const data = member.data || {};
      
      const courseKey = course.toLowerCase();
      if (!data[courseKey]) data[courseKey] = {};
      if (!data[courseKey][module]) data[courseKey][module] = {};
      
      if (completed) {
        data[courseKey][module][lesson] = {
          completed: true,
          completedAt: new Date().toISOString()
        };
      } else {
        delete data[courseKey][module][lesson];
        if (Object.keys(data[courseKey][module]).length === 0) delete data[courseKey][module];
        if (Object.keys(data[courseKey]).length === 0) delete data[courseKey];
      }
      
      await window.$memberstackDom.updateMemberJSON({ json: data });
      return data;
    } catch (error) {
      console.error('Error saving progress:', error);
      return null;
    }
  },

  countCompletedLessons(courseId, data) {
    const courseKey = courseId.toLowerCase();
    const course = data?.[courseKey];
    let count = 0;
    
    if (course && typeof course === 'object' && !Array.isArray(course)) {
      Object.values(course).forEach(module => {
        if (module && typeof module === 'object' && !Array.isArray(module)) {
          Object.values(module).forEach(lesson => {
            if (this.isLessonComplete(lesson)) count++;
          });
        }
      });
    }
    
    return count;
  },

  isLessonComplete(lessonData) {
    if (!lessonData) return false;
    if (lessonData === true) return true;
    if (typeof lessonData === 'object' && lessonData.completed === true) return true;
    return false;
  }
};