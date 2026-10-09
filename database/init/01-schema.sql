-- ============================================================
-- XORA DATABASE
-- PostgreSQL / Supabase
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_status AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED'
);

CREATE TYPE role_type AS ENUM (
    'LEARNER',
    'ADMIN'
);

CREATE TYPE session_status AS ENUM (
    'ACTIVE',
    'EXPIRED',
    'REVOKED'
);

CREATE TYPE content_status AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);

CREATE TYPE level_difficulty AS ENUM (
    'EASY',
    'MEDIUM',
    'HARD'
);

CREATE TYPE material_type AS ENUM (
    'ARTICLE',
    'VIDEO',
    'CODE_EXAMPLE',
    'REFERENCE'
);

CREATE TYPE assessment_type AS ENUM (
    'TOPIC',
    'LEVEL_FINAL',
    'MIXED',
    'REASSESSMENT',
    'PRACTICE'
);

CREATE TYPE question_type AS ENUM (
    'MULTIPLE_CHOICE',
    'ESSAY',
    'DRAG_DROP',
    'CODE'
);

CREATE TYPE attempt_status AS ENUM (
    'IN_PROGRESS',
    'COMPLETED',
    'ABANDONED'
);

CREATE TYPE gap_status AS ENUM (
    'INSUFFICIENT_EVIDENCE',
    'POSSIBLE_GAP',
    'VERIFICATION',
    'CONFIRMED',
    'REJECTED',
    'INCONCLUSIVE',
    'IN_PRACTICE',
    'RESOLVED',
    'NO_GAP',
    'MASTERED'
);

CREATE TYPE diagnostic_status AS ENUM (
    'PENDING',
    'HYPOTHESIS',
    'VERIFIED',
    'CONFIRMED',
    'INCONCLUSIVE'
);

CREATE TYPE action_type AS ENUM (
    'COLLECT_MORE_EVIDENCE',
    'RUN_DIAGNOSTIC',
    'ADVANCE',
    'PREREQUISITE_PRACTICE',
    'TARGETED_PRACTICE'
);

CREATE TYPE action_status AS ENUM (
    'RECOMMENDED',
    'IN_PROGRESS',
    'COMPLETED',
    'SKIPPED'
);

CREATE TYPE learning_path_status AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'PAUSED'
);

CREATE TYPE event_type AS ENUM (
    'LOGIN',
    'LOGOUT',
    'ASSESSMENT_STARTED',
    'ASSESSMENT_COMPLETED',
    'MATERIAL_VIEWED',
    'PRACTICE_STARTED',
    'PRACTICE_COMPLETED',
    'DIAGNOSTIC_GENERATED',
    'DIAGNOSTIC_VERIFIED',
    'RECOMMENDATION_CREATED',
    'RECOMMENDATION_COMPLETED',
    'REASSESSMENT_COMPLETED',
    'LEARNING_PATH_UPDATED'
);

CREATE TYPE audit_action AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'PUBLISH',
    'ARCHIVE',
    'LOGIN',
    'LOGOUT',
    'VERIFY'
);

CREATE TYPE actor_type AS ENUM (
    'LEARNER',
    'ADMIN',
    'SYSTEM',
    'AI_SERVICE'
);


-- ============================================================
-- USERS & AUTHENTICATION
-- ============================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    status user_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_status
    ON users(status);


CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name role_type NOT NULL UNIQUE,
    description TEXT
);


CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_roles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_user_roles_role
        FOREIGN KEY (role_id)
        REFERENCES roles(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_user_roles
        UNIQUE (user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id
    ON user_roles(user_id);

CREATE INDEX idx_user_roles_role_id
    ON user_roles(role_id);


CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token_hash TEXT NOT NULL UNIQUE,
    status session_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,

    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);

CREATE INDEX idx_sessions_user_id
    ON sessions(user_id);

CREATE INDEX idx_sessions_status
    ON sessions(status);

CREATE INDEX idx_sessions_expires_at
    ON sessions(expires_at);


-- ============================================================
-- CONTENT STRUCTURE
-- Subject → Level → Topic → Material
-- ============================================================

CREATE TABLE subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    status content_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subjects_status
    ON subjects(status);


CREATE TABLE learner_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    learning_goal TEXT,
    experience_level TEXT,
    preferred_subject_id UUID,
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_learner_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_learner_profiles_subject
        FOREIGN KEY (preferred_subject_id)
        REFERENCES subjects(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
);

CREATE INDEX idx_learner_profiles_preferred_subject
    ON learner_profiles(preferred_subject_id);


CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    employee_code TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_admin_profiles_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
);


