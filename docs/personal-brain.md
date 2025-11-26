## Proposed Heuristics Expansions:

- [ ] Search Query Patterns: Track repeated search terms across sessions, suggest "search for [term]" when user visits search engines frequently.
- [ ] Form Submission Patterns: Detect common form data (e.g., login credentials, addresses) and suggest "fill form with [saved data]" for recurring sites.
- [ ] Navigation Sequences: Analyze click paths (e.g., "home → products → checkout") and suggest "continue workflow from [step]" when patterns repeat.
- [x] Time-Based Patterns: Suggest actions based on time of day (e.g., "check email" in morning, "read news" at lunch).
- [x] Clustering: Group similar behaviors using embedding similarity (e.g., cluster sites by content type: work, entertainment, shopping).
