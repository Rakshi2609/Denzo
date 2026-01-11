import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { signOut } from "firebase/auth";
import { auth } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { FaTasks, FaUserCircle, FaSignOutAlt, FaHome } from "react-icons/fa";
import { HiOutlineMenu } from "react-icons/hi";
import { IoClose } from "react-icons/io5";

const Navbar = ({ onMenuClick, isSidebarOpen = false, showMenu = true }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      boxShadow: "0px 4px 15px rgba(59, 130, 246, 0.3)",
      transition: { duration: 0.2 },
    },
    tap: {
      scale: 0.95,
    },
  };

  const mobileMenuVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.2,
      }
    },
    visible: {
      opacity: 1,
      height: "auto",
      transition: {
        duration: 0.3,
      }
    }
  };

  const navLinkClasses =
    "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:bg-blue-600 hover:shadow-md";

  const mobileNavLinkClasses = 
    "flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-blue-600 active:bg-blue-700 w-full text-left";

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-900 text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {showMenu && user && (
              <button
                className="inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-blue-800/40"
                onClick={onMenuClick}
                aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
                aria-expanded={isSidebarOpen}
              >
                {isSidebarOpen ? <IoClose className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
              </button>
            )}
            <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 group">
              <motion.div
                initial={{ rotate: 0 }}
                whileHover={{ rotate: 10 }}
                transition={{ duration: 0.3 }}
                className="text-2xl sm:text-3xl text-blue-300 group-hover:text-white"
              >
                <FaTasks />
              </motion.div>
              <div className="text-xl sm:text-2xl font-extrabold text-white tracking-wide">
                Danzo
              </div>
            </Link>
          </div>

          {/* Desktop Nav - Hidden on mobile */}
          <div className="hidden md:flex items-center space-x-2">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 mr-2">
                  <FaUserCircle className="text-2xl" />
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user.displayName || 'User'}</span>
                    <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full">
                      {user.role || 'Member'}
                    </span>
                  </div>
                </div>
                
                <motion.button
                  onClick={handleLogout}
                  className={`${navLinkClasses} bg-red-500 hover:bg-red-600`}
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                >
                  <FaSignOutAlt /> Logout
                </motion.button>
              </>
            ) : (
              <>
                <Link to="/">
                  <motion.button
                    className={`${navLinkClasses} bg-transparent`}
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <FaHome /> Home
                  </motion.button>
                </Link>
                
                <Link to="/login">
                  <motion.button
                    className="px-5 py-2 bg-white text-blue-700 rounded-lg font-semibold hover:bg-blue-50 transition"
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                  >
                    Login
                  </motion.button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-md hover:bg-blue-800/40"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <IoClose className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="md:hidden bg-blue-800 border-t border-blue-700"
            variants={mobileMenuVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 mb-3 border-b border-blue-700">
                    <FaUserCircle className="text-3xl" />
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{user.displayName || 'User'}</span>
                      <span className="text-xs">{user.email}</span>
                      <span className="text-xs bg-blue-500 px-2 py-0.5 rounded-full mt-1 inline-block w-fit">
                        {user.role || 'Member'}
                      </span>
                    </div>
                  </div>
                  
                  <motion.button
                    onClick={() => {
                      handleLogout();
                      closeMobileMenu();
                    }}
                    className={`${mobileNavLinkClasses} bg-red-500 hover:bg-red-600`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FaSignOutAlt className="text-xl" /> Logout
                  </motion.button>
                </>
              ) : (
                <>
                  <Link to="/" onClick={closeMobileMenu}>
                    <motion.button
                      className={mobileNavLinkClasses}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FaHome className="text-xl" /> Home
                    </motion.button>
                  </Link>
                  
                  <Link to="/login" onClick={closeMobileMenu}>
                    <motion.button
                      className="w-full px-4 py-3 bg-white text-blue-700 rounded-lg font-semibold active:bg-blue-50 transition"
                      whileTap={{ scale: 0.98 }}
                    >
                      Login
                    </motion.button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
