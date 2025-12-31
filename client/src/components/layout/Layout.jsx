import { useState } from 'react';
import Navbar from './Navbar';
import SideNavbar from './SideNavbar';
import { useAuth } from '../../contexts/AuthContext';

export default function Layout({ children }) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <Navbar 
        onMenuClick={toggleSidebar} 
        isSidebarOpen={sidebarOpen}
        showMenu={!!user}
      />

      <div className="flex">
        {/* Side Navigation - Only show when user is logged in */}
        {user && (
          <SideNavbar 
            isOpen={sidebarOpen} 
            onClose={closeSidebar}
          />
        )}

        {/* Main Content - No margin adjustment, sidebar overlays */}
        <main className="flex-1 w-full">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
