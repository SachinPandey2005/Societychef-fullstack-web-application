// detox.config.js
/** @type {DetoxConfig} */
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/jest.config.js',
  specs: 'e2e/**/*.e2e.ts',
  behavior: {
    init: { reinstallApp: true },
    cleanup: { shutdownDevice: true },
  },
  apps: {
    "ios.debug": {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/mobile.app',
      build: 'npx expo prebuild --platform ios --no-install && xcodebuild -workspace ios/mobile.xcworkspace -scheme mobile -configuration Debug -derivedDataPath ios/build',
    },
    "android.debug": {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'npx expo prebuild --platform android --no-install && cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..',
    },
  },
  devices: {
    "simulator": { type: 'ios.simulator', name: 'iPhone 15' },
    "androidEmu": { type: 'android.emulator', name: 'Pixel_5_API_33' },
  },
};
