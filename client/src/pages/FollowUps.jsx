import { useState, useEffect } from 'react';
import { taskService, userService } from '../services/taskService';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { FaTasks, FaSpinner, FaCalendarAlt, FaUserCircle, FaFlag, FaSort, FaFilter, FaEye, FaSearch, FaEdit } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Pagination from '../components/Pagination';

export default function FollowUps() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('none');
  const [selectedDate, setSelectedDate] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const tasksRes = await taskService.getFollowUps();
      setTasks(tasksRes.data);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Completed': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityBorderColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'border-red-500';
      case 'High': return 'border-orange-500';
      case 'Medium': return 'border-yellow-500';
      case 'Low': return 'border-green-500';
      default: return 'border-gray-300';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'text-red-500';
      case 'High': return 'text-orange-500';
      case 'Medium': return 'text-yellow-600';
      case 'Low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  // Filter and sort logic
  const filteredAndSortedTasks = (() => {
    let result = [...tasks];

    // Search filter (by task name, assignee name, or assignee email)
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(task => 
        task.title?.toLowerCase().includes(searchLower) ||
        task.description?.toLowerCase().includes(searchLower) ||
        task.assignedTo?.displayName?.toLowerCase().includes(searchLower) ||
        task.assignedTo?.email?.toLowerCase().includes(searchLower)
      );
    }

    // Date filter
    if (selectedDate) {
      result = result.filter(
        task => new Date(task.dueDate).toDateString() === selectedDate.toDateString()
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(task => task.status === filterStatus);
    }

    // Priority filter
    if (filterPriority !== 'all') {
      result = result.filter(task => task.priority === filterPriority);
    }

    // Sorting
    if (sortBy === 'dueDate') {
      result.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    } else if (sortBy === 'priority') {
      const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 };
      result.sort((a, b) => (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5));
    } else if (sortBy === 'status') {
      const statusOrder = { 'In Progress': 1, 'Pending': 2, 'Completed': 3, 'Cancelled': 4 };
      result.sort((a, b) => (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5));
    } else if (sortBy === 'all') {
      const priorityOrder = { Urgent: 1, High: 2, Medium: 3, Low: 4 };
      result.sort((a, b) => {
        const dateDiff = new Date(a.dueDate) - new Date(b.dueDate);
        if (dateDiff !== 0) return dateDiff;
        return (priorityOrder[a.priority] || 5) - (priorityOrder[b.priority] || 5);
      });
    }

    return result;
  })();

  const paginatedTasks = filteredAndSortedTasks.slice((page - 1) * pageSize, page * pageSize);

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
  };

  const taskCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
    hover: { scale: 1.02, boxShadow: "0px 6px 20px rgba(59, 130, 246, 0.15)" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-6xl text-blue-600 mx-auto mb-4" />
          <p className="text-xl font-semibold text-gray-700">Loading follow ups...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-3 lg:p-4">
      <motion.div
        className="max-w-4xl mx-auto mt-2 p-4 sm:p-6 bg-white rounded-3xl shadow-2xl border border-blue-200 relative overflow-hidden"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/50 via-transparent to-indigo-100/50 opacity-60 rounded-3xl pointer-events-none"></div>

        <motion.div className="flex items-center justify-center gap-3 mb-6" variants={itemVariants}>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-900 drop-shadow-md flex items-center gap-2">
            <FaTasks className="text-blue-600 text-2xl sm:text-3xl" /> Follow Ups
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors duration-200"
            title="Toggle Filters"
          >
            <FaFilter className="text-blue-600 text-lg" />
          </button>
        </motion.div>

        <motion.p 
          className="text-center text-gray-600 mb-4 relative z-10"
          variants={itemVariants}
        >
          Tasks you created and assigned to others
        </motion.p>

        {showFilters && (
        <motion.div
          className="bg-blue-50 p-3 rounded-xl shadow-md border border-blue-100 mb-4 space-y-3 relative z-10"
          variants={itemVariants}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {/* Search Section */}
          <div className="flex items-center gap-2 w-full">
            <FaSearch className="text-lg sm:text-xl text-blue-600 flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by task name, assignee name or email..."
                className="flex-1 border border-blue-300 px-3 py-2 text-xs sm:text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 bg-white hover:border-blue-400 transition-all duration-200"
              />
              {searchTerm && (
                <motion.button
                  onClick={() => setSearchTerm('')}
                  className="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 transition-colors duration-200 flex-shrink-0"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  Clear
                </motion.button>
              )}
            </div>
          </div>

          {/* Sort Section */}
          <div className="flex items-center gap-2 w-full">
            <FaSort className="text-lg sm:text-xl text-blue-600 flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 border border-blue-300 rounded-lg px-2 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 bg-white hover:border-blue-400 transition-all duration-200"
            >
              <option value="none">Sort: Default</option>
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="status">Status</option>
              <option value="all">Due Date & Priority</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 w-full">
            <FaCalendarAlt className="text-lg sm:text-xl text-blue-600 flex-shrink-0" />
            <div className="flex-1 flex items-center gap-2">
              <DatePicker
                selected={selectedDate}
                onChange={(date) => setSelectedDate(date)}
                placeholderText="Filter by Due Date"
                className="flex-1 border border-blue-300 px-2 py-2 text-xs sm:text-sm rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-gray-700 bg-white hover:border-blue-400 transition-all duration-200"
                wrapperClassName="flex-1"
              />
              {selectedDate && (
                <motion.button
                  onClick={() => setSelectedDate(null)}
                  className="text-red-500 hover:text-red-700 font-medium text-xs px-2 py-1 transition-colors duration-200 flex-shrink-0"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  Clear
                </motion.button>
              )}
            </div>
          </div>

          {/* Status and Priority Filters */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-blue-300 rounded-lg px-2 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white"
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="border border-blue-300 rounded-lg px-2 py-2 text-xs sm:text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 bg-white"
            >
              <option value="all">All Priority</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </motion.div>
        )}

        {filteredAndSortedTasks.length === 0 ? (
          <motion.div 
            className="text-center py-12 relative z-10"
            variants={itemVariants}
          >
            <FaTasks className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Follow Ups Found</h3>
            <p className="text-gray-600">You haven't assigned any tasks yet</p>
          </motion.div>
        ) : (
          <>
            <ul className="space-y-4">
              {paginatedTasks.map((task, index) => (
                <motion.li
                  key={task._id || index}
                  className={`bg-white border-l-4 ${getPriorityBorderColor(task.priority)} p-4 rounded-lg shadow-md relative z-10`}
                  variants={taskCardVariants}
                  initial="hidden"
                  animate="visible"
                  whileHover="hover"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <Link 
                        to={`/tasks/${task._id}`}
                        className="flex-1"
                      >
                        <h4 className="text-base font-semibold text-gray-800 hover:text-blue-600 transition-colors break-words">
                          {task.title}
                        </h4>
                      </Link>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(task.status)} flex-shrink-0`}>
                        {task.status}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm text-gray-600 mb-2 break-words">{task.description}</p>
                    )}

                    {task.recurringTaskId && (
                      <p className="text-xs text-purple-600 font-medium flex items-center gap-1 mb-2">
                        <span className="bg-purple-100 px-2 py-1 rounded text-xs">🔁 Recurring</span>
                      </p>
                    )}

                    <div className="space-y-1">
                      <p className="text-xs text-gray-600 flex items-center gap-1">
                        <FaCalendarAlt className="text-blue-400" />
                        <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                      </p>

                      <p className="text-xs flex items-center gap-1">
                        <FaFlag className={getPriorityColor(task.priority)} />
                        <span className={`font-bold ${getPriorityColor(task.priority)}`}>
                          Priority: {task.priority}
                        </span>
                      </p>

                      <p className="text-xs text-gray-600 flex items-center gap-1 min-w-0">
                        <FaUserCircle className="text-indigo-400 flex-shrink-0" />
                        <span>Assigned to:</span>
                        <span className="font-medium text-blue-700 break-all">
                          {task.assignedTo?.displayName || task.assignedTo?.email || task.assignedTo}
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 flex gap-2 justify-end">
                      <Link
                        to={`/tasks/${task._id}`}
                        className="flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-full shadow text-xs font-medium transition-all duration-300"
                      >
                        <FaEye className="sm:mr-1" /> <span className="hidden sm:inline">View Details</span>
                      </Link>
                      <Link
                        to={`/edit-task/${task._id}`}
                        className="flex items-center justify-center bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-full shadow text-xs font-medium transition-all duration-300"
                      >
                        <FaEdit className="sm:mr-1" /> <span className="hidden sm:inline">Edit</span>
                      </Link>
                    </div>
                  </div>
                </motion.li>
              ))}
            </ul>
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filteredAndSortedTasks.length}
              onPageChange={setPage}
            />
          </>
        )}
      </motion.div>
    </div>
  );
}
