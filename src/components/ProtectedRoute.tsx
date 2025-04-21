
import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [isCheckingLocalStorage, setIsCheckingLocalStorage] = useState(true);
  const location = useLocation();
  
  useEffect(() => {
    // Check if auth is stored in localStorage as a backup
    const localAuth = localStorage.getItem('authUser');
    if (!isAuthenticated && !isLoading && localAuth) {
      // If we have local storage auth but no session, this could be
      // a page refresh where supabase hasn't restored the session yet
      console.log('Using localStorage auth backup');
      // We'll show the loading state for a bit longer to give the auth context time to catch up
      setTimeout(() => {
        setIsCheckingLocalStorage(false);
      }, 1000); // Give a short delay for auth to catch up
    } else {
      setIsCheckingLocalStorage(false);
    }
  }, [isAuthenticated, isLoading]);
  
  if (isLoading || isCheckingLocalStorage) {
    // Show a loading state while checking authentication
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If not authenticated and not on login page, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // If authenticated, render the children
  return <>{children}</>;
};

export default ProtectedRoute;
