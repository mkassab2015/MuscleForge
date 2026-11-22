# MuscleForge Photo AI — optional private backend
The iPhone camera and meal diary work without this backend, but image *analysis* requires a private AI service. Do **not** put an OpenAI API key in GitHub Pages or in the mobile app.

## Setup on Cloudflare
1. Create a Cloudflare account, open **Workers & Pages**, then **Create Worker**.
2. Paste the contents of `worker/meal-ai-worker.js` into the Worker code and deploy it.
3. Under Worker **Settings > Variables and Secrets**, add two **encrypted secrets**:
   - `OPENAI_API_KEY`: your OpenAI API key with billing and spending limits enabled.
   - `MUSCLEFORGE_TOKEN`: a long random private access token you choose.
4. Add the ordinary variable `CORS_ORIGIN` = `https://mkassab2015.github.io`.
5. Copy the Worker HTTPS URL.
6. In the MuscleForge iPhone app open **Profile > Photo nutrition AI connection**. Enter the Worker URL and the private token (not the OpenAI API key).
7. Under **Eat**, take a food photo and select **Estimate nutrition from photo**. Review and edit the estimates, then tap **Save this meal**.

### Important
- Your photo is transferred to your Worker and the AI provider when you tap Analyze.
- The numbers are estimates, especially for oils, hidden ingredients, portion weights, and restaurant dishes. They are not guaranteed accurate.
- A shared/private token in a local phone app is not the same as robust user authentication, so keep it private, rotate it if compromised and set spending limits. For wider distribution add proper login and rate limiting.
- The daily meal diary is stored on your device, with the app's JSON export backup.
- This endpoint is not deployed automatically as part of GitHub Pages; it requires separate Cloudflare setup.
