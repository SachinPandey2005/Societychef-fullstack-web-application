# Building a release APK locally

This covers `assembleRelease` via Gradle directly (`android/gradlew`), not EAS
cloud builds. The app builds and runs fine in dev mode (`expo start`,
`expo run:android`) without any of this — these are release-build-only
problems, all caused by the same root issue: Expo CLI's `export:embed`
auto-detects this repo as an npm workspace monorepo and treats the
**workspace root** (`societychef/`), not `apps/mobile/`, as its project root
for bundling. Nothing in `apps/mobile/` alone fixes that; the workarounds
below live partly in files this repo intentionally gitignores (`android/`,
`.env`), so a fresh clone needs them redone before a release build will
produce a working APK.

## 1. Android SDK location (gitignored: `android/local.properties`)

Gradle needs to know where the Android SDK lives. Create
`apps/mobile/android/local.properties`:

```properties
sdk.dir=C:\\path\\to\\your\\Android\\Sdk
```

(Windows paths need doubled backslashes in this file. On Mac/Linux, forward
slashes, no escaping needed.)

## 2. Workspace-root `.env` (gitignored: `/.env`)

`EXPO_PUBLIC_API_URL` (and the other `EXPO_PUBLIC_*` vars) only get embedded
into the release bundle if `.env` exists at the **workspace root**
(`societychef/.env`), not just `apps/mobile/.env` — because of the
project-root auto-detection above. Without it, the app silently falls back
to the hardcoded default in `lib/apiClient.ts`/`lib/socket.ts`/
`config/env.ts`, which is easy not to notice since the app still runs, it's
just silently talking to the wrong backend.

Create `/.env` at the repo root, mirroring `apps/mobile/.env`:

```
EXPO_PUBLIC_API_URL=https://backend-production-28028.up.railway.app
EXPO_PUBLIC_FORCE_MOCK=false
EXPO_PUBLIC_SENTRY_DSN=
```

**Verify it actually took** before shipping a build — don't just trust that
it did:

```bash
grep -a -o "railway.app" apps/mobile/android/app/build/generated/assets/createBundleReleaseJsAndAssets/index.android.bundle
```

If that prints nothing, the env var didn't make it into the bundle.

## 3. `android/app/build.gradle` changes (gitignored: all of `android/`)

The `android/` folder is generated (`expo prebuild`) and gitignored, so these
hand-edits to the `react { ... }` block don't survive a fresh `expo prebuild
--clean`. If that ever happens, reapply:

**a. Entry file** — point it at a local bridge file instead of the dynamic
`expo/scripts/resolveAppEntry` resolution, which resolves to a file hoisted
outside `apps/mobile/` and fails once relativized against the workspace-root
project root `export:embed` actually uses:

```groovy
entryFile = file("${projectRoot}/index.js")
```

This needs `apps/mobile/index.js` to exist (it's a real, committed file —
not gitignored):

```js
import 'expo-router/entry';
```

**b. Project root** — set explicitly to the workspace root, 2 levels up from
the default, to match what `export:embed` actually resolves against:

```groovy
root = file("../../../../")
```

**c. Memory** — this repo's bundle is large enough to hit a native OOM
(JVM crash, not just a heap error) on an 8-core/16GB machine at the default
worker count. Limit it:

```groovy
extraPackagerArgs = ["--max-workers", "2"]
```

Also pass `--max-workers=2` to the `gradlew` invocation itself.

**d. Sentry upload** — disabled; it adds a Gradle task that auto-uploads
source maps on every release build and fails outright without a real
Sentry org/project configured (comment out, don't delete, in case a real
Sentry project gets configured later):

```groovy
// apply from: new File(["node", "--print", "require('path').dirname(require.resolve('@sentry/react-native/package.json'))"].execute().text.trim(), "sentry.gradle")
```

## 4. Router root (already committed — `app.json` at the workspace root, not `apps/mobile/app.json`)

Expo Router's own app-directory discovery is a separate mechanism from (1-3)
above, computed against the same workspace-root project root. Already fixed
and committed in `/app.json` (workspace root):

```json
{ "expo": { "extra": { "router": { "root": "apps/mobile/app" } } } }
```

If routes ever come back as "No routes found" on a release build, check this
file still has that key — not `apps/mobile/app.json`, which Expo CLI doesn't
read for `export:embed` in this monorepo layout.

## Build + verify

```bash
cd apps/mobile/android
./gradlew assembleRelease --no-daemon --max-workers=2
```

Output: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`
— signed with the debug keystore, installable directly
(`adb install -r app-release.apk`), no Play Store needed.

Before handing it to anyone, sanity-check the bundled backend URL (step 2
above) and confirm the app actually launches without a "No routes found"
crash — both have shipped broken before without any build-time error.
