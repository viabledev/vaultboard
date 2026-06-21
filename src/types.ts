export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ProjectCategory = 'personal' | 'college' | 'work' | 'assignment' | 'other';
export type ProjectStatus = 'active' | 'paused' | 'completed' | 'archived';
export type NavSection = 'dashboard' | 'projects' | 'calendar' | 'analytics';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  tags: string[];
  timeEstimate?: number;
  timeSpent: number;
  subtasks: Subtask[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  color: string;
  icon: string;
  status: ProjectStatus;
  dueDate?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TimeEntry {
  id: string;
  taskId?: string;
  projectId: string;
  startTime: string;
  endTime?: string;
  duration: number;
  notes?: string;
  type: 'pomodoro' | 'manual';
}

export interface PomodoroSettings {
  workDuration: number;
  shortBreak: number;
  longBreak: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
}

export interface VaultBoardSettings {
  pomodoro: PomodoroSettings;
  defaultProjectColor: string;
  enableNotifications: boolean;
  weekStartsOn: 0 | 1;
  defaultView: NavSection;
  showCompletedTasks: boolean;
}

export interface VaultBoardData {
  projects: Project[];
  tasks: Task[];
  timeEntries: TimeEntry[];
  version: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: ProjectCategory;
  color: string;
  icon: string;
  taskTemplates: {
    title: string;
    priority: TaskPriority;
    tags: string[];
    timeEstimate?: number;
  }[];
  tags: string[];
  author: string;
}

export const CATEGORY_COLORS: Record<ProjectCategory, string> = {
  personal: '#6366f1',
  college: '#22c55e',
  work: '#3b82f6',
  assignment: '#f97316',
  other: '#64748b',
};

export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  personal: 'Personal',
  college: 'College',
  work: 'Work',
  assignment: 'Assignment',
  other: 'Other',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#64748b',
  medium: '#3b82f6',
  high: '#f97316',
  urgent: '#ef4444',
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'todo': 'To Do',
  'in-progress': 'In Progress',
  'review': 'Review',
  'done': 'Done',
  'cancelled': 'Cancelled',
};

