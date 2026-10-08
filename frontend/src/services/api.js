// ============================================================
// XORA — Frontend API Client
// frontend/src/services/api.js
// ============================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TOKEN_KEY = "xora_auth_token";

export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

/**
 * Core fetch wrapper with JSON serialization & error normalization
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const token = options.token !== undefined ? options.token : tokenStorage.get();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method: options.method || "GET",
    headers,
  };

  if (options.body) {
    config.body = JSON.stringify(options.body);
  }

  let res;
  try {
    res = await fetch(url, config);
  } catch (netErr) {
    throw new Error(`Koneksi ke backend gagal: ${netErr.message}`);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }

  if (!res.ok) {
    const errorMsg = json?.message || `Permintaan gagal dengan status ${res.status}`;
    const err = new Error(errorMsg);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json;
}

export const authApi = {
  register: ({ name, email, password }) =>
    apiRequest("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    }),

  login: ({ email, password }) =>
    apiRequest("/api/auth/login", {
      method: "POST",
      body: { email, password },
    }),

  getMe: (token) =>
    apiRequest("/api/auth/me", {
      method: "GET",
      token,
    }),
};

export const profileApi = {
  getProfile: (token) =>
    apiRequest("/api/profile", {
      method: "GET",
      token,
    }),

  updateProfile: ({ name, learning_goal, experience_level, preferred_subject_id }, token) => {
    const body = {};
    if (name !== undefined) body.name = name;
    if (learning_goal !== undefined) body.learning_goal = learning_goal;
    if (experience_level !== undefined) body.experience_level = experience_level;
    if (preferred_subject_id !== undefined) body.preferred_subject_id = preferred_subject_id;

    return apiRequest("/api/profile", {
      method: "PATCH",
      body,
      token,
    });
  },

  completeOnboarding: (token) =>
    apiRequest("/api/profile/onboarding", {
      method: "PATCH",
      token,
    }),
};

export const subjectsApi = {
  getAll: () =>
    apiRequest("/api/subjects", {
      method: "GET",
    }),
};

export const learningPathApi = {
  getPath: (subjectId, token) => {
    const endpoint = subjectId ? `/api/learning-path/${subjectId}` : "/api/learning-path";
    return apiRequest(endpoint, {
      method: "GET",
      token,
    });
  },
};

export const assessmentsApi = {
  getAll: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.subject_id) query.append("subject_id", params.subject_id);
    if (params.level_id) query.append("level_id", params.level_id);
    if (params.topic_id) query.append("topic_id", params.topic_id);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/assessments${qs}`, { method: "GET", token });
  },

  getById: (id, token) =>
    apiRequest(`/api/assessments/${id}`, { method: "GET", token }),

  getQuestions: (id, token) =>
    apiRequest(`/api/assessments/${id}/questions`, { method: "GET", token }),

  startAttempt: (id, token) =>
    apiRequest(`/api/assessments/${id}/attempts`, { method: "POST", token }),

  submitAttempt: (attemptId, answers, token) =>
    apiRequest(`/api/assessments/attempts/${attemptId}/submit`, {
      method: "POST",
      body: { answers },
      token,
    }),

  getAttempt: (attemptId, token) =>
    apiRequest(`/api/assessments/attempts/${attemptId}`, { method: "GET", token }),
};

export const attemptsApi = {
  getById: (id, token) =>
    apiRequest(`/api/attempts/${id}`, { method: "GET", token }),

  submit: (id, answers, token) =>
    apiRequest(`/api/attempts/${id}/submit`, {
      method: "POST",
      body: { answers },
      token,
    }),
};

export const systemApi = {
  getHealth: () =>
    apiRequest("/api/health", {
      method: "GET",
    }),
};