CREATE TABLE levels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL,
    name TEXT NOT NULL,
    difficulty level_difficulty NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    status content_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_levels_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_levels_subject_order
        UNIQUE (subject_id, order_index),

    CONSTRAINT uq_levels_subject_name
        UNIQUE (subject_id, name)
);

CREATE INDEX idx_levels_subject_id
    ON levels(subject_id);

CREATE INDEX idx_levels_difficulty
    ON levels(difficulty);

CREATE INDEX idx_levels_status
    ON levels(status);


CREATE TABLE topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    status content_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_topics_level
        FOREIGN KEY (level_id)
        REFERENCES levels(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_topics_level_order
        UNIQUE (level_id, order_index),

    CONSTRAINT uq_topics_level_name
        UNIQUE (level_id, name)
);

CREATE INDEX idx_topics_level_id
    ON topics(level_id);

CREATE INDEX idx_topics_status
    ON topics(status);


CREATE TABLE materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL,
    title TEXT NOT NULL,
    type material_type NOT NULL,
    content JSONB NOT NULL,
    order_index INTEGER NOT NULL,
    status content_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_materials_topic
        FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_materials_topic_order
        UNIQUE (topic_id, order_index)
);

CREATE INDEX idx_materials_topic_id
    ON materials(topic_id);

CREATE INDEX idx_materials_status
    ON materials(status);


-- ============================================================
-- KNOWLEDGE STRUCTURE
-- ============================================================

CREATE TABLE concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    status content_status NOT NULL DEFAULT 'DRAFT',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_concepts_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_concepts_subject_name
        UNIQUE (subject_id, name)
);

CREATE INDEX idx_concepts_subject_id
    ON concepts(subject_id);

CREATE INDEX idx_concepts_status
    ON concepts(status);


CREATE TABLE topic_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    topic_id UUID NOT NULL,
    concept_id UUID NOT NULL,
    relevance_weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_topic_concepts_topic
        FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_topic_concepts_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_topic_concepts_pair
        UNIQUE (topic_id, concept_id),

    CONSTRAINT uq_topic_concepts_order
        UNIQUE (topic_id, order_index),

    CONSTRAINT chk_topic_concepts_weight
        CHECK (relevance_weight >= 0)
);

CREATE INDEX idx_topic_concepts_topic_id
    ON topic_concepts(topic_id);

CREATE INDEX idx_topic_concepts_concept_id
    ON topic_concepts(concept_id);


CREATE TABLE concept_prerequisites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL,
    prerequisite_concept_id UUID NOT NULL,
    dependency_weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_concept_prerequisites_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_concept_prerequisites_prerequisite
        FOREIGN KEY (prerequisite_concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_concept_prerequisites_pair
        UNIQUE (concept_id, prerequisite_concept_id),

    CONSTRAINT chk_concept_prerequisite_not_self
        CHECK (concept_id <> prerequisite_concept_id),

    CONSTRAINT chk_concept_prerequisite_weight
        CHECK (dependency_weight >= 0)
);

CREATE INDEX idx_concept_prerequisites_concept_id
    ON concept_prerequisites(concept_id);

CREATE INDEX idx_concept_prerequisites_prerequisite_id
    ON concept_prerequisites(prerequisite_concept_id);


-- ============================================================
-- LEARNING PATH
-- ============================================================

