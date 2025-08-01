import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  Calendar,
  Heart,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Eye
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Donation {
  _id: string;
  donor: {
    name: string;
    email: string;
    phone: string;
    bloodType: string;
  };
  donationDate: string;
  bloodType: string;
  unitsCollected: number;
  status: string;
  location: {
    name: string;
    address: string;
    city: string;
    state: string;
  };
  preScreening?: {
    weight: number;
    bloodPressure: string;
    pulse: number;
    temperature: number;
    hemoglobin: number;
    eligible: boolean;
  };
  postDonation?: {
    complications: boolean;
    notes: string;
  };
  staffMember?: {
    name: string;
  };
  notes: string;
  createdAt: string;
}

const Donations: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    bloodType: '',
    search: ''
  });
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statusOptions = ['scheduled', 'completed', 'cancelled', 'rejected'];

  useEffect(() => {
    fetchDonations();
  }, [filters]);

  const fetchDonations = async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/blood/all' : '/blood/my-donations';
      const params = user?.role === 'admin' ? filters : {};
      
      const response = await axios.get(endpoint, { params });
      
      if (response.data.success) {
        setDonations(response.data.donations);
      }
    } catch (error) {
      console.error('Error fetching donations:', error);
      toast.error('Failed to load donations');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (donationId: string, status: string, updateData?: any) => {
    if (user?.role !== 'admin') return;

    setActionLoading(donationId);
    try {
      const response = await axios.patch(`/blood/${donationId}/status`, {
        status,
        ...updateData
      });

      if (response.data.success) {
        toast.success(`Donation ${status} successfully`);
        fetchDonations();
        setShowModal(false);
        setSelectedDonation(null);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to ${status} donation`;
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'rejected':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDonations = donations.filter(donation => {
    if (filters.search && !donation.donor.name.toLowerCase().includes(filters.search.toLowerCase()) &&
        !donation.location.name.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    return true;
  });

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
          <h1 className="text-3xl font-bold text-gray-900">
            {user?.role === 'admin' ? 'All Donations' : 'My Donations'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'admin' 
              ? 'Manage and track all blood donations'
              : 'View your donation history and scheduled appointments'
            }
          </p>
        </div>

        {/* Filters */}
        {user?.role === 'admin' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by donor or location..."
                    value={filters.search}
                    onChange={(e) => setFilters({...filters, search: e.target.value})}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Status</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status} className="capitalize">
                      {status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Type
                </label>
                <select
                  value={filters.bloodType}
                  onChange={(e) => setFilters({...filters, bloodType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Types</option>
                  {bloodTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ status: '', bloodType: '', search: '' })}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Donations List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredDonations.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredDonations.map((donation) => (
                <div key={donation._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        {user?.role === 'admin' && (
                          <h4 className="text-lg font-medium text-gray-900">
                            {donation.donor.name}
                          </h4>
                        )}
                        {user?.role !== 'admin' && (
                          <h4 className="text-lg font-medium text-gray-900">
                            {donation.location.name}
                          </h4>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(donation.status)}`}>
                          {getStatusIcon(donation.status)}
                          <span className="ml-1 capitalize">{donation.status}</span>
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-2 text-red-500" />
                          <span>
                            <strong>{donation.bloodType}</strong> ({donation.unitsCollected || 1} units)
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{donation.location.city}, {donation.location.state}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            {new Date(donation.donationDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            {new Date(donation.donationDate).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>

                      {user?.role === 'admin' && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700">Donor Contact:</p>
                              <p className="text-gray-600">{donation.donor.email}</p>
                              <p className="text-gray-600">{donation.donor.phone}</p>
                            </div>
                            <div>
                              <p className="font-medium text-gray-700">Location:</p>
                              <p className="text-gray-600">{donation.location.name}</p>
                              <p className="text-gray-600">{donation.location.address}</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {donation.preScreening && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-2">Pre-Screening Results:</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-blue-700">
                            <span>Weight: {donation.preScreening.weight}kg</span>
                            <span>BP: {donation.preScreening.bloodPressure}</span>
                            <span>Pulse: {donation.preScreening.pulse} bpm</span>
                            <span>Temp: {donation.preScreening.temperature}°C</span>
                            <span>Hb: {donation.preScreening.hemoglobin} g/dL</span>
                            <span className={`font-medium ${donation.preScreening.eligible ? 'text-green-700' : 'text-red-700'}`}>
                              {donation.preScreening.eligible ? 'Eligible' : 'Not Eligible'}
                            </span>
                          </div>
                        </div>
                      )}

                      {donation.postDonation && donation.status === 'completed' && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800 mb-2">Post-Donation:</p>
                          <div className="text-xs text-green-700">
                            <p>Complications: {donation.postDonation.complications ? 'Yes' : 'No'}</p>
                            {donation.postDonation.notes && (
                              <p>Notes: {donation.postDonation.notes}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {donation.notes && (
                        <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <strong>Notes:</strong> {donation.notes}
                          </p>
                          {donation.staffMember && (
                            <p className="text-xs text-yellow-600 mt-1">
                              - {donation.staffMember.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="ml-6 flex flex-col space-y-2">
                      {user?.role === 'admin' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedDonation(donation);
                              setShowModal(true);
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            {donation.status === 'scheduled' ? 'Process' : 'View Details'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <Heart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No donations found</h3>
              <p className="text-gray-600">
                {user?.role === 'admin' 
                  ? 'No donations match your current filters.'
                  : 'You haven\'t made any donations yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Donation Details Modal */}
        {showModal && selectedDonation && user?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedDonation.status === 'scheduled' ? 'Process Donation' : 'Donation Details'}
                </h3>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Donor Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {selectedDonation.donor.name}</p>
                      <p><strong>Email:</strong> {selectedDonation.donor.email}</p>
                      <p><strong>Phone:</strong> {selectedDonation.donor.phone}</p>
                      <p><strong>Blood Type:</strong> {selectedDonation.donor.bloodType}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Donation Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Date:</strong> {new Date(selectedDonation.donationDate).toLocaleString()}</p>
                      <p><strong>Location:</strong> {selectedDonation.location.name}</p>
                      <p><strong>Address:</strong> {selectedDonation.location.address}</p>
                      <p><strong>Status:</strong> <span className="capitalize">{selectedDonation.status}</span></p>
                    </div>
                  </div>
                </div>

                {selectedDonation.status === 'scheduled' && (
                  <div className="space-y-6">
                    {/* Pre-screening Form */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-4">Pre-Screening</h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            id="weight"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Blood Pressure
                          </label>
                          <input
                            type="text"
                            id="bloodPressure"
                            placeholder="120/80"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pulse (bpm)
                          </label>
                          <input
                            type="number"
                            id="pulse"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Temperature (°C)
                          </label>
                          <input
                            type="number"
                            id="temperature"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Hemoglobin (g/dL)
                          </label>
                          <input
                            type="number"
                            id="hemoglobin"
                            step="0.1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Units Collected
                          </label>
                          <input
                            type="number"
                            id="unitsCollected"
                            min="1"
                            max="2"
                            defaultValue="1"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notes
                      </label>
                      <textarea
                        id="donationNotes"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        placeholder="Any observations or notes about the donation..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-4">
                      <button
                        onClick={() => {
                          const weight = parseFloat((document.getElementById('weight') as HTMLInputElement)?.value || '0');
                          const bloodPressure = (document.getElementById('bloodPressure') as HTMLInputElement)?.value || '';
                          const pulse = parseInt((document.getElementById('pulse') as HTMLInputElement)?.value || '0');
                          const temperature = parseFloat((document.getElementById('temperature') as HTMLInputElement)?.value || '0');
                          const hemoglobin = parseFloat((document.getElementById('hemoglobin') as HTMLInputElement)?.value || '0');
                          const unitsCollected = parseInt((document.getElementById('unitsCollected') as HTMLInputElement)?.value || '1');
                          const notes = (document.getElementById('donationNotes') as HTMLTextAreaElement)?.value || '';

                          const eligible = weight >= 50 && pulse >= 50 && pulse <= 100 && 
                                         temperature <= 37.5 && hemoglobin >= 12.5;

                          const updateData = {
                            preScreening: {
                              weight,
                              bloodPressure,
                              pulse,
                              temperature,
                              hemoglobin,
                              eligible
                            },
                            unitsCollected,
                            notes
                          };

                          handleStatusUpdate(selectedDonation._id, 'completed', updateData);
                        }}
                        disabled={actionLoading === selectedDonation._id}
                        className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {actionLoading === selectedDonation._id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                        ) : (
                          'Complete Donation'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          const notes = (document.getElementById('donationNotes') as HTMLTextAreaElement)?.value || '';
                          handleStatusUpdate(selectedDonation._id, 'rejected', { notes });
                        }}
                        disabled={actionLoading === selectedDonation._id}
                        className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Reject Donation
                      </button>
                      <button
                        onClick={() => {
                          setShowModal(false);
                          setSelectedDonation(null);
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {selectedDonation.status !== 'scheduled' && (
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedDonation(null);
                      }}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Donations;