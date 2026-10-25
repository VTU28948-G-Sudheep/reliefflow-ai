# ✅ ReliefFlow AI — Quick Setup After Download

## Step 1 — Install Python packages (do this ONCE)
Open Command Prompt in the `backend` folder and run:
```
pip install -r requirements.txt
```

## Step 2 — Install Node.js packages (do this ONCE)
Download and install Node.js from https://nodejs.org (LTS version).

Then open Command Prompt in the `frontend` folder and run:
```
npm install
```

## Step 3 — Run the App

### Terminal 1 (Backend):
```
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Terminal 2 (Frontend):
```
cd frontend
npm run dev
```

## Step 4 — Open Browser
Go to: http://localhost:3000

---
That's it! Both terminals must stay open while you use the app.
