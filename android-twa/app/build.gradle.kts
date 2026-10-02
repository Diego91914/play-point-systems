plugins {
    id("com.android.application")
}

android {
    namespace = "com.playamplified.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.playamplified.app"
        minSdk = 23
        targetSdk = 36
        versionCode = 1
        versionName = "1.0.0"
    }
}

dependencies {
    implementation("com.google.androidbrowserhelper:androidbrowserhelper:2.6.2")
}
