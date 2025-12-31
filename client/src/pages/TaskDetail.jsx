import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCalendar, FiUser, FiClock, FiMessageSquare } from 'react-icons/fi';
import moment from 'moment';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTaskDetails();
  }, [id]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      const [taskRes, updatesRes] = await Promise.all([
        taskService.getTask(id),
        taskService.getTaskUpdates(id)
      ]);
      setTask(taskRes.data);
      setUpdates(updatesRes.data);
    } catch (error) {
      console.error('Failed to load task details:', error);
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const { data } = await taskService.addComment(id, comment);
      setUpdates([data, ...updates]);
      setComment('');
      toast.success('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await taskService.updateTaskStatus(id, newStatus);
      setTask({ ...task, status: newStatus });
      toast.success('Status updated successfully');
      loadTaskDetails(); // Reload to get the status change update
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update status');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      High: 'text-red-600 bg-red-50',
      Medium: 'text-yellow-600 bg-yellow-50',
      Low: 'text-green-600 bg-green-50'
    };
    return colors[priority] || 'text-gray-600 bg-gray-50';
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      Completed: 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getUpdateIcon = (type) => {
    switch (type) {
      case 'Comment':
        return '💬';
      case 'StatusChange':
        return '🔄';
      case 'Assignment':
        return '👤';
      case 'Update':
        return '✏️';
      default:
        return '📝';
    }
  };

  const formatUpdateMessage = (update) => {
    if (update.type === 'StatusChange') {
      return `Changed status from "${update.oldValue}" to "${update.newValue}"`;
    }
    return update.content;
  };

  const isAssignedToMe = task?.assignedTo?._id === user?._id || task?.assignedTo?._id === user?.uid;
  const isCreatedByMe = task?.createdBy?._id === user?._id || task?.createdBy?._id === user?.uid;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Task not found</h2>
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-800"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
        >
          <FiArrowLeft size={20} />
          Back
        </button>
      </div>

      {/* Task Details Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">{task.title}</h1>
            <div className="flex items-center gap-4 flex-wrap">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {task.priority} Priority
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
          </div>

          {/* Status Change Buttons - Only show if assigned to me */}
          {isAssignedToMe && task.status !== 'Completed' && (
            <div className="flex gap-2">
              {task.status === 'Pending' && (
                <button
                  onClick={() => handleStatusChange('In Progress')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Start Task
                </button>
              )}
              {task.status === 'In Progress' && (
                <button
                  onClick={() => handleStatusChange('Completed')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Mark Complete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Task Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center gap-3">
            <FiCalendar className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="text-gray-800 font-medium">
                {moment(task.dueDate).format('MMM DD, YYYY')}
                <span className={`ml-2 text-sm ${moment(task.dueDate).isBefore(moment(), 'day') && task.status !== 'Completed' ? 'text-red-600' : 'text-gray-500'}`}>
                  ({moment(task.dueDate).fromNow()})
                </span>
              </p>
            </div>
          </div>

          {(task.startTime || task.endTime) && (
            <div className="flex items-center gap-3">
              <FiClock className="text-gray-400" size={20} />
              <div>
                <p className="text-sm text-gray-500">Time Window</p>
                <p className="text-gray-800 font-medium">
                  {task.startTime && <span>{task.startTime}</span>}
                  {task.startTime && task.endTime && <span> - </span>}
                  {task.endTime && <span>{task.endTime}</span>}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <FiUser className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Assigned To</p>
              <p className="text-gray-800 font-medium">
                {task.assignedTo?.displayName || task.assignedTo?.email}
                {isAssignedToMe && <span className="ml-2 text-blue-600 text-sm">(You)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FiUser className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Created By</p>
              <p className="text-gray-800 font-medium">
                {task.createdBy?.displayName || task.createdBy?.email}
                {isCreatedByMe && <span className="ml-2 text-blue-600 text-sm">(You)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <FiClock className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-gray-800 font-medium">{moment(task.createdAt).format('MMM DD, YYYY')}</p>
            </div>
          </div>

          {/* Show actual time tracking if task is completed */}
          {task.status === 'Completed' && (task.actualStartTime || task.actualEndTime) && (
            <>
              {task.actualStartTime && (
                <div className="flex items-center gap-3">
                  <FiClock className="text-blue-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Work Started</p>
                    <p className="text-gray-800 font-medium">
                      {moment(task.actualStartTime).format('MMM DD, YYYY h:mm A')}
                    </p>
                  </div>
                </div>
              )}
              {task.actualEndTime && (
                <div className="flex items-center gap-3">
                  <FiClock className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Work Finished</p>
                    <p className="text-gray-800 font-medium">
                      {moment(task.actualEndTime).format('MMM DD, YYYY h:mm A')}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Description</h3>
            <p className="text-gray-600 whitespace-pre-wrap">{task.description}</p>
          </div>
        )}
      </div>

      {/* Comments Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <FiMessageSquare />
          Activity & Comments
        </h2>

        {/* Add Comment Form - Show for both assignee and creator */}
        {(isAssignedToMe || isCreatedByMe) && (
          <form onSubmit={handleAddComment} className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isAssignedToMe ? "Add a comment or update..." : "Add a follow-up comment..."}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        )}

        {/* Updates/Comments List */}
        <div className="space-y-4">
          {updates.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No comments or updates yet</p>
          ) : (
            updates.map((update) => (
              <div key={update._id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl">{getUpdateIcon(update.type)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">
                      {update.userId?.displayName || update.userId?.email}
                    </span>
                    {update.userId?._id === task.assignedTo?._id && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">Assignee</span>
                    )}
                    {update.userId?._id === task.createdBy?._id && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Creator</span>
                    )}
                    <span className="text-sm text-gray-500">
                      {moment(update.createdAt).fromNow()}
                    </span>
                  </div>
                  <p className="text-gray-700">{formatUpdateMessage(update)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
