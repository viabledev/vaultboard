import { App, setIcon } from 'obsidian';
import { VaultBoardStore } from '../store';
import { CATEGORY_LABELS, ProjectCategory } from '../types';
import VaultBoardPlugin from '../../main';

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function getPastDays(n: number): string[] {
  const days: string[] = [];
  const d = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(day.getDate() - i);
    days.push(day.toISOString().split('T')[0]);
  }
  return days;
}

function shortDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

export function renderAnalytics(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  plugin: VaultBoardPlugin
) {
  const section = container.createDiv({ cls: 'vb-section vb-analytics' });

  section.createEl('h2', { cls: 'vb-page-title', text: '📊 Analytics' });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Week range
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  const weekStartStr = weekStart.toISOString().split('T')[0];

  const last30Start = new Date(today);
  last30Start.setDate(today.getDate() - 29);
  const last30Str = last30Start.toISOString().split('T')[0];

  const allTasks = store.getTasks();
  const projects = store.getProjects();

  const weekCompleted = store.getCompletedTasksInRange(weekStartStr, todayStr);
  const monthCompleted = store.getCompletedTasksInRange(last30Str, todayStr);
  const streak = store.getStreakDays();
  const totalTimeEntries = store.getTimeEntries();
  const totalPomodoroTime = totalTimeEntries
    .filter(e => e.type === 'pomodoro')
    .reduce((s, e) => s + e.duration, 0);

  const totalDone = allTasks.filter(t => t.status === 'done').length;
  const totalTasks = allTasks.length;

  // Summary cards
  const cards = section.createDiv({ cls: 'vb-analytics-cards' });
  const cardDefs = [
    { icon: 'check-circle', label: 'Done this week', value: String(weekCompleted.length), sub: `${monthCompleted.length} this month`, cls: 'stat-success' },
    { icon: 'zap', label: 'Day streak', value: `${streak} 🔥`, sub: streak === 1 ? '1 day' : `${streak} days`, cls: 'stat-warning' },
    { icon: 'timer', label: 'Pomodoros logged', value: formatDuration(totalPomodoroTime), sub: `${totalTimeEntries.filter(e => e.type === 'pomodoro').length} sessions`, cls: 'stat-info' },
    { icon: 'target', label: 'Overall progress', value: `${totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0}%`, sub: `${totalDone}/${totalTasks} tasks done`, cls: 'stat-info' },
  ];

  cardDefs.forEach(c => {
    const card = cards.createDiv({ cls: `vb-stat-card ${c.cls}` });
    const iconEl = card.createDiv({ cls: 'vb-stat-icon' });
    setIcon(iconEl, c.icon);
    const text = card.createDiv({ cls: 'vb-stat-text' });
    text.createEl('span', { cls: 'vb-stat-value', text: c.value });
    text.createEl('span', { cls: 'vb-stat-label', text: c.label });
    text.createEl('small', { cls: 'vb-stat-sub', text: c.sub });
  });

  // Two-column charts layout
  const chartsRow = section.createDiv({ cls: 'vb-charts-row' });

  // Chart 1: Tasks completed per day (last 7 days)
  renderDailyChart(chartsRow, store, todayStr);

  // Chart 2: Time per project
  renderProjectTimeChart(chartsRow, store, projects);

  // Task status breakdown
  renderStatusBreakdown(section, allTasks);

  // Category breakdown
  renderCategoryBreakdown(section, store, projects);

  // Recent activity
  renderRecentActivity(section, store);
}

