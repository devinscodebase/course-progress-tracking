export const Storage = {
  ms: null,
  cache: null,
  cacheExpiry: null,
  CACHE_TTL: 5000,

  init() {
    this.ms = window.$memberstackDom;
  },

  clearCache() {
    this.cache = null;
    this.cacheExpiry = null;
  },

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
      this.clearCache();
    } catch (error) {
      console.error('Error updating member JSON:', error);
      throw error;
    }
  },

  async getLessonProgress() {
    if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      console.log('📦 Using Memberstack cache');
      return this.cache;
    }

    if (!this.ms) this.init();

    try {
      const allData = await this.getMemberJSON();
      let data = allData.lessonProgress || {};

      // Auto-migrate old data structure
      data = await this.migrateOldData(allData, data);

      this.cache = data;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      
      return data;
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
      return {};
    }
  },

  // ORIGINAL signature that uiManager.js expects
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
    
    lessonProgress[courseKey][moduleKey][lessonKeyLower] = {
      completed,
      completedAt: new Date().toISOString()
    };
    
    allData.lessonProgress = lessonProgress;
    await this.updateMemberJSON(allData);
  },

  // NEW method for NextLessonDetector to store nextLessonUrl
  async storeNextLessonUrl(courseId, nextLessonUrl) {
    const allData = await this.getMemberJSON();
    const lessonProgress = allData.lessonProgress || {};
    
    const courseKey = courseId.toLowerCase();
    
    if (!lessonProgress[courseKey]) {
      lessonProgress[courseKey] = {};
    }
    
    lessonProgress[courseKey].nextLessonUrl = nextLessonUrl;
    
    allData.lessonProgress = lessonProgress;
    await this.updateMemberJSON(allData);
    
    // DON'T clear cache here - it breaks progress tracking
    // this.clearCache();
  },

  async migrateOldData(fullData, lessonProgressData) {
    let migrated = false;

    // Check for old structure (data.course1 instead of data.lessonProgress.course1)
    if (fullData.course1 && !lessonProgressData.course1) {
      lessonProgressData.course1 = fullData.course1;
      migrated = true;
    }
    if (fullData.course2 && !lessonProgressData.course2) {
      lessonProgressData.course2 = fullData.course2;
      migrated = true;
    }
    if (fullData.course3 && !lessonProgressData.course3) {
      lessonProgressData.course3 = fullData.course3;
      migrated = true;
    }

    // If we migrated, save the new structure and clean up old data
    if (migrated) {
      console.log('🔄 Migrating old data structure...');
      await window.$memberstackDom.updateMemberJSON({
        json: {
          lessonProgress: lessonProgressData,
          course1: null,
          course2: null,
          course3: null
        }
      });
      this.clearCache();
    }

    return lessonProgressData;
  },

  isLessonComplete(lesson) {
    return lesson && lesson.completed === true;
  },

  countCompletedLessons(data) {
    let count = 0;
    
    for (const courseKey in data) {
      const course = data[courseKey];
      if (typeof course !== 'object') continue;
      
      for (const moduleKey in course) {
        // Skip non-module properties
        if (moduleKey === 'nextLessonUrl') continue;
        
        const module = course[moduleKey];
        if (typeof module !== 'object') continue;
        
        for (const lessonKey in module) {
          const lesson = module[lessonKey];
          if (this.isLessonComplete(lesson)) {
            count++;
          }
        }
      }
    }
    
    return count;
  }
};