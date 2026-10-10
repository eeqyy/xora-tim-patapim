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

  logout: () =>
    apiRequest("/api/auth/logout", {
      method: "POST",
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
    if (params.type) query.append("type", params.type);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/assessments${qs}`, { method: "GET", token });
  },

  getById: (id, token) =>
    apiRequest(`/api/assessments/${id}`, { method: "GET", token }),

  getQuestions: (id, token) =>
    apiRequest(`/api/assessments/${id}/questions`, { method: "GET", token }),

  startAttempt: (id, token) =>
    apiRequest(`/api/assessments/${id}/attempts`, { method: "POST", token }),

  reassess: (id, token) =>
    apiRequest(`/api/assessments/${id}/reassess`, { method: "POST", token }),

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

/**
 * Data referensi untuk form admin (level / topik / konsep).
 * Endpoint ini publik, tanpa token.
 */
export const referenceApi = {
  getLevels: () => apiRequest("/api/levels", { method: "GET" }),

  getTopics: () => apiRequest("/api/topics", { method: "GET" }),

  getConcepts: () => apiRequest("/api/concepts", { method: "GET" }),
};

/**
 * Admin CRUD assessment — butuh role ADMIN.
 * `getFull` mengembalikan assessment + seluruh soal termasuk kunci jawaban
 * (dipakai editor admin; peserta tetap memakai assessmentsApi.getQuestions).
 */
export const adminAssessmentsApi = {
  getFull: (id, token) =>
    apiRequest(`/api/assessments/admin/full/${id}`, { method: "GET", token }),

  create: (body, token) =>
    apiRequest("/api/assessments", { method: "POST", body, token }),

  update: (id, body, token) =>
    apiRequest(`/api/assessments/${id}`, { method: "PUT", body, token }),

  remove: (id, token) =>
    apiRequest(`/api/assessments/${id}`, { method: "DELETE", token }),
};

export const adminQuestionsApi = {
  create: (assessmentId, body, token) =>
    apiRequest(`/api/assessments/${assessmentId}/questions`, {
      method: "POST",
      body,
      token,
    }),

  update: (assessmentId, questionId, body, token) =>
    apiRequest(`/api/assessments/${assessmentId}/questions/${questionId}`, {
      method: "PUT",
      body,
      token,
    }),

  remove: (assessmentId, questionId, token) =>
    apiRequest(`/api/assessments/${assessmentId}/questions/${questionId}`, {
      method: "DELETE",
      token,
    }),

  reorder: (assessmentId, orderedIds, token) =>
    apiRequest(`/api/assessments/${assessmentId}/questions/reorder`, {
      method: "PUT",
      body: { orderedIds },
      token,
    }),
};

export const masteryApi = {
  getSummary: (token) =>
    apiRequest("/api/mastery", { method: "GET", token }),

  getConceptMastery: (conceptId, token) =>
    apiRequest(`/api/mastery/concepts/${conceptId}`, { method: "GET", token }),
};

export const gapsApi = {
  list: (token) =>
    apiRequest("/api/gaps", { method: "GET", token }),

  getDetail: (conceptId, token) =>
    apiRequest(`/api/gaps/${conceptId}`, { method: "GET", token }),

  diagnose: (conceptId, token) =>
    apiRequest(`/api/gaps/${conceptId}/diagnose`, { method: "POST", token }),
};

export const diagnosticsApi = {
  getDetail: (id, token) =>
    apiRequest(`/api/diagnostics/${id}`, { method: "GET", token }),

  startVerification: (id, token) =>
    apiRequest(`/api/diagnostics/${id}/verify/start`, { method: "POST", token }),
};

export const recommendationsApi = {
  list: (token) =>
    apiRequest("/api/recommendations", { method: "GET", token }),

  getNextStep: (token) =>
    apiRequest("/api/recommendations/next", { method: "GET", token }),

  getDetail: (id, token) =>
    apiRequest(`/api/recommendations/${id}`, { method: "GET", token }),

  getMaterials: (id, token) =>
    apiRequest(`/api/recommendations/${id}/materials`, { method: "GET", token }),

  start: (id, token) =>
    apiRequest(`/api/recommendations/${id}/start`, { method: "POST", token }),

  // Submit & result milik assessmentService PRACTICE (sama dgn practicesApi).
  submit: (attemptId, answers, token) =>
    apiRequest(`/api/practices/attempts/${attemptId}/submit`, {
      method: "POST",
      body: { answers },
      token,
    }),

  getResult: (attemptId, token) =>
    apiRequest(`/api/practices/attempts/${attemptId}/result`, { method: "GET", token }),

  complete: (id, token) =>
    apiRequest(`/api/recommendations/${id}/complete`, { method: "POST", token }),

  skip: (id, token) =>
    apiRequest(`/api/recommendations/${id}/skip`, { method: "POST", token }),
};

export const practicesApi = {
  list: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.subjectId) query.append("subjectId", params.subjectId);
    if (params.levelId) query.append("levelId", params.levelId);
    if (params.conceptId) query.append("conceptId", params.conceptId);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/practices${qs}`, { method: "GET", token });
  },

  getById: (id, token) =>
    apiRequest(`/api/practices/${id}`, { method: "GET", token }),

  start: (id, token) =>
    apiRequest(`/api/practices/${id}/start`, { method: "POST", token }),

  submit: (attemptId, answers, token) =>
    apiRequest(`/api/practices/attempts/${attemptId}/submit`, {
      method: "POST",
      body: { answers },
      token,
    }),

  getResult: (attemptId, token) =>
    apiRequest(`/api/practices/attempts/${attemptId}/result`, { method: "GET", token }),
};

export const historyApi = {
  getHistory: (params = {}, token) => {
    const query = new URLSearchParams();
    if (params.limit) query.append("limit", params.limit);
    if (params.offset) query.append("offset", params.offset);
    if (params.eventType) query.append("eventType", params.eventType);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest(`/api/history${qs}`, { method: "GET", token });
  },
};

export const aiApi = {
  /**
   * Analisis error pattern berbasis bukti (OpenRouter).
   * @param {{ concept_id?: string|null }} body
   */
  analyze: (body = {}, token) => {
    const payload = {};
    if (body.concept_id) payload.concept_id = body.concept_id;
    return apiRequest("/api/ai/analyze", {
      method: "POST",
      body: payload,
      token,
    });
  },
};

export const systemApi = {
  getHealth: () =>
    apiRequest("/api/health", {
      method: "GET",
    }),
};
