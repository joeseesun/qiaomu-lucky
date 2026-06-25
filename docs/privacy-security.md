# Privacy And Security Notes

Qiaomu Lucky is intentionally small, but it still handles operationally sensitive data.

## Data Stored By Default

`data/lottery-data.json` stores:

- activities;
- prize types;
- prize codes;
- winner phone numbers;
- draw records;
- per-phone and per-IP restriction state.

`data/runtime-secrets.json` stores:

- the current admin password after a password reset;
- the current session signing secret after a password reset.

## What Is Not Included By Default

- No external database.
- No email or SMS sending.
- No payment flow.
- No built-in identity provider.
- No hosted Qiaomu backend dependency.
- No analytics unless `VITE_UMAMI_*` variables are configured at build time.

## Operator Responsibilities

- Publish clear campaign rules and prize redemption rules.
- Explain why phone numbers are collected and how long records are retained.
- Use HTTPS for public deployments.
- Keep `.env`, `data/`, and logs private.
- Rotate admin credentials if a server or `.env` file may have been exposed.
- Back up `data/` before important events.

## Not For Regulated Lottery Or Gambling

This project is for ordinary campaign draws and prize-code distribution. It is not designed for gambling, betting, regulated lottery sales, financial rewards, or legal compliance workflows.
