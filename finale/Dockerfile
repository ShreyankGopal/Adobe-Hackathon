# ---------- Stage 1: Frontend build ----------
    FROM node:18 AS frontend
    WORKDIR /frontend
    
    # Install dependencies first (cached)
    COPY package.json package-lock.json ./
    RUN npm ci --legacy-peer-deps
    
    # Copy frontend sources
    COPY src ./src
    COPY index.html ./
    COPY vite.config.* ./
    COPY tailwind.config.* ./
    COPY postcss.config.js ./
    COPY tsconfig*.json ./
    
    # Build frontend
    ARG ADOBE_EMBED_API_KEY
    ENV VITE_ADOBE_CLIENT_ID=${ADOBE_EMBED_API_KEY}
    RUN npm install
    RUN npm run build
    
    # ---------- Stage 2: Backend + Supervisor ----------
    FROM python:3.10-slim
    
    WORKDIR /app
    
    # Install system dependencies
    RUN apt-get update && apt-get install -y --no-install-recommends \
        supervisor ffmpeg libgl1 libglib2.0-0 build-essential curl \
     && rm -rf /var/lib/apt/lists/*
    
    # Backend requirements
    COPY backend/requirements.txt /tmp/requirements.txt
    # RUN pip install --no-cache-dir -r /tmp/requirements.txt && \
    #     python -m nltk.downloader punkt wordnet punkt_tab

    RUN pip install --no-cache-dir -r /tmp/requirements.txt

# Create NLTK data directory and download data
#     RUN mkdir -p /root/nltk_data && \
#     python -c "import nltk; nltk.download('punkt', download_dir='/root/nltk_data')" && \
#     python -c "import nltk; nltk.download('wordnet', download_dir='/root/nltk_data')" && \
#     python -c "import nltk; nltk.download('punkt_tab', download_dir='/root/nltk_data')"

# # Set NLTK data path
#     ENV NLTK_DATA=/root/nltk_data

    
    # Copy backend code
    COPY backend/ /app/
    
    # Copy built frontend into /frontend/dist
    COPY --from=frontend /frontend/dist /app/static
    
    # Install vite globally for preview
   
    
    # Supervisor config
    COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
    
    # Expose frontend (8080) and backend (5001)
    EXPOSE 8080 5001
    
    CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]