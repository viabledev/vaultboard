import { App, Modal, Notice } from 'obsidian';
import { VaultBoardStore } from '../store';
import { Project, ProjectCategory, ProjectStatus, CATEGORY_COLORS } from '../types';

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#22c55e', '#f97316', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f59e0b', '#ef4444', '#64748b',
];

const PRESET_ICONS = ['📁', '💼', '🎓', '📝', '⭐', '🚀', '🔬', '🎨', '🏠', '💡', '📚', '🎯', '🏆', '🌱', '💻'];

export class ProjectModal extends Modal {
  private project?: Project;
  private onSave: () => void;
  private store: VaultBoardStore;
  private selectedColor: string;
  private selectedIcon: string;

  constructor(
    app: App,
    store: VaultBoardStore,
    onSave: () => void,
    project?: Project
  ) {
    super(app);
    this.store = store;
    this.onSave = onSave;
    this.project = project;
    this.selectedColor = project?.color ?? '#6366f1';
    this.selectedIcon = project?.icon ?? '📁';
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('vb-modal');

    contentEl.createEl('h2', {
      cls: 'vb-modal-title',
      text: this.project ? 'Edit Project' : 'New Project',
    });

    const form = contentEl.createDiv({ cls: 'vb-form' });

    // Name
    const nameField = form.createDiv({ cls: 'vb-field' });
    nameField.createEl('label', { cls: 'vb-label', text: 'Project Name *' });
    const nameInput = nameField.createEl('input', {
      type: 'text',
      cls: 'vb-input',
      placeholder: 'My Project...',
    });
    if (this.project) nameInput.value = this.project.name;
    nameInput.focus();

    // Category + Status row
    const row1 = form.createDiv({ cls: 'vb-form-row' });

    const catField = row1.createDiv({ cls: 'vb-field' });
    catField.createEl('label', { cls: 'vb-label', text: 'Category' });
    const catSelect = catField.createEl('select', { cls: 'vb-select' });
    const categories: { value: ProjectCategory; label: string }[] = [
      { value: 'personal', label: '⭐ Personal' },
      { value: 'college', label: '🎓 College' },
      { value: 'work', label: '💼 Work' },
      { value: 'assignment', label: '📝 Assignment' },
      { value: 'other', label: '📁 Other' },
    ];
    categories.forEach(c => {
      const opt = catSelect.createEl('option', { text: c.label, value: c.value });
      if ((this.project?.category ?? 'personal') === c.value) opt.selected = true;
    });
    catSelect.addEventListener('change', () => {
      this.selectedColor = CATEGORY_COLORS[catSelect.value as ProjectCategory];
      this.renderColorPicker(colorPickerContainer);
    });

    const statusField = row1.createDiv({ cls: 'vb-field' });
    statusField.createEl('label', { cls: 'vb-label', text: 'Status' });
    const statusSelect = statusField.createEl('select', { cls: 'vb-select' });
    const statuses: { value: ProjectStatus; label: string }[] = [
      { value: 'active', label: '🟢 Active' },
      { value: 'paused', label: '⏸️ Paused' },
      { value: 'completed', label: '✅ Completed' },
      { value: 'archived', label: '📦 Archived' },
    ];
    statuses.forEach(s => {
      const opt = statusSelect.createEl('option', { text: s.label, value: s.value });
      if ((this.project?.status ?? 'active') === s.value) opt.selected = true;
    });

    // Description
    const descField = form.createDiv({ cls: 'vb-field' });
    descField.createEl('label', { cls: 'vb-label', text: 'Description' });
    const descInput = descField.createEl('textarea', {
      cls: 'vb-textarea',
      placeholder: 'What is this project about?',
    });
    if (this.project?.description) descInput.value = this.project.description;

    // Due Date + Tags row
    const row2 = form.createDiv({ cls: 'vb-form-row' });

    const dueDateField = row2.createDiv({ cls: 'vb-field' });
    dueDateField.createEl('label', { cls: 'vb-label', text: 'Due Date' });
    const dueDateInput = dueDateField.createEl('input', { type: 'date', cls: 'vb-input' });
    if (this.project?.dueDate) dueDateInput.value = this.project.dueDate;

    const tagsField = row2.createDiv({ cls: 'vb-field' });
    tagsField.createEl('label', { cls: 'vb-label', text: 'Tags (comma-separated)' });
    const tagsInput = tagsField.createEl('input', {
      type: 'text',
      cls: 'vb-input',
      placeholder: 'study, urgent...',
    });
    if (this.project?.tags) tagsInput.value = this.project.tags.join(', ');

    // Icon picker
    const iconField = form.createDiv({ cls: 'vb-field' });
    iconField.createEl('label', { cls: 'vb-label', text: 'Icon' });
    const iconGrid = iconField.createDiv({ cls: 'vb-icon-grid' });
    PRESET_ICONS.forEach(icon => {
      const btn = iconGrid.createEl('button', { cls: 'vb-icon-btn', text: icon, type: 'button' });
      if (this.selectedIcon === icon) btn.addClass('selected');
      btn.addEventListener('click', () => {
        this.selectedIcon = icon;
        iconGrid.querySelectorAll('.vb-icon-btn').forEach(b => b.removeClass('selected'));
        btn.addClass('selected');
      });
    });

    // Color picker
    const colorField = form.createDiv({ cls: 'vb-field' });
    colorField.createEl('label', { cls: 'vb-label', text: 'Color' });
    const colorPickerContainer = colorField.createDiv({ cls: 'vb-color-picker' });
    this.renderColorPicker(colorPickerContainer);

    // Actions
    const actions = contentEl.createDiv({ cls: 'vb-modal-actions' });
    const cancelBtn = actions.createEl('button', { cls: 'vb-btn vb-btn-ghost', text: 'Cancel' });
    cancelBtn.addEventListener('click', () => this.close());

    const saveBtn = actions.createEl('button', {
      cls: 'vb-btn vb-btn-primary',
      text: this.project ? 'Save Changes' : 'Create Project',
    });
    saveBtn.addEventListener('click', () => {
      const name = nameInput.value.trim();
      if (!name) {
        new Notice('Project name is required.');
        nameInput.focus();
        return;
      }

      const tags = tagsInput.value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const now = new Date().toISOString();

      if (this.project) {
        this.store.updateProject(this.project.id, {
          name,
          description: descInput.value.trim(),
          category: catSelect.value as ProjectCategory,
          status: statusSelect.value as ProjectStatus,
          color: this.selectedColor,
          icon: this.selectedIcon,
          dueDate: dueDateInput.value || undefined,
          tags,
        });
      } else {
        const newProject: Project = {
          id: this.store.generateId(),
          name,
          description: descInput.value.trim(),
          category: catSelect.value as ProjectCategory,
          status: statusSelect.value as ProjectStatus,
          color: this.selectedColor,
          icon: this.selectedIcon,
          dueDate: dueDateInput.value || undefined,
          tags,
          createdAt: now,
          updatedAt: now,
        };
        this.store.addProject(newProject);
      }

      new Notice(this.project ? 'Project updated.' : 'Project created!');
      this.onSave();
      this.close();
    });
  }

  private renderColorPicker(container: HTMLElement) {
    container.empty();
    PRESET_COLORS.forEach(color => {
      const swatch = container.createDiv({ cls: 'vb-color-swatch' });
      swatch.style.backgroundColor = color;
      if (this.selectedColor === color) swatch.addClass('selected');
      swatch.addEventListener('click', () => {
        this.selectedColor = color;
        container.querySelectorAll('.vb-color-swatch').forEach(s => s.removeClass('selected'));
        swatch.addClass('selected');
      });
    });

    const customInput = container.createEl('input', {
      type: 'color',
      cls: 'vb-color-custom',
    });
    customInput.value = this.selectedColor;
    customInput.title = 'Custom color';
    customInput.addEventListener('input', () => {
      this.selectedColor = customInput.value;
      container.querySelectorAll('.vb-color-swatch').forEach(s => s.removeClass('selected'));
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}
