FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN apt-get update && apt-get install -y \
  ffmpeg \
  libopus-dev \
  libopus0 \
  && rm -rf /var/lib/apt/lists/*

COPY agent.py .
COPY scripts ./scripts

CMD ["python", "agent.py", "start"]

