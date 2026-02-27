bind = "0.0.0.0:8000"
workers = 2
worker_class = "uvicorn.workers.UvicornWorker"
timeout = 60
keepalive = 5
graceful_timeout = 30
accesslog = "-"
errorlog = "-"
