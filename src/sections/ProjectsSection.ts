import { App, setIcon } from 'obsidian';
import { VaultBoardStore } from '../store';
import { Project, ProjectCategory, ProjectStatus, Task, CATEGORY_LABELS } from '../types';
import { ProjectModal } from '../modals/ProjectModal';
import { TaskModal } from '../modals/TaskModal';
import { TemplateModal } from '../modals/TemplateModal';
import { renderTaskItem } from './DashboardSection';
import VaultBoardPlugin from '../../main';

type FilterCategory = 'all' | ProjectCategory;
type FilterStatus = 'all' | ProjectStatus;

let activeCategory: FilterCategory = 'all';
let activeStatus: FilterStatus = 'active';
let expandedProjectId: string | null = null;

export function renderProjects(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  plugin: VaultBoardPlugin,
  refresh: () => void
) {
  const section = container.createDiv({ cls: 'vb-section vb-projects' });

  // Header
  const header = section.createDiv({ cls: 'vb-section-header' });
  const titleRow = header.createDiv({ cls: 'vb-section-title-row' });
  titleRow.createEl('h2', { cls: 'vb-page-title', text: '📁 Projects' });

  const actions = titleRow.createDiv({ cls: 'vb-header-actions' });

  const templateBtn = actions.createEl('button', { cls: 'vb-btn vb-btn-outline' });
  setIcon(templateBtn.createSpan(), 'layout-grid');
  templateBtn.createSpan({ text: ' Templates' });
  templateBtn.addEventListener('click', () => new TemplateModal(app, store, refresh).open());

  const newBtn = actions.createEl('button', { cls: 'vb-btn vb-btn-primary' });
  setIcon(newBtn.createSpan(), 'plus');
  newBtn.createSpan({ text: ' New Project' });
  newBtn.addEventListener('click', () => new ProjectModal(app, store, refresh).open());

  // Category filters
  const filterBar = section.createDiv({ cls: 'vb-filter-bar' });
  const categoryFilters = filterBar.createDiv({ cls: 'vb-filter-group' });

  const cats: { value: FilterCategory; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'personal', label: '⭐ Personal' },
    { value: 'college', label: '🎓 College' },
    { value: 'work', label: '💼 Work' },
    { value: 'assignment', label: '📝 Assignment' },
    { value: 'other', label: '📁 Other' },
  ];

  cats.forEach(cat => {
    const btn = categoryFilters.createEl('button', {
      cls: `vb-filter-btn${activeCategory === cat.value ? ' active' : ''}`,
      text: cat.label,
    });
    btn.addEventListener('click', () => {
      activeCategory = cat.value;
      renderProjects(container, store, app, plugin, refresh);
    });
  });

  // Status filters
  const statusFilters = filterBar.createDiv({ cls: 'vb-filter-group' });
  const statuses: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: '🟢 Active' },
    { value: 'paused', label: '⏸️ Paused' },
    { value: 'completed', label: '✅ Completed' },
    { value: 'archived', label: '📦 Archived' },
  ];

  statuses.forEach(s => {
    const btn = statusFilters.createEl('button', {
      cls: `vb-filter-btn${activeStatus === s.value ? ' active' : ''}`,
      text: s.label,
    });
    btn.addEventListener('click', () => {
      activeStatus = s.value;
      renderProjects(container, store, app, plugin, refresh);
    });
  });

  // Filter projects
  let projects = store.getProjects();
  if (activeCategory !== 'all') projects = projects.filter(p => p.category === activeCategory);
  if (activeStatus !== 'all') projects = projects.filter(p => p.status === activeStatus);

  // Sort: active first, then by name
  projects.sort((a, b) => {
    const order: ProjectStatus[] = ['active', 'paused', 'completed', 'archived'];
    const diff = order.indexOf(a.status) - order.indexOf(b.status);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });

  if (projects.length === 0) {
    const empty = section.createDiv({ cls: 'vb-empty-state vb-empty-large' });
    setIcon(empty.createDiv({ cls: 'vb-empty-icon' }), 'folder-open');
    empty.createEl('h3', { text: 'No projects found' });
    empty.createEl('p', { text: 'Create your first project or apply a community template.' });
    const emptyActions = empty.createDiv({ cls: 'vb-empty-actions' });
    emptyActions.createEl('button', { cls: 'vb-btn vb-btn-primary', text: '+ New Project' })
      .addEventListener('click', () => new ProjectModal(app, store, refresh).open());
    emptyActions.createEl('button', { cls: 'vb-btn vb-btn-outline', text: '✨ Browse Templates' })
      .addEventListener('click', () => new TemplateModal(app, store, refresh).open());
    return;
  }

  // Projects grid
  const grid = section.createDiv({ cls: 'vb-projects-grid' });
  projects.forEach(project => {
    renderProjectCard(grid, store, app, project, refresh);
  });
}

