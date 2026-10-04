-- =============================================================================
-- TRAJECTORY — Admin role + authored-content metadata
-- =============================================================================
ALTER TABLE TRAJECTORY_USERS ADD (
    USER_ROLE VARCHAR2(10) DEFAULT 'USER' NOT NULL,
    CONSTRAINT CHK_USER_ROLE CHECK (USER_ROLE IN ('USER','ADMIN'))
);

-- Who authored / last edited a question (NULL = shipped question bank)
ALTER TABLE QUESTIONS ADD (
    CREATED_BY  VARCHAR2(36),
    UPDATED_AT  TIMESTAMP
);

ALTER TABLE SKILL_CATEGORIES ADD (CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP);
