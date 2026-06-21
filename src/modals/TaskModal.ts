import { App, Modal, Notice, setIcon } from 'obsidian';
import { VaultBoardStore } from '../store';
import {
  Task,
  TaskPriority,
  TaskStatus,
  Subtask,
  PRIORITY_COLORS,
} from '../types';

export class TaskModal extends Modal {
  private task?: Task;
  private defaultProjectId?: string;
  private onSave: () => void;
  private store: VaultBoardStore;

  private titleInput!: HTMLInputElement;
  private descInput!: HTMLTextAreaElement;
  private projectSelect!: HTMLSelectElement;
  private statusSelect!: HTMLSelectElement;
  private prioritySelect!: HTMLSelectElement;
  private dueDateInput!: HTMLInputElement;
  private tagsInput!: HTMLInputElement;
  private timeEstInput!: HTMLInputElement;
  private notesInput!: HTMLTextAreaElement;
  private subtasksList!: HTMLElement;
  private subtasks: Subtask[] = [];

  constructor(
    app: App,
    store: VaultBoardStore,
    onSave: () => void,
    task?: Task,
    defaultProjectId?: string
  ) {
    super(app);
    this.store = store;
    this.onSave = onSave;
    this.task = task;
    this.defaultProjectId = defaultProjectId;
    if (task) this.subtasks = [...task.subtasks];
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('vb-modal');

    contentEl.createEl('h2', {
      cls: 'vb-modal-title',
      text: this.task ? 'Edit Task' : 'New Task',
    });

    const form = contentEl.createDiv({ cls: 'vb-form' });

    // Title
    this.createField(form, 'Title *', () => {
      this.titleInput = form.createEl('input', {
        type: 'text',
        cls: 'vb-input',
        placeholder: 'Task title...',
      });
      if (this.task) this.titleInput.value = this.task.title;
      this.titleInput.focus();
      return this.titleInput;
    });

    // Project + Status row
    const row1 = form.createDiv({ cls: 'vb-form-row' });
    this.createFieldIn(row1, 'Project', () => {
      this.projectSelect = row1.createEl('select', { cls: 'vb-select' });
      const projects = this.store.getProjects().filter(p => p.status !== 'archived');
      if (projects.length === 0) {
        this.projectSelect.createEl('option', { text: 'No projects yet', value: '' });
      } else {
        this.projectSelect.createEl('option', { text: '— Select project —', value: '' });
        projects.forEach(p => {
          const opt = this.projectSelect.createEl('option', { text: p.name, value: p.id });
          if (this.task?.projectId === p.id || this.defaultProjectId === p.id) {
            opt.selected = true;
          }
        });
      }
      return this.projectSelect;
    });

    this.createFieldIn(row1, 'Status', () => {
      this.statusSelect = row1.createEl('select', { cls: 'vb-select' });
      const statuses: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'cancelled'];
      statuses.forEach(s => {
        const labels: Record<TaskStatus, string> = {
          'todo': 'To Do',
          'in-progress': 'In Progress',
          'review': 'Review',
          'done': 'Done',
          'cancelled': 'Cancelled',
        };
        const opt = this.statusSelect.createEl('option', { text: labels[s], value: s });
        if ((this.task?.status ?? 'todo') === s) opt.selected = true;
      });
      return this.statusSelect;
    });

