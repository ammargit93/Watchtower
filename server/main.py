from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client.parser import text_string_to_metric_families
import httpx
import requests
import time
import asyncio


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],      
    allow_credentials=True,       
    allow_methods=["*"],         
    allow_headers=["*"],         
)



all_metrics = []

from fastapi import FastAPI, WebSocket
from prometheus_client.parser import text_string_to_metric_families
import httpx
import asyncio

app = FastAPI()

all_metrics = []

@app.websocket("/")
async def services(ws: WebSocket):
    await ws.accept()
    url = await ws.receive_text()
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        while True:
            try:
                resp = await client.get(url, timeout=5.0)
                metrics = resp.text
                active_users = None

                for family in text_string_to_metric_families(metrics):
                    for sample in family.samples:
                        if sample.name == "active_users":
                            active_users = sample.value

                if active_users is not None:
                    await ws.send_json({"time": int(asyncio.get_event_loop().time()), "activeUsers": active_users})

            except Exception as e:
                print("Error fetching metrics:", e)
                await ws.send_json({"error": str(e)})
            
            await asyncio.sleep(2)
