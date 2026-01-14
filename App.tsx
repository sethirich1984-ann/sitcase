import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { EnterpriseInitPage } from './pages/EnterpriseInitPage';
import { DashboardPage } from './pages/DashboardPage';
import { InviteHandler } from './pages/InviteHandler';

// Route Guard to handle:
// 1. Is Authenticated?
// 2. Has Merchant? (Initialization Check)
// 3. Is Invite Flow?
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');

  if (isLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  // Logic D: Invitation System
  // If user is logged in BUT has a token in URL, they should see the Invite Handler
  // regardless of their currentMerchantStatus (they might be switching tenants)
  if (isAuthenticated && token) {
     return <InviteHandler />;
  }

  // Not logged in
  if (!isAuthenticated) {
    // Logic B: Invite Token Preservation
    // If attempting to access with a token, redirect to auth but KEEP the token
    if (token) {
        return <Navigate to={`/auth?token=${token}`} replace />;
    }
    return <Navigate to="/auth" replace />;
  }

  // Logged in
  if (user) {
    // Logic C: Enterprise Initialization
    // If user has NO merchant ID, they MUST go to Init page
    if (!user.currentMerchantId) {
       return <Navigate to="/init" replace />;
    }
  }

  return <>{children}</>;
};

// Specialized Route for Init Page (Prevent accessing if already has merchant)
const InitRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  
  // If already initialized, go to dashboard
  if (user?.currentMerchantId) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Auth Route (Prevent accessing if already logged in, UNLESS there is an invite token)
const AuthRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isAuthenticated, user } = useAuth();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    if (isAuthenticated) {
        // If logged in AND has token, go to Invite Handler (which is covered by the root path logic usually, or explicit route)
        if (token) {
            return <Navigate to={`/invite?token=${token}`} replace />;
        }
        
        // Normal login flow check
        if (!user?.currentMerchantId) {
            return <Navigate to="/init" replace />;
        }
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/auth" element={<AuthRoute><AuthPage /></AuthRoute>} />
            <Route path="/init" element={<InitRoute><EnterpriseInitPage /></InitRoute>} />
            
            {/* Logic D: Explicit Invite Route for clarity, though ProtectedRoute handles it too */}
            <Route path="/invite" element={
                <ProtectedRoute>
                    <InviteHandler />
                </ProtectedRoute>
            } />

            {/* Default Dashboard Route */}
            <Route path="/" element={
                <ProtectedRoute>
                    <DashboardPage />
                </ProtectedRoute>
            } />
        </Routes>
    );
}

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
};

export default App;