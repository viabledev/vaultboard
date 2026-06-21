import { App, setIcon } from 'obsidian';
import { VaultBoardStore } from '../store';
import { Task, NavSection, PRIORITY_COLORS, STATUS_LABELS } from '../types';
import { TaskModal } from '../modals/TaskModal';
import { TemplateModal } from '../modals/TemplateModal';
import VaultBoardPlugin from '../../main';

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function renderDashboard(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  plugin: VaultBoardPlugin,
  navigate: (s: NavSection) => void,
  refresh: () => void
) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const section = container.createDiv({ cls: 'vb-section vb-dashboard' });

  // Header
  const header = section.createDiv({ cls: 'vb-dashboard-header' });
  header.createEl('h1', { cls: 'vb-greeting', text: `${getGreeting()} 👋` });
  header.createEl('p', { cls: 'vb-date-label', text: formatDate(today) });

  // Quick action bar
  const quickBar = section.createDiv({ cls: 'vb-quick-bar' });

  const newTaskBtn = quickBar.createEl('button', { cls: 'vb-btn vb-btn-primary' });
  setIcon(newTaskBtn.createSpan(), 'plus');
  newTaskBtn.createSpan({ text: ' New Task' });
  newTaskBtn.addEventListener('click', () => {
    new TaskModal(app, store, refresh).open();
  });

  const browseBtn = quickBar.createEl('button', { cls: 'vb-btn vb-btn-outline' });
  setIcon(browseBtn.createSpan(), 'layout-grid');
  browseBtn.createSpan({ text: ' Templates' });
  browseBtn.addEventListener('click', () => {
    new TemplateModal(app, store, refresh).open();
  });

  const projectsBtn = quickBar.createEl('button', { cls: 'vb-btn vb-btn-ghost' });
  setIcon(projectsBtn.createSpan(), 'folder');
  projectsBtn.createSpan({ text: ' All Projects' });
  projectsBtn.addEventListener('click', () => navigate('projects'));

  // Stats row
  const overdueTasks = store.getOverdueTasks();
  const todayTasks = store.getTasksForDate(todayStr);
  const allTasks = store.getTasks();
  const completedToday = allTasks.filter(
    t => t.completedAt && t.completedAt.startsWith(todayStr)
  );
  const activeProjects = store.getProjects().filter(p => p.status === 'active');
  const streak = store.getStreakDays();

  const stats = section.createDiv({ cls: 'vb-stats-row' });
  const statDefs = [
    { label: 'Done Today', value: String(completedToday.length), icon: 'check-circle', cls: 'stat-success' },
    { label: 'Due Today', value: String(todayTasks.length), icon: 'calendar', cls: 'stat-info' },
    { label: 'Overdue', value: String(overdueTasks.length), icon: 'alert-circle', cls: overdueTasks.length > 0 ? 'stat-danger' : 'stat-info' },
    { label: 'Active Projects', value: String(activeProjects.length), icon: 'folder', cls: 'stat-info' },
    { label: 'Day Streak 🔥', value: String(streak), icon: 'zap', cls: 'stat-warning' },
  ];

  statDefs.forEach(s => {
    const card = stats.createDiv({ cls: `vb-stat-card ${s.cls}` });
    const iconEl = card.createDiv({ cls: 'vb-stat-icon' });
    setIcon(iconEl, s.icon);
    const textEl = card.createDiv({ cls: 'vb-stat-text' });
    textEl.createEl('span', { cls: 'vb-stat-value', text: s.value });
    textEl.createEl('span', { cls: 'vb-stat-label', text: s.label });
  });

  // Two-column layout below stats
  const columns = section.createDiv({ cls: 'vb-dashboard-columns' });

  // Left: Today's tasks
  const leftCol = columns.createDiv({ cls: 'vb-dashboard-col' });
  renderTodayTasks(leftCol, store, app, plugin, todayTasks, todayStr, refresh);

  // Right: Overdue + Upcoming
  const rightCol = columns.createDiv({ cls: 'vb-dashboard-col' });
  if (overdueTasks.length > 0) {
    renderTaskGroup(rightCol, store, app, plugin, '🔴 Overdue', overdueTasks.slice(0, 5), refresh, 'vb-overdue-group');
  }

  // Upcoming (next 7 days excluding today)
  const next7 = new Date(today);
  next7.setDate(next7.getDate() + 7);
  const nextStr = next7.toISOString().split('T')[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const upcomingTasks = store
    .getTasksDueInRange(tomorrowStr, nextStr)
    .filter(t => t.status !== 'done' && t.status !== 'cancelled')
    .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
    .slice(0, 8);

  renderTaskGroup(rightCol, store, app, plugin, '📅 Upcoming (7 days)', upcomingTasks, refresh, 'vb-upcoming-group');

  // Active Projects mini-overview
  if (activeProjects.length > 0) {
    const projectsSection = section.createDiv({ cls: 'vb-active-projects-strip' });
    projectsSection.createEl('h3', { cls: 'vb-section-title', text: '🚀 Active Projects' });
    const projectsRow = projectsSection.createDiv({ cls: 'vb-projects-strip' });

    activeProjects.slice(0, 4).forEach(project => {
      const stats = store.getProjectTaskStats(project.id);
      const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
      const card = projectsRow.createDiv({ cls: 'vb-mini-project-card' });
      card.style.borderLeftColor = project.color;
      card.addEventListener('click', () => navigate('projects'));

      const cardHeader = card.createDiv({ cls: 'vb-mini-card-header' });
      cardHeader.createSpan({ cls: 'vb-project-icon', text: project.icon });
      cardHeader.createEl('strong', { text: project.name });

      const progressBar = card.createDiv({ cls: 'vb-progress' });
      const fill = progressBar.createDiv({ cls: 'vb-progress-fill' });
      fill.style.width = `${progress}%`;
      fill.style.backgroundColor = project.color;

      card.createEl('small', {
        cls: 'vb-mini-stats',
        text: `${stats.done}/${stats.total} tasks · ${progress}%`,
      });
    });

    if (activeProjects.length > 4) {
      const moreBtn = projectsSection.createEl('button', {
        cls: 'vb-btn vb-btn-ghost vb-btn-sm',
        text: `View all ${activeProjects.length} projects →`,
      });
      moreBtn.addEventListener('click', () => navigate('projects'));
    }
  }
}

