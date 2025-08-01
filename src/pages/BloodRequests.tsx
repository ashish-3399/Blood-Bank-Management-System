import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  FileText,
  Heart,
  MapPin,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Phone,
  AlertTriangle,
  Filter,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

interface BloodRequest {
  _id: string;
  patientName: string;
  bloodType: string;
  unitsNeeded: number;
  urgency: string;
  hospitalName: string;
  hospitalAddress: {
    city: string;
    state: string;
  };
  contactPerson: {
    name: string;
    phone: string;
    email: string;
  };
  medicalReason: string;
  requiredDate: string;
  status: string;
  createdAt: string;
  requester: {
    name: string;
    email: string;
    phone: string;
  };
  approvedBy?: {
    name: string;
  };
  notes?: string;
}

const BloodRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    bloodType: '',
    urgency: '',
    search: ''
  });
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const statusOptions = ['pending', 'approved', 'fulfilled', 'cancelled', 'expired'];
  const urgencyOptions = ['low', 'medium', 'high', 'critical'];

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const fetchRequests = async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/requests/all' : '/requests/my-requests';
      const params = user?.role === 'admin' ? filters : {};
      
      const response = await axios.get(endpoint, { params });
      
      if (response.data.success) {
        setRequests(response.data.requests);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string, notes?: string) => {
    if (user?.role !== 'admin') return;

    setActionLoading(requestId);
    try {
      const response = await axios.patch(`/requests/${requestId}/status`, {
        status,
        notes
      });

      if (response.data.success) {
        toast.success(`Request ${status} successfully`);
        fetchRequests();
        setShowModal(false);
        setSelectedRequest(null);
      }
    } catch (error: any) {
      const message = error.response?.data?.message || `Failed to ${status} request`;
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'fulfilled':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'expired':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'fulfilled':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return 'text-green-600';
      case 'medium':
        return 'text-yellow-600';
      case 'high':
        return 'text-orange-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filters.search && !request.patientName.toLowerCase().includes(filters.search.toLowerCase()) &&
        !request.hospitalName.toLowerCase().includes(filters.search.toLowerCase())) {
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
            {user?.role === 'admin' ? 'All Blood Requests' : 'My Blood Requests'}
          </h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'admin' 
              ? 'Manage and approve blood requests from recipients'
              : 'Track the status of your blood requests'
            }
          </p>
        </div>

        {/* Filters */}
        {user?.role === 'admin' && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by patient or hospital..."
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
                  <option value="">All Statuses</option>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urgency
                </label>
                <select
                  value={filters.urgency}
                  onChange={(e) => setFilters({...filters, urgency: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">All Urgencies</option>
                  {urgencyOptions.map(urgency => (
                    <option key={urgency} value={urgency} className="capitalize">
                      {urgency}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => setFilters({ status: '', bloodType: '', urgency: '', search: '' })}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Requests List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {filteredRequests.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredRequests.map((request) => (
                <div key={request._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-lg font-medium text-gray-900">
                          {request.patientName}
                        </h4>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1 capitalize">{request.status}</span>
                        </span>
                        <span className={`text-sm font-medium ${getUrgencyColor(request.urgency)}`}>
                          <AlertTriangle className="inline h-4 w-4 mr-1" />
                          {request.urgency.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600 mb-4">
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-2 text-red-500" />
                          <span>
                            <strong>{request.bloodType}</strong> ({request.unitsNeeded} units)
                          </span>
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{request.hospitalName}</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>
                            Required: {new Date(request.requiredDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>
                            Submitted: {new Date(request.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {user?.role === 'admin' && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-gray-700">Requester:</p>
                              <p className="text-gray-600">{request.requester.name}</p>
                              <p className="text-gray-600">{request.requester.email}</p>
                              <p className="text-gray-600">{request.requester.phone}</p>
                            </div>
                            {request.contactPerson.name && (
                              <div>
                                <p className="font-medium text-gray-700">Contact Person:</p>
                                <p className="text-gray-600">{request.contactPerson.name}</p>
                                <p className="text-gray-600">{request.contactPerson.phone}</p>
                                <p className="text-gray-600">{request.contactPerson.email}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-700">
                          <strong>Medical Reason:</strong> {request.medicalReason}
                        </p>
                        <div className="mt-2 text-sm text-gray-600">
                          <p>
                            <strong>Location:</strong> {request.hospitalAddress.city}, {request.hospitalAddress.state}
                          </p>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Admin Notes:</strong> {request.notes}
                          </p>
                          {request.approvedBy && (
                            <p className="text-xs text-blue-600 mt-1">
                              - {request.approvedBy.name}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {user?.role === 'admin' && request.status === 'pending' && (
                      <div className="ml-6 flex flex-col space-y-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request);
                            setShowModal(true);
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                        >
                          Review Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
              <p className="text-gray-600">
                {user?.role === 'admin' 
                  ? 'No blood requests match your current filters.'
                  : 'You haven\'t made any blood requests yet.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Review Modal */}
        {showModal && selectedRequest && user?.role === 'admin' && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Review Blood Request</h3>
              </div>
              
              <div className="p-6">
                <div className="space-y-4 mb-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Patient</label>
                      <p className="text-gray-900">{selectedRequest.patientName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Blood Type</label>
                      <p className="text-gray-900">{selectedRequest.bloodType} ({selectedRequest.unitsNeeded} units)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Urgency</label>
                      <p className={`font-medium ${getUrgencyColor(selectedRequest.urgency)}`}>
                        {selectedRequest.urgency.toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Required Date</label>
                      <p className="text-gray-900">
                        {new Date(selectedRequest.requiredDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Medical Reason</label>
                    <p className="text-gray-900">{selectedRequest.medicalReason}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Hospital</label>
                    <p className="text-gray-900">{selectedRequest.hospitalName}</p>
                    <p className="text-gray-600">
                      {selectedRequest.hospitalAddress.city}, {selectedRequest.hospitalAddress.state}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes (Optional)
                    </label>
                    <textarea
                      id="adminNotes"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      placeholder="Add any notes about this request..."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        const notes = (document.getElementById('adminNotes') as HTMLTextAreaElement)?.value || '';
                        handleStatusUpdate(selectedRequest._id, 'approved', notes);
                      }}
                      disabled={actionLoading === selectedRequest._id}
                      className="flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === selectedRequest._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                      ) : (
                        'Approve Request'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        const notes = (document.getElementById('adminNotes') as HTMLTextAreaElement)?.value || '';
                        handleStatusUpdate(selectedRequest._id, 'cancelled', notes);
                      }}
                      disabled={actionLoading === selectedRequest._id}
                      className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading === selectedRequest._id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
                      ) : (
                        'Reject Request'
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowModal(false);
                        setSelectedRequest(null);
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BloodRequests;