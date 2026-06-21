import { App, Notice, Plugin, WorkspaceLeaf } from 'obsidian';
import { VaultBoardStore } from './src/store';
import { VaultBoardView, VIEW_TYPE_VAULTBOARD } from './src/VaultBoardView';
import { VaultBoardSettingsTab } from './src/settings/SettingsTab';
import { TaskModal } from './src/modals/TaskModal';
import { ProjectModal } from './src/modals/ProjectModal';
import { TemplateModal } from './src/modals/TemplateModal';

export default class VaultBoardPlugin extends Plugin {
  store!: VaultBoardStore;

  async onload() {
    this.store = new VaultBoardStore(this);
    await this.store.load();

    // Register the main view
    this.registerView(VIEW_TYPE_VAULTBOARD, (leaf) => new VaultBoardView(leaf, this));

    // Ribbon icon
    this.addRibbonIcon('layout-grid', 'VaultBoard', () => {
      this.activateView();
    });

    // Settings tab
    this.addSettingTab(new VaultBoardSettingsTab(this.app, this));

    // Commands
    this.addCommand({
      id: 'open-vaultboard',
      name: 'Open VaultBoard',
      callback: () => this.activateView(),
    });

    this.addCommand({
      id: 'create-task',
      name: 'Create new task',
      callback: () => {
        new TaskModal(this.app, this.store, () => this.refreshViews()).open();
      },
    });

    this.addCommand({
      id: 'create-project',
      name: 'Create new project',
      callback: () => {
        new ProjectModal(this.app, this.store, () => this.refreshViews()).open();
      },
    });

    this.addCommand({
      id: 'browse-templates',
      name: 'Browse community templates',
      callback: () => {
        new TemplateModal(this.app, this.store, () => this.refreshViews()).open();
      },
    });

    this.addCommand({
      id: 'open-dashboard',
      name: 'Go to Dashboard',
      callback: () => {
        this.activateView('dashboard');
      },
    });

    this.addCommand({
      id: 'open-calendar',
      name: 'Go to Calendar',
      callback: () => {
        this.activateView('calendar');
      },
    });

    this.addCommand({
      id: 'open-analytics',
      name: 'Go to Analytics',
      callback: () => {
        this.activateView('analytics');
      },
    });

    console.log('VaultBoard loaded');
  }

  async onunload() {
    console.log('VaultBoard unloaded');
  }

  async activateView(section?: string) {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const existing = workspace.getLeavesOfType(VIEW_TYPE_VAULTBOARD);

    if (existing.length > 0) {
      leaf = existing[0];
    } else {
      leaf = workspace.getLeaf(false);
      if (!leaf) {
        leaf = workspace.getLeaf(true);
      }
      await leaf.setViewState({ type: VIEW_TYPE_VAULTBOARD, active: true });
    }

    workspace.revealLeaf(leaf);

    if (section) {
      const view = leaf.view as VaultBoardView;
      if (view && view instanceof VaultBoardView) {
        (view as any).currentSection = section;
        view.refresh();
      }
    }
  }

  refreshViews() {
    this.app.workspace.getLeavesOfType(VIEW_TYPE_VAULTBOARD).forEach(leaf => {
      if (leaf.view instanceof VaultBoardView) {
        leaf.view.refresh();
      }
    });
  }
}
