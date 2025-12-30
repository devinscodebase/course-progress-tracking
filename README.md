# Course Progress System

Modular lesson tracking system for Webflow + Memberstack with Zapier integration.

## Features

- ✅ Lesson completion tracking with timestamps
- ✅ Progress badges and bars
- ✅ Course completion detection
- ✅ Zapier webhooks for re-engagement
- ✅ Backward compatible with legacy data

## Installation

Add to Webflow **Footer Code**:

```html
<script type="module" src="https://cdn.jsdelivr.net/gh/devinscodebase/course-progress-tracking@main/init.js"></script>
```

## Module Structure

```text
modules/
├── config.js        - Webhooks, courses, UI settings
├── eventBus.js      - Event system
├── storage.js       - Memberstack JSON operations
├── webhooks.js      - Zapier integrations
├── metadata.js      - Page content extraction
├── lessonTracker.js - Completion logic
├── uiManager.js     - DOM updates
└── badgeSystem.js   - Progress tracking
```

## Webhook Payload

**Lesson Activity:**

```json
{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "timestamp": 1767086603999,
  "activeCourse": "Βασικές Αρχές Blockchain",
  "nextLesson": "Consensus Mechanisms",
  "lessonKey": "Course1-module2-lesson5"
}
```

## Configuration

Edit `modules/config.js` to customize:

- Webhook URLs
- Course definitions
- UI messages and colors
- Progress text

## Usage

Webflow button attribute:

```html
<a ms-code-mark-complete="Course1-module1-lesson1">Complete Lesson</a>
```

## Development

```bash
git clone https://github.com/devinscodebase/course-progress-tracking.git
# Edit modules
git commit -m "Update feature"
git push
# CDN updates automatically
```

## Version

2.0.0 - Modular architecture
