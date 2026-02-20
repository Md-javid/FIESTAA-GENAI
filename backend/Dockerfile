# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — MediCode AI Django Backend
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.11-slim

# System deps
RUN apt-get update && apt-get install -y \
  build-essential \
  libpq-dev \
  curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project (exclude node_modules, .env via .dockerignore)
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

EXPOSE 8000

# Use gunicorn in production
CMD ["gunicorn", "medicode_backend.wsgi:application", \
  "--bind", "0.0.0.0:8000", \
  "--workers", "4", \
  "--timeout", "120", \
  "--access-logfile", "-", \
  "--error-logfile", "-"]
