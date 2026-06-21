# Changelog

All notable changes to VaultBoard will be documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-06-21

### Added
- **Dashboard** with greeting, stat cards (done today, due today, overdue, active projects, streak), today's tasks, upcoming tasks, and active project strip
- **Projects** section with categorized cards (Personal, College, Work, Assignment, Other), color/icon picker, progress bars, status lifecycle, tags, filter bar by category and status, and inline task expansion
- **Calendar** view with monthly grid, per-day task indicators (pending/done dots), overdue highlighting, click-to-select day detail panel, and month completion summary
- **Analytics** section with daily bar chart (last 7 days), time-per-project horizontal bars, task status breakdown, category distribution grid, and recent activity feed
- **Pomodoro timer** in sidebar with work/short-break/long-break modes, visual progress bar, session counter, auto time-entry logging, and desktop notifications
- **Task modal** with title, description, project selector, status, priority, due date, tags, time estimate, subtasks, and notes
- **Project modal** with name, description, category, status, due date, tags, 15 preset icons, 10 preset colors, and custom color picker
- **Community templates** modal with Browse (5 built-in templates), Import JSON, and Export project tabs
- 5 built-in community templates: Semester Study Plan, Work Sprint (2 Weeks), Personal Goal Tracker, Research Paper/Assignment, Freelance Project
- **Settings tab** with all Pomodoro settings, default view, week start day, notification toggle, data export, and danger-zone clear
- 7 Obsidian commands for keyboard-shortcut driven workflow
- Ribbon icon for one-click access
- Persistent data storage via Obsidian's plugin data API
- Full TypeScript source with esbuild bundling
