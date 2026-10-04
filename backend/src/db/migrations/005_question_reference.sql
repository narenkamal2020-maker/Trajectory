-- Reference solutions (admin-only; never returned by learner endpoints)
ALTER TABLE QUESTIONS ADD (
    REFERENCE_LANG VARCHAR2(20),
    REFERENCE_CODE CLOB
)
