---
description: How to run the ChatSync mobile app
---

To run the mobile application, follow these steps:

1. **Install Dependencies** (if you haven't already):
   Open your terminal in the root directory and run:
   ```bash
   npm install
   ```

2. **Navigate to the Mobile App directory**:
   ```bash
   cd apps/mobile
   ```

3. **Start the Expo Development Server**:
   ```bash
   npx expo start
   ```

4. **Run on a Device or Emulator**:
   - **Android**: Press `a` in the terminal or run `npx expo start --android`.
   - **iOS**: Press `i` in the terminal or run `npx expo start --ios`.
   - **Physical Device**: Download the **Expo Go** app from the Play Store or App Store. Scan the QR code displayed in your terminal using the Expo Go app (Android) or the Camera app (iOS).

> [!TIP]
> Make sure your phone and computer are on the same Wi-Fi network for the QR code scanning to work correctly.
