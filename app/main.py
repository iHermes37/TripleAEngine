import uvicorn
from fastapi import FastAPI

from app.router import analytics, insights
app=FastAPI()
@app.get("/")
async def root(): #test api
    return {"message": "API is running"}


app.include_router(insights.router,prefix="/insights")
# app.include_router(analytics.router, prefix="/analytics")



if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)