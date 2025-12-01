from fastapi import FastAPI
from prometheus_client import Counter, Gauge, Histogram, Summary, make_asgi_app
import psutil, time, random
from threading import Thread

app = FastAPI()

# --- Metrics ---
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP Requests", ["method","endpoint"])
ERROR_COUNT = Counter("http_errors_total", "Total HTTP Errors", ["endpoint"])
MEMORY_USAGE = Gauge("memory_usage_mb", "Memory usage in MB")
ACTIVE_USERS = Gauge("active_users", "Number of active users")
REQUEST_LATENCY = Histogram("request_latency_seconds", "Request latency in seconds", ["endpoint"])
RESPONSE_SIZE = Summary("response_size_bytes", "Response size in bytes", ["endpoint"])

# --- Update Gauge metrics in background ---
def update_metrics():
    while True:
        MEMORY_USAGE.set(psutil.Process().memory_info().rss / (1024*1024))
        ACTIVE_USERS.set(random.randint(30, 100))
        time.sleep(1)

Thread(target=update_metrics, daemon=True).start()

# --- Endpoints ---
@app.get("/health")
def health():
    REQUEST_COUNT.labels(method="GET", endpoint="/health").inc()
    return {"status": "ok"}

@app.get("/slow")
def slow():
    with REQUEST_LATENCY.labels(endpoint="/slow").time():
        delay = random.uniform(0.1, 2.0)
        time.sleep(delay)
    return {"delay": delay}

@app.get("/data")
def data():
    size = random.randint(1000, 5000)
    RESPONSE_SIZE.labels(endpoint="/data").observe(size)
    return {"size": size}

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)