export const COMMUNITY_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'semester-plan',
    name: 'Semester Study Plan',
    description: 'Organize your semester with structured study tasks',
    category: 'college',
    color: '#22c55e',
    icon: '🎓',
    tags: ['study', 'semester', 'academic'],
    author: 'VaultBoard Community',
    taskTemplates: [
      { title: 'Review syllabus and set goals', priority: 'high', tags: ['planning'] },
      { title: 'Create study schedule', priority: 'high', tags: ['planning'] },
      { title: 'Gather course materials', priority: 'medium', tags: ['prep'] },
      { title: 'Complete weekly readings', priority: 'medium', tags: ['study'], timeEstimate: 120 },
      { title: 'Attend all lectures', priority: 'high', tags: ['attendance'] },
      { title: 'Review lecture notes', priority: 'medium', tags: ['study'], timeEstimate: 60 },
      { title: 'Complete assignments', priority: 'high', tags: ['assignments'] },
      { title: 'Prepare for midterms', priority: 'urgent', tags: ['exam'], timeEstimate: 300 },
      { title: 'Prepare for finals', priority: 'urgent', tags: ['exam'], timeEstimate: 480 },
    ],
  },
  {
    id: 'work-sprint',
    name: 'Work Sprint (2 Weeks)',
    description: 'Agile-style sprint for office projects',
    category: 'work',
    color: '#3b82f6',
    icon: '💼',
    tags: ['sprint', 'agile', 'office'],
    author: 'VaultBoard Community',
    taskTemplates: [
      { title: 'Sprint planning & goal setting', priority: 'high', tags: ['planning'], timeEstimate: 60 },
      { title: 'Define deliverables and milestones', priority: 'high', tags: ['planning'] },
      { title: 'Research & discovery', priority: 'medium', tags: ['research'], timeEstimate: 180 },
      { title: 'Design / Architecture', priority: 'high', tags: ['design'], timeEstimate: 240 },
      { title: 'Implementation phase 1', priority: 'high', tags: ['dev'], timeEstimate: 480 },
      { title: 'Implementation phase 2', priority: 'high', tags: ['dev'], timeEstimate: 480 },
      { title: 'Testing & QA', priority: 'high', tags: ['testing'], timeEstimate: 240 },
      { title: 'Code / work review', priority: 'medium', tags: ['review'], timeEstimate: 120 },
      { title: 'Documentation', priority: 'medium', tags: ['docs'], timeEstimate: 120 },
      { title: 'Sprint retrospective', priority: 'low', tags: ['review'], timeEstimate: 60 },
    ],
  },
  {
    id: 'personal-goals',
    name: 'Personal Goal Tracker',
    description: 'Track personal development and life goals',
    category: 'personal',
    color: '#6366f1',
    icon: '⭐',
    tags: ['personal', 'goals', 'self-improvement'],
    author: 'VaultBoard Community',
    taskTemplates: [
      { title: 'Define SMART goals', priority: 'high', tags: ['planning'] },
      { title: 'Break goals into weekly milestones', priority: 'high', tags: ['planning'] },
      { title: 'Morning routine practice', priority: 'medium', tags: ['habit'], timeEstimate: 30 },
      { title: 'Weekly progress review', priority: 'medium', tags: ['review'], timeEstimate: 30 },
      { title: 'Monthly goal evaluation', priority: 'high', tags: ['review'], timeEstimate: 60 },
      { title: 'Learn new skill', priority: 'medium', tags: ['learning'], timeEstimate: 60 },
      { title: 'Health & fitness check-in', priority: 'medium', tags: ['health'] },
      { title: 'Celebrate milestones', priority: 'low', tags: ['motivation'] },
    ],
  },
  {
    id: 'research-paper',
    name: 'Research Paper / Assignment',
    description: 'Step-by-step workflow for academic papers',
    category: 'assignment',
    color: '#f97316',
    icon: '📝',
    tags: ['research', 'paper', 'writing'],
    author: 'VaultBoard Community',
    taskTemplates: [
      { title: 'Understand assignment requirements', priority: 'urgent', tags: ['prep'] },
      { title: 'Choose and refine topic', priority: 'high', tags: ['planning'] },
      { title: 'Literature review / initial research', priority: 'high', tags: ['research'], timeEstimate: 240 },
      { title: 'Create outline', priority: 'high', tags: ['writing'], timeEstimate: 60 },
      { title: 'First draft', priority: 'high', tags: ['writing'], timeEstimate: 360 },
      { title: 'Peer review / feedback', priority: 'medium', tags: ['review'] },
      { title: 'Revise and edit', priority: 'high', tags: ['writing'], timeEstimate: 180 },
      { title: 'Format citations (APA/MLA)', priority: 'medium', tags: ['formatting'], timeEstimate: 60 },
      { title: 'Proofread final draft', priority: 'high', tags: ['review'], timeEstimate: 60 },
      { title: 'Submit', priority: 'urgent', tags: ['submission'] },
    ],
  },
  {
    id: 'freelance-project',
    name: 'Freelance Project',
    description: 'Manage a client project from kickoff to delivery',
    category: 'work',
    color: '#8b5cf6',
    icon: '🚀',
    tags: ['freelance', 'client', 'project'],
    author: 'VaultBoard Community',
    taskTemplates: [
      { title: 'Client kickoff call & requirements', priority: 'urgent', tags: ['client'], timeEstimate: 60 },
      { title: 'Create project proposal / SOW', priority: 'high', tags: ['planning'] },
      { title: 'Set up project workspace', priority: 'medium', tags: ['setup'] },
      { title: 'Design mockups / wireframes', priority: 'high', tags: ['design'], timeEstimate: 240 },
      { title: 'Client approval on designs', priority: 'high', tags: ['client'] },
      { title: 'Development / execution', priority: 'high', tags: ['dev'], timeEstimate: 600 },
      { title: 'Internal review', priority: 'medium', tags: ['review'], timeEstimate: 60 },
      { title: 'Client review & revisions', priority: 'high', tags: ['client'], timeEstimate: 120 },
      { title: 'Final delivery', priority: 'urgent', tags: ['delivery'] },
      { title: 'Invoice & follow-up', priority: 'high', tags: ['admin'] },
    ],
  },
];
