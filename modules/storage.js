import CONFIG from './config.js';

export const Storage = {
  cache: null,
  cacheTimestamp: 0,
  CACHE_TTL: 5000, // 5 seconds

  async getMemberJSON() {
    try {
      const result = await window.$memberstackDom.getMemberJSON();
      return result?.data || result || {};
    } catch (error) {
      console.error('Error fetching member JSON:', error);
      return {};
    }
  },

  async updateMemberJSON(json) {
    try {
      await window.$memberstackDom.updateMemberJSON({ json });
      // Invalidate cache after update
      this.cache = null;
    } catch (error) {
      console.error('Error updating member JSON:', error);
      throw error;
    }
  },

  // OPTIMIZATION #3: Cache getMemberJSON for rapid operations
  async getLessonProgress() {
    const now = Date.now();
    
    // Return cache if valid
    if (this.cache && (now - this.cacheTimestamp) < this.CACHE_TTL) {
      console.log('📦 Using Memberstack cache');
      return this.cache;
    }
    
    // Fetch fresh data
    const data = await this.getMemberJSON();
    this.cache = data.lessonProgress || {};
    this.cacheTimestamp = now;
    
    return this.cache;
  },

  async saveLessonProgress(lessonKey, completed) {
    const [course, module, lesson] = lessonKey.split('-');
    
    // Fetch current data
    const allData = await this.getMemberJSON();
    const lessonProgress = allData.lessonProgress || {};
    
    const courseKey = course.toLowerCase();
    const moduleKey = module.toLowerCase();
    const lessonKeyLower = lesson.toLowerCase();

    if (!lessonProgress[courseKey]) {
      lessonProgress[courseKey] = {};
    }
    if (!lessonProgress[courseKey][moduleKey]) {
      lessonProgress[courseKey][moduleKey] = {};
    }

    if (completed) {
      lessonProgress[courseKey][moduleKey][lessonKeyLower] = {
        completed: true,
        completedAt: new Date().toISOString()
      };
    } else {
      delete lessonProgress[courseKey][moduleKey][lessonKeyLower];
    }

    allData.lessonProgress = lessonProgress;
    
    await this.updateMemberJSON(allData);
    
    // Update cache
    this.cache = lessonProgress;
    this.cacheTimestamp = Date.now();
  },

  async save(lessonProgress) {
    const allData = await this.getMemberJSON();
    allData.lessonProgress = lessonProgress;
    await this.updateMemberJSON(allData);
  },

  isLessonComplete(lessonData) {
    return lessonData && lessonData.completed === true;
  }
};