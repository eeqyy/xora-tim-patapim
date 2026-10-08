// ============================================================
// XORA — Learner Profile Routes
// backend/routes/profile.js
// ============================================================

const express = require("express");
const router = express.Router();
const profileService = require("../services/profileService");
const { requireAuth } = require("../middleware/auth");

// Standard UUID format regex (8-4-4-4-12 hex)
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/profile (Self-service profile)
router.get("/", requireAuth, async (req, res) => {
  try {
    const profile = await profileService.getLearnerProfile(req.user.id);
    return res.json({
      status: "ok",
      data: profile,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("GET /api/profile ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server saat mengambil profil",
    });
  }
});

// PATCH /api/profile (Self-service update profile)
router.patch("/", requireAuth, async (req, res) => {
  try {
    const {
      name,
      learning_goal,
      experience_level,
      preferred_subject_id,
    } = req.body || {};

    const updateData = {};

    // 1. Validate name (if provided)
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Nama harus berupa string dan tidak boleh kosong",
        });
      }
      updateData.name = name.trim();
    }

    // 2. Validate learning_goal (if provided)
    if (learning_goal !== undefined) {
      if (learning_goal !== null && typeof learning_goal !== "string") {
        return res.status(400).json({
          status: "error",
          message: "Tujuan pembelajaran harus berupa teks atau null",
        });
      }
      updateData.learning_goal = typeof learning_goal === "string" ? learning_goal.trim() : null;
    }

    // 3. Validate experience_level (if provided)
    if (experience_level !== undefined) {
      if (typeof experience_level !== "string" || experience_level.trim().length === 0) {
        return res.status(400).json({
          status: "error",
          message: "Tingkat pengalaman harus berupa teks dan tidak boleh kosong",
        });
      }
      updateData.experience_level = experience_level.trim();
    }

    // 4. Validate preferred_subject_id (if provided)
    if (preferred_subject_id !== undefined) {
      if (preferred_subject_id !== null) {
        if (typeof preferred_subject_id !== "string" || !UUID_REGEX.test(preferred_subject_id)) {
          return res.status(400).json({
            status: "error",
            message: "ID subject pilihan harus berupa UUID yang valid",
          });
        }
        updateData.preferred_subject_id = preferred_subject_id;
      } else {
        updateData.preferred_subject_id = null;
      }
    }

    // Update profile in transaction
    const updatedProfile = await profileService.updateLearnerProfile(req.user.id, updateData);

    return res.json({
      status: "ok",
      data: updatedProfile,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("PATCH /api/profile ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server saat memperbarui profil",
    });
  }
});

// PATCH /api/profile/onboarding (Complete onboarding)
router.patch("/onboarding", requireAuth, async (req, res) => {
  try {
    const result = await profileService.completeOnboarding(req.user.id);
    return res.json({
      status: "ok",
      data: result,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        status: "error",
        message: error.message,
      });
    }

    console.error("PATCH /api/profile/onboarding ERROR:", error);
    return res.status(500).json({
      status: "error",
      message: "Terjadi kesalahan internal pada server saat menyelesaikan onboarding",
    });
  }
});

module.exports = router;
