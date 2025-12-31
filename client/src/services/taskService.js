import api from './api';

export const taskService = {
  // Get all tasks
  getAllTasks: () => api.get('/tasks'),
  
  // Get tasks assigned to me
  getMyTasks: () => api.get('/tasks/my-tasks'),
  
  // Get tasks I created for others (Follow Ups)
  getFollowUps: () => api.get('/tasks/follow-ups'),
  
  // Get single task
  getTask: (id) => api.get(`/tasks/${id}`),
  
  // Create task
  createTask: (taskData) => api.post('/tasks', taskData),
  
  // Update task
  updateTask: (id, taskData) => api.put(`/tasks/${id}`, taskData),
  
  // Update task status
  updateTaskStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  
  // Complete task with time tracking
  completeTask: (payload) => api.patch('/tasks/complete', payload),
  
  // Delete task
  deleteTask: (payload) => api.delete('/tasks/delete', { data: payload }),
  
  // Get task updates/comments
  getTaskUpdates: (taskId) => api.get(`/tasks/${taskId}/updates`),
  
  // Add comment
  addComment: (taskId, content) => api.post(`/tasks/${taskId}/updates`, { content }),
};

export const recurringTaskService = {
  getAll: () => api.get('/recurring-tasks'),
  create: (data) => api.post('/recurring-tasks', data),
  update: (id, data) => api.put(`/recurring-tasks/${id}`, data),
  delete: (id) => api.delete(`/recurring-tasks/${id}`),
  toggle: (id) => api.patch(`/recurring-tasks/${id}/toggle`),
  triggerNow: () => api.post('/recurring-tasks/trigger-now'),
};

export const userService = {
  getAllUsers: () => api.get('/users'),
  updateRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  getCurrentUser: () => api.get('/auth/me'),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getCalendar: (start, end) => api.get(`/dashboard/calendar?start=${start}&end=${end}`),
  getOverdue: () => api.get('/dashboard/overdue'),
};
