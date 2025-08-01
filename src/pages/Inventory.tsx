import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Heart,
  AlertTriangle,
  Plus,
  Minus,
  Edit,
  Save,
  X,
  TrendingUp,
  Package
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface InventoryItem {
  _id: string;
  bloodType: string;
  unitsAvailable: number;
  minimumThreshold: number;
  maxCapacity: number;
  lastUpdated: string;
  reservedUnits: number;
}

interface InventoryStats {
  totalUnits: number;
  lowStockCount: number;
  bloodTypeDistribution: Array<{
    bloodType: string;
    units: number;
    isLowStock: boolean;
  }>;
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addUnitsData, setAddUnitsData]= useState({
    bloodType: '',
    units: 1,
    expiryDate: ''
  });

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      const [inventoryRes, statsRes] = await Promise.all([
        axios.get('/inventory'),
        axios.get('/inventory/stats')
      ]);

      if (inventoryRes.data.success) {
        setInventory(inventoryRes.data.inventory);
      }

      if (statsRes.data.success) {
        setStats(statsRes.data.stats);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInventory = async (bloodType: string, updates: any) => {
    try {
      const response = await axios.patch(`/inventory/${bloodType}`, updates);
      
      if (response.data.success) {
        toast.success('Inventory updated successfully');
        fetchInventoryData();
        setEditingItem(null);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update inventory';
      toast.error(message);
    }
  };

  const handleAddUnits = async () => {
    try {
      const response = await axios.post('/inventory/add-units', addUnitsData);
      
      if (response.data.success) {
        toast.success(`Added ${addUnitsData.units} units of ${addUnitsData.bloodType}`);
        setShowAddModal(false);
        setAddUnitsData({ bloodType: '', units: 1, expiryDate: '' });
        fetchInventoryData();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to add units';
      toast.error(message);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    const availableUnits = item.unitsAvailable - item.reservedUnits;
    if (availableUnits <= item.minimumThreshold) {
      return { status: 'low', color: 'text-red-600', bgColor: 'bg-red-50' };
    } else if (availableUnits <= item.minimumThreshold * 1.5) {
      return { status: 'medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    } else {
      return { status: 'good', color: 'text-green-600', bgColor: 'bg-green-50' };
    }
  };

  const getChartData = () => {
    return inventory.map(item => ({
      bloodType: item.bloodType,
      available: item.unitsAvailable - item.reservedUnits,
      reserved: item.reservedUnits,
      threshold: item.minimumThreshold
    }));
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Blood Inventory</h1>
              <p className="text-gray-600 mt-2">
                Monitor and manage blood stock levels across all blood types.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Units
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Units</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUnits}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Low Stock Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.lowStockCount}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Heart className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Blood Types</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.bloodTypeDistribution.length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inventory Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={getChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="bloodType" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="available" fill="#16A34A" name="Available" />
              <Bar dataKey="reserved" fill="#EAB308" name="Reserved" />
              <Bar dataKey="threshold" fill="#DC2626" name="Min Threshold" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Current Stock Levels</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blood Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Available Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reserved Units
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Min Threshold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Max Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.map((item) => {
                  const stockStatus = getStockStatus(item);
                  const availableUnits = item.unitsAvailable - item.reservedUnits;
                  const isEditing = editingItem === item._id;

                  return (
                    <tr key={item._id} className={stockStatus.bgColor}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Heart className="h-5 w-5 text-red-500 mr-2" />
                          <span className="text-sm font-medium text-gray-900">
                            {item.bloodType}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={item.unitsAvailable}
                            id={`units-${item._id}`}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{item.unitsAvailable}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.reservedUnits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={item.minimumThreshold}
                            id={`threshold-${item._id}`}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{item.minimumThreshold}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            defaultValue={item.maxCapacity}
                            id={`capacity-${item._id}`}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{item.maxCapacity}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          stockStatus.status === 'low' ? 'bg-red-100 text-red-800' :
                          stockStatus.status === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {stockStatus.status === 'low' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {availableUnits} available
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {isEditing ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                const units = parseInt((document.getElementById(`units-${item._id}`) as HTMLInputElement)?.value || '0');
                                const threshold = parseInt((document.getElementById(`threshold-${item._id}`) as HTMLInputElement)?.value || '0');
                                const capacity = parseInt((document.getElementById(`capacity-${item._id}`) as HTMLInputElement)?.value || '0');
                                
                                handleUpdateInventory(item.bloodType, {
                                  unitsAvailable: units,
                                  minimumThreshold: threshold,
                                  maxCapacity: capacity
                                });
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingItem(item._id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Units Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Add Blood Units</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Blood Type
                  </label>
                  <select
                    value={addUnitsData.bloodType}
                    onChange={(e) => setAddUnitsData({...addUnitsData, bloodType: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Select Blood Type</option>
                    {bloodTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={addUnitsData.units}
                    onChange={(e) => setAddUnitsData({...addUnitsData, units: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={addUnitsData.expiryDate}
                    onChange={(e) => setAddUnitsData({...addUnitsData, expiryDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddUnits}
                  disabled={!addUnitsData.bloodType || addUnitsData.units < 1}
                  className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add Units
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Low Stock Alert */}
        {stats && stats.lowStockCount > 0 && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-red-800">
                Low Stock Alert ({stats.lowStockCount} blood types)
              </h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.bloodTypeDistribution
                .filter(item => item.isLowStock)
                .map((item, index) => (
                  <div key={index} className="bg-white p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{item.bloodType}</span>
                      <Heart className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-sm text-gray-600">{item.units} units remaining</p>
                    <p className="text-xs text-red-600 font-medium">Urgent restocking needed</p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inventory;