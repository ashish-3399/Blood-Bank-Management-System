import axios from 'axios';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  bloodType: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Set up axios defaults
  useEffect(() => {
    // Configure axios defaults
    axios.defaults.baseURL = API_BASE_URL;
    axios.defaults.timeout = 10000; // 10 second timeout for production
    
    // Add request interceptor to handle errors
    axios.interceptors.request.use(
      config => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for network errors
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.code === 'ECONNABORTED') {
          toast.error('Connection timed out. Please try again.');
        } else if (!error.response) {
          toast.error('Network error. Please check if the server is running.');
        }
        return Promise.reject(error);
      }
    );
  }, []);

  // Check if user is logged in on app start
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      getCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const getCurrentUser = async () => {
    try {
      const response = await axios.get('/auth/me');
      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  // Update login function with better error handling
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/auth/login', { 
        email, 
        password 
      });
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Login failed');
      }

      const { token, user } = response.data;
      if (!token || !user) {
        throw new Error('Invalid response from server');
      }

      localStorage.setItem('token', token);
      setUser(user);
      toast.success('Login successful!');
      return user;
    } catch (error: any) {
      if (error.code === 'ERR_NETWORK') {
        toast.error('Cannot connect to server. Please check if the server is running.');
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      }
      throw error;
    }
  };

  const register = async (userData: any) => {
    try {
      const response = await axios.post('/auth/register', userData);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Registration failed');
      }

      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success('Registration successful!');
      return user;
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};