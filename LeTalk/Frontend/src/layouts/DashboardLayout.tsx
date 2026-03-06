import React from 'react';
import { Outlet } from 'react-router-dom';
import BottomNavigation from '../components/BottomNavigation';
import { ReminderNotificationProvider } from '../context/ReminderNotificationContext';
import { useTheme } from '../components/ThemeContext';

const DashboardLayout: React.FC = () => {
  const { isDarkMode } = useTheme();

  return (
    <ReminderNotificationProvider>
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-pink-50'}`}>
        <main className="h-full">
          <Outlet />
        </main>
        <BottomNavigation />
      </div>
    </ReminderNotificationProvider>
  );
};

export default DashboardLayout;