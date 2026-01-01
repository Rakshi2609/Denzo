import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { taskService } from '../services/taskService';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiCalendar, FiUser, FiClock, FiMessageSquare, FiEdit } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import moment from 'moment';
import confetti from 'canvas-confetti';

export default function TaskDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [timeData, setTimeData] = useState({ startTime: '', endTime: '' });

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
    if (newStatus === 'Completed') {
      // Show time tracking modal for completion
      setShowTimeModal(true);
    } else {
      // For other status changes, update directly
      try {
        await taskService.updateTaskStatus(id, newStatus);
        setTask({ ...task, status: newStatus });
        toast.success('Status updated successfully');
        loadTaskDetails(); // Reload to get the status change update
      } catch (error) {
        console.error('Failed to update status:', error);
        toast.error('Failed to update status');
      }
    }
  };

  const handleCompleteWithTime = async () => {
    if (!user?.email) return;

    try {
      const today = new Date();
      const todayDateStr = today.toISOString().split('T')[0];
      
      let actualStartTimeISO = null;
      let actualEndTimeISO = null;
      
      if (timeData.startTime) {
        actualStartTimeISO = new Date(`${todayDateStr}T${timeData.startTime}`).toISOString();
      }
      if (timeData.endTime) {
        actualEndTimeISO = new Date(`${todayDateStr}T${timeData.endTime}`).toISOString();
      }
      
      const payload = { 
        taskId: id,
        actualStartTime: actualStartTimeISO,
        actualEndTime: actualEndTimeISO
      };
      
      console.log('Completing task with payload:', payload);
      
      await taskService.completeTask(payload);
      
      // Trigger celebration animation
      triggerCelebration();
      
      // Show celebratory toast
      toast.success('🎉 Task completed successfully!', {
        duration: 4000,
        style: {
          background: '#10B981',
          color: '#fff',
        }
      });
      
      // Reset modal state
      setShowTimeModal(false);
      setTimeData({ startTime: '', endTime: '' });
      
      // Reload task details
      loadTaskDetails();
    } catch (error) {
      console.error('Error completing task:', error);
      toast.error('Could not complete task: ' + (error.response?.data?.message || error.response?.data?.error || error.message));
    }
  };

  const handleTimeModalCancel = () => {
    setShowTimeModal(false);
    setTimeData({ startTime: '', endTime: '' });
  };

  const handleReaction = async (updateId, emoji) => {
    try {
      await taskService.toggleReaction(id, updateId, emoji);
      loadTaskDetails(); // Reload to get updated reactions
    } catch (error) {
      console.error('Failed to add reaction:', error);
      toast.error('Failed to add reaction');
    }
  };

  const triggerCelebration = () => {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

    (function frame() {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    }());
  };

  const getInitials = (name, email) => {
    if (name) {
      const names = name.split(' ');
      return names.length > 1 ? `${names[0][0]}${names[1][0]}` : name.substring(0, 2);
    }
    return email ? email.substring(0, 2) : '??';
  };

  const getAvatarColor = (str) => {
    const colors = [
      'bg-gradient-to-br from-blue-400 to-blue-600',
      'bg-gradient-to-br from-purple-400 to-purple-600',
      'bg-gradient-to-br from-green-400 to-green-600',
      'bg-gradient-to-br from-orange-400 to-orange-600',
      'bg-gradient-to-br from-pink-400 to-pink-600',
      'bg-gradient-to-br from-indigo-400 to-indigo-600',
      'bg-gradient-to-br from-teal-400 to-teal-600',
      'bg-gradient-to-br from-red-400 to-red-600',
    ];
    const hash = (str || '').split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
    return colors[hash % colors.length];
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
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Header */}
      <motion.div 
        variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 text-sm sm:text-base"
        >
          <FiArrowLeft size={20} />
          Back
        </button>
        
        {/* Edit Button - Only show if user is the creator */}
        {isCreatedByMe && (
          <button
            onClick={() => navigate(`/edit-task/${id}`)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm sm:text-base rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto justify-center"
          >
            <FiEdit size={18} />
            Edit Task
          </button>
        )}
      </motion.div>

      {/* Task Details Card */}
      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="bg-white rounded-xl shadow-lg border-t-4 border-blue-500 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300"
      >
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-4">
          <div className="flex-1 w-full">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3">{task.title}</h1>
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <span className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm ${getPriorityColor(task.priority)}`}>
                {task.priority} Priority
              </span>
              <span className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-sm ${getStatusColor(task.status)}`}>
                {task.status}
              </span>
            </div>
          </div>

          {/* Status Change Buttons - Only show if assigned to me */}
          {isAssignedToMe && task.status !== 'Completed' && (
            <div className="flex gap-2 w-full sm:w-auto">
              {task.status === 'Pending' && (
                <button
                  onClick={() => handleStatusChange('In Progress')}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-initial whitespace-nowrap font-medium"
                >
                  Start Task
                </button>
              )}
              {task.status === 'In Progress' && (
                <button
                  onClick={() => handleStatusChange('Completed')}
                  className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm sm:text-base rounded-lg hover:from-green-700 hover:to-green-800 shadow-md hover:shadow-lg transition-all duration-200 flex-1 sm:flex-initial whitespace-nowrap font-medium"
                >
                  Mark Complete
                </button>
              )}
            </div>
          )}
        </div>

        {/* Task Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FiCalendar className="text-blue-600" size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Due Date</p>
              <p className="text-sm sm:text-base text-gray-800 font-medium">
                {moment(task.dueDate).format('MMM DD, YYYY')}
                <span className={`ml-2 text-xs sm:text-sm ${moment(task.dueDate).isBefore(moment(), 'day') && task.status !== 'Completed' ? 'text-red-600' : 'text-gray-500'}`}>
                  ({moment(task.dueDate).fromNow()})
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <FiUser className="text-gray-400" size={18} />
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Assigned To</p>
              <p className="text-sm sm:text-base text-gray-800 font-medium">
                {task.assignedTo?.displayName || task.assignedTo?.email}
                {isAssignedToMe && <span className="ml-2 text-blue-600 text-xs sm:text-sm">(You)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
            <div className="bg-green-100 p-2 rounded-lg">
              <FiUser className="text-green-600" size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Created By</p>
              <p className="text-sm sm:text-base text-gray-800 font-medium">
                {task.createdBy?.displayName || task.createdBy?.email}
                {isCreatedByMe && <span className="ml-2 text-blue-600 text-xs sm:text-sm">(You)</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-100">
            <div className="bg-gray-100 p-2 rounded-lg">
              <FiClock className="text-gray-600" size={18} />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500">Created</p>
              <p className="text-sm sm:text-base text-gray-800 font-medium">{moment(task.createdAt).format('MMM DD, YYYY')}</p>
            </div>
          </div>

          {/* Show actual time tracking if task is completed */}
          {task.status === 'Completed' && (task.actualStartTime || task.actualEndTime) && (
            <>
              {task.actualStartTime && (
                <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-100">
                  <div className="bg-cyan-100 p-2 rounded-lg">
                    <FiClock className="text-cyan-600" size={18} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Work Started</p>
                    <p className="text-sm sm:text-base text-gray-800 font-medium">
                      {moment(task.actualStartTime).format('MMM DD, YYYY h:mm A')}
                    </p>
                  </div>
                </div>
              )}
              {task.actualEndTime && (
                <div className="flex items-center gap-2 sm:gap-3 p-3 rounded-lg bg-gradient-to-r from-teal-50 to-green-50 border border-teal-100">
                  <div className="bg-teal-100 p-2 rounded-lg">
                    <FiClock className="text-teal-600" size={18} />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Work Finished</p>
                    <p className="text-sm sm:text-base text-gray-800 font-medium">
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
          <div className="border-t pt-4 mt-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-500 rounded-full"></div>
              Description
            </h3>
            <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">{task.description}</p>
          </div>
        )}
      </motion.div>

      {/* Comments Section */}
      <motion.div 
        variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
        className="bg-white rounded-xl shadow-lg border-t-4 border-indigo-500 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-300"
      >
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <div className="bg-indigo-100 p-2 rounded-lg">
            <FiMessageSquare className="text-indigo-600" size={20} />
          </div>
          Activity & Comments
        </h2>

        {/* Add Comment Form - Show for both assignee and creator */}
        {(isAssignedToMe || isCreatedByMe) && (
          <form onSubmit={handleAddComment} className="mb-4 sm:mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={isAssignedToMe ? "Add a comment or update..." : "Add a follow-up comment..."}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              rows="3"
            />
            <div className="flex justify-end mt-2 sm:mt-3">
              <button
                type="submit"
                disabled={submitting || !comment.trim()}
                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm sm:text-base rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all duration-200 font-medium"
              >
                {submitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        )}

        {/* Updates/Comments List */}
        <AnimatePresence>
          <div className="space-y-3 sm:space-y-4">
          {updates.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <div className="bg-gray-100 w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center mx-auto mb-3">
                <FiMessageSquare className="text-gray-400" size={32} />
              </div>
              <p className="text-gray-500 text-sm sm:text-base">No comments or updates yet</p>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">Be the first to comment!</p>
            </div>
          ) : (
            updates.map((update, index) => (
              <motion.div 
                key={update._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow duration-200"
              >
                {/* User Avatar */}
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base flex-shrink-0 shadow-md ring-2 ring-white ${getAvatarColor(update.userId?.email || update.userId?.displayName)}`}
                >
                  {getInitials(update.userId?.displayName, update.userId?.email).toUpperCase()}
                </motion.div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                      {update.userId?.displayName || update.userId?.email}
                    </span>
                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                      {update.userId?._id === task.assignedTo?._id && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium">Assignee</span>
                      )}
                      {update.userId?._id === task.createdBy?._id && (
                        <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full font-medium">Creator</span>
                      )}
                      <span className="text-xs sm:text-sm text-gray-500">
                        {moment(update.createdAt).fromNow()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm sm:text-base text-gray-700 break-words leading-relaxed">{formatUpdateMessage(update)}</p>
                  
                  {/* Reactions */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {/* Quick Reaction Buttons */}
                    <div className="flex gap-1">
                      {['👍', '👏', '❤️', '🎉', '🔥'].map((emoji) => {
                        const reactors = update.reactions?.get?.(emoji) || [];
                        const hasReacted = reactors.includes(user?._id || user?.uid);
                        return (
                          <motion.button
                            key={emoji}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReaction(update._id, emoji)}
                            className={`px-2 py-1 rounded-full text-sm transition-all ${
                              hasReacted 
                                ? 'bg-blue-100 border-2 border-blue-500 shadow-sm' 
                                : 'bg-gray-100 border border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {emoji}
                            {reactors.length > 0 && (
                              <span className={`ml-1 text-xs font-medium ${hasReacted ? 'text-blue-700' : 'text-gray-600'}`}>
                                {reactors.length}
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
        </AnimatePresence>
      </motion.div>

      {/* Time Tracking Modal */}
      {showTimeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <h3 className="text-2xl font-bold text-gray-800 mb-4">Track Your Time</h3>
            <p className="text-gray-600 mb-4">
              Record what time you started and finished this task today.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
              <p className="text-sm text-blue-800 flex items-center gap-2">
                <FiCalendar className="text-blue-600" />
                <span className="font-semibold">Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</span>
              </p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time (Optional)
                </label>
                <input
                  type="time"
                  value={timeData.startTime}
                  onChange={(e) => setTimeData({ ...timeData, startTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time (Optional)
                </label>
                <input
                  type="time"
                  value={timeData.endTime}
                  onChange={(e) => setTimeData({ ...timeData, endTime: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  If you don't provide an end time, it will be set to now.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleTimeModalCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteWithTime}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
              >
                Complete Task
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
