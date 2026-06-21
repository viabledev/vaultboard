import { App, Modal, Notice } from 'obsidian';
import { VaultBoardStore } from '../store';
import { COMMUNITY_TEMPLATES, ProjectTemplate, Task } from '../types';

export class TemplateModal extends Modal {
  private store: VaultBoardStore;
  private onApply: () => void;
  private activeTab: 'browse' | 'export' | 'import' = 'browse';
  private selectedTemplate: ProjectTemplate | null = null;

  constructor(app: App, store: VaultBoardStore, onApply: () => void) {
    super(app);
    this.store = store;
    this.onApply = onApply;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.addClass('vb-modal', 'vb-template-modal');
    this.render();
  }

  private render() {
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl('h2', { cls: 'vb-modal-title', text: '🌐 Community Templates' });

    // Tabs
    const tabs = contentEl.createDiv({ cls: 'vb-tabs' });
    const tabDefs: { id: typeof this.activeTab; label: string }[] = [
      { id: 'browse', label: '📚 Browse Templates' },
      { id: 'import', label: '📥 Import JSON' },
      { id: 'export', label: '📤 Export Project' },
    ];

    tabDefs.forEach(tab => {
      const t = tabs.createEl('button', {
        cls: `vb-tab${this.activeTab === tab.id ? ' active' : ''}`,
        text: tab.label,
        type: 'button',
      });
      t.addEventListener('click', () => {
        this.activeTab = tab.id;
        this.render();
      });
    });

    const body = contentEl.createDiv({ cls: 'vb-tab-body' });

    if (this.activeTab === 'browse') this.renderBrowse(body);
    if (this.activeTab === 'import') this.renderImport(body);
    if (this.activeTab === 'export') this.renderExport(body);
  }

  private renderBrowse(container: HTMLElement) {
    const grid = container.createDiv({ cls: 'vb-template-grid' });

    COMMUNITY_TEMPLATES.forEach(tpl => {
      const card = grid.createDiv({
        cls: `vb-template-card${this.selectedTemplate?.id === tpl.id ? ' selected' : ''}`,
      });

      const header = card.createDiv({ cls: 'vb-template-card-header' });
      header.createSpan({ cls: 'vb-template-icon', text: tpl.icon });
      header.createEl('h3', { cls: 'vb-template-name', text: tpl.name });
      header.createSpan({
        cls: `vb-category-badge vb-cat-${tpl.category}`,
        text: tpl.category,
      });

      card.createEl('p', { cls: 'vb-template-desc', text: tpl.description });

      const meta = card.createDiv({ cls: 'vb-template-meta' });
      meta.createSpan({ text: `${tpl.taskTemplates.length} tasks` });
      meta.createSpan({ text: `by ${tpl.author}` });

      const tagRow = card.createDiv({ cls: 'vb-tag-row' });
      tpl.tags.slice(0, 3).forEach(tag => {
        tagRow.createSpan({ cls: 'vb-tag', text: tag });
      });

      card.addEventListener('click', () => {
        this.selectedTemplate = tpl;
        grid.querySelectorAll('.vb-template-card').forEach(c => c.removeClass('selected'));
        card.addClass('selected');
      });
    });

    const actions = container.createDiv({ cls: 'vb-modal-actions' });
    actions.createEl('button', {
      cls: 'vb-btn vb-btn-ghost',
      text: 'Cancel',
    }).addEventListener('click', () => this.close());

    const applyBtn = actions.createEl('button', {
      cls: 'vb-btn vb-btn-primary',
      text: '✨ Apply Template',
    });
    applyBtn.addEventListener('click', () => {
      if (!this.selectedTemplate) {
        new Notice('Please select a template first.');
        return;
      }
      this.applyTemplate(this.selectedTemplate);
    });
  }

  private applyTemplate(tpl: ProjectTemplate) {
    const now = new Date().toISOString();
    const projectId = this.store.generateId();

    this.store.addProject({
      id: projectId,
      name: tpl.name,
      description: tpl.description,
      category: tpl.category,
      color: tpl.color,
      icon: tpl.icon,
      status: 'active',
      tags: tpl.tags,
      createdAt: now,
      updatedAt: now,
    });

    tpl.taskTemplates.forEach(tt => {
      const task: Task = {
        id: this.store.generateId(),
        title: tt.title,
        description: '',
        projectId,
        status: 'todo',
        priority: tt.priority,
        tags: tt.tags,
        timeEstimate: tt.timeEstimate,
        timeSpent: 0,
        subtasks: [],
        createdAt: now,
        updatedAt: now,
      };
      this.store.addTask(task);
    });

    new Notice(`✨ Template "${tpl.name}" applied! ${tpl.taskTemplates.length} tasks created.`);
    this.onApply();
    this.close();
  }