function renderProjectCard(
  container: HTMLElement,
  store: VaultBoardStore,
  app: App,
  project: Project,
  refresh: () => void
) {
  const stats = store.getProjectTaskStats(project.id);
  const progress = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const isExpanded = expandedProjectId === project.id;

  const card = container.createDiv({ cls: `vb-project-card${isExpanded ? ' expanded' : ''}` });
  card.style.setProperty('--project-color', project.color);

  // Color band
  const band = card.createDiv({ cls: 'vb-card-band' });
  band.style.backgroundColor = project.color;

  // Card header
  const cardHeader = card.createDiv({ cls: 'vb-card-header' });
  const titleArea = cardHeader.createDiv({ cls: 'vb-card-title-area' });
  titleArea.createSpan({ cls: 'vb-project-icon', text: project.icon });

  const titleBlock = titleArea.createDiv({ cls: 'vb-card-title-block' });
  titleBlock.createEl('h3', { cls: 'vb-card-name', text: project.name });

  const badges = titleBlock.createDiv({ cls: 'vb-card-badges' });
  badges.createSpan({
    cls: `vb-category-badge vb-cat-${project.category}`,
    text: CATEGORY_LABELS[project.category],
  });
  badges.createSpan({
    cls: `vb-status-badge vb-status-${project.status}`,
    text: project.status,
  });

  // Card actions
  const cardActions = cardHeader.createDiv({ cls: 'vb-card-actions' });

  const expandBtn = cardActions.createEl('button', {
    cls: 'vb-btn-icon',
    title: isExpanded ? 'Collapse' : 'View tasks',
    type: 'button',
  });
  setIcon(expandBtn, isExpanded ? 'chevron-up' : 'chevron-down');
  expandBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    expandedProjectId = isExpanded ? null : project.id;
    refresh();
  });

  const editBtn = cardActions.createEl('button', { cls: 'vb-btn-icon', title: 'Edit project', type: 'button' });
  setIcon(editBtn, 'pencil');
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    new ProjectModal(app, store, refresh, project).open();
  });

  const archiveBtn = cardActions.createEl('button', {
    cls: 'vb-btn-icon',
    title: project.status === 'archived' ? 'Unarchive' : 'Archive',
    type: 'button',
  });
  setIcon(archiveBtn, 'archive');
  archiveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    store.updateProject(project.id, {
      status: project.status === 'archived' ? 'active' : 'archived',
    });
    refresh();
  });

  const deleteBtn = cardActions.createEl('button', {
    cls: 'vb-btn-icon vb-btn-danger-icon',
    title: 'Delete project',
    type: 'button',
  });
  setIcon(deleteBtn, 'trash-2');
  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (confirm(`Delete "${project.name}" and all its tasks? This cannot be undone.`)) {
      store.deleteProject(project.id);
      if (expandedProjectId === project.id) expandedProjectId = null;
      refresh();
    }
  });

  // Description
  if (project.description) {
    card.createEl('p', { cls: 'vb-card-desc', text: project.description });
  }

  // Progress
  const progressSection = card.createDiv({ cls: 'vb-card-progress' });
  const progressMeta = progressSection.createDiv({ cls: 'vb-progress-meta' });
  progressMeta.createSpan({ text: `${stats.done}/${stats.total} tasks` });
  progressMeta.createSpan({ cls: 'vb-progress-pct', text: `${progress}%` });
  const progressBar = progressSection.createDiv({ cls: 'vb-progress' });
  const fill = progressBar.createDiv({ cls: 'vb-progress-fill' });
  fill.style.width = `${progress}%`;
  fill.style.backgroundColor = project.color;

  // Meta footer
  const cardFooter = card.createDiv({ cls: 'vb-card-footer' });
  if (project.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = project.dueDate < today && project.status !== 'completed';
    cardFooter.createSpan({
      cls: `vb-card-due${isOverdue ? ' overdue' : ''}`,
      text: `📅 Due: ${project.dueDate}`,
    });
  }

  if (project.tags.length > 0) {
    const tagRow = cardFooter.createDiv({ cls: 'vb-tag-row' });
    project.tags.slice(0, 3).forEach(tag => tagRow.createSpan({ cls: 'vb-tag', text: tag }));
  }

  // Expanded: Task list
  if (isExpanded) {
    const taskSection = card.createDiv({ cls: 'vb-card-tasks' });
    const taskHeader = taskSection.createDiv({ cls: 'vb-task-group-header' });
    taskHeader.createEl('strong', { text: 'Tasks' });

    const addTaskBtn = taskHeader.createEl('button', {
      cls: 'vb-btn vb-btn-ghost vb-btn-sm',
      type: 'button',
    });
    setIcon(addTaskBtn.createSpan(), 'plus');
    addTaskBtn.createSpan({ text: ' Add Task' });
    addTaskBtn.addEventListener('click', () => {
      new TaskModal(app, store, refresh, undefined, project.id).open();
    });

    const tasks = store.getTasks(project.id);
    const pending = tasks.filter(t => t.status !== 'done' && t.status !== 'cancelled');
    const done = tasks.filter(t => t.status === 'done');

    if (tasks.length === 0) {
      const emptyTasks = taskSection.createDiv({ cls: 'vb-empty-state' });
      emptyTasks.createEl('p', { text: 'No tasks yet. Add one above!' });
    } else {
      [...pending, ...done].forEach(task =>
        renderTaskItem(taskSection, store, app, task, refresh, false)
      );
    }
  }
}
