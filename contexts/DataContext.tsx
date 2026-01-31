import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, StockItem, Task, WorkflowStage, Notification, DashboardStats, TaskReport } from '@/types';
import { mockProjects, mockStockItems, mockNotifications } from '@/mocks/data';

const PROJECTS_STORAGE_KEY = '@ideal_cuisine_projects';
const STOCK_STORAGE_KEY = '@ideal_cuisine_stock';
const NOTIFICATIONS_STORAGE_KEY = '@ideal_cuisine_notifications';

export const [DataProvider, useData] = createContextHook(() => {
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [stockItems, setStockItems] = useState<StockItem[]>(mockStockItems);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredData();
  }, []);

  const loadStoredData = async () => {
    try {
      const [storedProjects, storedStock, storedNotifications] = await Promise.all([
        AsyncStorage.getItem(PROJECTS_STORAGE_KEY),
        AsyncStorage.getItem(STOCK_STORAGE_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY),
      ]);

      if (storedProjects) setProjects(JSON.parse(storedProjects));
      if (storedStock) setStockItems(JSON.parse(storedStock));
      if (storedNotifications) setNotifications(JSON.parse(storedNotifications));
    } catch (error) {
      console.log('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProjects = async (data: Project[]) => {
    await AsyncStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(data));
  };

  const saveStock = async (data: StockItem[]) => {
    await AsyncStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(data));
  };

  const saveNotifications = async (data: Notification[]) => {
    await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(data));
  };

  const createProject = useCallback(async (projectData: Omit<Project, 'id' | 'workflow' | 'files' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      ...projectData,
      workflow: [],
      files: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = [...projects, newProject];
    setProjects(updated);
    await saveProjects(updated);
    console.log('Project created:', newProject.name);
    return newProject;
  }, [projects]);

  const updateProject = useCallback(async (projectId: string, updates: Partial<Project>) => {
    const updated = projects.map(p => 
      p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
    );
    setProjects(updated);
    await saveProjects(updated);
    console.log('Project updated:', projectId);
  }, [projects]);

  const deleteProject = useCallback(async (projectId: string) => {
    const updated = projects.filter(p => p.id !== projectId);
    setProjects(updated);
    await saveProjects(updated);
    console.log('Project deleted:', projectId);
  }, [projects]);

  const addWorkflowStage = useCallback(async (projectId: string, stageName: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const newStage: WorkflowStage = {
      id: `stage-${Date.now()}`,
      name: stageName,
      order: project.workflow.length + 1,
      tasks: [],
    };

    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          workflow: [...p.workflow, newStage],
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProjects(updated);
    await saveProjects(updated);
    console.log('Workflow stage added:', stageName);
  }, [projects]);

  const updateWorkflowStage = useCallback(async (projectId: string, stageId: string, updates: Partial<WorkflowStage>) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          workflow: p.workflow.map(s => s.id === stageId ? { ...s, ...updates } : s),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProjects(updated);
    await saveProjects(updated);
    console.log('Workflow stage updated:', stageId);
  }, [projects]);

  const deleteWorkflowStage = useCallback(async (projectId: string, stageId: string) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          workflow: p.workflow.filter(s => s.id !== stageId),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProjects(updated);
    await saveProjects(updated);
    console.log('Workflow stage deleted:', stageId);
  }, [projects]);

  const addTask = useCallback(async (projectId: string, stageId: string, taskData: Omit<Task, 'id' | 'number' | 'projectId' | 'stageId' | 'comments' | 'attachments' | 'reports' | 'createdAt' | 'updatedAt'>) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const stage = project.workflow.find(s => s.id === stageId);
    if (!stage) return;

    const allTasks = project.workflow.flatMap(s => s.tasks);
    const maxNumber = allTasks.length > 0 ? Math.max(...allTasks.map(t => t.number)) : 0;

    const newTask: Task = {
      id: `task-${Date.now()}`,
      number: maxNumber + 1,
      ...taskData,
      projectId,
      stageId,
      comments: [],
      attachments: [],
      reports: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          workflow: p.workflow.map(s => {
            if (s.id === stageId) {
              return { ...s, tasks: [...s.tasks, newTask] };
            }
            return s;
          }),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProjects(updated);
    await saveProjects(updated);
    console.log('Task added:', newTask.description);
    return newTask;
  }, [projects]);

  const updateTask = useCallback(async (projectId: string, stageId: string, taskId: string, updates: Partial<Task>) => {
    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          workflow: p.workflow.map(s => {
            if (s.id === stageId) {
              return {
                ...s,
                tasks: s.tasks.map(t => 
                  t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
                ),
              };
            }
            return s;
          }),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProjects(updated);
    await saveProjects(updated);
    console.log('Task updated:', taskId);
  }, [projects]);

  const addTaskReport = useCallback(async (projectId: string, stageId: string, taskId: string, reportData: { userId: string; userName: string; content: string; attachments?: any[] }) => {
    const newReport: TaskReport = {
      id: `report-${Date.now()}`,
      taskId,
      userId: reportData.userId,
      userName: reportData.userName,
      content: reportData.content,
      attachments: reportData.attachments || [],
      createdAt: new Date().toISOString(),
    };

    const updated = projects.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          workflow: p.workflow.map(s => {
            if (s.id === stageId) {
              return {
                ...s,
                tasks: s.tasks.map(t => {
                  if (t.id === taskId) {
                    return {
                      ...t,
                      reports: [...(t.reports || []), newReport],
                      updatedAt: new Date().toISOString(),
                    };
                  }
                  return t;
                }),
              };
            }
            return s;
          }),
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    setProjects(updated);
    await saveProjects(updated);
    console.log('Report added to task:', taskId);
    return newReport;
  }, [projects]);

  const getTaskById = useCallback((taskId: string) => {
    for (const project of projects) {
      for (const stage of project.workflow) {
        const task = stage.tasks.find(t => t.id === taskId);
        if (task) {
          return { task, project, stage };
        }
      }
    }
    return null;
  }, [projects]);

  const updateStockItem = useCallback(async (itemId: string, updates: Partial<StockItem>) => {
    const updated = stockItems.map(item => {
      if (item.id === itemId) {
        const newQuantity = updates.quantity ?? item.quantity;
        let status = item.status;
        
        if (newQuantity === 0) status = 'out_of_stock';
        else if (newQuantity <= item.minQuantity) status = 'low';
        else status = 'available';

        return { ...item, ...updates, status, lastUpdated: new Date().toISOString() };
      }
      return item;
    });

    setStockItems(updated);
    await saveStock(updated);
    console.log('Stock item updated:', itemId);
  }, [stockItems]);

  const addStockItem = useCallback(async (itemData: Omit<StockItem, 'id' | 'status' | 'lastUpdated'>) => {
    let status: StockItem['status'] = 'available';
    if (itemData.quantity === 0) status = 'out_of_stock';
    else if (itemData.quantity <= itemData.minQuantity) status = 'low';

    const newItem: StockItem = {
      id: `stock-${Date.now()}`,
      ...itemData,
      status,
      lastUpdated: new Date().toISOString(),
    };

    const updated = [...stockItems, newItem];
    setStockItems(updated);
    await saveStock(updated);
    console.log('Stock item added:', newItem.name);
    return newItem;
  }, [stockItems]);

  const deleteStockItem = useCallback(async (itemId: string) => {
    const updated = stockItems.filter(item => item.id !== itemId);
    setStockItems(updated);
    await saveStock(updated);
    console.log('Stock item deleted:', itemId);
  }, [stockItems]);

  const markNotificationRead = useCallback(async (notificationId: string) => {
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    await saveNotifications(updated);
  }, [notifications]);

  const addNotification = useCallback(async (notificationData: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      id: `notif-${Date.now()}`,
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    setNotifications(updated);
    await saveNotifications(updated);
    console.log('Notification added:', newNotification.title);
  }, [notifications]);

  const dashboardStats: DashboardStats = useMemo(() => {
    const allTasks = projects.flatMap(p => p.workflow.flatMap(s => s.tasks));
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in_progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      pausedProjects: projects.filter(p => p.status === 'paused').length,
      totalTasks: allTasks.length,
      completedTasks: allTasks.filter(t => t.status === 'completed').length,
      pendingTasks: allTasks.filter(t => t.status === 'pending' || t.status === 'in_progress').length,
      totalEmployees: 0,
      lowStockItems: stockItems.filter(s => s.status === 'low' || s.status === 'out_of_stock').length,
    };
  }, [projects, stockItems]);

  const unreadNotifications = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const getProjectById = useCallback((id: string) => {
    return projects.find(p => p.id === id);
  }, [projects]);

  const clearAllNotifications = useCallback(async () => {
    setNotifications([]);
    await saveNotifications([]);
  }, []);

  return {
    projects,
    stockItems,
    notifications,
    dashboardStats,
    unreadNotifications,
    isLoading,
    createProject,
    updateProject,
    deleteProject,
    addWorkflowStage,
    updateWorkflowStage,
    deleteWorkflowStage,
    addTask,
    updateTask,
    addTaskReport,
    getTaskById,
    updateStockItem,
    addStockItem,
    deleteStockItem,
    markNotificationRead,
    addNotification,
    clearAllNotifications,
    getProjectById,
  };
});