function renderDailyChart(container: HTMLElement, store: VaultBoardStore, todayStr: string) {
  const chartCard = container.createDiv({ cls: 'vb-chart-card' });
  chartCard.createEl('h3', { cls: 'vb-chart-title', text: 'Tasks Completed (Last 7 Days)' });

  const days = getPastDays(7);
  const counts = days.map(d => store.getCompletedTasksInRange(d, d).length);
  const maxCount = Math.max(...counts, 1);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = chartCard.createSvg('svg', { cls: 'vb-bar-chart' });
  svg.setAttribute('viewBox', '0 0 350 140');
  svg.setAttribute('width', '100%');

  const barW = 36;
  const gap = 14;
  const chartH = 100;
  const baseY = 120;
  const startX = 20;

  days.forEach((day, i) => {
    const count = counts[i];
    const barH = maxCount > 0 ? Math.max((count / maxCount) * chartH, count > 0 ? 4 : 0) : 0;
    const x = startX + i * (barW + gap);
    const y = baseY - barH;
    const isToday = day === todayStr;

    const bar = document.createElementNS(svgNS, 'rect');
    bar.setAttribute('x', String(x));
    bar.setAttribute('y', String(y));
    bar.setAttribute('width', String(barW));
    bar.setAttribute('height', String(barH));
    bar.setAttribute('rx', '4');
    bar.setAttribute('fill', isToday ? 'var(--color-accent)' : 'var(--interactive-accent)');
    bar.setAttribute('opacity', isToday ? '1' : '0.6');
    svg.appendChild(bar);

    if (count > 0) {
      const label = document.createElementNS(svgNS, 'text');
      label.setAttribute('x', String(x + barW / 2));
      label.setAttribute('y', String(y - 4));
      label.setAttribute('text-anchor', 'middle');
      label.setAttribute('font-size', '11');
      label.setAttribute('fill', 'var(--text-normal)');
      label.textContent = String(count);
      svg.appendChild(label);
    }

    const dayLabel = document.createElementNS(svgNS, 'text');
    dayLabel.setAttribute('x', String(x + barW / 2));
    dayLabel.setAttribute('y', String(baseY + 14));
    dayLabel.setAttribute('text-anchor', 'middle');
    dayLabel.setAttribute('font-size', '11');
    dayLabel.setAttribute('fill', isToday ? 'var(--color-accent)' : 'var(--text-muted)');
    dayLabel.setAttribute('font-weight', isToday ? 'bold' : 'normal');
    dayLabel.textContent = shortDay(day);
    svg.appendChild(dayLabel);
  });

  // Baseline
  const baseline = document.createElementNS(svgNS, 'line');
  baseline.setAttribute('x1', '10');
  baseline.setAttribute('y1', String(baseY + 1));
  baseline.setAttribute('x2', '340');
  baseline.setAttribute('y2', String(baseY + 1));
  baseline.setAttribute('stroke', 'var(--background-modifier-border)');
  baseline.setAttribute('stroke-width', '1');
  svg.appendChild(baseline);
}

function renderProjectTimeChart(container: HTMLElement, store: VaultBoardStore, projects: ReturnType<VaultBoardStore['getProjects']>) {
  const chartCard = container.createDiv({ cls: 'vb-chart-card' });
  chartCard.createEl('h3', { cls: 'vb-chart-title', text: 'Time Spent per Project' });

  const projectTimes = projects
    .map(p => ({
      project: p,
      time: store.getTotalTimeSpent(p.id),
    }))
    .filter(pt => pt.time > 0)
    .sort((a, b) => b.time - a.time)
    .slice(0, 6);

  if (projectTimes.length === 0) {
    const empty = chartCard.createDiv({ cls: 'vb-empty-state' });
    setIcon(empty.createDiv({ cls: 'vb-empty-icon' }), 'timer');
    empty.createEl('p', { text: 'No time tracked yet.' });
    empty.createEl('small', { text: 'Use the Pomodoro timer to log time.' });
    return;
  }

  const maxTime = projectTimes[0].time;

  projectTimes.forEach(({ project, time }) => {
    const row = chartCard.createDiv({ cls: 'vb-hbar-row' });
    const label = row.createDiv({ cls: 'vb-hbar-label' });
    label.createSpan({ text: project.icon });
    label.createSpan({ text: ` ${project.name}` });

    const barWrap = row.createDiv({ cls: 'vb-hbar-wrap' });
    const bar = barWrap.createDiv({ cls: 'vb-hbar-fill' });
    const pct = Math.round((time / maxTime) * 100);
    bar.style.width = `${pct}%`;
    bar.style.backgroundColor = project.color;

    row.createDiv({ cls: 'vb-hbar-value', text: formatDuration(time) });
  });
}

