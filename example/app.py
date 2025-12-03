from fastapi import FastAPI, Request
from prometheus_client import Counter, Gauge, Histogram, Summary, make_asgi_app
import psutil
import time

app = FastAPI()

# --- Metrics ---
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP Requests", ["method", "endpoint"])
ERROR_COUNT = Counter("http_errors_total", "Total HTTP Errors", ["endpoint"])
REQUEST_LATENCY = Histogram("request_latency_seconds", "Request latency", ["endpoint"])
RESPONSE_SIZE = Summary("response_size_bytes", "Response size in bytes", ["endpoint"])

MEMORY_USAGE = Gauge("memory_usage_mb", "Current memory usage in MB")
ACTIVE_USERS = Gauge("active_users", "How many requests are currently in progress")

process = psutil.Process()  # For real memory usage

connected_clients = set()
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    client_ip = request.client.host
    connected_clients.add(client_ip)
    ACTIVE_USERS.set(len(connected_clients))
    try:
        response = await call_next(request)
        return response
    finally:
        connected_clients.discard(client_ip)
        ACTIVE_USERS.set(len(connected_clients))



# --- Routes (real requests only, no simulation) ---
@app.get("/health")
def health():
    # time.sleep(5)
    return {"status": "ok"}


@app.get("/slow")
def slow():
    time.sleep(2)  # slow route to test latency + active user increase
    return {"delay": 2}


@app.get("/data")
def data():
    payload = "x" * 5000
    RESPONSE_SIZE.labels(endpoint="/data").observe(len(payload))
    return {"size": len(payload)}


# --- Prometheus metrics endpoint ---
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
