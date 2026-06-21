import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import VaultBoardPlugin from '../../main';

export class VaultBoardSettingsTab extends PluginSettingTab {
  plugin: VaultBoardPlugin;

  constructor(app: App, plugin: VaultBoardPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.addClass('vb-settings');

    containerEl.createEl('h2', { text: 'VaultBoard Settings' });

    // ── General ───────────────────────────────────────────────────────────

    containerEl.createEl('h3', { text: '⚙️ General' });

    new Setting(containerEl)
      .setName('Default view')
      .setDesc('Which section opens when you launch VaultBoard.')
      .addDropdown(drop => {
        drop
          .addOption('dashboard', 'Dashboard')
          .addOption('projects', 'Projects')
          .addOption('calendar', 'Calendar')
          .addOption('analytics', 'Analytics')
          .setValue(this.plugin.store.settings.defaultView)
          .onChange(async value => {
            this.plugin.store.updateSettings({
              defaultView: value as any,
            });
          });
      });

    new Setting(containerEl)
      .setName('Week starts on')
      .setDesc('First day of the week in calendar views.')
      .addDropdown(drop => {
        drop
          .addOption('1', 'Monday')
          .addOption('0', 'Sunday')
          .setValue(String(this.plugin.store.settings.weekStartsOn))
          .onChange(async value => {
            this.plugin.store.updateSettings({ weekStartsOn: Number(value) as 0 | 1 });
          });
      });

    new Setting(containerEl)
      .setName('Enable desktop notifications')
      .setDesc('Show system notifications when Pomodoro sessions end.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.store.settings.enableNotifications)
          .onChange(async value => {
            if (value && 'Notification' in window) {
              Notification.requestPermission().then(perm => {
                if (perm !== 'granted') {
                  new Notice('Notification permission denied by browser.');
                }
              });
            }
            this.plugin.store.updateSettings({ enableNotifications: value });
          });
      });

    new Setting(containerEl)
      .setName('Show completed tasks')
      .setDesc('Display completed tasks in task lists.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.store.settings.showCompletedTasks)
          .onChange(async value => {
            this.plugin.store.updateSettings({ showCompletedTasks: value });
          });
      });

    // ── Pomodoro ──────────────────────────────────────────────────────────

    containerEl.createEl('h3', { text: '🍅 Pomodoro Timer' });

    new Setting(containerEl)
      .setName('Work duration (minutes)')
      .setDesc('Length of a single focus session.')
      .addSlider(slider => {
        slider
          .setLimits(5, 90, 5)
          .setValue(this.plugin.store.settings.pomodoro.workDuration)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.store.updateSettings({
              pomodoro: { ...this.plugin.store.settings.pomodoro, workDuration: value },
            });
          });
      });

    new Setting(containerEl)
      .setName('Short break duration (minutes)')
      .setDesc('Break after each focus session.')
      .addSlider(slider => {
        slider
          .setLimits(1, 30, 1)
          .setValue(this.plugin.store.settings.pomodoro.shortBreak)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.store.updateSettings({
              pomodoro: { ...this.plugin.store.settings.pomodoro, shortBreak: value },
            });
          });
      });

    new Setting(containerEl)
      .setName('Long break duration (minutes)')
      .setDesc('Extended break after several sessions.')
      .addSlider(slider => {
        slider
          .setLimits(5, 60, 5)
          .setValue(this.plugin.store.settings.pomodoro.longBreak)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.store.updateSettings({
              pomodoro: { ...this.plugin.store.settings.pomodoro, longBreak: value },
            });
          });
      });

    new Setting(containerEl)
      .setName('Sessions before long break')
      .setDesc('Number of focus sessions before a long break.')
      .addSlider(slider => {
        slider
          .setLimits(2, 8, 1)
          .setValue(this.plugin.store.settings.pomodoro.sessionsBeforeLongBreak)
          .setDynamicTooltip()
          .onChange(value => {
            this.plugin.store.updateSettings({
              pomodoro: { ...this.plugin.store.settings.pomodoro, sessionsBeforeLongBreak: value },
            });
          });
      });

    new Setting(containerEl)
      .setName('Auto-start breaks')
      .setDesc('Automatically start break timer after a session ends.')
      .addToggle(toggle => {
        toggle
          .setValue(this.plugin.store.settings.pomodoro.autoStartBreaks)
          .onChange(value => {
            this.plugin.store.updateSettings({
              pomodoro: { ...this.plugin.store.settings.pomodoro, autoStartBreaks: value },
            });
          });
      });

    // ── Danger Zone ───────────────────────────────────────────────────────

    containerEl.createEl('h3', { text: '⚠️ Data Management' });

    new Setting(containerEl)
      .setName('Export all data')
      .setDesc('Copy all VaultBoard data as JSON to clipboard.')
      .addButton(btn => {
        btn.setButtonText('Export JSON').onClick(async () => {
          const data = {
            projects: this.plugin.store.getProjects(),
            tasks: this.plugin.store.getTasks(),
            timeEntries: this.plugin.store.getTimeEntries(),
            exportedAt: new Date().toISOString(),
            version: '1.0.0',
          };
          await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
          new Notice('✅ Data exported to clipboard!');
        });
      });

    new Setting(containerEl)
      .setName('Clear all data')
      .setDesc('⚠️ Permanently delete all projects, tasks, and time entries. This cannot be undone.')
      .addButton(btn => {
        btn.setButtonText('Clear All Data').setWarning().onClick(() => {
          const confirmed = confirm(
            'Are you absolutely sure? This will delete ALL your projects, tasks, and time entries permanently.'
          );
          if (confirmed) {
            this.plugin.store.getProjects().forEach(p => this.plugin.store.deleteProject(p.id));
            new Notice('All VaultBoard data cleared.');
            this.plugin.refreshViews();
          }
        });
      });

    // ── About ─────────────────────────────────────────────────────────────

    containerEl.createEl('h3', { text: 'ℹ️ About' });

    const about = containerEl.createDiv({ cls: 'vb-settings-about' });
    about.createEl('p', { text: 'VaultBoard v1.0.0 — A community workspace for Obsidian.' });
    const links = about.createEl('p');
    links.createEl('a', {
      text: 'GitHub Repository',
      href: 'https://github.com/vaultboard-plugin/vaultboard',
    });
    links.createSpan({ text: ' · ' });
    links.createEl('a', {
      text: 'Report an Issue',
      href: 'https://github.com/vaultboard-plugin/vaultboard/issues',
    });
    links.createSpan({ text: ' · ' });
    links.createEl('a', {
      text: 'Community Forum',
      href: 'https://forum.obsidian.md',
    });
  }
}
