import { useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FaEdit, FaTrash } from 'react-icons/fa';

export default function MyTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const { data } = await taskService.getMyTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (taskId, newStatus) => {
    try {
      await taskService.updateTaskStatus(taskId, newStatus);
      toast.success('Task status updated');
      loadTasks();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-gray-800">My Tasks</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'Pending', 'In Progress', 'Completed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded ${
              filter === status
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border'
            }`}
          >
            {status === 'all' ? 'All' : status}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="bg-white p-8 rounded-lg shadow text-center text-gray-500">
            No tasks found
          </div>
        ) : (
          filteredTasks.map(task => (
            <div key={task._id} className="bg-white p-6 rounded-lg shadow hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Link to={`/tasks/${task._id}`} className="text-xl font-semibold text-gray-800 hover:text-blue-600">
                      {task.title}
                    </Link>
                    {task.recurringTaskId && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">🔁 Recurring</span>
                    )}
                  </div>
                  <p className="text-gray-600 mt-2">{task.description}</p>
                  
                  <div className="flex gap-4 mt-3 text-sm text-gray-500">
                    <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                    {(task.startTime || task.endTime) && (
                      <span>Time: {task.startTime || '--'} - {task.endTime || '--'}</span>
                    )}
                    <span>Priority: {task.priority}</span>
                    {task.createdBy?.displayName && (
                      <span>Assigned by: {task.createdBy.displayName}</span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded text-sm ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusUpdate(task._id, e.target.value)}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
