## iOS (Capacitor) – Build & Submit

Prereqs:
- Xcode installed and opened once
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer account (Team access)
- Your web app deployed at a public HTTPS URL (e.g., https://app.yourdomain.com)

Configure:
1) Set the production URL for the iOS WebView:
   - Your domain is already wired: https://pricingengine.pro
   - Run:
     - `pnpm run ios:sync:prod`
   (This sets `CAP_SERVER_URL` at sync time to https://pricingengine.pro and writes it into the native iOS config.)

2) Branding:
   - Display name set to “Brrrr Pricing” in `ios/App/App/Info.plist`
   - Bundle ID is `com.brrrr.pricingengine` (change in Xcode if needed)
   - Replace icons/splash in `ios/App/App/Assets.xcassets/`
     - AppIcon.appiconset/
     - Splash.imageset/

Open and archive:
1) `pnpm run ios:open`
2) In Xcode:
   - Set Signing & Capabilities → Team
   - Set “Bundle Identifier” if you need a different one
   - Product → Archive (Any iOS Device)
3) Distribute archive via the Organizer to TestFlight / App Store.

Notes:
- For development, use `pnpm run dev` and `pnpm run ios:sync:dev` to keep localhost settings.
- For App Store/TestFlight, ensure https://pricingengine.pro is reachable from devices.
- You set versioning in Xcode: “Marketing Version” and “Build”.


