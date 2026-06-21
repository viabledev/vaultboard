import { App, setIcon } from 'obsidian';
import { VaultBoardStore } from '../store';
import { Task } from '../types';
import { TaskModal } from '../modals/TaskModal';
import { renderTaskItem } from './DashboardSection';
import VaultBoardPlugin from '../../main';

let calendarYear = new Date().getFullYear();
let calendarMonth = new Date().getMonth(); // 0-indexed
let selectedDate: string | null = null;

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function renderCalendar(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  plugin: VaultBoardPlugin,
  refresh: () => void
) {
  const section = container.createDiv({ cls: 'vb-section vb-calendar' });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // Header
  const header = section.createDiv({ cls: 'vb-section-header' });
  const titleRow = header.createDiv({ cls: 'vb-section-title-row' });
  titleRow.createEl('h2', { cls: 'vb-page-title', text: '📅 Calendar' });

  const newTaskBtn = titleRow.createEl('button', { cls: 'vb-btn vb-btn-primary' });
  setIcon(newTaskBtn.createSpan(), 'plus');
  newTaskBtn.createSpan({ text: ' New Task' });
  newTaskBtn.addEventListener('click', () => {
    new TaskModal(app, store, () => renderCalendar(container, store, app, plugin, refresh)).open();
  });

  const calBody = section.createDiv({ cls: 'vb-calendar-body' });
  const calLeft = calBody.createDiv({ cls: 'vb-calendar-left' });
  const calRight = calBody.createDiv({ cls: 'vb-calendar-right' });

  renderMonthNav(calLeft, store, app, plugin, container, refresh, todayStr);
  renderDayDetail(calRight, store, app, plugin, container, refresh, todayStr);
}

