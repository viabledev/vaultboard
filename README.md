# VaultBoard

> A community workspace plugin for [Obsidian](https://obsidian.md) — manage projects, tasks, assignments, college work, and office work all in one place, with calendar views, time tracking, and Pomodoro focus sessions.

![VaultBoard Banner](https://raw.githubusercontent.com/devakollam/vaultboard/main/assets/banner.png)

## ✨ Features

### 🗂️ Project Management
- **Categorized projects** — Personal, College, Work, Assignment, Other
- Color-coded project cards with custom icons and progress tracking
- Project status lifecycle: Active → Paused → Completed → Archived
- Filter and sort by category and status
- Due dates, tags, and task count per project

### ✅ Task Management
- Rich task creation — title, description, priority, due date, tags, time estimate
- Four statuses: To Do, In Progress, Review, Done (+ Cancelled)
- Four priority levels: Low, Medium, High, Urgent
- Subtasks with individual completion tracking
- Task notes for additional context and references
- Quick complete toggle directly from any view

### 📅 Calendar View
- Monthly calendar grid with task indicators
- Color-coded dots (pending, done) per day
- Click any day to see and manage its tasks
- Month-level completion summary
- Overdue day highlighting

### 📊 Analytics
- Daily task completion bar chart (last 7 days)
- Time spent per project (horizontal bar chart)
- Task status breakdown
- Category distribution overview
- Productivity streak counter
- Recent activity feed

### 🍅 Pomodoro Focus Timer
- Configurable work/short break/long break durations
- Visual progress bar and session counter
- Desktop notifications on session end
- Auto-logs completed sessions as time entries
- Persistent across view navigation

### 🌐 Community Templates
- 5 built-in templates: Semester Study Plan, Work Sprint, Research Paper, Personal Goals, Freelance Project
- Import any template shared as JSON
- Export your own projects as shareable templates
- Copy to clipboard for easy sharing

### ⌨️ Commands & Keyboard Shortcuts
All commands are accessible via the Obsidian Command Palette (`Ctrl/Cmd + P`):

| Command | Description |
|---------|-------------|
| `Open VaultBoard` | Open the main workspace |
| `Create new task` | Open task creation modal |
| `Create new project` | Open project creation modal |
| `Browse community templates` | Open template gallery |
| `Go to Dashboard` | Navigate to dashboard |
| `Go to Calendar` | Navigate to calendar |
| `Go to Analytics` | Navigate to analytics |

## 📦 Installation

### From Obsidian Community Plugins (Recommended)
1. Open Obsidian → **Settings → Community Plugins**
2. Click **Browse** and search for **VaultBoard**
3. Click **Install**, then **Enable**

### Manual Installation
1. Download the [latest release](https://github.com/devakollam/vaultboard/releases/latest)
2. Extract `main.js`, `styles.css`, and `manifest.json` into your vault's `.obsidian/plugins/vaultboard/` folder
3. Reload Obsidian and enable the plugin under **Settings → Community Plugins**

### Building from Source
```bash
git clone https://github.com/devakollam/vaultboard.git
cd vaultboard
npm install
npm run build
```
Copy `main.js`, `styles.css`, and `manifest.json` into `.obsidian/plugins/vaultboard/`.

## 🚀 Quick Start

1. Click the **VaultBoard** icon in the left ribbon (grid icon)
2. Create your first project — choose a category, color, and icon
3. Or click **Templates** to start from a community template
4. Add tasks to your project with due dates and priorities
5. Switch to **Calendar** to see your deadlines spread across the month
6. Use the **Pomodoro timer** in the sidebar to stay focused
7. Check **Analytics** to track your productivity over time

## ⚙️ Configuration

Open **Settings → VaultBoard** to configure:

- **Default view** — which section opens on launch
- **Week start day** — Monday or Sunday
- **Desktop notifications** — enable/disable Pomodoro notifications
- **Pomodoro durations** — work, short break, long break
- **Sessions before long break** — default 4
- **Data export** — export all data as JSON
- **Clear all data** — permanently reset (use with caution)

## 🌐 Community & Contributing

VaultBoard is community-driven. We welcome:

- **Bug reports** — [Open an issue](https://github.com/devakollam/vaultboard/issues)
- **Feature requests** — [Start a discussion](https://github.com/devakollam/vaultboard/discussions)
- **Pull requests** — See [CONTRIBUTING.md](CONTRIBUTING.md)
- **Template sharing** — Share your exported project templates in [Discussions](https://github.com/devakollam/vaultboard/discussions)

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Made with ❤️ for the Obsidian community
