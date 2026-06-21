import { ItemView, Notice, WorkspaceLeaf, setIcon } from 'obsidian';
import VaultBoardPlugin from '../main';
import { NavSection } from './types';
import { renderDashboard } from './sections/DashboardSection';
import { renderProjects } from './sections/ProjectsSection';
import { renderCalendar } from './sections/CalendarSection';
import { renderAnalytics } from './sections/AnalyticsSection';

export const VIEW_TYPE_VAULTBOARD = 'vaultboard-view';

interface PomodoroState {
  isRunning: boolean;
  timeLeft: number;
  sessionType: 'work' | 'short-break' | 'long-break';
  sessionsCompleted: number;
}

export class VaultBoardView extends ItemView {
  plugin: VaultBoardPlugin;
  private currentSection: NavSection;
  private pomodoroInterval: ReturnType<typeof setInterval> | null = null;
  private pomo: PomodoroState;

  constructor(leaf: WorkspaceLeaf, plugin: VaultBoardPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.currentSection = plugin.store.getSettings().defaultView;
    const settings = plugin.store.getSettings();
    this.pomo = {
      isRunning: false,
      timeLeft: settings.pomodoro.workDuration * 60,
      sessionType: 'work',
      sessionsCompleted: 0,
    };
  }

  getViewType(): string { return VIEW_TYPE_VAULTBOARD; }
  getDisplayText(): string { return 'VaultBoard'; }
  getIcon(): string { return 'layout-grid'; }

  async onOpen(): Promise<void> {
    this.render();
  }

  async onClose(): Promise<void> {
    if (this.pomodoroInterval) clearInterval(this.pomodoroInterval);
  }

  refresh() {
    this.render();
  }

  private render() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.addClass('vb-view');

    const sidebar = contentEl.createDiv({ cls: 'vb-sidebar' });
    this.renderSidebar(sidebar);

