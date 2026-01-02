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

  async getLessonProgress() {
    if (this.cache && this.cacheExpiry && Date.now() < this.cacheExpiry) {
      console.log('📦 Using Memberstack cache');
      return this.cache;
    }

    if (!this.ms) this.init();

    try {
      const response = await this.ms.getMemberJSON();
      let data = response.data?.lessonProgress || {};

      // Auto-migrate old data structure
      data = await this.migrateOldData(response.data, data);

      this.cache = data;
      this.cacheExpiry = Date.now() + this.CACHE_TTL;
      
      return data;
    } catch (error) {
      console.error('Error fetching lesson progress:', error);
      return {};
    }
  },

  async saveLessonProgress(data) {
    const normalized = {};
    
    for (const courseKey in data) {
      normalized[courseKey] = {};
      
      for (const moduleKey in data[courseKey]) {
        const moduleData = data[courseKey][moduleKey];
        
        // Handle string properties (like nextLessonUrl) - just copy them
        if (typeof moduleData === 'string') {
          normalized[courseKey][moduleKey] = moduleData;
          continue;
        }
        
        // Handle object properties (actual modules with lessons)
        if (typeof moduleData === 'object' && moduleData !== null) {
          normalized[courseKey][moduleKey] = {};
          
          for (const lessonKey in moduleData) {
            normalized[courseKey][moduleKey][lessonKey] = moduleData[lessonKey];
          }
        }
      }
    }
    
    await this.ms.updateMemberJSON({ json: { lessonProgress: normalized } });
    this.clearCache();
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
      await this.ms.updateMemberJSON({
        json: {
          lessonProgress: lessonProgressData,
          course1: null,
          course2: null,
          course3: null
        }
      });
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