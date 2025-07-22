
from fastapi import FastAPI, Depends
from utils.security import verify_api_key
from routers import kickcount  # We'll add more routers as needed
from routers import mentalhealth
from routers import nutritionist
from routers import useronboarding

app = FastAPI(title="TummyTales DB Agent API", dependencies=[Depends(verify_api_key)])

# Include agent-specific routers
app.include_router(useronboarding.router)
app.include_router(kickcount.router)
app.include_router(mentalhealth.router)
app.include_router(nutritionist.router)

@app.get("/")
def root():
    return {"message": "Welcome to the TummyTales DB Access Gateway"}