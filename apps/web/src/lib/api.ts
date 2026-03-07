const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const TOKEN_KEY = 'tms_token';

export const tokenStore = {
  get: (): string | null =>
    typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null,
  set: (token: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(TOKEN_KEY, token);
    // Non-HttpOnly marker cookie so Next.js middleware can detect auth state
    document.cookie = `tms_auth=1; path=/; max-age=604800; SameSite=Lax`;
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(TOKEN_KEY);
    document.cookie = `tms_auth=; path=/; max-age=0`;
  },
};

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}/api${endpoint}`;
  const token = tokenStore.get();

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export const api = {
  auth: {
    login: (body: { email: string; password: string }) =>
      apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

    register: (body: { name: string; email: string; password: string; divisionId: string; departmentId: string }) =>
      apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

    logout: () =>
      apiRequest('/auth/logout', { method: 'POST' }),

    me: () =>
      apiRequest('/auth/me'),

    getDivisions: () =>
      apiRequest('/auth/divisions'),

    getProfile: () =>
      apiRequest('/auth/profile'),

    updateProfile: (body: { name?: string; departmentId?: string; currentPassword?: string; newPassword?: string }) =>
      apiRequest('/auth/profile', { method: 'PATCH', body: JSON.stringify(body) }),
  },

  divisions: {
    getAll: () =>
      apiRequest('/divisions'),

    getById: (id: string) =>
      apiRequest(`/divisions/${id}`),

    create: (body: { name: string }) =>
      apiRequest('/divisions', { method: 'POST', body: JSON.stringify(body) }),

    delete: (id: string) =>
      apiRequest(`/divisions/${id}`, { method: 'DELETE' }),

    addDepartment: (divisionId: string, body: { name: string }) =>
      apiRequest(`/divisions/${divisionId}/departments`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    updateDepartment: (divisionId: string, deptId: string, body: { name: string }) =>
      apiRequest(`/divisions/${divisionId}/departments/${deptId}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
      }),

    deleteDepartment: (divisionId: string, deptId: string) =>
      apiRequest(`/divisions/${divisionId}/departments/${deptId}`, {
        method: 'DELETE',
      }),

    assignTraining: (divisionId: string, body: { trainingCategoryId: string }) =>
      apiRequest(`/divisions/${divisionId}/trainings`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    unassignTraining: (divisionId: string, trainingCategoryId: string) =>
      apiRequest(`/divisions/${divisionId}/trainings/${trainingCategoryId}`, {
        method: 'DELETE',
      }),

    addManager: (divisionId: string, body: { employeeId: string; departmentId: string }) =>
      apiRequest(`/divisions/${divisionId}/managers`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),

    removeManager: (divisionId: string, employeeId: string) =>
      apiRequest(`/divisions/${divisionId}/managers/${employeeId}`, {
        method: 'DELETE',
      }),
  },

  trainings: {
    getAll: () =>
      apiRequest('/trainings'),

    create: (body: { name: string }) =>
      apiRequest('/trainings', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: { name: string }) =>
      apiRequest(`/trainings/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: (id: string) =>
      apiRequest(`/trainings/${id}`, { method: 'DELETE' }),
  },

  employees: {
    getAll: (params?: { search?: string; divisionId?: string; departmentId?: string; status?: string }) => {
      const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
      return apiRequest(`/employees${qs}`);
    },

    create: (body: { name: string; email: string; departmentId: string; employeeNumber?: string }) =>
      apiRequest('/employees', { method: 'POST', body: JSON.stringify(body) }),

    update: (id: string, body: { name?: string; employeeNumber?: string; departmentId?: string; status?: string }) =>
      apiRequest(`/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    delete: (id: string) =>
      apiRequest(`/employees/${id}`, { method: 'DELETE' }),
  },

  manager: {
    getDashboard: () =>
      apiRequest('/manager/dashboard'),

    getRequests: () =>
      apiRequest('/manager/requests'),

    createRequest: (body: { trainingCategoryId: string; dueDate: string; employeeIds: string[] }) =>
      apiRequest('/manager/requests', { method: 'POST', body: JSON.stringify(body) }),

    updateRequest: (id: string, body: { status?: string; dueDate?: string; employeeIds?: string[] }) =>
      apiRequest(`/manager/requests/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    deleteRequest: (id: string) =>
      apiRequest(`/manager/requests/${id}`, { method: 'DELETE' }),

    getTeam: () =>
      apiRequest('/manager/team'),

    addEmployee: (body: { name: string; email: string; employeeNumber?: string }) =>
      apiRequest('/manager/employees', { method: 'POST', body: JSON.stringify(body) }),

    updateEmployee: (id: string, body: { name?: string; employeeNumber?: string; status?: string }) =>
      apiRequest(`/manager/employees/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

    removeEmployee: (id: string) =>
      apiRequest(`/manager/employees/${id}`, { method: 'DELETE' }),

    getCompletedTrainings: (employeeId: string) =>
      apiRequest(`/manager/employees/${employeeId}/completed-trainings`),

    getTrainingCategories: () =>
      apiRequest('/manager/training-categories'),
  },

  clerk: {
    getDashboard: () =>
      apiRequest('/clerk/dashboard'),

    getRequests: (params?: { search?: string; divisionId?: string; departmentId?: string; status?: string }) => {
      const qs = params ? '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString() : '';
      return apiRequest(`/clerk/requests${qs}`);
    },
  },
};
