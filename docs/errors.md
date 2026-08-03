# Release Build Troubleshooting & Known Errors

## 1. Zombie Gradle Daemons / Out of RAM

### Symptom
- `clang++` frontend crash or `Native memory allocation (malloc) failed`.
- High memory usage even when not actively running a build.

### Issue
Running `.\gradlew --stop` does not always kill all orphaned Gradle / Java daemon background processes on Windows. Unstopped daemons hold onto gigabytes of RAM.

### Solution
- Check Task Manager for **Java(TM) Platform SE binary** processes and manually use **End Task** if memory remains occupied.
- Set `--max-workers=2` when running builds:
  ```powershell
  .\gradlew assembleRelease --max-workers=2
  ```
- Configure `android.ninja.jobs=2` in `android/gradle.properties` to throttle concurrent C++ compilation jobs.

---

## 2. ZaloPay Local AAR Dependency (`hasLocalAarDeps` Error)

### Symptom
- Build failure during `:react-native-zalopay:bundleReleaseAar` with:
  > `Direct local .aar file dependencies are not supported when building an AAR...`

### Issue
Android Gradle Plugin (AGP) prevents custom library modules from using direct `implementation fileTree(...)` or `implementation files(...)` referencing local `.aar` files because sub-library AARs cannot package nested AARs.

### Fix
1. In `modules/react-native-zalopay/android/build.gradle`, change the AAR dependency from `implementation` to `compileOnly`:
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
