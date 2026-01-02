export const SidebarScroller = {
    init() {
      this.scrollToCurrentLesson();
    },
  
    scrollToCurrentLesson() {
      const currentUrl = window.location.pathname;
      
      // Find all lesson links using custom attribute
      const lessonLinks = document.querySelectorAll('[data-lesson-link]');
  
      lessonLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        
        if (linkHref === currentUrl || link.href.includes(currentUrl)) {
          // Found current lesson - scroll to it
          link.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
  
          // Optional: Add highlight class
          link.classList.add('current-lesson');
        }
      });
    }
  };