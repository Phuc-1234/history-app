# Release Build Troubleshooting & Known Errors

## 1. Zombie Gradle Daemons / Out of RAM
**Status:** Resolved

### Symptom
- `clang++` frontend crash or `Native memory allocation (malloc) failed`.
- High memory usage even when not actively running a build.

### Issue
Running `.\gradlew --stop` does not always kill all orphaned Gradle / Java daemon background processes on Windows. Unstopped daemons hold onto gigabytes of RAM.

### Solution
- Stop running daemons via Gradle:
  ```powershell
  .\gradlew --stop
  ```
- Check Task Manager for orphaned **Java(TM) Platform SE binary** processes and manually use **End Task** (or `taskkill /F /IM java.exe`) if memory remains occupied before running `.\gradlew assembleRelease`.


---

## 2. ZaloPay Local AAR Dependency (`hasLocalAarDeps` Error)
**Status:** Resolved but need to apply everytime

### Symptom
- Build failure during `:react-native-zalopay:bundleReleaseAar` with:
  > `Direct local .aar file dependencies are not supported when building an AAR...`

### Issue
Android Gradle Plugin (AGP) prevents custom library modules from using direct `implementation fileTree(...)` or `implementation files(...)` referencing local `.aar` files because sub-library AARs cannot package nested AARs.

### Fix
1. In `apps/react-native-client/modules/react-native-zalopay/android/build.gradle`, change the AAR dependency from `implementation` to `compileOnly`:
   ```gradle
   dependencies {
       implementation 'com.facebook.react:react-android:+'
       compileOnly fileTree(dir: 'libs', include: ['*.aar', '*.jar'])
   }
   ```
2. In `apps/react-native-client/android/app/build.gradle`, explicitly include the `.aar` in the main application dependencies:
   ```gradle
   dependencies {
       ...
       implementation files("../../modules/react-native-zalopay/android/libs/zpdk-release-v3.1.aar")
   }
   ```

> [!IMPORTANT]
> Since the `android` folder is generated/modified by `npx expo prebuild` and is git-ignored, these changes to `apps/react-native-client/android/app/build.gradle` must be checked and re-applied manually before building if `prebuild` or `prebuild --clean` has been executed.


---

## 3. Media3 Version Collision (`expo-audio` & `react-native-video`)
**Status:** Untested, keep watch

### Symptom
- App crashes immediately upon opening screens with video (e.g. `NodeScreen`, `VideoStreamScreen`):
  > `java.lang.NoSuchMethodError: No direct method <init>(Landroidx/media3/exoplayer/upstream/DefaultAllocator;IIIIIZIZ)V in class Landroidx/media3/exoplayer/DefaultLoadControl;`
  > `com.brentvatne.exoplayer.ReactExoplayerView$RNVLoadControl.<init>(ReactExoplayerView.java:568)`

### Issue
`expo-audio` depends on `androidx.media3: 1.9.0`, causing Gradle to resolve `media3` app-wide to `1.9.0`. However, `react-native-video` (v6.x) relies on a `DefaultLoadControl` constructor that was removed in Media3 1.9.0.

### Fix
1. Migrate from `react-native-video` to official Expo SDK 56 `expo-video` (`~56.1.4`):
   - Replace `"react-native-video"` with `"expo-video"` in `apps/react-native-client/package.json` and `apps/react-native-client/app.json`.
   - Update `VideoPlayer.tsx` to use `useVideoPlayer` and `VideoView` from `expo-video`.
2. Run `npx expo prebuild --clean` to re-link native modules cleanly without old `react-native-video` bindings.
