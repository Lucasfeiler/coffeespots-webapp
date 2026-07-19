# CoffeeSpots — Status Notes (for discussion with Andrew)

## What's been built so far

1. **Backend (the "engine" behind the app)** — a real server with its own database that handles account sign-up/login, saving favorite coffee shops, posting reviews, and letting people submit new shop suggestions.
2. **Website connected to that backend** — the site now saves and loads real data instead of fake placeholder data. Tested end-to-end (sign up, save a favorite, post a review all work).
3. **Redesign** — the whole look was changed to match a reference design: dark theme, orange/gold accents, new fonts, updated button styling. Checked every page to confirm it renders correctly.
4. **"Near Me" feature (just added, mid-testing)** — a new page that asks for the visitor's location (standard browser permission prompt) and shows coffee shops nearby, anywhere in the world — not just our 5 hand-picked cities. Uses OpenStreetMap, a free/no-cost map data source, so it doesn't add any new billing.

## Current state — important

**Everything above only runs locally on this computer right now.** Nothing is live on the internet yet, there's no hosting, and there's no mobile app — just the website running on a dev machine.

## Paused, waiting on a decision

- **Real photos for all 180 café listings** — the accurate way to do this is Google's Places API, which needs a Google Cloud account with billing enabled (free credit likely covers it, but it does require a card on file and is a real account to set up). Paused until this gets discussed.
- **A separate design made in another Claude conversation** — was asked to sync the site's design with a different design draft; still waiting on that file/screenshot to compare against.

## Path to the Google Play Store (Android)

This is a separate project phase, not yet started. In order:

1. **Host the app online** — right now it only exists on this computer. It needs a real server + database on the internet before anyone else could use it, on a phone or otherwise.
2. **Package it as an Android app** — the practical route is a tool called Capacitor, which wraps the existing website into a real installable Android app without rebuilding the whole thing from scratch. The current design would carry over automatically.
3. **Google Play Developer account** — $25 one-time fee (paid by you/Andrew, not something that can be set up on your behalf).
4. **App store essentials** — app icon, screenshots, a real privacy policy (currently just placeholder text), and Google's content-rating questionnaire.
5. **Build and submit** for Google's review.

## Decisions to make with Andrew

- Do we pay for real café photos (Google Places API), or keep the free "Near Me" approach as the main experience for now?
- Are we ready to commit to hosting costs + the Play Store process, or hold at "working local demo" for now?
- What's the actual reference design (the separate Claude file) meant to change vs. the current dark-theme redesign?
