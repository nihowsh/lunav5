# Photo site

Basic photo editor + online gallery. Photos are stored on the server, per account, so users don't depend on phone storage.

Run: `node server.js` then open http://localhost:3000 (no dependencies; Node 18+).

- Create an account / log in
- Upload photos straight to the gallery, or open one in the editor (brightness, contrast, saturation, grayscale, blur, rotate, flip) and save it
- Download or delete photos from the gallery

Data lives in `./data` (override with `DATA_DIR`). When deploying, put it on a persistent disk and serve over HTTPS.
Basics only: no password reset, rate limiting or storage quotas.