    const main = contentEl.createDiv({ cls: 'vb-main' });
    this.renderSection(main);
  }

  private renderSidebar(sidebar: HTMLElement) {
    // Logo
    const logo = sidebar.createDiv({ cls: 'vb-logo' });
    setIcon(logo.createSpan({ cls: 'vb-logo-icon' }), 'layout-grid');
    logo.createSpan({ cls: 'vb-logo-text', text: 'VaultBoard' });

    // Navigation
    const nav = sidebar.createDiv({ cls: 'vb-nav' });
    const navItems: { id: NavSection; icon: string; label: string }[] = [
      { id: 'dashboard', icon: 'home', label: 'Dashboard' },
      { id: 'projects',  icon: 'folder', label: 'Projects' },
      { id: 'calendar',  icon: 'calendar', label: 'Calendar' },
      { id: 'analytics', icon: 'bar-chart-2', label: 'Analytics' },
    ];

    navItems.forEach(item => {
      const el = nav.createDiv({
        cls: `vb-nav-item${this.currentSection === item.id ? ' active' : ''}`,
      });
      setIcon(el.createSpan({ cls: 'vb-nav-icon' }), item.icon);
      el.createSpan({ cls: 'vb-nav-label', text: item.label });
      el.addEventListener('click', () => {
        this.currentSection = item.id;
        this.render();
      });
    });

    // Quick stats
    const store = this.plugin.store;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayCount = store.getTasksForDate(todayStr).length;
    const overdueCount = store.getOverdueTasks().length;
    const activeCount = store.getProjects().filter(p => p.status === 'active').length;

    const quickStats = sidebar.createDiv({ cls: 'vb-sidebar-stats' });
    quickStats.createEl('div', { cls: 'vb-sidebar-stat-row' })
      .setText(`📁 ${activeCount} active projects`);
    quickStats.createEl('div', { cls: 'vb-sidebar-stat-row' })
      .setText(`📋 ${todayCount} due today`);
    if (overdueCount > 0) {
      quickStats.createEl('div', { cls: 'vb-sidebar-stat-row vb-stat-alert' })
        .setText(`⚠️ ${overdueCount} overdue`);
    }

    // Pomodoro widget
    this.renderPomodoroWidget(sidebar);

    // Footer
    const footer = sidebar.createDiv({ cls: 'vb-sidebar-footer' });
    const settingsBtn = footer.createEl('button', { cls: 'vb-btn-icon', title: 'Settings' });
    setIcon(settingsBtn, 'settings');
    settingsBtn.addEventListener('click', () => {
      (this.app as any).setting.open();
      (this.app as any).setting.openTabById('vaultboard');
    });
  }

  private renderPomodoroWidget(sidebar: HTMLElement) {
    const settings = this.plugin.store.getSettings();
    const widget = sidebar.createDiv({ cls: 'vb-pomodoro' });

    const header = widget.createDiv({ cls: 'vb-pomodoro-header' });
    setIcon(header.createSpan(), 'timer');
    header.createSpan({ text: ' Focus Timer' });

    // Session type toggle
    const typeRow = widget.createDiv({ cls: 'vb-pomodoro-types' });
    const types: { key: PomodoroState['sessionType']; label: string; duration: number }[] = [
      { key: 'work',        label: '🍅',   duration: settings.pomodoro.workDuration },
      { key: 'short-break', label: '☕',   duration: settings.pomodoro.shortBreak },
      { key: 'long-break',  label: '🧘',   duration: settings.pomodoro.longBreak },
    ];

    types.forEach(t => {
      const btn = typeRow.createEl('button', {
        cls: `vb-pomo-type-btn${this.pomo.sessionType === t.key ? ' active' : ''}`,
        text: t.label,
        title: `${t.label} (${t.duration}m)`,
        type: 'button',
      });
      btn.addEventListener('click', () => {
        if (this.pomodoroInterval) {
          clearInterval(this.pomodoroInterval);
          this.pomodoroInterval = null;
        }
        this.pomo.isRunning = false;
        this.pomo.sessionType = t.key;
        this.pomo.timeLeft = t.duration * 60;
        this.render();
      });
    });

    // Timer display
    const mins = String(Math.floor(this.pomo.timeLeft / 60)).padStart(2, '0');
    const secs = String(this.pomo.timeLeft % 60).padStart(2, '0');
    const display = widget.createDiv({ cls: 'vb-pomo-display' });
    display.createEl('span', { cls: 'vb-pomo-time', text: `${mins}:${secs}` });

    const sessionLabel = widget.createDiv({
      cls: 'vb-pomo-label',
      text: this.pomo.sessionType === 'work' ? 'Focus Session'
          : this.pomo.sessionType === 'short-break' ? 'Short Break'
          : 'Long Break',
    });

    // Progress ring
    const maxTime = types.find(t => t.key === this.pomo.sessionType)!.duration * 60;
    const progress = ((maxTime - this.pomo.timeLeft) / maxTime) * 100;
    const progressBar = widget.createDiv({ cls: 'vb-pomo-progress' });
    const fill = progressBar.createDiv({ cls: 'vb-pomo-progress-fill' });
    fill.style.width = `${progress}%`;

    // Controls
    const controls = widget.createDiv({ cls: 'vb-pomo-controls' });

    const startBtn = controls.createEl('button', {
      cls: `vb-btn vb-btn-sm ${this.pomo.isRunning ? 'vb-btn-outline' : 'vb-btn-primary'}`,
      text: this.pomo.isRunning ? '⏸ Pause' : '▶ Start',
      type: 'button',
    });
    startBtn.addEventListener('click', () => this.togglePomodoro());

    const resetBtn = controls.createEl('button', {
      cls: 'vb-btn vb-btn-ghost vb-btn-sm',
      text: '↺ Reset',
      type: 'button',
    });
    resetBtn.addEventListener('click', () => this.resetPomodoro());

    // Session count
    if (this.pomo.sessionsCompleted > 0) {
      widget.createDiv({
        cls: 'vb-pomo-sessions',
        text: `Sessions today: ${'🍅'.repeat(Math.min(this.pomo.sessionsCompleted, 8))}`,
      });
    }
  }

  private togglePomodoro() {
    if (this.pomo.isRunning) {
      this.pomo.isRunning = false;
      if (this.pomodoroInterval) {
        clearInterval(this.pomodoroInterval);
        this.pomodoroInterval = null;
      }
    } else {
      this.pomo.isRunning = true;
      this.pomodoroInterval = setInterval(() => {
        this.pomo.timeLeft--;
        if (this.pomo.timeLeft <= 0) {
          this.onPomodoroComplete();
          return;
        }
        // Update only the timer display without full re-render
        const timeEl = this.contentEl.querySelector('.vb-pomo-time');
        const mins = String(Math.floor(this.pomo.timeLeft / 60)).padStart(2, '0');
        const secs = String(this.pomo.timeLeft % 60).padStart(2, '0');
        if (timeEl) timeEl.textContent = `${mins}:${secs}`;

        const settings = this.plugin.store.getSettings();
        const types = [
          { key: 'work', duration: settings.pomodoro.workDuration },
          { key: 'short-break', duration: settings.pomodoro.shortBreak },
          { key: 'long-break', duration: settings.pomodoro.longBreak },
        ];
        const maxTime = (types.find(t => t.key === this.pomo.sessionType)?.duration ?? 25) * 60;
        const pct = ((maxTime - this.pomo.timeLeft) / maxTime) * 100;
        const fill = this.contentEl.querySelector('.vb-pomo-progress-fill') as HTMLElement;
        if (fill) fill.style.width = `${pct}%`;
      }, 1000);
    }
    // Re-render sidebar to update button state
    const sidebar = this.contentEl.querySelector('.vb-sidebar') as HTMLElement;
    if (sidebar) { sidebar.empty(); this.renderSidebar(sidebar); }
  }

  private onPomodoroComplete() {
    if (this.pomodoroInterval) { clearInterval(this.pomodoroInterval); this.pomodoroInterval = null; }
    this.pomo.isRunning = false;

    const settings = this.plugin.store.getSettings();

    if (this.pomo.sessionType === 'work') {
      this.pomo.sessionsCompleted++;

      this.plugin.store.addTimeEntry({
        id: this.plugin.store.generateId(),
        projectId: '',
        startTime: new Date(Date.now() - settings.pomodoro.workDuration * 60000).toISOString(),
        endTime: new Date().toISOString(),
        duration: settings.pomodoro.workDuration,
        type: 'pomodoro',
      });

      const isLongBreak = this.pomo.sessionsCompleted % settings.pomodoro.sessionsBeforeLongBreak === 0;
      this.pomo.sessionType = isLongBreak ? 'long-break' : 'short-break';
      this.pomo.timeLeft = (isLongBreak ? settings.pomodoro.longBreak : settings.pomodoro.shortBreak) * 60;

      new Notice(`🍅 Pomodoro complete! Time for a ${isLongBreak ? 'long' : 'short'} break.`);
      if (settings.enableNotifications && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('VaultBoard – Pomodoro Complete! 🍅', {
          body: `Take a ${isLongBreak ? 'long' : 'short'} break. You've completed ${this.pomo.sessionsCompleted} sessions.`,
        });
      }
    } else {
      this.pomo.sessionType = 'work';
      this.pomo.timeLeft = settings.pomodoro.workDuration * 60;
      new Notice('☕ Break over! Back to work.');
    }

    this.render();
  }

  private resetPomodoro() {
    if (this.pomodoroInterval) { clearInterval(this.pomodoroInterval); this.pomodoroInterval = null; }
    const settings = this.plugin.store.getSettings();
    this.pomo.isRunning = false;
    this.pomo.timeLeft = settings.pomodoro.workDuration * 60;
    this.pomo.sessionType = 'work';
    this.render();
  }

  private renderSection(main: HTMLElement) {
    const { store, app } = this.plugin;
    const navigate = (s: NavSection) => { this.currentSection = s; this.render(); };
    const refresh = () => this.render();

    switch (this.currentSection) {
      case 'dashboard':
        renderDashboard(main, store, app, this.plugin, navigate, refresh);
        break;
      case 'projects':
        renderProjects(main, store, app, this.plugin, refresh);
        break;
      case 'calendar':
        renderCalendar(main, store, app, this.plugin, refresh);
        break;
      case 'analytics':
        renderAnalytics(main, store, app, this.plugin);
        break;
    }
  }
}