    // Priority + Due Date row
    const row2 = form.createDiv({ cls: 'vb-form-row' });
    this.createFieldIn(row2, 'Priority', () => {
      this.prioritySelect = row2.createEl('select', { cls: 'vb-select' });
      const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];
      priorities.forEach(p => {
        const opt = this.prioritySelect.createEl('option', {
          text: p.charAt(0).toUpperCase() + p.slice(1),
          value: p,
        });
        if ((this.task?.priority ?? 'medium') === p) opt.selected = true;
      });
      return this.prioritySelect;
    });

    this.createFieldIn(row2, 'Due Date', () => {
      this.dueDateInput = row2.createEl('input', { type: 'date', cls: 'vb-input' });
      if (this.task?.dueDate) this.dueDateInput.value = this.task.dueDate;
      return this.dueDateInput;
    });

    // Tags + Time Estimate row
    const row3 = form.createDiv({ cls: 'vb-form-row' });
    this.createFieldIn(row3, 'Tags (comma-separated)', () => {
      this.tagsInput = row3.createEl('input', {
        type: 'text',
        cls: 'vb-input',
        placeholder: 'study, urgent, review...',
      });
      if (this.task?.tags) this.tagsInput.value = this.task.tags.join(', ');
      return this.tagsInput;
    });

    this.createFieldIn(row3, 'Time Estimate (min)', () => {
      this.timeEstInput = row3.createEl('input', {
        type: 'number',
        cls: 'vb-input',
        placeholder: '60',
      });
      this.timeEstInput.min = '0';
      if (this.task?.timeEstimate) this.timeEstInput.value = String(this.task.timeEstimate);
      return this.timeEstInput;
    });

    // Description
    this.createField(form, 'Description', () => {
      this.descInput = form.createEl('textarea', {
        cls: 'vb-textarea',
        placeholder: 'Brief description of this task...',
      });
      if (this.task?.description) this.descInput.value = this.task.description;
      return this.descInput;
    });

    // Subtasks
    const subtaskSection = form.createDiv({ cls: 'vb-subtasks-section' });
    subtaskSection.createEl('label', { cls: 'vb-label', text: 'Subtasks' });
    this.subtasksList = subtaskSection.createDiv({ cls: 'vb-subtasks-list' });
    this.renderSubtasks();

    const addSubBtn = subtaskSection.createEl('button', {
      cls: 'vb-btn vb-btn-ghost vb-btn-sm',
      text: '+ Add subtask',
    });
    addSubBtn.type = 'button';
    addSubBtn.addEventListener('click', () => {
      this.subtasks.push({ id: this.store.generateId(), title: '', done: false });
      this.renderSubtasks();
    });

    // Notes
    this.createField(form, 'Notes', () => {
      this.notesInput = form.createEl('textarea', {
        cls: 'vb-textarea',
        placeholder: 'Additional notes, links, references...',
      });
      if (this.task?.notes) this.notesInput.value = this.task.notes;
      return this.notesInput;
    });

    // Actions
    const actions = contentEl.createDiv({ cls: 'vb-modal-actions' });
    const cancelBtn = actions.createEl('button', { cls: 'vb-btn vb-btn-ghost', text: 'Cancel' });
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = actions.createEl('button', {
      cls: 'vb-btn vb-btn-primary',
      text: this.task ? 'Save Changes' : 'Create Task',
    });
    saveBtn.addEventListener('click', () => this.handleSave());
  }

  private createField(
    container: HTMLElement,
    label: string,
    builder: () => HTMLElement
  ) {
    const field = container.createDiv({ cls: 'vb-field' });
    field.createEl('label', { cls: 'vb-label', text: label });
    builder();
  }

  private createFieldIn(
    container: HTMLElement,
    label: string,
    builder: () => HTMLElement
  ) {
    const field = container.createDiv({ cls: 'vb-field' });
    field.createEl('label', { cls: 'vb-label', text: label });
    builder();
  }

  private renderSubtasks() {
    this.subtasksList.empty();
    this.subtasks.forEach((sub, idx) => {
      const row = this.subtasksList.createDiv({ cls: 'vb-subtask-row' });

      const checkbox = row.createEl('input', { type: 'checkbox' });
      checkbox.checked = sub.done;
      checkbox.addEventListener('change', () => {
        this.subtasks[idx].done = checkbox.checked;
      });

      const input = row.createEl('input', {
        type: 'text',
        cls: 'vb-input vb-subtask-input',
        placeholder: 'Subtask title...',
      });
      input.value = sub.title;
      input.addEventListener('input', () => {
        this.subtasks[idx].title = input.value;
      });

      const delBtn = row.createEl('button', { cls: 'vb-btn-icon', type: 'button' });
      setIcon(delBtn, 'x');
      delBtn.addEventListener('click', () => {
        this.subtasks.splice(idx, 1);
        this.renderSubtasks();
      });
    });
  }

  private handleSave() {
    const title = this.titleInput.value.trim();
    if (!title) {
      new Notice('Task title is required.');
      this.titleInput.focus();
      return;
    }

    const projectId = this.projectSelect.value;
    if (!projectId) {
      new Notice('Please select a project.');
      return;
    }

    const tags = this.tagsInput.value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const timeEstimate = this.timeEstInput.value
      ? parseInt(this.timeEstInput.value)
      : undefined;

    const status = this.statusSelect.value as TaskStatus;
    const now = new Date().toISOString();

    const cleanSubtasks = this.subtasks.filter(s => s.title.trim() !== '');

    if (this.task) {
      this.store.updateTask(this.task.id, {
        title,
        description: this.descInput.value.trim(),
        projectId,
        status,
        priority: this.prioritySelect.value as TaskPriority,
        dueDate: this.dueDateInput.value || undefined,
        tags,
        timeEstimate,
        notes: this.notesInput.value.trim() || undefined,
        subtasks: cleanSubtasks,
        completedAt:
          status === 'done' && !this.task.completedAt ? now : this.task.completedAt,
      });
    } else {
      const newTask: Task = {
        id: this.store.generateId(),
        title,
        description: this.descInput.value.trim(),
        projectId,
        status,
        priority: this.prioritySelect.value as TaskPriority,
        dueDate: this.dueDateInput.value || undefined,
        tags,
        timeEstimate,
        timeSpent: 0,
        subtasks: cleanSubtasks,
        notes: this.notesInput.value.trim() || undefined,
        createdAt: now,
        updatedAt: now,
        completedAt: status === 'done' ? now : undefined,
      };
      this.store.addTask(newTask);
    }

    new Notice(this.task ? 'Task updated.' : 'Task created!');
    this.onSave();
    this.close();
  }

  onClose() {
    this.contentEl.empty();
  }
}
