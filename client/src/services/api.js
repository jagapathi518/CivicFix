const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function getToken() {
  return localStorage.getItem('civicfix_token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (let browser set multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

// Auth
export const auth = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),
};

// Complaints
export const complaints = {
  create: (data) => request('/complaints', { method: 'POST', body: JSON.stringify(data) }),
  getAll: (params) => {
    const query = new URLSearchParams(params).toString();
    return request(`/complaints?${query}`);
  },
  getById: (id) => request(`/complaints/${id}`),
  update: (id, data) => request(`/complaints/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  addComment: (id, data) => request(`/complaints/${id}/comments`, { method: 'POST', body: JSON.stringify(data) }),
  addEvidence: (id, formData) => request(`/complaints/${id}/evidence`, { method: 'POST', body: formData }),
  assign: (id, data) => request(`/complaints/${id}/assign`, { method: 'POST', body: JSON.stringify(data) }),
  accept: (id) => request(`/complaints/${id}/accept`, { method: 'POST', body: JSON.stringify({}) }),
  start: (id) => request(`/complaints/${id}/start`, { method: 'POST', body: JSON.stringify({}) }),
  resolve: (id, data) => request(`/complaints/${id}/resolve`, { method: 'POST', body: JSON.stringify(data || {}) }),
  verify: (id, data) => request(`/complaints/${id}/verify`, { method: 'POST', body: JSON.stringify(data) }),
  reopen: (id, data) => request(`/complaints/${id}/reopen`, { method: 'POST', body: JSON.stringify(data) }),
  track: (number) => request(`/complaints/track/${number}`),
  getStats: () => request('/complaints/stats/overview'),
};

// Departments
export const departments = {
  getAll: () => request('/departments'),
  create: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/departments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// Categories
export const categories = {
  getAll: (departmentId) => {
    const query = departmentId ? `?department_id=${departmentId}` : '';
    return request(`/categories${query}`);
  },
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
};

// Notifications
export const notifications = {
  getAll: () => request('/notifications'),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// Analytics
export const analytics = {
  getPublic: () => request('/analytics/public'),
  getOverview: () => request('/analytics/overview'),
  getDepartments: () => request('/analytics/departments'),
  getCategories: () => request('/analytics/categories'),
};

// Workers (for admin to list available workers)
export const workers = {
  getByDepartment: (deptId) => {
    // Uses a special query to get workers
    return request(`/auth/me`).then(() => {
      // We'll add a proper endpoint, for now return empty
      return { success: true, data: [] };
    });
  },
};

export default { auth, complaints, departments, categories, notifications, analytics };
