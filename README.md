# InterActiu — MVP

Projecte complet (client + server) per a una aplicació de presentacions interactives en temps real.

## Estructura
```
interactiu-mvp/
├── client/
└── server/
```

## Instruccions locals
1. Backend:
   ```
   cd server
   npm install
   npm start
   ```
2. Frontend:
   ```
   cd client
   npm install
   npm run dev
   ```
- Frontend (Vite): http://localhost:5173
- Backend (Express + Socket.IO): http://localhost:4000

## Notes
- Aquest MVP utilitza dades en memòria. Per producció cal persistència (Redis / DB).
- Crea la sessió de prova `ABC123` al servidor.
