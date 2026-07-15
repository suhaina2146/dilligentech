# Delligen Technologies — setup guide

This is a two-person private space disguised as a small company cloud portal
("Delligen Technologies"). It has a real, working attendance tracker and
worksheet, and a hidden "Reports" tab that is actually your private chat.

## 0. Why this version has a `vendor/firebase/` folder

Earlier versions loaded the Firebase SDK and Google Fonts directly from
Google's CDN (`gstatic.com`, `googleapis.com`). That's normal for a regular
website, but some website-to-APK wrapper tools (AppMint, APKMint, and
similar) treat *any* request to a domain other than your own as "the user is
leaving the site" and kick out to the phone's system browser instead of
rendering inside the app — which is why the app was opening in a browser tab.

This version removes that dependency entirely: the whole Firebase SDK is
bundled locally in `vendor/firebase/`, and Google Fonts has been dropped in
favor of the built-in system font fallback. As long as you upload/point the
wrapper tool at this version, there are no more external-domain requests for
it to trip over — only the actual Firebase API calls to Google's backend
(Firestore, Auth), which are ordinary background network requests, not page
navigations, so they won't trigger a browser hand-off.

## What's in this folder

- `index.html` — the whole app (splash, pairing, cosmetic login, dashboard, chat)
- `firebase-messaging-sw.js` — background push handler (shows the generic popup)
- `firestore.rules` — locks the database to only your two paired devices
- `manifest.json` — makes it installable as an app icon on the home screen
- `functions/` — the one Cloud Function that actually sends the push notification

## 1. One-time Firebase Console setup

You already have the project (`dilligen-technologies`), so:

1. **Enable Firestore** — Firebase Console → Build → Firestore Database → Create database (production mode, any region close to you both).
2. **Enable Authentication** — Build → Authentication → Sign-in method → enable **Anonymous**. (No emails/passwords are ever stored — nothing personally identifying touches the database.)
3. **Enable Cloud Messaging** — Build → Messaging. Then Project settings (gear icon) → Cloud Messaging tab → under "Web configuration" click **Generate key pair**. Copy the long key it gives you.
4. Already done — `index.html` is set to your key:
   ```js
   const VAPID_KEY = "P3QeAaHVnybqvi3QsQSlnEesYAjpIe-N_ywC2ZSQEm8";
   ```
5. **Deploy the security rules**: `firebase deploy --only firestore:rules` (see step 3 below for CLI setup) — or paste the contents of `firestore.rules` directly into Console → Firestore → Rules → publish.

## 2. Deploy the Cloud Function (required for background push)

Real-time chat works without this — it's only needed so a message still buzzes her
phone when the app is closed or she's in Instagram.

```bash
npm install -g firebase-tools
firebase login
cd delligen
firebase init functions   # choose "Use an existing project" -> dilligen-technologies
# when it asks to overwrite functions/index.js and package.json, say NO
firebase deploy --only functions
```

This deploys `notifyOnNewMessage`, which watches for new chat messages and sends
a push to whichever device didn't send it — with generic text only
("Your worksheet was updated" / "Priority flag raised on your report"), never
the actual message content.

## 3. Host it on GitHub Pages

All files in this download are already at the top level (no subfolder) — that
matters, because `firebase-messaging-sw.js` must sit at the same level the
site is served from.

```bash
cd delligen-technologies    # the folder you unzipped, containing index.html directly
git init
git add .
git commit -m "Delligen Technologies portal"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo-name>.git
git push -u origin main
```

Then: repo → Settings → Pages → Source: `main` branch, `/ (root)` → Save.
Your app will be live at `https://<your-username>.github.io/<repo-name>/`.

Note: GitHub Pages project sites are served under that `/<repo-name>/`
subpath, not the bare domain — all the paths in `index.html`,
`firebase-messaging-sw.js`, and `manifest.json` are written as relative paths
for exactly this reason, so it works correctly either way. If you ever move
files into a subfolder, double-check nothing references an absolute `/path`.

**Important:** push (background) notifications and `firebase-messaging-sw.js`
only work over **HTTPS**, which GitHub Pages gives you automatically — so no
extra config needed there.

## 4. First-time pairing (do this once, together)

1. Open the site on your device. On the "New Setup" tab, tap **Generate setup code**. A 6-digit code appears.
2. On her device, open the same site, switch to **Have a Code**, and enter that code.
3. Both screens automatically continue once linked — no need to touch anything else. From then on, both devices remember each other (`localStorage`), and reopening the app always shows the normal cosmetic "Sign in" screen — the pairing step never appears again on those two devices.

## 5. How the disguise works

- The **Reports** tab (your real chat) is hidden from the navigation by default. Triple-tap the small avatar circle in the top-right corner (top bar, visible on every screen size — desktop, tablet, and phone) within about a second to reveal or hide it again. It resets to hidden every time the app reloads.
- Sender names in chat show as anonymous Employee IDs (e.g. `DG-4F1A`), not names.
- All lock-screen/background notifications say generic things like *"Your worksheet was updated"* — never the message text.
- Attendance and Worksheet are fully functional, so there's real everyday activity in the app if anyone opens it.

## 6. The "waiting for you" ping

The flag icon next to the message box sends a special `ping` message. On her
side (foreground) it triggers a distinct repeating vibration pattern and a
different tone than a normal message, plus a toast: **"⚑ She is waiting on
you."** In the background, it shows a separate notification channel
(`delligen_priority`) so you could later give it its own custom sound in
Android settings if you want it to feel different from ordinary alerts.

## 7. Known platform limits (please read before relying on this)

- **iOS Safari**: continuous/patterned vibration and background push notifications
  only work if the app is **added to the Home Screen** (Share → Add to Home
  Screen) and only on fairly recent iOS versions with web push enabled. Vibration
  patterns on iOS are more limited than Android regardless.
- **Android Chrome**: works best — install via the browser's "Add to Home
  screen" prompt (the `manifest.json` here enables that) so it behaves like a
  real app icon and can receive background push reliably.
- Browsers increasingly restrict background vibration for privacy reasons — if
  a pattern silently doesn't run, the toast + sound + push notification still
  land, so she won't miss it.
- Two `icons/icon-192.png` and `icons/icon-512.png` files (plus
  `icons/badge-72.png` for the notification badge) are already included, so
  install prompts and notifications show a proper icon out of the box. If you
  ever want to swap the branding, just replace those three files with the
  same names and sizes.

## 8. If someone else opens the app

They'll see: a login screen for "Delligen Technologies," then a dashboard with
Dashboard / Attendance / Worksheet / Settings. There is nothing in the visible
UI, page title, or source that says "chat," "love," or names either of you —
messages are stored under a random workspace ID and shown under anonymous
Employee IDs. The Reports tab literally isn't in the sidebar unless you do the
triple-tap gesture.