function renderTodayTasks(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  plugin: VaultBoardPlugin,
  tasks: Task[],
  todayStr: string,
  refresh: () => void
) {
  const group = container.createDiv({ cls: 'vb-task-group' });
  const header = group.createDiv({ cls: 'vb-task-group-header' });
  header.createEl('h3', { cls: 'vb-section-title', text: `📋 Today's Tasks (${tasks.length})` });

  const addBtn = header.createEl('button', { cls: 'vb-btn vb-btn-ghost vb-btn-sm' });
  setIcon(addBtn, 'plus');
  addBtn.title = 'Add task due today';
  addBtn.addEventListener('click', () => {
    const modal = new TaskModal(app, store, refresh);
    modal.open();
  });

  if (tasks.length === 0) {
    const empty = group.createDiv({ cls: 'vb-empty-state' });
    setIcon(empty.createDiv({ cls: 'vb-empty-icon' }), 'check-circle');
    empty.createEl('p', { text: "You're all clear for today! 🎉" });
    empty.createEl('small', { text: 'Add a task with the + button above.' });
    return;
  }

  const pending = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const done = tasks.filter(t => t.status === 'done');

  [...pending, ...done].forEach(task => {
    renderTaskItem(group, store, app, task, refresh);
  });
}

function renderTaskGroup(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  plugin: VaultBoardPlugin,
  title: string,
  tasks: Task[],
  refresh: () => void,
  cls?: string
) {
  if (tasks.length === 0) return;

  const group = container.createDiv({ cls: `vb-task-group ${cls ?? ''}` });
  group.createEl('h3', { cls: 'vb-section-title', text: `${title} (${tasks.length})` });

  tasks.forEach(task => {
    renderTaskItem(group, store, app, task, refresh);
  });
}

