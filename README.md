# German Astro Site

Astro + React based German learning site with interactive practice tools for noun articles, verb-preposition pairs, and irregular verbs.

## Tech Stack

- Astro 6
- React 19
- Tailwind CSS 4 through `@tailwindcss/vite`
- Firebase client SDK for optional cloud sync
- Browser `speechSynthesis` for German audio
- `localStorage` for local-first progress

## Project Structure

```text
src/
  components/
    LessonShell.astro              Shared lesson page shell
    VerbWithPreposition.jsx        Lektion 2 trainer
    IrregularVerbTrainer.jsx       Lektion 3 trainer
    NounChallengeApp.jsx           Standalone noun trainer component, currently not routed
    Welcome.astro                  Astro starter component, currently not routed
  data/
    verb-prepositions.ts           Lektion 2 data
    irregular-verbs.ts             Lektion 3 data
  layouts/
    Layout.astro                   Base document layout
  pages/
    index.astro                    Course index
    lesson1-wort.astro             Lektion 1 iframe wrapper
    lesson2-VerbWithPreposition.astro
    lesson3-irregular-verbs.astro
  styles/
    global.css
public/
  lesson1-platform.html            Legacy standalone Lektion 1 app
tools/
  add-verb-types.mjs               Data maintenance helper
```

## Development

```sh
npm install
npm run dev
npm run build
npm run preview
```

The dev server usually runs at `http://localhost:4321/`.

## Adding A Lesson

Create a new `.astro` file in `src/pages` and export `frontmatter`:

```js
export const frontmatter = {
  title: "Lektion 4: ...",
  description: "...",
  category: "德語文法特訓",
  tags: ["A2", "練習"],
  order: 4,
  level: "A2-B1",
  estimatedMinutes: 15
};
```

The homepage discovers lesson pages automatically through `import.meta.glob` and sorts by `frontmatter.order`.

## Progress Storage

- Lektion 1 stores `deutschLernkartenDB_vPro` and `deutschLernkartenStats`.
- Lektion 2 stores `verb-preposition-trainer-v1`.
- Lektion 3 stores `irregular-verbs-trainer-v3`.

Firebase sync is optional and depends on the runtime globals used by the current app environment. Local progress remains available without Firebase.

## Optional Firebase Login

Set these public environment variables to enable Google and email/password login:

```sh
PUBLIC_FIREBASE_API_KEY=
PUBLIC_FIREBASE_AUTH_DOMAIN=
PUBLIC_FIREBASE_PROJECT_ID=
PUBLIC_FIREBASE_STORAGE_BUCKET=
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_FIREBASE_APP_ID=
```

When a user signs in, local progress is merged into:

```text
users/{uid}/learning/progress
```

The app still works in local-only mode when these values are not configured.

Firebase Console setup:

1. Open `https://console.firebase.google.com/project/german-astro-site-20260424/authentication`
2. Click `Get started`
3. Enable `Google`
4. Enable `Email/Password`
5. In Authentication settings, add local development domains if needed:
   - `localhost`
   - `127.0.0.1`

If Authentication is not initialized, Firebase returns `auth/configuration-not-found`.

## Current Maintenance Notes

- `public/lesson1-platform.html` is a legacy standalone app embedded by iframe. It works, but future larger changes should migrate it into the Astro/React structure.
- `Welcome.astro`, `NounChallengeApp.jsx`, and the Astro starter assets are not routed by the current site. Keep them only if they are planned for reuse.
- Run `npm run build` before handing off changes.
