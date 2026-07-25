# Workflow: Generate Mock API
1. Analyze the requested feature or component properties.
2. Generate a local JSON file populated with 10-20 highly realistic sample records (no "test1", "test2"; use realistic names, dates, and values).
3. If needed, spin up a quick, zero-config mock server (e.g., json-server or a simple Express script) or local utility to fetch this data.
4. Verify the frontend can access and successfully render this data.