  private renderImport(container: HTMLElement) {
    const intro = container.createEl('p', {
      cls: 'vb-help-text',
      text: 'Paste a VaultBoard project template JSON (exported by another user) below.',
    });

    const textarea = container.createEl('textarea', {
      cls: 'vb-textarea vb-import-textarea',
      placeholder: '{ "id": "...", "name": "...", ... }',
    });

    const actions = container.createDiv({ cls: 'vb-modal-actions' });
    actions.createEl('button', {
      cls: 'vb-btn vb-btn-ghost',
      text: 'Cancel',
    }).addEventListener('click', () => this.close());

    actions.createEl('button', {
      cls: 'vb-btn vb-btn-primary',
      text: '📥 Import',
    }).addEventListener('click', () => {
      try {
        const json = JSON.parse(textarea.value.trim());
        if (!json.name || !json.taskTemplates) {
          throw new Error('Invalid template format');
        }
        const tpl: ProjectTemplate = {
          id: json.id ?? this.store.generateId(),
          name: json.name,
          description: json.description ?? '',
          category: json.category ?? 'other',
          color: json.color ?? '#6366f1',
          icon: json.icon ?? '📁',
          taskTemplates: json.taskTemplates ?? [],
          tags: json.tags ?? [],
          author: json.author ?? 'Imported',
        };
        this.applyTemplate(tpl);
      } catch {
        new Notice('❌ Invalid JSON. Please check the template format.');
      }
    });
  }

  private renderExport(container: HTMLElement) {
    const projects = this.store.getProjects().filter(p => p.status !== 'archived');

    if (projects.length === 0) {
      container.createEl('p', {
        cls: 'vb-help-text',
        text: 'No active projects to export. Create a project first.',
      });
      return;
    }

    container.createEl('p', {
      cls: 'vb-help-text',
      text: 'Select a project to export as a shareable template JSON.',
    });

    const projectSelect = container.createEl('select', { cls: 'vb-select' });
    projectSelect.createEl('option', { text: '— Select project —', value: '' });
    projects.forEach(p => {
      projectSelect.createEl('option', {
        text: `${p.icon} ${p.name}`,
        value: p.id,
      });
    });

    const previewArea = container.createEl('textarea', {
      cls: 'vb-textarea vb-import-textarea',
      placeholder: 'Select a project to preview the export...',
    });
    previewArea.readOnly = true;

    projectSelect.addEventListener('change', () => {
      const project = this.store.getProject(projectSelect.value);
      if (!project) { previewArea.value = ''; return; }

      const tasks = this.store.getTasks(project.id);
      const tpl: ProjectTemplate = {
        id: this.store.generateId(),
        name: project.name,
        description: project.description,
        category: project.category,
        color: project.color,
        icon: project.icon,
        tags: project.tags,
        author: 'VaultBoard User',
        taskTemplates: tasks.map(t => ({
          title: t.title,
          priority: t.priority,
          tags: t.tags,
          timeEstimate: t.timeEstimate,
        })),
      };
      previewArea.value = JSON.stringify(tpl, null, 2);
    });

    const actions = container.createDiv({ cls: 'vb-modal-actions' });
    actions.createEl('button', {
      cls: 'vb-btn vb-btn-ghost',
      text: 'Close',
    }).addEventListener('click', () => this.close());

    actions.createEl('button', {
      cls: 'vb-btn vb-btn-primary',
      text: '📋 Copy to Clipboard',
    }).addEventListener('click', () => {
      if (!previewArea.value) {
        new Notice('Select a project first.');
        return;
      }
      navigator.clipboard.writeText(previewArea.value).then(() => {
        new Notice('✅ Template copied to clipboard! Share it with the community.');
      });
    });
  }

  onClose() {
    this.contentEl.empty();
  }
}
