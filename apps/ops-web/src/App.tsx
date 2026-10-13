import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './router/ProtectedRoute';
import Layout from './components/Layout';

const Login = React.lazy(() => import('./features/auth/Login'));
const Unauthorized = React.lazy(() => import('./pages/Unauthorized'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Kitchens = React.lazy(() => import('./pages/Kitchens'));
const Consumers = React.lazy(() => import('./pages/Consumers'));
const Societies = React.lazy(() => import('./pages/Societies'));
const Orders = React.lazy(() => import('./pages/Orders'));
const Trust = React.lazy(() => import('./pages/Trust'));
const Support = React.lazy(() => import('./pages/Support'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Admin/Settings'));
const RBAC = React.lazy(() => import('./pages/Admin/RBAC'));
const Campaigns = React.lazy(() => import('./pages/Admin/Campaigns'));
const AuditLogs = React.lazy(() => import('./pages/Admin/AuditLogs'));
const Monitoring = React.lazy(() => import('./pages/Admin/Monitoring'));
const Dishes = React.lazy(() => import('./pages/Dishes'));
const Payments = React.lazy(() => import('./pages/Payments'));
const Settlements = React.lazy(() => import('./pages/Settlements'));
const Finance = React.lazy(() => import('./pages/Finance'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Delivery = React.lazy(() => import('./pages/Delivery'));
const ChefProfile = React.lazy(() => import('./pages/ChefProfile'));
const CustomerProfile = React.lazy(() => import('./pages/CustomerProfile'));
const PartyMode = React.lazy(() => import('./pages/PartyMode'));
const KitchenPartyProfile = React.lazy(() => import('./pages/KitchenPartyProfile'));

const TypedRoutes = Routes as any;
const TypedRoute = Route as any;

export default function App() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading...</div>}>
      <TypedRoutes>
        <TypedRoute path="/login" element={<Login />} />
        <TypedRoute path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected Routes inside Layout */}
        <TypedRoute element={<ProtectedRoute />}>
          <TypedRoute element={<Layout />}>
            <TypedRoute path="/" element={<Dashboard />} />
            <TypedRoute path="/kitchens" element={<Kitchens />} />
            <TypedRoute path="/consumers" element={<Consumers />} />
            <TypedRoute path="/societies" element={<Societies />} />
            <TypedRoute path="/orders" element={<Orders />} />
            <TypedRoute path="/support" element={<Support />} />
            <TypedRoute path="/trust" element={<Trust />} />
            <TypedRoute path="/finance" element={<Finance />} />
            <TypedRoute path="/analytics" element={<Analytics />} />
            <TypedRoute path="/reports" element={<Reports />} />
            <TypedRoute path="/dishes" element={<Dishes />} />
            <TypedRoute path="/payments" element={<Payments />} />
            <TypedRoute path="/settlements" element={<Settlements />} />
            <TypedRoute path="/notifications" element={<Notifications />} />
            <TypedRoute path="/delivery" element={<Delivery />} />
            <TypedRoute path="/crm/chefs/:chefId" element={<ChefProfile />} />
            <TypedRoute path="/crm/customers/:customerId" element={<CustomerProfile />} />
            <TypedRoute path="/party-mode" element={<PartyMode />} />
            <TypedRoute path="/party-mode/kitchens/:id" element={<KitchenPartyProfile />} />

            
            {/* Admin / Platform */}
            <TypedRoute path="/admin/settings" element={<Settings />} />
            <TypedRoute path="/admin/rbac" element={<RBAC />} />
            <TypedRoute path="/admin/campaigns" element={<Campaigns />} />
            <TypedRoute path="/admin/audit-logs" element={<AuditLogs />} />
            <TypedRoute path="/admin/monitoring" element={<Monitoring />} />
          </TypedRoute>
        </TypedRoute>
      </TypedRoutes>
    </Suspense>
  );
}
