import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Heart,
  Calendar,
  Clock,
  Award,
  Plus,
  Activity,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

interface Donation {
  _id: string;
  donationDate: string;
  status: string;
  unitsCollected: number;
  location: {
    name: string;
    city: string;
  };
}

interface EligibilityData {
  eligible: boolean;
  lastDonation: string | null;
  nextEligibleDate: string | null;
  donationCount: number;
}

const DonorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [formData, setFormData] = useState({
    donationDate: '',
    location: {
      name: '',
      address: '',
      city: '',
      state: ''
    }
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [donationsRes, eligibilityRes] = await Promise.all([
        axios.get('/blood/my-donations'),
        axios.get('/users/eligibility')
      ]);

      if (donationsRes.data.success) {
        setDonations(donationsRes.data.donations);
      }

      if (eligibilityRes.data.success) {
        setEligibility(eligibilityRes.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleDonation = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!eligibility?.eligible) {
      toast.error('You are not eligible to donate at this time');
      return;
    }

    try {
      const response = await axios.post('/blood/donate', formData);
      
      if (response.data.success) {
        toast.success('Donation scheduled successfully!');
        setShowScheduleForm(false);
        setFormData({
          donationDate: '',
          location: {
            name: '',
            address: '',
            city: '',
            state: ''
          }
        });
        fetchDashboardData();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to schedule donation';
      toast.error(message);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDonationTrend = () => {
    const monthlyData = donations
      .filter(d => d.status === 'completed')
      .reduce((acc, donation) => {
        const month = new Date(donation.donationDate).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
        acc[month] = (acc[month] || 0) + (donation.unitsCollected || 1);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(monthlyData).map(([month, units]) => ({ month, units }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const completedDonations = donations.filter(d => d.status === 'completed').length;
  const scheduledDonations = donations.filter(d => d.status === 'scheduled').length;
  const totalUnits = donations
    .filter(d => d.status === 'completed')
    .reduce((sum, d) => sum + (d.unitsCollected || 1), 0);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Thank you for being a lifesaver. Here's your donation dashboard.
          </p>
        </div>

        {/* Eligibility Status */}
        <div className="mb-8">
          <div className={`p-6 rounded-lg border-2 ${
            eligibility?.eligible 
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-center">
              {eligibility?.eligible ? (
                <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600 mr-3" />
              )}
              <div>
                <h3 className={`font-semibold ${
                  eligibility?.eligible ? 'text-green-800' : 'text-yellow-800'
                }`}>
                  {eligibility?.eligible ? 'Eligible to Donate' : 'Not Eligible Yet'}
                </h3>
                <p className={`text-sm ${
                  eligibility?.eligible ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {eligibility?.eligible 
                    ? 'You can schedule your next donation'
                    : eligibility?.nextEligibleDate 
                      ? `Next eligible date: ${new Date(eligibility.nextEligibleDate).toLocaleDateString()}`
                      : 'Complete your profile to check eligibility'
                  }
                </p>
              </div>
            </div>

            {eligibility?.eligible && (
              <div className="mt-4">
                <button
                  onClick={() => setShowScheduleForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Donation
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <Heart className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed Donations</p>
                <p className="text-2xl font-bold text-gray-900">{completedDonations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledDonations}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Activity className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Units</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lives Saved</p>
                <p className="text-2xl font-bold text-gray-900">{totalUnits * 3}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Recent Donations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Donation Trend Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation Trend</h3>
            {getDonationTrend().length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={getDonationTrend()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="units" stroke="#dc2626" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-300 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No donation data yet</p>
                  <p className="text-sm">Your donation history will appear here</p>
                </div>
              </div>
            )}
          </div>

          {/* Recent Donations */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations</h3>
            <div className="space-y-4">
              {donations.length > 0 ? (
                donations.slice(0, 5).map((donation) => (
                  <div key={donation._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {donation.location?.name || 'Blood Bank'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(donation.donationDate).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {donation.location?.city}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                        {donation.status}
                      </span>
                      <p className="text-sm text-gray-600 mt-1">
                        {donation.unitsCollected || 1} unit(s)
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No donations yet</p>
                  <p className="text-sm">Schedule your first donation to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Donation Modal */}
        {showScheduleForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Schedule Donation</h3>
              
              <form onSubmit={handleScheduleDonation} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Donation Date
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.donationDate}
                    onChange={(e) => setFormData({...formData, donationDate: e.target.value})}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., City General Hospital"
                    value={formData.location.name}
                    onChange={(e) => setFormData({
                      ...formData, 
                      location: {...formData.location, name: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full address"
                    value={formData.location.address}
                    onChange={(e) => setFormData({
                      ...formData, 
                      location: {...formData.location, address: e.target.value}
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location.city}
                      onChange={(e) => setFormData({
                        ...formData, 
                        location: {...formData.location, city: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      State
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.location.state}
                      onChange={(e) => setFormData({
                        ...formData, 
                        location: {...formData.location, state: e.target.value}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Schedule
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorDashboard;