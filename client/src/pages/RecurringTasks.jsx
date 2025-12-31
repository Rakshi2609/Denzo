import { useState, useEffect } from 'react';
import { recurringTaskService, userService } from '../services/taskService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaPlus, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Card, { CardHeader, InfoCard } from '../components/Card';

export default function RecurringTasks() {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    frequency: 'Daily',
    startDate: '',
    endDate: '',
    assignedTo: '',
    priority: 'Medium',
    startTime: '',
    endTime: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        recurringTaskService.getAll(),
        userService.getAllUsers()
      ]);
      setTasks(tasksRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await recurringTaskService.update(editingTask._id, formData);
        toast.success('Recurring task updated successfully');
      } else {
        await recurringTaskService.create(formData);
        toast.success('Recurring task created successfully');
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Failed to save task:', error);
      toast.error(error.response?.data?.error || 'Failed to save task');
    }
  };

  const handleTriggerNow = async () => {
    try {
      const loadingToast = toast.loading('Generating tasks from recurring templates...');
      const response = await recurringTaskService.triggerNow();
      toast.dismiss(loadingToast);
      toast.success(response.data.message || 'Tasks generated successfully!');
    } catch (error) {
      console.error('Failed to trigger tasks:', error);
      toast.error(error.response?.data?.error || 'Failed to generate tasks');
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Are you sure? This will stop generating future tasks.')) return;
    
    try {
      await recurringTaskService.delete(taskId);
      toast.success('Recurring task deleted successfully');
      loadData();
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleToggle = async (taskId) => {
    try {
      await recurringTaskService.toggle(taskId);
      toast.success('Status updated successfully');
      loadData();
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      frequency: task.frequency,
      startDate: format(new Date(task.startDate), 'yyyy-MM-dd'),
      endDate: task.endDate ? format(new Date(task.endDate), 'yyyy-MM-dd') : '',
      assignedTo: task.assignedTo._id || task.assignedTo,
      priority: task.taskTemplate?.priority || 'Medium',
      startTime: task.taskTemplate?.startTime || '',
      endTime: task.taskTemplate?.endTime || ''
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      frequency: 'Daily',
      startDate: '',
      endDate: '',
      assignedTo: '',
      priority: 'Medium',
      startTime: '',
      endTime: ''
    });
    setEditingTask(null);
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">Create Recurring Task</h2>
        <div className="flex gap-2">
          <button
            onClick={handleTriggerNow}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Generate Tasks Now
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <FaPlus /> New Recurring Task
          </button>
        </div>
      </div>

      <InfoCard
        title="About Recurring Tasks:"
        message={`These tasks are automatically created daily at 9 PM. Click "Generate Tasks Now" to manually create tasks from your recurring templates. All generated tasks will appear in your "My Tasks" page. You have ${tasks.length} active recurring tasks.`}
        type="info"
      />

      {tasks.length > 0 && (
        <Card>
          <CardHeader title={`Active Recurring Tasks (${tasks.length})`} />
          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task._id} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800">{task.title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      task.frequency === 'Daily' ? 'bg-green-100 text-green-800' :
                      task.frequency === 'Weekly' ? 'bg-blue-100 text-blue-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {task.frequency}
                    </span>
                    {task.taskTemplate?.priority && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        task.taskTemplate.priority === 'Urgent' ? 'bg-red-100 text-red-800' :
                        task.taskTemplate.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        task.taskTemplate.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {task.taskTemplate.priority}
                      </span>
                    )}
                    {!task.isActive && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">Paused</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Assigned to: {task.assignedTo?.displayName || task.assignedTo?.email}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    <strong>From:</strong> {format(new Date(task.startDate), 'MMM dd, yyyy')} 
                    {task.endDate && <> <strong>To:</strong> {format(new Date(task.endDate), 'MMM dd, yyyy')}</>}
                    {!task.endDate && <> <strong>To:</strong> No end date</>}
                  </p>
                  {(task.taskTemplate?.startTime || task.taskTemplate?.endTime) && (
                    <p className="text-sm text-gray-500 mt-1">
                      <strong>Time:</strong> {task.taskTemplate.startTime && <span>{task.taskTemplate.startTime}</span>}
                      {task.taskTemplate.startTime && task.taskTemplate.endTime && <span> - </span>}
                      {task.taskTemplate.endTime && <span>{task.taskTemplate.endTime}</span>}
                    </p>
                  )}
                  {task.description && (
                    <p className="text-sm text-gray-500 mt-1 italic">"{task.description}"</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggle(task._id)}
                    className={`p-2 rounded ${task.isActive ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}
                    title={task.isActive ? 'Active' : 'Paused'}
                  >
                    {task.isActive ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
                  </button>
                  <button
                    onClick={() => handleEdit(task)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tasks.length === 0 && (
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Recurring Tasks Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first recurring task to automate task generation
          </p>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            <FaPlus /> Create Your First Recurring Task
          </button>
        </Card>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 w-full max-w-md my-8">
            <h3 className="text-xl font-bold mb-4">
              {editingTask ? 'Edit Recurring Task' : 'Create Recurring Task'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Frequency *</label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData({...formData, frequency: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="Daily">Daily</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Assign To *</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({...formData, assignedTo: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select user...</option>
                  {users.map(user => (
                    <option key={user._id} value={user._id}>
                      {user.displayName || user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Start Date *</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">End Date (Optional)</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Time</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Task start time"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                    className="w-full border rounded px-3 py-2"
                    placeholder="Task end time"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  {editingTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
