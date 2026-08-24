import { useState, useEffect } from 'react'
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
import './App.css'

import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { LoadingProvider } from './context/LoadingContext.jsx';
// Simple placeholder for other routes
const SimplePlaceholder = () => (
  <></>
);
function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="login" element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics" element={<SimplePlaceholder title="Analytics" />} />
          <Route path="production-trend" element={<ProductionTrend />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="inventory/item-master/:itemCode" element={<ItemMasterView />} />
          <Route path="orders" element={<SimplePlaceholder title="Orders" />} />
          <Route path="production-orders" element={<ProductionOrders />} />
          <Route path="delivery" element={<SimplePlaceholder title="Delivery" />} />
          <Route path="machine-efficiency" element={<MachineEfficiency />} />
          <Route path="cost-analysis" element={<CostAnalysis />} />
          <Route path="production-planning" element={<ProductionPlanning />} />
          <Route path="settings" element={<SimplePlaceholder title="Settings" />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

function App() {
  return (
    <LoadingProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LoadingProvider>
  );
}

export default App;
