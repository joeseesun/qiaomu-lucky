# Deployment Guide

Qiaomu Lucky is designed for a small VPS or private server.

Recommended topology:

```text
Browser -> HTTPS reverse proxy -> Node.js on 127.0.0.1:3158
```

## Build

```bash
npm ci
cp .env.example .env
npm run build
npm start
```

Required `.env` values:

```bash
LUCKY_ADMIN_PASSWORD=replace-with-a-strong-password
LUCKY_SESSION_SECRET=replace-with-a-random-secret-at-least-32-chars
LUCKY_PUBLIC_BASE_URL=https://your-domain.example
```

Generate a random secret:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

## Data Files

Default runtime files:

```text
data/lottery-data.json
data/runtime-secrets.json
```

Back up `data/` before important events. Do not expose this directory through Nginx, Caddy, Apache, object storage, or static hosting.

## systemd Example

See [docs/deploy/qiaomu-lucky.service.example](deploy/qiaomu-lucky.service.example).

Install outline:

```bash
sudo mkdir -p /opt/qiaomu-lucky
sudo rsync -a --delete ./ /opt/qiaomu-lucky/
sudo useradd --system --home /opt/qiaomu-lucky --shell /usr/sbin/nologin qiaomu-lucky || true
sudo chown -R qiaomu-lucky:qiaomu-lucky /opt/qiaomu-lucky/data
sudo cp docs/deploy/qiaomu-lucky.service.example /etc/systemd/system/qiaomu-lucky.service
sudo systemctl daemon-reload
sudo systemctl enable --now qiaomu-lucky
```

## Nginx Example

See [docs/deploy/nginx.conf.example](deploy/nginx.conf.example).

The important part is to proxy all requests to the private Node service and forward the original protocol:

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Password Reset Link

From the server itself:

```bash
curl -sS -X POST http://127.0.0.1:3158/api/local/password-reset-link
```

This endpoint only accepts loopback requests that did not come through a proxy. Public requests should return `403`.

Logged-in admins can also generate a reset link from the admin API.

## Health Check

```bash
curl -sS http://127.0.0.1:3158/api/health
```

Expected shape:

```json
{"ok":true,"activities":1,"codes":3,"records":0}
```
