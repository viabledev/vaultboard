import { Plugin } from 'obsidian';
import {
  VaultBoardData,
  VaultBoardSettings,
  Project,
  Task,
  TimeEntry,
} from './types';

const DEFAULT_DATA: VaultBoardData = {
  projects: [],
  tasks: [],
  timeEntries: [],
  version: '1.0.0',
};

export const DEFAULT_SETTINGS: VaultBoardSettings = {
  pomodoro: {
    workDuration: 25,
    shortBreak: 5,
    longBreak: 15,
    sessionsBeforeLongBreak: 4,
    autoStartBreaks: false,
  },
  defaultProjectColor: '#6366f1',
  enableNotifications: true,
  weekStartsOn: 1,
  defaultView: 'dashboard',
  showCompletedTasks: true,
};

export class VaultBoardStore {
  private data: VaultBoardData;
  settings: VaultBoardSettings;
  private plugin: Plugin;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(plugin: Plugin) {
    this.plugin = plugin;
    this.data = { ...DEFAULT_DATA };
    this.settings = { ...DEFAULT_SETTINGS };
  }

  async load() {
    const loaded = await this.plugin.loadData();
    if (loaded) {
      this.data = {
        ...DEFAULT_DATA,
        ...(loaded.data ?? {}),
        projects: loaded.data?.projects ?? [],
        tasks: loaded.data?.tasks ?? [],
        timeEntries: loaded.data?.timeEntries ?? [],
      };
      this.settings = {
        ...DEFAULT_SETTINGS,
        ...(loaded.settings ?? {}),
        pomodoro: {
          ...DEFAULT_SETTINGS.pomodoro,
          ...(loaded.settings?.pomodoro ?? {}),
        },
      };
    }
  }

  async save() {
    await this.plugin.saveData({ data: this.data, settings: this.settings });
  }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.save(), 500);
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 7);
  }

  // ── Projects ─────────────────────────────────────────────────────────────

  getProjects(): Project[] {
    return this.data.projects;
  }

  getProject(id: string): Project | undefined {
    return this.data.projects.find(p => p.id === id);
  }

  addProject(project: Project): void {
    this.data.projects.push(project);
    this.scheduleSave();
  }

  updateProject(id: string, updates: Partial<Project>): void {
    const idx = this.data.projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.data.projects[idx] = {
        ...this.data.projects[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSave();
    }
  }

  deleteProject(id: string): void {
    this.data.projects = this.data.projects.filter(p => p.id !== id);
    this.data.tasks = this.data.tasks.filter(t => t.projectId !== id);
    this.data.timeEntries = this.data.timeEntries.filter(e => e.projectId !== id);
    this.scheduleSave();
  }

  // ── Tasks ─────────────────────────────────────────────────────────────────

  getTasks(projectId?: string): Task[] {
    if (projectId) return this.data.tasks.filter(t => t.projectId === projectId);
    return this.data.tasks;
  }

  getTask(id: string): Task | undefined {
    return this.data.tasks.find(t => t.id === id);
  }

  addTask(task: Task): void {
    this.data.tasks.push(task);
    this.scheduleSave();
  }

  updateTask(id: string, updates: Partial<Task>): void {
    const idx = this.data.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.data.tasks[idx] = {
        ...this.data.tasks[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      this.scheduleSave();
    }
  }

  deleteTask(id: string): void {
    this.data.tasks = this.data.tasks.filter(t => t.id !== id);
    this.data.timeEntries = this.data.timeEntries.filter(e => e.taskId !== id);
    this.scheduleSave();
  }

  // ── Time Entries ──────────────────────────────────────────────────────────

  getTimeEntries(projectId?: string): TimeEntry[] {
    if (projectId) return this.data.timeEntries.filter(e => e.projectId === projectId);
    return this.data.timeEntries;
  }

  addTimeEntry(entry: TimeEntry): void {
    this.data.timeEntries.push(entry);
    this.scheduleSave();
  }

  getTotalTimeSpent(projectId: string): number {
    return this.data.timeEntries
      .filter(e => e.projectId === projectId)
      .reduce((sum, e) => sum + e.duration, 0);
  }

  // ── Query Helpers ─────────────────────────────────────────────────────────

  getTasksForDate(date: string): Task[] {
    return this.data.tasks.filter(
      t => t.dueDate === date && t.status !== 'cancelled'
    );
  }

  getOverdueTasks(): Task[] {
    const today = new Date().toISOString().split('T')[0];
    return this.data.tasks.filter(
      t =>
        t.dueDate &&
        t.dueDate < today &&
        t.status !== 'done' &&
        t.status !== 'cancelled'
    );
  }

  getTasksDueInRange(startDate: string, endDate: string): Task[] {
    return this.data.tasks.filter(
      t =>
        t.dueDate &&
        t.dueDate >= startDate &&
        t.dueDate <= endDate &&
        t.status !== 'cancelled'
    );
  }

  getProjectTaskStats(projectId: string): {
    total: number;
    done: number;
    inProgress: number;
    todo: number;
  } {
    const tasks = this.getTasks(projectId);
    return {
      total: tasks.length,
      done: tasks.filter(t => t.status === 'done').length,
      inProgress: tasks.filter(t => t.status === 'in-progress').length,
      todo: tasks.filter(t => t.status === 'todo').length,
    };
  }

  getCompletedTasksInRange(startDate: string, endDate: string): Task[] {
    return this.data.tasks.filter(
      t =>
        t.completedAt &&
        t.completedAt >= startDate &&
        t.completedAt <= endDate
    );
  }

  getStreakDays(): number {
    const today = new Date();
    let streak = 0;
    let current = new Date(today);

    while (true) {
      const dateStr = current.toISOString().split('T')[0];
      const completed = this.data.tasks.filter(
        t => t.completedAt && t.completedAt.startsWith(dateStr)
      );
      if (completed.length === 0 && dateStr !== today.toISOString().split('T')[0]) break;
      if (completed.length > 0) streak++;
      current.setDate(current.getDate() - 1);
      if (streak > 365) break;
    }
    return streak;
  }

  // ── Settings ──────────────────────────────────────────────────────────────

  getSettings(): VaultBoardSettings {
    return this.settings;
  }

  updateSettings(updates: Partial<VaultBoardSettings>): void {
    this.settings = {
      ...this.settings,
      ...updates,
      pomodoro: {
        ...this.settings.pomodoro,
        ...((updates.pomodoro as Partial<VaultBoardSettings['pomodoro']>) ?? {}),
      },
    };
    this.save();
  }
}