function renderMonthNav(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  plugin: VaultBoardPlugin,
  fullContainer: HTMLElement,
  refresh: () => void,
  todayStr: string
) {
  container.empty();

  // Month navigation
  const nav = container.createDiv({ cls: 'vb-month-nav' });
  const prevBtn = nav.createEl('button', { cls: 'vb-btn-icon', type: 'button' });
  setIcon(prevBtn, 'chevron-left');
  prevBtn.addEventListener('click', () => {
    calendarMonth--;
    if (calendarMonth < 0) { calendarMonth = 11; calendarYear--; }
    renderCalendar(fullContainer, store, app, plugin, refresh);
  });

  nav.createEl('h3', {
    cls: 'vb-month-label',
    text: `${MONTH_NAMES[calendarMonth]} ${calendarYear}`,
  });

  const nextBtn = nav.createEl('button', { cls: 'vb-btn-icon', type: 'button' });
  setIcon(nextBtn, 'chevron-right');
  nextBtn.addEventListener('click', () => {
    calendarMonth++;
    if (calendarMonth > 11) { calendarMonth = 0; calendarYear++; }
    renderCalendar(fullContainer, store, app, plugin, refresh);
  });

  const todayBtn = nav.createEl('button', {
    cls: 'vb-btn vb-btn-ghost vb-btn-sm',
    text: 'Today',
    type: 'button',
  });
  todayBtn.addEventListener('click', () => {
    const now = new Date();
    calendarYear = now.getFullYear();
    calendarMonth = now.getMonth();
    selectedDate = todayStr;
    renderCalendar(fullContainer, store, app, plugin, refresh);
  });

  // Weekday headers
  const weekRow = container.createDiv({ cls: 'vb-weekday-row' });
  WEEKDAYS.forEach(d => weekRow.createDiv({ cls: 'vb-weekday-label', text: d }));

  // Day grid
  const grid = container.createDiv({ cls: 'vb-calendar-grid' });

  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const lastDay = new Date(calendarYear, calendarMonth + 1, 0);

  // Day of week for first (Mon=0..Sun=6)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  // Blank cells before first day
  for (let i = 0; i < startDow; i++) {
    grid.createDiv({ cls: 'vb-calendar-day vb-day-blank' });
  }

  // Get all tasks for this month for performance
  const monthStart = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-01`;
  const monthEnd = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
  const monthTasks = store.getTasksDueInRange(monthStart, monthEnd);
  const overdueTasks = store.getOverdueTasks();

  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = monthTasks.filter(t => t.dueDate === dateStr);
    const isToday = dateStr === todayStr;
    const isSelected = dateStr === selectedDate;
    const hasDone = dayTasks.some(t => t.status === 'done');
    const hasPending = dayTasks.some(t => t.status !== 'done' && t.status !== 'cancelled');
    const hasOverdue = overdueTasks.some(t => t.dueDate === dateStr);

    const dayEl = grid.createDiv({
      cls: [
        'vb-calendar-day',
        isToday ? 'vb-day-today' : '',
        isSelected ? 'vb-day-selected' : '',
        hasOverdue ? 'vb-day-overdue' : '',
      ].filter(Boolean).join(' '),
    });

    dayEl.createEl('span', { cls: 'vb-day-number', text: String(day) });

    if (dayTasks.length > 0) {
      const dots = dayEl.createDiv({ cls: 'vb-day-dots' });
      if (hasPending || hasOverdue) dots.createDiv({ cls: 'vb-dot vb-dot-pending' });
      if (hasDone) dots.createDiv({ cls: 'vb-dot vb-dot-done' });
      dayEl.createEl('span', { cls: 'vb-day-count', text: String(dayTasks.length) });
    }

    dayEl.addEventListener('click', () => {
      selectedDate = dateStr;
      renderCalendar(fullContainer, store, app, plugin, refresh);
    });
  }
}

function renderDayDetail(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  plugin: VaultBoardPlugin,
  fullContainer: HTMLElement,
  refresh: () => void,
  todayStr: string
) {
  container.empty();

  const displayDate = selectedDate ?? todayStr;
  const dateObj = new Date(displayDate + 'T12:00:00');
  const label = dateObj.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const header = container.createDiv({ cls: 'vb-day-detail-header' });
  header.createEl('h3', { cls: 'vb-day-detail-title', text: label });

  const addBtn = header.createEl('button', { cls: 'vb-btn vb-btn-primary vb-btn-sm' });
  setIcon(addBtn.createSpan(), 'plus');
  addBtn.createSpan({ text: ' Task' });
  addBtn.addEventListener('click', () => {
    const modal = new TaskModal(
      app,
      store,
      () => renderCalendar(fullContainer, store, app, plugin, refresh)
    );
    modal.open();
  });

  const tasks = store.getTasksForDate(displayDate);
  const pending = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
  const done = tasks.filter(t => t.status === 'done');
  const cancelled = tasks.filter(t => t.status === 'cancelled');

  if (tasks.length === 0) {
    const empty = container.createDiv({ cls: 'vb-empty-state' });
    setIcon(empty.createDiv({ cls: 'vb-empty-icon' }), 'calendar');
    empty.createEl('p', { text: 'No tasks on this day.' });
    empty.createEl('small', { text: 'Click "+ Task" to add one.' });
    return;
  }

  const taskRefresh = () => renderCalendar(fullContainer, store, app, plugin, refresh);

  if (pending.length > 0) {
    const group = container.createDiv({ cls: 'vb-task-group' });
    group.createEl('h4', { cls: 'vb-task-group-label', text: `Pending (${pending.length})` });
    pending.forEach(t => renderTaskItem(group, store, app, t, taskRefresh));
  }

  if (done.length > 0) {
    const group = container.createDiv({ cls: 'vb-task-group vb-task-group-done' });
    group.createEl('h4', { cls: 'vb-task-group-label', text: `Completed (${done.length})` });
    done.forEach(t => renderTaskItem(group, store, app, t, taskRefresh));
  }

  if (cancelled.length > 0) {
    const group = container.createDiv({ cls: 'vb-task-group vb-task-group-cancelled' });
    group.createEl('h4', { cls: 'vb-task-group-label', text: `Cancelled (${cancelled.length})` });
    cancelled.forEach(t => renderTaskItem(group, store, app, t, taskRefresh));
  }

  // Mini month summary
  const summary = container.createDiv({ cls: 'vb-month-summary' });
  const m = String(calendarMonth + 1).padStart(2, '0');
  const monthStart = `${calendarYear}-${m}-01`;
  const lastDayNum = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const monthEnd = `${calendarYear}-${m}-${String(lastDayNum).padStart(2, '0')}`;
  const monthTasks = store.getTasksDueInRange(monthStart, monthEnd);
  const monthDone = monthTasks.filter(t => t.status === 'done').length;

  summary.createEl('p', {
    cls: 'vb-month-stat',
    text: `${MONTH_NAMES[calendarMonth]}: ${monthDone}/${monthTasks.length} tasks complete`,
  });

  const monthPct = monthTasks.length > 0 ? Math.round((monthDone / monthTasks.length) * 100) : 0;
  const bar = summary.createDiv({ cls: 'vb-progress vb-progress-thin' });
  const fill = bar.createDiv({ cls: 'vb-progress-fill' });
  fill.style.width = `${monthPct}%`;
}