CREATE TABLE learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    initial_level_id UUID NOT NULL,
    current_level_id UUID NOT NULL,
    status learning_path_status NOT NULL DEFAULT 'ACTIVE',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_learning_paths_learner
        FOREIGN KEY (learner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_learning_paths_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_learning_paths_initial_level
        FOREIGN KEY (initial_level_id)
        REFERENCES levels(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_learning_paths_current_level
        FOREIGN KEY (current_level_id)
        REFERENCES levels(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX idx_learning_paths_learner_id
    ON learning_paths(learner_id);

CREATE INDEX idx_learning_paths_subject_id
    ON learning_paths(subject_id);

CREATE INDEX idx_learning_paths_initial_level_id
    ON learning_paths(initial_level_id);

CREATE INDEX idx_learning_paths_current_level_id
    ON learning_paths(current_level_id);

CREATE INDEX idx_learning_paths_status
    ON learning_paths(status);


-- ============================================================
-- LEARNER CONCEPT STATE
-- ============================================================

CREATE TABLE learner_concept_states (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL,
    concept_id UUID NOT NULL,
    mastery_score NUMERIC(5,2) NOT NULL,
    evidence_confidence NUMERIC(5,2) NOT NULL,
    evidence_count INTEGER NOT NULL DEFAULT 0,
    primary_error_pattern TEXT,
    gap_status gap_status NOT NULL,
    last_assessed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_learner_concept_states_learner
        FOREIGN KEY (learner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_learner_concept_states_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_learner_concept_states
        UNIQUE (learner_id, concept_id),

    CONSTRAINT chk_learner_concept_mastery
        CHECK (mastery_score >= 0 AND mastery_score <= 100),

    CONSTRAINT chk_learner_concept_confidence
        CHECK (evidence_confidence >= 0 AND evidence_confidence <= 100),

    CONSTRAINT chk_learner_concept_evidence_count
        CHECK (evidence_count >= 0)
);

CREATE INDEX idx_learner_concept_states_learner_id
    ON learner_concept_states(learner_id);

CREATE INDEX idx_learner_concept_states_concept_id
    ON learner_concept_states(concept_id);

CREATE INDEX idx_learner_concept_states_gap_status
    ON learner_concept_states(gap_status);


-- ============================================================
-- ASSESSMENT
-- ============================================================

CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL,
    level_id UUID,
    topic_id UUID,
    type assessment_type NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INTEGER,
    passing_score NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_assessments_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_assessments_level
        FOREIGN KEY (level_id)
        REFERENCES levels(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_assessments_topic
        FOREIGN KEY (topic_id)
        REFERENCES topics(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_assessments_passing_score
        CHECK (
            passing_score IS NULL
            OR (passing_score >= 0 AND passing_score <= 100)
        ),

    CONSTRAINT chk_assessments_duration
        CHECK (
            duration_minutes IS NULL
            OR duration_minutes > 0
        ),

    CONSTRAINT chk_topic_assessment_requires_topic
        CHECK (
            type <> 'TOPIC'
            OR topic_id IS NOT NULL
        ),

    CONSTRAINT chk_level_final_requires_level
        CHECK (
            type <> 'LEVEL_FINAL'
            OR level_id IS NOT NULL
        )
);

CREATE INDEX idx_assessments_subject_id
    ON assessments(subject_id);

CREATE INDEX idx_assessments_level_id
    ON assessments(level_id);

CREATE INDEX idx_assessments_topic_id
    ON assessments(topic_id);

CREATE INDEX idx_assessments_type
    ON assessments(type);


CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL,
    concept_id UUID NOT NULL,
    difficulty level_difficulty NOT NULL DEFAULT 'MEDIUM',
    type question_type NOT NULL,
    question_text TEXT NOT NULL,
    correct_answer JSONB NOT NULL,
    points NUMERIC(5,2) NOT NULL,
    order_index INTEGER NOT NULL,

    CONSTRAINT fk_questions_assessment
        FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_questions_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT uq_questions_assessment_order
        UNIQUE (assessment_id, order_index),

    CONSTRAINT chk_questions_points
        CHECK (points >= 0)
);

CREATE INDEX idx_questions_assessment_id
    ON questions(assessment_id);

CREATE INDEX idx_questions_concept_id
    ON questions(concept_id);


CREATE TABLE attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL,
    assessment_id UUID NOT NULL,
    status attempt_status NOT NULL DEFAULT 'IN_PROGRESS',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score NUMERIC(5,2),

    CONSTRAINT fk_attempts_learner
        FOREIGN KEY (learner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_attempts_assessment
        FOREIGN KEY (assessment_id)
        REFERENCES assessments(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_attempts_score
        CHECK (
            score IS NULL
            OR (score >= 0 AND score <= 100)
        )
);

CREATE INDEX idx_attempts_learner_id
    ON attempts(learner_id);

CREATE INDEX idx_attempts_assessment_id
    ON attempts(assessment_id);

CREATE INDEX idx_attempts_status
    ON attempts(status);

CREATE INDEX idx_attempts_learner_assessment
    ON attempts(learner_id, assessment_id);


CREATE TABLE evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL,
    question_id UUID NOT NULL,
    concept_id UUID NOT NULL,
    answer JSONB NOT NULL,
    is_correct BOOLEAN NOT NULL,
    score NUMERIC(5,2) NOT NULL,
    error_pattern TEXT,
    response_time_seconds INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_evidence_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES attempts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_evidence_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_evidence_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_evidence_score
        CHECK (score >= 0 AND score <= 100),

    CONSTRAINT chk_evidence_response_time
        CHECK (
            response_time_seconds IS NULL
            OR response_time_seconds >= 0
        )
);

CREATE INDEX idx_evidence_attempt_id
    ON evidence(attempt_id);

CREATE INDEX idx_evidence_question_id
    ON evidence(question_id);

CREATE INDEX idx_evidence_concept_id
    ON evidence(concept_id);

CREATE INDEX idx_evidence_attempt_concept
    ON evidence(attempt_id, concept_id);

CREATE INDEX idx_evidence_concept_correct
    ON evidence(concept_id, is_correct);


-- ============================================================
-- DIAGNOSTIC & ROOT CAUSE
-- ============================================================

CREATE TABLE diagnostics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL,
    concept_id UUID NOT NULL,
    candidate_root_cause_id UUID,
    final_root_cause_id UUID,
    verification_result TEXT,
    diagnostic_status diagnostic_status NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verified_at TIMESTAMPTZ,

    CONSTRAINT fk_diagnostics_learner
        FOREIGN KEY (learner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_diagnostics_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_diagnostics_candidate_root
        FOREIGN KEY (candidate_root_cause_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_diagnostics_final_root
        FOREIGN KEY (final_root_cause_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX idx_diagnostics_learner_id
    ON diagnostics(learner_id);

CREATE INDEX idx_diagnostics_concept_id
    ON diagnostics(concept_id);

CREATE INDEX idx_diagnostics_candidate_root
    ON diagnostics(candidate_root_cause_id);

CREATE INDEX idx_diagnostics_final_root
    ON diagnostics(final_root_cause_id);

CREATE INDEX idx_diagnostics_status
    ON diagnostics(diagnostic_status);

CREATE INDEX idx_diagnostics_learner_concept
    ON diagnostics(learner_id, concept_id);


CREATE TABLE diagnostic_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    diagnostic_id UUID NOT NULL,
    verification_assessment_id UUID NOT NULL,
    result TEXT NOT NULL,
    evidence_score NUMERIC(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_diagnostic_verifications_diagnostic
        FOREIGN KEY (diagnostic_id)
        REFERENCES diagnostics(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_diagnostic_verifications_assessment
        FOREIGN KEY (verification_assessment_id)
        REFERENCES assessments(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_diagnostic_verification_score
        CHECK (
            evidence_score IS NULL
            OR (evidence_score >= 0 AND evidence_score <= 100)
        )
);

CREATE INDEX idx_diagnostic_verifications_diagnostic
    ON diagnostic_verifications(diagnostic_id);

CREATE INDEX idx_diagnostic_verifications_assessment
    ON diagnostic_verifications(verification_assessment_id);


-- ============================================================
-- LEARNING ACTION
-- ============================================================

CREATE TABLE learning_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL,
    concept_id UUID NOT NULL,
    diagnostic_id UUID,
    action_type action_type NOT NULL,
    reason TEXT NOT NULL,
    priority INTEGER NOT NULL,
    status action_status NOT NULL DEFAULT 'RECOMMENDED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,

    CONSTRAINT fk_learning_actions_learner
        FOREIGN KEY (learner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_learning_actions_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_learning_actions_diagnostic
        FOREIGN KEY (diagnostic_id)
        REFERENCES diagnostics(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_learning_actions_priority
        CHECK (priority >= 0)
);

CREATE INDEX idx_learning_actions_learner_id
    ON learning_actions(learner_id);

CREATE INDEX idx_learning_actions_concept_id
    ON learning_actions(concept_id);

CREATE INDEX idx_learning_actions_diagnostic_id
    ON learning_actions(diagnostic_id);

CREATE INDEX idx_learning_actions_status
    ON learning_actions(status);

CREATE INDEX idx_learning_actions_learner_status
    ON learning_actions(learner_id, status);


-- ============================================================
-- LEARNING EVENTS
-- ============================================================

CREATE TABLE learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL,
    event_type event_type NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    metadata JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_learning_events_learner
        FOREIGN KEY (learner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX idx_learning_events_learner_id
    ON learning_events(learner_id);

CREATE INDEX idx_learning_events_event_type
    ON learning_events(event_type);

CREATE INDEX idx_learning_events_occurred_at
    ON learning_events(occurred_at);

CREATE INDEX idx_learning_events_entity
    ON learning_events(entity_type, entity_id);

CREATE INDEX idx_learning_events_learner_occurred
    ON learning_events(learner_id, occurred_at);


-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    actor_type actor_type NOT NULL,
    action audit_action NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address TEXT,

    CONSTRAINT fk_audit_logs_actor
        FOREIGN KEY (actor_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

CREATE INDEX idx_audit_logs_actor_id
    ON audit_logs(actor_id);

CREATE INDEX idx_audit_logs_actor_type
    ON audit_logs(actor_type);

CREATE INDEX idx_audit_logs_action
    ON audit_logs(action);

CREATE INDEX idx_audit_logs_occurred_at
    ON audit_logs(occurred_at);

CREATE INDEX idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id);


-- ============================================================
-- ANALYTICS
-- ============================================================

CREATE TABLE learner_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id UUID NOT NULL,
    total_assessments INTEGER NOT NULL DEFAULT 0,
    completed_assessments INTEGER NOT NULL DEFAULT 0,
    average_mastery NUMERIC(5,2),
    mastered_concept_count INTEGER NOT NULL DEFAULT 0,
    active_gap_count INTEGER NOT NULL DEFAULT 0,
    completed_actions INTEGER NOT NULL DEFAULT 0,
    learning_time_minutes INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_learner_analytics_learner
        FOREIGN KEY (learner_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_learner_analytics_mastery
        CHECK (
            average_mastery IS NULL
            OR (average_mastery >= 0 AND average_mastery <= 100)
        ),

    CONSTRAINT chk_learner_analytics_total
        CHECK (total_assessments >= 0),

    CONSTRAINT chk_learner_analytics_completed
        CHECK (completed_assessments >= 0),

    CONSTRAINT chk_learner_analytics_mastered
        CHECK (mastered_concept_count >= 0),

    CONSTRAINT chk_learner_analytics_gap
        CHECK (active_gap_count >= 0),

    CONSTRAINT chk_learner_analytics_actions
        CHECK (completed_actions >= 0),

    CONSTRAINT chk_learner_analytics_time
        CHECK (learning_time_minutes >= 0)
);

CREATE INDEX idx_learner_analytics_learner_id
    ON learner_analytics(learner_id);

CREATE INDEX idx_learner_analytics_calculated_at
    ON learner_analytics(calculated_at);


CREATE TABLE concept_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concept_id UUID NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    average_mastery NUMERIC(5,2),
    gap_count INTEGER NOT NULL DEFAULT 0,
    diagnostic_count INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_concept_analytics_concept
        FOREIGN KEY (concept_id)
        REFERENCES concepts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_concept_analytics_attempt
        CHECK (attempt_count >= 0),

    CONSTRAINT chk_concept_analytics_error
        CHECK (error_count >= 0),

    CONSTRAINT chk_concept_analytics_mastery
        CHECK (
            average_mastery IS NULL
            OR (average_mastery >= 0 AND average_mastery <= 100)
        ),

    CONSTRAINT chk_concept_analytics_gap
        CHECK (gap_count >= 0),

    CONSTRAINT chk_concept_analytics_diagnostic
        CHECK (diagnostic_count >= 0)
);

CREATE INDEX idx_concept_analytics_concept_id
    ON concept_analytics(concept_id);

CREATE INDEX idx_concept_analytics_calculated_at
    ON concept_analytics(calculated_at);


CREATE TABLE learning_path_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id UUID NOT NULL,
    completed_topics INTEGER NOT NULL DEFAULT 0,
    total_topics INTEGER NOT NULL DEFAULT 0,
    completed_levels INTEGER NOT NULL DEFAULT 0,
    total_levels INTEGER NOT NULL DEFAULT 0,
    progress_percentage NUMERIC(5,2),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_learning_path_analytics_path
        FOREIGN KEY (learning_path_id)
        REFERENCES learning_paths(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_learning_path_analytics_topics
        CHECK (
            completed_topics >= 0
            AND total_topics >= 0
            AND completed_topics <= total_topics
        ),

    CONSTRAINT chk_learning_path_analytics_levels
        CHECK (
            completed_levels >= 0
            AND total_levels >= 0
            AND completed_levels <= total_levels
        ),

    CONSTRAINT chk_learning_path_analytics_progress
        CHECK (
            progress_percentage IS NULL
            OR (
                progress_percentage >= 0
                AND progress_percentage <= 100
            )
        )
);

CREATE INDEX idx_learning_path_analytics_path_id
    ON learning_path_analytics(learning_path_id);

CREATE INDEX idx_learning_path_analytics_calculated_at
    ON learning_path_analytics(calculated_at);


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_learner_profiles_updated_at
BEFORE UPDATE ON learner_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_admin_profiles_updated_at
BEFORE UPDATE ON admin_profiles
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_subjects_updated_at
BEFORE UPDATE ON subjects
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_levels_updated_at
BEFORE UPDATE ON levels
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_topics_updated_at
BEFORE UPDATE ON topics
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_materials_updated_at
BEFORE UPDATE ON materials
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_concepts_updated_at
BEFORE UPDATE ON concepts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_learning_paths_updated_at
BEFORE UPDATE ON learning_paths
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


CREATE TRIGGER trg_learner_concept_states_updated_at
BEFORE UPDATE ON learner_concept_states
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- END OF XORA DATABASE SCHEMA
-- ============================================================