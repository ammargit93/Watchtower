from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client.parser import text_string_to_metric_families
from tortoise.contrib.fastapi import register_tortoise
from models import User, Service, Metric
import httpx
import requests
import time
import asyncio


app = FastAPI()

register_tortoise(
    app,
    db_url="postgres://admin:admin@localhost:5432/mydb",
    modules={"models": ["models"]},
    generate_schemas=True,  
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],      
    allow_credentials=True,       
    allow_methods=["*"],         
    allow_headers=["*"],         
)

@app.websocket("/")
async def services(ws: WebSocket):
    await ws.accept()
    url = await ws.receive_text()
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        while True:
            try:
                resp = await client.get(url, timeout=5.0)
                metrics = resp.text
                parsed_metrics = []

                # Parse all Prometheus metrics
                for family in text_string_to_metric_families(metrics):
                    for sample in family.samples:
                        parsed_metrics.append({
                            "name": sample.name,
                            "labels": sample.labels,
                            "value": sample.value
                        })
                result = {
                    "requests": [],
                    "errors": [],
                    "other": []
                }

                for m in parsed_metrics:
                    name = m['name'].lower()
                    if "http_requests" in name and "total" in name:
                        result["requests"].append({
                            "endpoint": m['labels'].get('endpoint'),
                            "method": m['labels'].get('method'),
                            "value": m['value']
                        })
                    elif "http_errors" in name and "total" in name:
                        result["errors"].append({
                            "endpoint": m['labels'].get('endpoint'),
                            "value": m['value']
                        })
                    else:
                        result["other"].append({
                            "name": m['name'],
                            "labels": m['labels'],
                            "value": m['value']
                        })

                await ws.send_json({
                    "time": int(asyncio.get_event_loop().time()),
                    "metrics": result
                })

            except Exception as e:
                print("Error fetching metrics:", e)
                await ws.send_json({"error": str(e)})
            
            await asyncio.sleep(2)

@app.post('/signup')
async def signup(req: Request):
    data = await req.json()
    name = data['username']
    email = data['email']
    password = data['password']
    print(data)
    user = await User.create(name=name, email=email, password=password)
    await user.save()
    


@app.post("/login")
async def login(req: Request):
    data = await req.json()
    email = data['email']
    password = data['password']
    user = await User.filter(email=email).first()
    
    if not user or password != user.password:
        return {"error": "Invalid email or password"}

    return {"userid":user.id,"email": user.email, "username": user.name}


@app.post("/add-service")
async def addService(req: Request):
    data = await req.json()
    userid = data['userid']
    service_name = data['service_name']
    url = data['url']
    status = data['status']
    metrics = data['metrics']
    chartedservice = set(metrics)&set({"ACTIVE_USERS","MEMORY_USAGE"})
    
    url_map = {
        "localhost":"127.0.0.1"
    } 
    if url in url_map:
        url = url_map[url]
    user = await User.get(id=userid)
    service = await Service.create(service_name=service_name,url=url,status=status,user=user)
    await service.save()
    
    for metric in metrics:
        created_metric = await Metric.create(metric=metric, service=service)
        await created_metric.save()
    
    
    
@app.get("/get-services/{userid}")
async def getServices(userid: int):
    user = await User.get(id=userid)
    services = await Service.filter(user=user).values()    
    return {"services":services}