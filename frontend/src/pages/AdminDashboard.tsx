import React, { useState, useEffect } from 'react';

/**
 * Admin Dashboard
 * 
 * Detailed system information for app owner:
 * - All users and their activity
 * - All ideas being explored
 * - System health and metrics
 * - Deployment status
 * - Telemetry from all nodes
 * - Database statistics
 * - Error logs
 * - Security events
 */

interface AdminStats {
  users: {
    total: number;
    active: number;
    newThisWeek: number;
  };
  ideas: {
    total: number;
    active: number;
    completed: number;
  };
  system: {
    uptime: number;
    memory: string;
    cpu: number;
    requests: number;
  };
  nodes: {
    total: number;
    online: number;
    degraded: number;
  };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchAdminStats();
  }, []);
  
  const fetchAdminStats = async () => {
    const res = await fetch('/api/admin/stats');
    const data = await res.json();
    setStats(data);
    setLoading(false);
  };
  
  if (loading) {
    return <div className="p-8">Loading admin dashboard...</div>;
  }
  
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            🔧 Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            System owner view - Complete system information
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Users"
            value={stats?.users.total || 0}
            subtitle={`${stats?.users.active || 0} active`}
            trend={`+${stats?.users.newThisWeek || 0} this week`}
            icon="👥"
          />
          
          <StatCard
            title="Ideas"
            value={stats?.ideas.total || 0}
            subtitle={`${stats?.ideas.active || 0} active`}
            trend={`${stats?.ideas.completed || 0} completed`}
            icon="💡"
          />
          
          <StatCard
            title="System Health"
            value={`${stats?.system.cpu || 0}%`}
            subtitle={stats?.system.memory || '0/0'}
            trend={`${stats?.system.uptime || 0}s uptime`}
            icon="📊"
          />
          
          <StatCard
            title="Nodes"
            value={stats?.nodes.total || 0}
            subtitle={`${stats?.nodes.online || 0} online`}
            trend={stats?.nodes.degraded ? `${stats.nodes.degraded} degraded` : 'All healthy'}
            icon="🖥️"
          />
        </div>
        
        {/* Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DetailSection title="Recent Activity" />
          <DetailSection title="System Logs" />
          <DetailSection title="Deployed Nodes" />
          <DetailSection title="Security Events" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subtitle, trend, icon }: any) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-600">{subtitle}</div>
      <div className="text-xs text-gray-500 mt-2">{trend}</div>
    </div>
  );
}

function DetailSection({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="text-gray-600">
        Loading {title.toLowerCase()}...
      </div>
    </div>
  );
}
