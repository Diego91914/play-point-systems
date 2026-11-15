# Play Amplified Android

Android storefront shell for the existing Play Amplified web app, using a Trusted Web Activity.

- Application ID: `com.playamplified.app`
- Canonical production origin: `https://www.playamplified.com`
- Launch URL: `https://www.playamplified.com/play-amplified`
- Target SDK: 36 (Android 16)

Use the canonical `www` host for launch and App Links. The apex `playamplified.com` currently redirects to `www.playamplified.com`; keep generated invites on the canonical host so association does not depend on a redirect.

This directory intentionally contains no private signing key.

## Release signing

Create/retain the upload keystore outside Git and provide credentials locally or through CI secrets. Google Play App Signing should be enabled for production distribution.

After the Play Console app is created, copy the **App signing key certificate SHA-256 fingerprint** from Play Console into:

`public/.well-known/assetlinks.json`

The Digital Asset Link must use package `com.playamplified.app`, the actual Play App Signing certificate fingerprint, and the `delegate_permission/common.handle_all_urls` relation. Do not use a made-up fingerprint. Until the association file is present at `https://www.playamplified.com/.well-known/assetlinks.json` and verified against the signed build, Android may fall back from a Trusted Web Activity to browser chrome.
