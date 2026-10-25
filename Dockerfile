FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DATA_DIR=/data HOST=0.0.0.0 PORT=8080 APP_TIMEZONE=Asia/Shanghai
WORKDIR /app
COPY course.py store.py server.py data_lock.py ./
COPY static ./static
COPY scripts ./scripts
RUN apt-get update && apt-get install -y --no-install-recommends tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /data && chown 1000:1000 /data
USER 1000:1000
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/api/health',timeout=3)" || exit 1
CMD ["python", "server.py"]
