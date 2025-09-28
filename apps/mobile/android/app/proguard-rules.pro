# Elite ProGuard Rules for Nationwide Toll Hub
# 
# Production-ready ProGuard configuration for code obfuscation,
# optimization, and security enhancement.

# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.

# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.yoga.** { *; }

# Keep Hermes classes
-keep class com.facebook.hermes.** { *; }

# Keep JSC classes
-keep class com.facebook.jsc.** { *; }

# Keep React Native Bridge
-keep class com.facebook.react.bridge.** { *; }
-keep class com.facebook.react.uimanager.** { *; }

# Keep React Native modules
-keep class com.facebook.react.modules.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep Firebase classes
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }

# Keep vector icons
-keep class com.oblador.vectoricons.** { *; }

# Keep biometric classes
-keep class com.joshblour.reactnativebiometrics.** { *; }

# Keep keychain classes
-keep class com.oblador.keychain.** { *; }

# Keep push notification classes
-keep class com.dieam.reactnativepushnotification.** { *; }

# Keep device info classes
-keep class com.learnium.RNDeviceInfo.** { *; }

# Keep AsyncStorage classes
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# Keep gesture handler classes
-keep class com.swmansion.gesturehandler.** { *; }

# Keep reanimated classes
-keep class com.swmansion.reanimated.** { *; }

# Keep screens classes
-keep class com.swmansion.rnscreens.** { *; }

# Keep safe area context classes
-keep class com.th3rdwave.safeareacontext.** { *; }

# Keep linear gradient classes
-keep class com.BV.LinearGradient.** { *; }

# Keep SVG classes
-keep class com.horcrux.svg.** { *; }

# Keep chart kit classes
-keep class com.reactnativecommunity.art.** { *; }

# Keep paper classes
-keep class com.callstack.reactnativepaper.** { *; }

# Keep elements classes
-keep class com.reactnativeelements.** { *; }

# Keep image picker classes
-keep class com.imagepicker.** { *; }

# Keep document picker classes
-keep class com.reactnativedocumentpicker.** { *; }

# Keep share classes
-keep class cl.json.** { *; }

# Keep camera classes
-keep class org.reactnative.camera.** { *; }

# Keep QR code scanner classes
-keep class org.reactnative.camera.** { *; }

# Keep permissions classes
-keep class com.zoontek.rnpermissions.** { *; }

# Keep netinfo classes
-keep class com.reactnativecommunity.netinfo.** { *; }

# Keep splash screen classes
-keep class org.devio.rn.splashscreen.** { *; }

# Keep skeleton placeholder classes
-keep class com.fabianpoza.** { *; }

# Keep modal classes
-keep class com.reactnativecommunity.modal.** { *; }

# Keep toast message classes
-keep class com.toast.** { *; }

# Keep loading spinner classes
-keep class com.reactnativecommunity.loading.** { *; }

# Keep date picker classes
-keep class com.reactnativecommunity.datetimepicker.** { *; }

# Keep calendars classes
-keep class com.wix.reactnativecalendar.** { *; }

# Keep charts wrapper classes
-keep class com.github.wuxudong.rncharts.** { *; }

# Keep HTML to PDF classes
-keep class com.christopherdro.htmltopdf.** { *; }

# Keep FS classes
-keep class com.rnfs.** { *; }

# Keep print classes
-keep class com.christopherdro.reactnativeprint.** { *; }

# Keep credit card input classes
-keep class com.nubabank.** { *; }

# Keep phone number input classes
-keep class com.reactnativecommunity.phonenumber.** { *; }

# Keep country picker classes
-keep class com.xcarpenter.** { *; }

# Keep signature canvas classes
-keep class com.rncanvas.** { *; }

# Keep signature pad classes
-keep class com.rnsignaturepad.** { *; }

# Keep maps classes
-keep class com.airbnb.android.react.maps.** { *; }

# Keep geolocation service classes
-keep class com.agontuk.** { *; }

# Keep background job classes
-keep class com.pilloxa.backgroundjob.** { *; }

# Keep background timer classes
-keep class com.ocetnik.** { *; }

# Keep flash message classes
-keep class com.invertase.flashmessage.** { *; }

# Keep gifted chat classes
-keep class com.FaridSafi.** { *; }

# Keep image crop picker classes
-keep class com.reactnative.** { *; }

# Keep contacts classes
-keep class com.rt2zz.** { *; }

# Keep share menu classes
-keep class com.meedan.** { *; }

# Keep sound classes
-keep class com.zmxv.** { *; }

# Keep video classes
-keep class com.brentvatne.** { *; }

# Keep webview classes
-keep class com.reactnativecommunity.webview.** { *; }

# Keep PDF classes
-keep class com.wonday.** { *; }

# Keep file viewer classes
-keep class com.vinzscam.** { *; }

# Keep download manager classes
-keep class com.eko.** { *; }

# Keep share sheet classes
-keep class com.reactnativecommunity.sharesheet.** { *; }

# Keep share extension classes
-keep class com.reactnativecommunity.shareextension.** { *; }

# Keep serialization classes
-keepclassmembers class * implements java.io.Serializable {
    static final long serialVersionUID;
    private static final java.io.ObjectStreamField[] serialPersistentFields;
    private void writeObject(java.io.ObjectOutputStream);
    private void readObject(java.io.ObjectInputStream);
    java.lang.Object writeReplace();
    java.lang.Object readResolve();
}

# Keep enums
-keepclassmembers enum * {
    public static **[] values();
    public static ** valueOf(java.lang.String);
}

# Keep Parcelable classes
-keep class * implements android.os.Parcelable {
    public static final android.os.Parcelable$Creator *;
}

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Keep JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep annotation classes
-keep class * extends java.lang.annotation.Annotation { *; }

# Remove logging
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int i(...);
    public static int w(...);
    public static int d(...);
    public static int e(...);
}

# Optimization
-optimizationpasses 5
-dontusemixedcaseclassnames
-dontskipnonpubliclibraryclasses
-dontpreverify
-verbose
-optimizations !code/simplification/arithmetic,!field/*,!class/merging/*

# Keep line numbers for debugging
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
