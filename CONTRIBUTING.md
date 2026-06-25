# Contributing

Thanks for helping improve Qiaomu Lucky.

## Good First Contributions

- Fix deployment documentation.
- Improve empty/error states.
- Add focused tests or smoke scripts.
- Improve accessibility in admin dialogs and forms.
- Report reproducible bugs with screenshots or API responses.

## Development

```bash
npm ci
cp .env.example .env
npm run server
```

In another terminal:

```bash
npm run dev
```

Before opening a pull request:

```bash
npm run check
```

## Pull Request Expectations

- Keep changes focused.
- Do not commit `.env`, `data/`, `dist/`, logs, or runtime secrets.
- Include screenshots for visible UI changes.
- Mention how you verified the change.
- Update README or docs when behavior, deployment, or configuration changes.

## Product Boundaries

This project is for self-hosted campaign lotteries and prize-code distribution. Please do not add gambling, betting, payment, odds manipulation, or regulated lottery features.
