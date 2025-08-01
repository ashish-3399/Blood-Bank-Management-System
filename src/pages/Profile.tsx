import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { User, Heart, Save } from 'lucide-react'; // Remove unused icons
import toast from 'react-hot-toast';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  bloodType: string;
  dateOfBirth: string;
  gender: string;
  role: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  medicalHistory: {
    conditions: string[];
    medications: string[];
    allergies: string[];
  };
  donationCount: number;
  lastDonation: string | null;
  isEligible: boolean;
  createdAt: string;
}

const Profile: React.FC = () => {
  const { updateUser } = useAuth(); // Remove unused user variable
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    medicalHistory: {
      conditions: [] as string[],
      medications: [] as string[],
      allergies: [] as string[]
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/users/profile');
      if (response.data.success) {
        const profileData = response.data.user;
        setProfile(profileData);
        setFormData({
          name: profileData.name || '',
          phone: profileData.phone || '',
          address: profileData.address || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: ''
          },
          medicalHistory: profileData.medicalHistory || {
            conditions: [],
            medications: [],
            allergies: []
          }
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await axios.patch('/users/profile', formData);
      if (response.data.success) {
        setProfile(response.data.user);
        updateUser({ name: formData.name });
        setIsEditing(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleArrayChange = (field: 'conditions' | 'medications' | 'allergies', value: string) => {
    const items = value.split(',').map(item => item.trim()).filter(item => item);
    setFormData({
      ...formData,
      medicalHistory: {
        ...formData.medicalHistory,
        [field]: items
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Failed to load profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your personal information and preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Summary Card */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-red-600">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
                <p className="text-gray-600">{profile.email}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <Heart className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-gray-900">
                      {profile.bloodType}
                    </span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <span className="text-sm text-gray-600 capitalize">
                      {profile.role}
                    </span>
                  </div>
                  {profile.role === 'donor' && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Donations Made</p>
                      <p className="text-xl font-bold text-gray-900">{profile.donationCount}</p>
                      {profile.lastDonation && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last: {new Date(profile.lastDonation).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {profile.role === 'donor' && (
              <div className="mt-6 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h4 className="font-medium text-gray-900 mb-3">Donation Eligibility</h4>
                <div className={`p-3 rounded-lg ${
                  profile.isEligible ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    profile.isEligible ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {profile.isEligible ? 'Eligible to Donate' : 'Not Eligible Yet'}
                  </p>
                  <p className={`text-xs ${
                    profile.isEligible ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {profile.isEligible 
                      ? 'You can schedule your next donation'
                      : 'Please wait before your next donation'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <p className="text-gray-900">{profile.email}</p>
                    <p className="text-xs text-gray-500">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                      />
                    ) : (
                      <p className="text-gray-900">{profile.phone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Blood Type
                    </label>
                    <p className="text-gray-900">{profile.bloodType}</p>
                    <p className="text-xs text-gray-500">Blood type cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <p className="text-gray-900">
                      {new Date(profile.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <p className="text-gray-900 capitalize">{profile.gender}</p>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Address</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Street Address
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.street}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: {...formData.address, street: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.address.street || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: {...formData.address, city: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.address.city || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.state}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: {...formData.address, state: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.address.state || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ZIP Code
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.zipCode}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: {...formData.address, zipCode: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.address.zipCode || 'Not specified'}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Country
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.address.country}
                          onChange={(e) => setFormData({
                            ...formData,
                            address: {...formData.address, country: e.target.value}
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.address.country || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-4">Medical History</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medical Conditions
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.medicalHistory.conditions.join(', ')}
                          onChange={(e) => handleArrayChange('conditions', e.target.value)}
                          placeholder="Enter conditions separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          rows={2}
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile.medicalHistory.conditions.length > 0 
                            ? profile.medicalHistory.conditions.join(', ')
                            : 'None specified'
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Medications
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.medicalHistory.medications.join(', ')}
                          onChange={(e) => handleArrayChange('medications', e.target.value)}
                          placeholder="Enter medications separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          rows={2}
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile.medicalHistory.medications.length > 0 
                            ? profile.medicalHistory.medications.join(', ')
                            : 'None specified'
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allergies
                      </label>
                      {isEditing ? (
                        <textarea
                          value={formData.medicalHistory.allergies.join(', ')}
                          onChange={(e) => handleArrayChange('allergies', e.target.value)}
                          placeholder="Enter allergies separated by commas"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-red-500 focus:border-red-500"
                          rows={2}
                        />
                      ) : (
                        <p className="text-gray-900">
                          {profile.medicalHistory.allergies.length > 0 
                            ? profile.medicalHistory.allergies.join(', ')
                            : 'None specified'
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="pt-6 border-t border-gray-200">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Account Type
                      </label>
                      <p className="text-gray-900 capitalize">{profile.role}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Member Since
                      </label>
                      <p className="text-gray-900">
                        {new Date(profile.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;