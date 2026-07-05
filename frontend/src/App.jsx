import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loadUser } from './store/authSlice.js';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Catalog from './pages/Catalog.jsx';
import Quotes from './pages/Quotes.jsx';
import Ledger from './pages/Ledger.jsx';
import Estimator from './pages/Estimator.jsx';
import Analytics from './pages/Analytics.jsx';
import DigitalCard from './pages/DigitalCard.jsx';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, loading } = useSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center text-xs text-slate-500 font-medium">
        Verifying user credentials and loading marketplace files...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      dispatch(loadUser());
    }
  }, [dispatch]);

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected Marketplace Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Catalog />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/quotes"
          element={
            <ProtectedRoute>
              <Layout>
                <Quotes />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/ledger"
          element={
            <ProtectedRoute allowedRoles={['Builder', 'Contractor', 'Gold', 'Silver', 'Dealer', 'Admin']}>
              <Layout>
                <Ledger />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/estimator"
          element={
            <ProtectedRoute>
              <Layout>
                <Estimator />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['Dealer', 'Admin']}>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/digital-card"
          element={
            <ProtectedRoute>
              <Layout>
                <DigitalCard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Fallback Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
