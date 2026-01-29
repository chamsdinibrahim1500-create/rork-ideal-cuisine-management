export type UserRole = 'developer' | 'manager' | 'employee';

export type Language = 'fr' | 'ar' | 'tn';

export interface Permission {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

export interface UserPermissions {
  viewDashboard: boolean;
  viewProjects: boolean;
  createProjects: boolean;
  editProjects: boolean;
  deleteProjects: boolean;
  viewTasks: boolean;
  createTasks: boolean;
  editTasks: boolean;
  deleteTasks: boolean;
  assignTasks: boolean;
  viewWorkflow: boolean;
  editWorkflow: boolean;
  viewStock: boolean;
  editStock: boolean;
  addStock: boolean;
  deleteStock: boolean;
  viewCalendar: boolean;
  viewEmployees: boolean;
  manageEmployees: boolean;
  viewFiles: boolean;
  uploadFiles: boolean;
  downloadFiles: boolean;
  deleteFiles: boolean;
  sendFiles: boolean;
  viewReports: boolean;
  createReports: boolean;
  viewSettings: boolean;
  managePermissions: boolean;
  viewAdminPanel: boolean;
  sendMessages: boolean;
  receiveMessages: boolean;
  viewNotifications: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  permissions: UserPermissions;
  isActive: boolean;
  createdAt: string;
  supabaseId?: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  attachments: FileAttachment[];
  read: boolean;
  createdAt: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  updatedAt: string;
}

export interface TaskReport {
  id: string;
  taskId: string;
  userId: string;
  userName: string;
  content: string;
  attachments: FileAttachment[];
  createdAt: string;
}

export type ProjectStatus = 'in_progress' | 'paused' | 'completed';
export type TaskStatus = 'pending' | 'in_progress' | 'paused' | 'completed';
export type StockStatus = 'available' | 'low' | 'out_of_stock';

export interface WorkflowStage {
  id: string;
  name: string;
  order: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  number: number;
  description: string;
  status: TaskStatus;
  assignedTo: string[];
  projectId: string;
  stageId: string;
  comments: Comment[];
  attachments: FileAttachment[];
  reports: TaskReport[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  attachments: FileAttachment[];
  createdAt: string;
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  number: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  startDate: string;
  status: ProjectStatus;
  workflow: WorkflowStage[];
  assignedEmployees: string[];
  files: FileAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  minQuantity: number;
  unit: string;
  category: string;
  status: StockStatus;
  lastUpdated: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'task' | 'project' | 'file' | 'system' | 'message' | 'report';
  read: boolean;
  relatedId?: string;
  senderId?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  pausedProjects: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  totalEmployees: number;
  lowStockItems: number;
}
