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

/**
 * Admin CRUD catalog (subjects / levels / topics / concepts) — role ADMIN.
 *
 * Endpoint public GET dipakai sebagai sumber daftar; endpoint admin
 * (POST/PUT/DELETE) menuntut token admin. Semua respons di-normalisasi ke
 * camelCase di sini supaya halaman admin tidak perlu tahu perbedaan bentuk
 * snake/camel antara endpoint publik dan CRUD.
 */
const CATALOG_MAP = {
  id: "id",
  name: "name",
  email: "email",
  roles: "roles",
  status: "status",
  title: "title",
  type: "type",
  content: "content",
  learning_goal: "learningGoal",
  experience_level: "experienceLevel",
  onboarding_completed: "onboardingCompleted",
  preferred_subject_name: "preferredSubjectName",
  employee_code: "employeeCode",
  learner_id: "learnerId",
  learner_name: "learnerName",
  learner_email: "learnerEmail",
  initial_level_id: "initialLevelId",
  initial_level_name: "initialLevelName",
  current_level_id: "currentLevelId",
  current_level_name: "currentLevelName",
  current_level_order: "currentLevelOrder",
  total_levels: "totalLevels",
  started_at: "startedAt",
  completed_at: "completedAt",
  description: "description",
  difficulty: "difficulty",
  created_at: "createdAt",
  updated_at: "updatedAt",
  subject_id: "subjectId",
  subject_name: "subjectName",
  level_id: "levelId",
  level_name: "levelName",
  topic_id: "topicId",
  topic_name: "topicName",
  concept_id: "conceptId",
  concept_name: "conceptName",
  order_index: "orderIndex",
  prerequisiteIds: "prerequisiteIds",
  prerequisite_concept_id: "prerequisiteId",
  prerequisite_name: "prerequisiteName",
  dependency_weight: "dependencyWeight",
};

function toCamel(row) {
  if (!row || typeof row !== "object") return row;
  const out = {};
  for (const [key, camel] of Object.entries(CATALOG_MAP)) {
    if (row[key] !== undefined) out[camel] = row[key];
  }
  return out;
}

async function withCatalog(resPromise, mapFn = toCamel) {
  const res = await resPromise;
  const data = Array.isArray(res?.data)
    ? res.data.map(mapFn)
    : res?.data
      ? mapFn(res.data)
      : res?.data;
  return { status: res?.status, data };
}

export const adminCatalogApi = {
  subjects: {
    list: (token) => withCatalog(apiRequest("/api/subjects", { method: "GET", token })),
    create: (body, token) =>
      withCatalog(apiRequest("/api/subjects", { method: "POST", body, token })),
    update: (id, body, token) =>
      withCatalog(apiRequest(`/api/subjects/${id}`, { method: "PUT", body, token })),
    remove: (id, token) => withCatalog(apiRequest(`/api/subjects/${id}`, { method: "DELETE", token })),
  },
  levels: {
    list: (token) => withCatalog(apiRequest("/api/levels", { method: "GET", token })),
    create: (body, token) =>
      withCatalog(apiRequest("/api/levels", { method: "POST", body, token })),
    update: (id, body, token) =>
      withCatalog(apiRequest(`/api/levels/${id}`, { method: "PUT", body, token })),
    remove: (id, token) => withCatalog(apiRequest(`/api/levels/${id}`, { method: "DELETE", token })),
  },
  topics: {
    list: (token) => withCatalog(apiRequest("/api/topics", { method: "GET", token })),
    create: (body, token) =>
      withCatalog(apiRequest("/api/topics", { method: "POST", body, token })),
    update: (id, body, token) =>
      withCatalog(apiRequest(`/api/topics/${id}`, { method: "PUT", body, token })),
    remove: (id, token) => withCatalog(apiRequest(`/api/topics/${id}`, { method: "DELETE", token })),
  },
  concepts: {
    list: (token) => withCatalog(apiRequest("/api/concepts", { method: "GET", token })),
    getPrerequisites: (id, token) =>
      withCatalog(
        apiRequest(`/api/concepts/${id}/prerequisites`, { method: "GET", token }),
        (row) =>
          toCamel({
            prerequisite_concept_id: row?.prerequisite_concept_id,
            prerequisite_name: row?.prerequisite_name,
            dependency_weight: row?.dependency_weight,
            id: row?.id,
          })
      ),
    create: (body, token) =>
      withCatalog(apiRequest("/api/concepts", { method: "POST", body, token })),
    update: (id, body, token) =>
      withCatalog(apiRequest(`/api/concepts/${id}`, { method: "PUT", body, token })),
    setPrerequisites: (id, prerequisiteIds, token) =>
      withCatalog(
        apiRequest(`/api/concepts/${id}/prerequisites`, {
          method: "PUT",
          body: { prerequisiteIds },
          token,
        })
      ),
    remove: (id, token) => withCatalog(apiRequest(`/api/concepts/${id}`, { method: "DELETE", token })),
  },
  materials: {
    list: (token, params = {}) => {
      const qs = new URLSearchParams();
      if (params.topicId) qs.set("topicId", params.topicId);
      if (params.conceptId) qs.set("conceptId", params.conceptId);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return withCatalog(apiRequest(`/api/materials${suffix}`, { method: "GET", token }));
    },
    create: (body, token) =>
      withCatalog(apiRequest("/api/materials", { method: "POST", body, token })),
    update: (id, body, token) =>
      withCatalog(apiRequest(`/api/materials/${id}`, { method: "PUT", body, token })),
    remove: (id, token) => withCatalog(apiRequest(`/api/materials/${id}`, { method: "DELETE", token })),
  },
};

// Oversight admin: akun pengguna (role + status) & learning path learner.
export const adminUserApi = {
  list: (token, params = {}) => {
    const qs = params.search ? `?search=${encodeURIComponent(params.search)}` : "";
    return withCatalog(apiRequest(`/api/admin/users${qs}`, { method: "GET", token }));
  },
  setRoles: (id, roles, token) =>
    withCatalog(apiRequest(`/api/admin/users/${id}/roles`, { method: "PUT", body: { roles }, token })),
  setStatus: (id, status, token) =>
    withCatalog(apiRequest(`/api/admin/users/${id}/status`, { method: "PATCH", body: { status }, token })),
};

export const adminLearningPathApi = {
  list: (token, params = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.status) qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return withCatalog(apiRequest(`/api/admin/learning-paths${suffix}`, { method: "GET", token }));
  },
  setStatus: (id, status, token) =>
    withCatalog(apiRequest(`/api/admin/learning-paths/${id}/status`, { method: "PATCH", body: { status }, token })),
  setCurrentLevel: (id, levelId, token) =>
    withCatalog(apiRequest(`/api/admin/learning-paths/${id}/current-level`, { method: "PATCH", body: { levelId }, token })),
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
