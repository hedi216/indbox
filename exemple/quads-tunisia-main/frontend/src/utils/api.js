const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Set auth token to localStorage
export const setAuthToken = (token) => {
  localStorage.setItem('authToken', token);
};

// Remove auth token from localStorage
export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
};

// Get user from localStorage
export const getStoredUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

// Set user to localStorage
export const setStoredUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

// Remove user from localStorage
export const removeStoredUser = () => {
  localStorage.removeItem('user');
};

// Generic fetch wrapper
const apiFetch = async (endpoint, options = {}) => {
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: async (credentials) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.success) {
      setAuthToken(data.data.token);
      setStoredUser(data.data.user);
    }
    return data;
  },

  register: async (userData) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    if (data.success) {
      setAuthToken(data.data.token);
      setStoredUser(data.data.user);
    }
    return data;
  },

  logout: () => {
    removeAuthToken();
    removeStoredUser();
  },

  verify: async () => {
    return await apiFetch('/auth/verify');
  },
};

// Activities API
export const activitiesAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiFetch(`/activities${queryString ? '?' + queryString : ''}`);
  },

  getOne: async (id) => {
    return await apiFetch(`/activities/${id}`);
  },

  create: async (activityData) => {
    return await apiFetch('/activities', {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  },

  update: async (id, activityData) => {
    return await apiFetch(`/activities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(activityData),
    });
  },

  delete: async (id) => {
    return await apiFetch(`/activities/${id}`, {
      method: 'DELETE',
    });
  },
};

// Bookings API
export const bookingsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiFetch(`/bookings${queryString ? '?' + queryString : ''}`);
  },

  getOne: async (id) => {
    return await apiFetch(`/bookings/${id}`);
  },

  getStats: async () => {
    return await apiFetch('/bookings/stats');
  },

  create: async (bookingData) => {
    return await apiFetch('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  },

  update: async (id, bookingData) => {
    return await apiFetch(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookingData),
    });
  },

  delete: async (id) => {
    return await apiFetch(`/bookings/${id}`, {
      method: 'DELETE',
    });
  },
};

// Users API
export const usersAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiFetch(`/users${queryString ? '?' + queryString : ''}`);
  },

  getOne: async (id) => {
    return await apiFetch(`/users/${id}`);
  },

  getStats: async () => {
    return await apiFetch('/users/stats');
  },

  create: async (userData) => {
    return await apiFetch('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id, userData) => {
    return await apiFetch(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  delete: async (id) => {
    return await apiFetch(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Reviews API
export const reviewsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiFetch(`/reviews${queryString ? '?' + queryString : ''}`);
  },

  getActivityReviews: async (activityId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return await apiFetch(`/reviews/activity/${activityId}${queryString ? '?' + queryString : ''}`);
  },

  getActivityRating: async (activityId) => {
    return await apiFetch(`/reviews/activity/${activityId}/rating`);
  },

  create: async (reviewData) => {
    return await apiFetch('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },

  updateApproval: async (id, isApproved) => {
    return await apiFetch(`/reviews/${id}/approval`, {
      method: 'PATCH',
      body: JSON.stringify({ isApproved }),
    });
  },

  delete: async (id) => {
    return await apiFetch(`/reviews/${id}`, {
      method: 'DELETE',
    });
  },
};
