# Play Amplified Android

Android storefront shell for the existing Play Amplified web app.

- Application ID: `com.playamplified.app`
- Production origin: `https://playamplified.com`
- Launch URL: `https://playamplified.com/play-amplified`
- Target SDK: 36 (Android 16)

This directory intentionally contains no private signing key.

## Release signing

Create/retain the upload keystore outside Git and provide credentials locally or through CI secrets. Google Play App Signing should be enabled for production distribution.

After the Play Console app is created, copy the **App signing key certificate SHA-256 fingerprint** from Play Console into:

`public/.well-known/assetlinks.json`

Do not use a made-up fingerprint. The production Digital Asset Link must match the certificate Google uses to sign installs.
