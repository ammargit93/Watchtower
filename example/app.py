from fastapi import FastAPI
from prometheus_client import Counter, Gauge, Histogram, Summary, make_asgi_app
import psutil, time, random, math
from threading import Thread

app = FastAPI()

# --- Metrics ---
REQUEST_COUNT = Counter("http_requests_total", "Total HTTP Requests", ["method","endpoint"])
ERROR_COUNT = Counter("http_errors_total", "Total HTTP Errors", ["endpoint"])
MEMORY_USAGE = Gauge("memory_usage_mb", "Memory usage in MB")
ACTIVE_USERS = Gauge("active_users", "Number of active users")
REQUEST_LATENCY = Histogram("request_latency_seconds", "Request latency in seconds", ["endpoint"])
RESPONSE_SIZE = Summary("response_size_bytes", "Response size in bytes", ["endpoint"])

# --- Background metric updates ---
def update_metrics():
    t = 0
    while True:
        # Memory usage fluctuates like a small load increase
        MEMORY_USAGE.set(psutil.Process().memory_info().rss / (1024*1024) + random.uniform(0, 50))
        
        # Active users fluctuate like a sine wave + noise
        active_users = int(50 + 30 * math.sin(t/5) + random.randint(-5, 5))
        ACTIVE_USERS.set(max(active_users, 0))
        
        t += 1
        time.sleep(1)

Thread(target=update_metrics, daemon=True).start()

# --- Simulate HTTP requests ---
@app.get("/health")
def health():
    REQUEST_COUNT.labels(method="GET", endpoint="/health").inc()
    # Random chance of error
    if random.random() < 0.02:
        ERROR_COUNT.labels(endpoint="/health").inc()
        return {"status": "error"}, 500
    return {"status": "ok"}

@app.get("/slow")
def slow():
    REQUEST_COUNT.labels(method="GET", endpoint="/slow").inc()
    delay = random.uniform(0.1, 3.0)
    with REQUEST_LATENCY.labels(endpoint="/slow").time():
        time.sleep(delay)
    return {"delay": delay}

@app.get("/data")
def data():
    REQUEST_COUNT.labels(method="GET", endpoint="/data").inc()
    size = random.randint(1000, 10000)
    RESPONSE_SIZE.labels(endpoint="/data").observe(size)
    return {"size": size}

# --- Prometheus metrics endpoint ---
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# --- Extra: simulate requests in background ---
def simulate_requests():
    endpoints = ["/health", "/slow", "/data"]
    while True:
        endpoint = random.choice(endpoints)
        REQUEST_COUNT.labels(method="GET", endpoint=endpoint).inc()
        if random.random() < 0.05:
            ERROR_COUNT.labels(endpoint=endpoint).inc()
        time.sleep(random.uniform(0.1, 0.5))

Thread(target=simulate_requests, daemon=True).start()
