import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast';
import { authApi } from './apis/auth/auth';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/login/Login';
import Dashboard from './pages/dashboard/Dashboard.jsx';
import MachineEfficiency from './pages/Machine Efficiency/machineefficiency.jsx';
import CostAnalysis from './pages/CostAnalysis/CostAnalysis.jsx';
import ProductionTrend from './pages/ProductionTrend/ProductionTrend.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';
import Inventory from './pages/Inventory/Inventory.jsx';
import ItemMasterView from './pages/Inventory/ItemMasterView.jsx';
import ProductionPlanning from './pages/ProductionPlanning/ProductionPlanning.jsx';
import ProductionOrders from './pages/ProductionOrders/ProductionOrders.jsx';
import Complaints from './pages/Complaints/Complaints.jsx';
import QC from './pages/QC/QC.jsx';
import AccessControl from './pages/AccessControl/AccessControl.jsx';
import PermissionControl from './pages/AccessControl/PermissionControl.jsx';
import AccessPermission from './pages/AccessControl/AccessPermission.jsx';
import UnauthorizedPage from './pages/Unauthorized/UnauthorizedPage.jsx';
import ProductionTemplate from './pages/ProductionTemplate/ProductionTemplate.jsx';
import './App.css'

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LoadingProvider } from './context/LoadingContext.jsx';
import { PermissionProvider, usePermission, ProtectedRoute } from './context/permissioncheck.jsx';
// Simple placeholder for other routes
const SimplePlaceholder = () => (
  <></>
);

const DefaultRedirect = () => {
  const { allowedModules, loadingPermissions } = usePermission();
  const { user } = useAuth();
  
  if (loadingPermissions) {
    return <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#64748b' }}>Loading...</div>;
  }
  
  if (user?.isSuperAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const menuItems = [
    { path: '/dashboard', main_module: 'Production Dashboard' },
    { path: '/cost-analysis', main_module: 'Cost Analysis' },
    { path: '/inventory', main_module: 'Inventory' },
    { path: '/machine-efficiency', main_module: 'Machine Efficiency' },
    { path: '/production-planning', main_module: 'Production Planning' },
    { path: '/production-trend', main_module: 'Production Trend' },
    { path: '/production-orders', main_module: 'Production Orders' },
    { path: '/production-template', main_module: 'Production Template' },
    { path: '/qc', main_module: 'QC' },
  ];

  for (const item of menuItems) {
    if (allowedModules.has(item.main_module)) {
      return <Navigate to={item.path} replace />;
    }
  }

  return <Navigate to="/dashboard" replace />;
};
function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <PermissionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<DefaultRedirect />} />
            <Route path="login" element={<DefaultRedirect />} />

            <Route path="dashboard" element={<ProtectedRoute requiredRoute="/dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="analytics" element={<SimplePlaceholder title="Analytics" />} />
            <Route path="production-trend" element={<ProtectedRoute requiredRoute="/production-trend"><ProductionTrend /></ProtectedRoute>} />
            <Route path="inventory" element={<ProtectedRoute requiredRoute="/inventory"><Inventory /></ProtectedRoute>} />
            <Route path="inventory/item-master/:itemCode" element={<ProtectedRoute requiredRoute="/inventory"><ItemMasterView /></ProtectedRoute>} />
            <Route path="orders" element={<SimplePlaceholder title="Orders" />} />
            <Route path="production-orders" element={<ProtectedRoute requiredRoute="/production-orders"><ProductionOrders /></ProtectedRoute>} />
            <Route path="delivery" element={<SimplePlaceholder title="Delivery" />} />
            <Route path="machine-efficiency" element={<ProtectedRoute requiredRoute="/machine-efficiency"><MachineEfficiency /></ProtectedRoute>} />
            <Route path="cost-analysis" element={<ProtectedRoute requiredRoute="/cost-analysis"><CostAnalysis /></ProtectedRoute>} />
            <Route path="production-planning" element={<ProtectedRoute requiredRoute="/production-planning"><ProductionPlanning /></ProtectedRoute>} />
            <Route path="production-template" element={<ProtectedRoute requiredRoute="/production-template"><ProductionTemplate /></ProtectedRoute>} />
            <Route path="qc" element={<ProtectedRoute requiredRoute="/qc"><QC /></ProtectedRoute>} />
            <Route path="access-control">
              <Route index element={<AccessControl />} />
              <Route path="permission-control" element={<PermissionControl />} />
              <Route path="access-permission/:empid" element={<AccessPermission />} />
            </Route>
            <Route path="settings" element={<SimplePlaceholder title="Settings" />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </PermissionProvider>
  )
}

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <Toaster position="top-right" />
        <AppContent />
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
