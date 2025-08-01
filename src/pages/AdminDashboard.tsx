import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Users,
  Heart,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import toast from 'react-hot-toast';

interface DashboardStats {
  users: {
    total: number;
    donors: number;
    recipients: number;
  };
  requests: {
    pending: number;
  };
  donations: {
    completed: number;
    scheduled: number;
  };
  inventory: {
    totalUnits: number;
    lowStockCount: number;
    bloodTypes: number;
  };
}

interface RecentActivity {
  requests: any[];
  donations: any[];
  users: any[];
}

interface InventoryItem {
  bloodType: string;
  unitsAvailable: number;
  isLowStock: boolean;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<RecentActivity | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activitiesRes, inventoryRes] = await Promise.all([
        axios.get('/admin/dashboard'),
        axios.get('/admin/activities'),
        axios.get('/inventory')
      ]);

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }

      if (activitiesRes.data.success) {
        setActivities(activitiesRes.data.activities);
      }

      if (inventoryRes.data.success) {
        const inventoryData = inventoryRes.data.inventory.map((item: any) => ({
          bloodType: item.bloodType,
          unitsAvailable: item.unitsAvailable,
          isLowStock: item.unitsAvailable <= item.minimumThreshold
        }));
        setInventory(inventoryData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const getInventoryChartData = () => {
    return inventory.map(item => ({
      name: item.bloodType,
      units: item.unitsAvailable,
      fill: item.isLowStock ? '#DC2626' : '#16A34A'
    }));
  };

  const getRecentRequestsData = () => {
    if (!activities?.requests) return [];
    
    const statusCounts = activities.requests.reduce((acc, request) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count
    }));
  };

  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your blood bank operations from here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.users.total || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.users.donors || 0} donors, {stats?.users.recipients || 0} recipients
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <FileText className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.requests.pending || 0}</p>
                <p className="text-xs text-gray-500">Awaiting approval</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Donations</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.donations.completed || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.donations.scheduled || 0} scheduled
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Blood Inventory</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.inventory.totalUnits || 0}</p>
                <p className="text-xs text-gray-500">
                  {stats?.inventory.lowStockCount || 0} low stock alerts
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Blood Inventory Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Blood Inventory</h3>
            {inventory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getInventoryChartData()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="units" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No inventory data</p>
                </div>
              </div>
            )}
          </div>

          {/* Request Status Distribution */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Status Distribution</h3>
            {getRecentRequestsData().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={getRecentRequestsData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getRecentRequestsData().map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No request data</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Requests */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h3>
            <div className="space-y-4">
              {activities?.requests && activities.requests.length > 0 ? (
                activities.requests.map((request, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {request.patientName}
                      </p>
                      <p className="text-xs text-gray-600">
                        {request.bloodType} - {request.unitsNeeded} units
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        request.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        request.status === 'fulfilled' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {request.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent requests</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Donations */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations</h3>
            <div className="space-y-4">
              {activities?.donations && activities.donations.length > 0 ? (
                activities.donations.map((donation, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {donation.donor?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-600">
                        {donation.bloodType} - {donation.unitsCollected || 1} units
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        donation.status === 'completed' ? 'bg-green-100 text-green-800' :
                        donation.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {donation.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No recent donations</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Users</h3>
            <div className="space-y-4">
              {activities?.users && activities.users.length > 0 ? (
                activities.users.map((user, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {user.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'donor' ? 'bg-green-100 text-green-800' :
                        user.role === 'recipient' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No new users</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        {inventory.some(item => item.isLowStock) && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold text-yellow-800">Low Stock Alerts</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inventory
                .filter(item => item.isLowStock)
                .map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-yellow-200">
                    <p className="font-medium text-gray-900">{item.bloodType}</p>
                    <p className="text-sm text-gray-600">{item.unitsAvailable} units remaining</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;