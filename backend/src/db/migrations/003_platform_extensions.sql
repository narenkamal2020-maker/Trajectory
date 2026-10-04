-- =============================================================================
-- TRAJECTORY — Platform extensions v1.0
-- Executable questions, refresh tokens, interview plans, ML training events,
-- offline-sync idempotency.
-- =============================================================================

-- Executable question metadata
ALTER TABLE QUESTIONS ADD (
    QUESTION_TYPE  VARCHAR2(10)  DEFAULT 'CODE' NOT NULL,
    FUNCTION_NAME  VARCHAR2(100),
    STARTER_CODE   CLOB,
    HARNESS_META   CLOB,
    CONSTRAINT CHK_Q_TYPE CHECK (QUESTION_TYPE IN ('CODE','SQL'))
);

-- Skills captured during onboarding
ALTER TABLE PROFILES ADD (SKILLS_JSON CLOB);

-- Interview plan + progress
ALTER TABLE INTERVIEWS ADD (
    PLAN_JSON      CLOB,
    QUESTION_INDEX NUMBER(4) DEFAULT 0 NOT NULL,
    SUMMARY_JSON   CLOB
);

-- Offline-sync idempotency: the client generates an id per submission.
-- Function-based so rows without a client id (online submissions) are not indexed.
ALTER TABLE SUBMISSIONS ADD (CLIENT_SUBMISSION_ID VARCHAR2(64));
CREATE UNIQUE INDEX UQ_SUB_CLIENT_ID ON SUBMISSIONS(
    CASE WHEN CLIENT_SUBMISSION_ID IS NOT NULL THEN USER_ID END,
    CASE WHEN CLIENT_SUBMISSION_ID IS NOT NULL THEN CLIENT_SUBMISSION_ID END);

-- -----------------------------------------------------------------------------
-- REFRESH_TOKENS (rotation + revocation; only a hash is stored)
-- -----------------------------------------------------------------------------
CREATE TABLE REFRESH_TOKENS (
    TOKEN_ID     VARCHAR2(36)  PRIMARY KEY,
    USER_ID      VARCHAR2(36)  NOT NULL,
    TOKEN_HASH   VARCHAR2(128) NOT NULL,
    EXPIRES_AT   TIMESTAMP     NOT NULL,
    REVOKED      NUMBER(1)     DEFAULT 0 NOT NULL CHECK (REVOKED IN (0,1)),
    CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT FK_RT_USER FOREIGN KEY (USER_ID)
        REFERENCES TRAJECTORY_USERS(USER_ID) ON DELETE CASCADE
);
CREATE INDEX IDX_RT_HASH ON REFRESH_TOKENS(TOKEN_HASH);

-- -----------------------------------------------------------------------------
-- ML_EVENTS (training data: one row per learning event with features + label)
-- -----------------------------------------------------------------------------
CREATE TABLE ML_EVENTS (
    EVENT_ID     VARCHAR2(36)  PRIMARY KEY,
    USER_ID      VARCHAR2(36)  NOT NULL,
    EVENT_TYPE   VARCHAR2(30)  NOT NULL,
    ENTITY_ID    VARCHAR2(36),
    FEATURES     CLOB          NOT NULL,
    LABEL        NUMBER(8,4),
    CREATED_AT   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT FK_MLE_USER FOREIGN KEY (USER_ID)
        REFERENCES TRAJECTORY_USERS(USER_ID) ON DELETE CASCADE,
    CONSTRAINT CHK_MLE_TYPE CHECK (EVENT_TYPE IN ('SUBMISSION','INTERVIEW_ANSWER','RESUME','RECOMMENDATION_CLICK'))
);
CREATE INDEX IDX_MLE_TYPE_DATE ON ML_EVENTS(EVENT_TYPE, CREATED_AT)