function renderStatusBreakdown(container: HTMLElement, allTasks: ReturnType<VaultBoardStore['getTasks']>) {
  if (allTasks.length === 0) return;

  const card = container.createDiv({ cls: 'vb-analytics-card' });
  card.createEl('h3', { cls: 'vb-chart-title', text: 'Task Status Breakdown' });

  const statusGroups = [
    { label: 'To Do', key: 'todo', color: '#64748b' },
    { label: 'In Progress', key: 'in-progress', color: '#3b82f6' },
    { label: 'Review', key: 'review', color: '#f59e0b' },
    { label: 'Done', key: 'done', color: '#22c55e' },
    { label: 'Cancelled', key: 'cancelled', color: '#ef4444' },
  ];

  const breakdown = container.createDiv({ cls: 'vb-status-breakdown' });
  statusGroups.forEach(sg => {
    const count = allTasks.filter(t => t.status === sg.key).length;
    if (count === 0) return;
    const pct = Math.round((count / allTasks.length) * 100);

    const row = breakdown.createDiv({ cls: 'vb-hbar-row' });
    const label = row.createDiv({ cls: 'vb-hbar-label' });
    const dot = label.createEl('span', { cls: 'vb-status-dot' });
    dot.style.backgroundColor = sg.color;
    label.createSpan({ text: sg.label });

    const barWrap = row.createDiv({ cls: 'vb-hbar-wrap' });
    const bar = barWrap.createDiv({ cls: 'vb-hbar-fill' });
    bar.style.width = `${pct}%`;
    bar.style.backgroundColor = sg.color;

    row.createDiv({ cls: 'vb-hbar-value', text: `${count} (${pct}%)` });
  });
}

function renderCategoryBreakdown(
  container: HTMLElement,
  store: VaultBoardStore,
  projects: ReturnType<VaultBoardStore['getProjects']>
) {
  if (projects.length === 0) return;

  const card = container.createDiv({ cls: 'vb-analytics-card' });
  card.createEl('h3', { cls: 'vb-chart-title', text: 'Projects by Category' });

  const catColors: Record<ProjectCategory, string> = {
    personal: '#6366f1',
    college: '#22c55e',
    work: '#3b82f6',
    assignment: '#f97316',
    other: '#64748b',
  };

  const categories: ProjectCategory[] = ['personal', 'college', 'work', 'assignment', 'other'];
  const grid = card.createDiv({ cls: 'vb-category-grid' });

  categories.forEach(cat => {
    const catProjects = projects.filter(p => p.category === cat);
    if (catProjects.length === 0) return;

    const cell = grid.createDiv({ cls: 'vb-category-cell' });
    cell.style.borderColor = catColors[cat];

    const header = cell.createDiv({ cls: 'vb-category-cell-header' });
    header.style.backgroundColor = catColors[cat] + '22';
    header.createEl('strong', { text: CATEGORY_LABELS[cat] });
    header.createSpan({ cls: 'vb-category-count', text: String(catProjects.length) });

    catProjects.slice(0, 3).forEach(p => {
      const projectRow = cell.createDiv({ cls: 'vb-category-project-row' });
      projectRow.createSpan({ text: p.icon });
      projectRow.createSpan({ text: p.name });
      const stats = store.getProjectTaskStats(p.id);
      const pct = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
      projectRow.createEl('small', { text: `${pct}%` });
    });

    if (catProjects.length > 3) {
      cell.createEl('small', { cls: 'vb-text-muted', text: `+${catProjects.length - 3} more` });
    }
  });
}

function renderRecentActivity(container: HTMLElement, store: VaultBoardStore) {
  const card = container.createDiv({ cls: 'vb-analytics-card' });
  card.createEl('h3', { cls: 'vb-chart-title', text: '🕐 Recent Activity' });

  const allTasks = store.getTasks();
  const recent = [...allTasks]
    .filter(t => t.updatedAt)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 10);

  if (recent.length === 0) {
    card.createEl('p', { cls: 'vb-text-muted', text: 'No activity yet.' });
    return;
  }

  const list = card.createDiv({ cls: 'vb-activity-list' });
  recent.forEach(task => {
    const project = store.getProject(task.projectId);
    const item = list.createDiv({ cls: 'vb-activity-item' });

    const dot = item.createDiv({ cls: 'vb-activity-dot' });
    dot.style.backgroundColor = project?.color ?? '#64748b';

    const body = item.createDiv({ cls: 'vb-activity-body' });
    body.createEl('span', { cls: 'vb-activity-title', text: task.title });
    if (project) {
      body.createEl('small', { cls: 'vb-activity-project', text: `${project.icon} ${project.name}` });
    }

    const time = item.createEl('small', { cls: 'vb-activity-time' });
    const updated = new Date(task.updatedAt);
    const diff = Date.now() - updated.getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (days > 0) time.setText(`${days}d ago`);
    else if (hours > 0) time.setText(`${hours}h ago`);
    else time.setText('Just now');
  });
}
