# Security Policy

## Supported Versions

Security updates are handled on the latest `main` branch.

## Reporting A Vulnerability

Please do not open a public GitHub issue for security vulnerabilities.

Report privately through one of these channels:

- GitHub: <https://github.com/joeseesun>
- X: <https://x.com/vista8>
- Website: <https://qiaomu.ai>

Please include:

- affected version or commit;
- deployment mode;
- clear reproduction steps;
- expected and actual impact;
- whether any personal data, prize code, admin session, or server file is exposed.

## Deployment Security Notes

- Set a strong `LUCKY_ADMIN_PASSWORD`.
- Set a random `LUCKY_SESSION_SECRET`.
- Keep `.env`, `data/`, and logs outside the public web root.
- Put the Node service behind HTTPS.
- Back up `data/lottery-data.json` before large events.
- Treat phone numbers and prize codes as sensitive operational data.
