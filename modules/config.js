export const Config = {
    version: '2.0.0',
    
    webhooks: {
      courseComplete: 'https://hooks.zapier.com/hooks/catch/25657269/uwoe6a4/',
      lessonActivity: 'https://hooks.zapier.com/hooks/catch/25657269/uw2xnbg/'
    },
    
    courses: {
      'course1': {
        finalModule: 'module6',
        finalLesson: 'lesson30',
        nameGreek: 'Βασικές Αρχές Blockchain'
      },
      'course2': {
        finalModule: 'module5',
        finalLesson: 'lesson14',
        nameGreek: 'Συναλλαγές Κρυπτονομισμάτων'
      },
      'course3': {
        finalModule: 'module8',
        finalLesson: 'lesson51',
        nameGreek: 'Προχωρημένο DeFi'
      }
    },
    
    ui: {
      encouragingMessages: [
        "Τέλεια πρόοδος!",
        "Άψογη δουλειά!",
        "Έχεις πάρει φωτιά!",
        "Ουαου! Καλή δουλειά!",
        "Το μάθημα ολοκληρώθηκε"
      ],
      buttonColors: ["#6c4cf9"],
      selectors: {
        lessonButton: '[ms-code-mark-complete]',
        badgeText: '[data-ms-code="badge-text"]',
        progressBar: '[data-ms-code="progress-bar"]',
        progressText: '[data-ms-code="progress-text"]',
        totalLessons: '[data-ms-code="total-lessons"]',
        completionBadge: '[data-ms-code="completion-badge"]',
        checkbox: '.chapter-menu_check'
      }
    },
    
    progressText: {
      notStarted: "Δεν ξεκίνησε",
      completed: "Το μάθημα ολοκληρώθηκε!",
      inProgress: (progress) => `${progress}% Complete`,
      lessonCount: (completed, total) => `${completed} από τα ${total} ΜΑΘΗΜΑΤΑ ΟΛΟΚΛΗΡΩΜΕΝΑ`
    }
  };