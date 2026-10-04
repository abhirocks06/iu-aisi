# AISI Website

Multi-page site for the **AI Safety Initiative (AISI) @ IU**.

## Stack

- React + Vite
- React Router
- Tailwind CSS v4

## Develop

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Hero data (`src/data/wire.json`)

The home-page graph is built from goveronica.com's
[Misalignment Map](https://goveronica.com/misalignment-map.html) and
[What are states doing about AI risk?](https://goveronica.com/ai-risk-states.html):
the 10 newest incidents and the 10 newest quotes.

```bash
npm run update-wire                    # fetch and rewrite wire.json
node scripts/update-wire.mjs --dry-run # show what would change
```

The `Update AI safety news data` GitHub Action runs this every Monday and
commits the file when it changes. The script refuses to write if the source
looks incomplete. Short labels on the graph (`handle`) come from the `HANDLES`
map at the top of the script; add an entry there to label a new node by hand.
