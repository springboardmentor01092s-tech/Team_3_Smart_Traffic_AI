# WHERE TO PUT THESE FILES — read this first

This zip mirrors your actual repo's folder structure. Everything under
`Backend/` here should be copied into your local clone of
`Team_3_Smart_Traffic_AI/Backend/` — matching folder for folder, file for file.

## Step-by-step

### 1. Copy the files into your repo

From this zip's `Backend/` folder, copy everything into your local
`Team_3_Smart_Traffic_AI/Backend/` folder, **overwriting** any files with the
same name (your old `models.py`, `reports.py`, `routes.py` get replaced —
that's expected, this zip's versions supersede them).

Files being added/replaced:
```
Backend/
├── requirements.txt          
├── .gitignore                 
└── app/
    ├── database.py             
    ├── models.py                
    ├── schemas.py                
    ├── auth_handler.py            
    ├── dependencies.py             
    ├── main.py                      
    ├── ml/                            
    └── routers/
        ├── auth.py                    
        ├── traffic.py                  
        ├── prediction.py               
        ├── reports.py                    
        └── routes.py                      
```

### 2. Add your trained model file

Copy your downloaded `congestion_model.pkl` (from the Colab training session)
into:
```
Backend/app/ml/congestion_model.pkl
```
**If you skip this:** the app still starts up fine — you'll just see a
warning in the terminal, and `/prediction/predict` will return a 503 error
until the file is added. Everything else (traffic, reports, routes, auth)
works regardless.

### 3. Install dependencies and run it locally — TEST BEFORE PUSHING

```bash
cd Backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Open `http://localhost:8000/docs` — you should see 5 sections: Auth, Traffic,
Prediction, Reports, Routes. Test each one for real (register → login →
Authorize with the token → try each endpoint) before pushing anything.



Then go to GitHub and open a **Pull Request** from
`traffic-prediction-backend` → `testing`, so your mentor/team can see the
diff clearly — that PR is your proof of contribution for Milestone 2.

## What each endpoint does (for your demo tomorrow)

| Endpoint | What it does |
|---|---|
| `POST /auth/register`, `POST /auth/login` | Existing auth (unchanged) |
| `POST /traffic/ingest` | Add a traffic reading for a road |
| `GET /traffic/live` | Latest reading per road |
| `GET /traffic/history/{road_name}` | Last 50 readings for one road |
| `POST /prediction/predict` | Real ML model prediction (Low/Medium/High + confidence) |
| `GET /reports/traffic-summary?days=7` | Per-road summary: readings, avg speed, high-congestion count |
| `GET /reports/export-csv?days=7` | Downloads a CSV of raw readings |
| `GET /routes/recommend?origin=X&destination=Y` | Recommends the less congested of 2 known roads |

## Known limitation, be upfront about it if asked

`ROUTE_OPTIONS` in `routes.py` only knows 2 hardcoded origin/destination
pairs (Connaught Place→Noida, Connaught Place→Gurgaon). It's a starting
point, not a full routing engine — say so plainly rather than implying it
works for any two places.
