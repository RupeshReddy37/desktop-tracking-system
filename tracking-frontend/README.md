# tracking-frontend

React + Vite frontend for the `tracking-server` backend.

## Run

```powershell
cd "C:\Users\lomad\OneDrive\Desktop\desktop application\tracking-frontend"
npm install
npm run dev
```

The app expects the server at `http://localhost:8081` and proxies `/api` requests there during development.

## Backend routes wired in the UI

- `POST /api/v1/employees`
- `POST /api/v1/devices/register`
- `POST /api/v1/sync`
- `GET /api/v1/dashboard/home`
- `GET /api/v1/dashboard/employees/{employeeId}/profile`
- `GET /api/v1/reports/daily-app-usage`
- `GET /api/v1/reports/anomalies`
- `GET /api/v1/reports/employees/{employeeId}/anomalies`
