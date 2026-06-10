# Kapita Waitlist Landing

Standalone waitlist page for separate deployment.

## Files
- `index.html`: Main landing page markup
- `styles.css`: Theme and layout styles aligned with Kapita landing design
- `script.js`: Waitlist form behavior and submission handling

## Local run
You can serve this folder with any static server.

Example:
```bash
cd frontend_waitlist
python -m http.server 4173
```
Then open `http://localhost:4173`.

## Submission behavior
By default, submissions are saved to browser `localStorage` under `kapita_waitlist_entries`.

To send to an API endpoint, set this global before `script.js` loads:
```html
<script>
  window.WAITLIST_ENDPOINT = 'https://your-domain.com/api/waitlist';
</script>
```

Expected request payload:
```json
{
  "fullName": "...",
  "email": "...",
  "businessName": "...",
  "businessType": "...",
  "teamSize": "...",
  "notes": "...",
  "consent": true,
  "createdAt": "ISO_TIMESTAMP"
}
```
