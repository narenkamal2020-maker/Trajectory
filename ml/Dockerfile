FROM python:3.12-slim
WORKDIR /ml
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY trajectory_ml ./trajectory_ml
COPY train.py serve.py ./
# Mount exported data at /ml/data to include real events; otherwise the synthetic bootstrap is used.
RUN mkdir -p data models && python train.py > /dev/null
ENV ML_HOST=0.0.0.0 ML_PORT=8000
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s CMD python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/health',timeout=3)"
CMD ["python", "serve.py"]
