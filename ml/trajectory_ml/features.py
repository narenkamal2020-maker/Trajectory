"""Shared feature definitions. Order must match backend/src/ml/client.ts (SolveFeatures)."""

SOLVE_FEATURES = [
    "proficiency",                 # weighted avg proficiency over the question's skills (0-100)
    "min_proficiency",             # weakest linked skill (0-100)
    "difficulty",                  # 0 easy, 1 medium, 2 hard
    "attempts_on_skill",           # total attempts across linked skills
    "prior_attempts_on_question",  # how many times the user tried this question before
    "solve_rate",                  # global solve rate of the question (0-1)
    "days_since_practice",         # days since any linked skill was practiced
]

# Keyword profiles per role, used to synthesize labelled resume text for the role classifier.
# Titles must match JOB_ROLES.TITLE in the database.
ROLE_KEYWORDS = {
    "Software Engineer": ["data structures", "algorithms", "java", "python", "c++", "system design", "oop", "design patterns",
                          "rest api", "sql", "git", "unit testing", "microservices", "leetcode", "distributed systems"],
    "Frontend Developer": ["javascript", "typescript", "react", "next.js", "redux", "css", "html", "tailwind", "accessibility",
                           "webpack", "vite", "figma", "responsive design", "web performance", "jest"],
    "Backend Developer": ["node.js", "express", "java", "spring boot", "postgresql", "mysql", "redis", "kafka", "rest api",
                          "graphql", "microservices", "docker", "query optimization", "indexing", "caching"],
    "Full Stack Developer": ["react", "node.js", "typescript", "express", "mongodb", "postgresql", "rest api", "next.js",
                             "docker", "aws", "graphql", "tailwind", "authentication", "jwt", "full stack"],
    "Data Analyst": ["sql", "excel", "tableau", "power bi", "pandas", "statistics", "dashboards", "a/b testing", "reporting",
                     "data visualization", "window functions", "kpi", "stakeholders", "data cleaning", "looker"],
    "Data Scientist": ["python", "machine learning", "statistics", "scikit-learn", "pandas", "numpy", "regression",
                       "classification", "hypothesis testing", "jupyter", "feature engineering", "xgboost", "nlp", "r", "experimentation"],
    "ML Engineer": ["pytorch", "tensorflow", "deep learning", "mlops", "model deployment", "kubernetes", "docker", "python",
                    "feature store", "airflow", "transformers", "gpu", "model serving", "spark", "llm"],
    "DevOps Engineer": ["kubernetes", "docker", "terraform", "aws", "gcp", "azure", "ci/cd", "jenkins", "github actions",
                        "linux", "bash", "prometheus", "grafana", "networking", "ansible"],
    "Software Engineering Intern": ["coursework", "data structures", "java", "python", "c", "projects", "hackathon",
                                    "git", "gpa", "teaching assistant", "algorithms", "web development", "club", "university", "internship"],
}

FILLER = ["team", "project", "built", "led", "improved", "worked", "collaborated", "delivered", "users", "performance",
          "designed", "implemented", "company", "experience", "responsible", "developed", "reduced", "increased", "feature"]
