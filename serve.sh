#!/usr/bin/env bash
# FID 사이트 정적 서버 keepalive — 5199 포트가 죽어있으면 백그라운드 기동 (cron 1분마다 호출)
set -u
SITE_DIR="/home/jjh0709/FID"
PORT=5199
LOG="/home/jjh0709/fid-server.log"
cd "$SITE_DIR" || exit 1
if ss -ltn 2>/dev/null | grep -qE "[:.]${PORT}[[:space:]]"; then exit 0; fi
echo "[$(date '+%F %T')] starting http.server on ${PORT} from $SITE_DIR" >> "$LOG"
setsid nohup python3 -m http.server "$PORT" --bind 0.0.0.0 >> "$LOG" 2>&1 < /dev/null &
exit 0