export function renderTaskItem(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  task: Task,
  refresh: () => void,
  showProject = true
) {
  const isDone = task.status === 'done';
  const isCancelled = task.status === 'cancelled';
  const project = store.getProject(task.projectId);

  const item = container.createDiv({ cls: `vb-task-item${isDone ? ' done' : ''}${isCancelled ? ' cancelled' : ''}` });
  if (project) item.style.setProperty('--project-color', project.color);

  // Checkbox
  const checkbox = item.createEl('input', { type: 'checkbox' });
  checkbox.checked = isDone;
  checkbox.addEventListener('change', () => {
    const newStatus = checkbox.checked ? 'done' : 'todo';
    store.updateTask(task.id, {
      status: newStatus,
      completedAt: checkbox.checked ? new Date().toISOString() : undefined,
    });
    refresh();
  });

  const body = item.createDiv({ cls: 'vb-task-body' });

  // Title row
  const titleRow = body.createDiv({ cls: 'vb-task-title-row' });
  titleRow.createEl('span', { cls: 'vb-task-title', text: task.title });

  // Priority badge
  const priorityEl = titleRow.createEl('span', { cls: `vb-priority-badge vb-priority-${task.priority}` });
  priorityEl.style.backgroundColor = PRIORITY_COLORS[task.priority] + '22';
  priorityEl.style.color = PRIORITY_COLORS[task.priority];
  priorityEl.setText(task.priority.charAt(0).toUpperCase() + task.priority.slice(1));

  // Meta row
  const metaRow = body.createDiv({ cls: 'vb-task-meta' });

  if (showProject && project) {
    const projBadge = metaRow.createEl('span', { cls: 'vb-task-project' });
    projBadge.style.borderLeftColor = project.color;
    projBadge.setText(`${project.icon} ${project.name}`);
  }

  if (task.dueDate) {
    const isOverdue = task.dueDate < new Date().toISOString().split('T')[0] && !isDone;
    const dueBadge = metaRow.createEl('span', { cls: `vb-task-due${isOverdue ? ' overdue' : ''}` });
    setIcon(dueBadge.createSpan(), 'calendar');
    dueBadge.createSpan({ text: ` ${task.dueDate}` });
  }

  if (task.timeEstimate) {
    metaRow.createEl('span', {
      cls: 'vb-task-time',
      text: `⏱ ${formatDuration(task.timeEstimate)}`,
    });
  }

  if (task.tags.length > 0) {
    const tagRow = body.createDiv({ cls: 'vb-tag-row' });
    task.tags.slice(0, 3).forEach(tag => {
      tagRow.createSpan({ cls: 'vb-tag', text: tag });
    });
  }

  // Subtasks progress
  if (task.subtasks.length > 0) {
    const doneSubs = task.subtasks.filter(s => s.done).length;
    body.createEl('small', {
      cls: 'vb-subtask-progress',
      text: `${doneSubs}/${task.subtasks.length} subtasks`,
    });
  }

  // Actions
  const actions = item.createDiv({ cls: 'vb-task-actions' });

  const editBtn = actions.createEl('button', { cls: 'vb-btn-icon', title: 'Edit task', type: 'button' });
  setIcon(editBtn, 'pencil');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    new TaskModal(app, store, refresh, task).open();
  });

  const deleteBtn = actions.createEl('button', {
    cls: 'vb-btn-icon vb-btn-danger-icon',
    title: 'Delete task',
    type: 'button',
  });
  setIcon(deleteBtn, 'trash-2');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`Delete "${task.title}"?`)) {
      store.deleteTask(task.id);
      refresh();
    }
  });
}
