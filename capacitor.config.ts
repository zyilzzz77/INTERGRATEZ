import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.inversave.app",
  appName: "Inversave",
  webDir: "out",
  // Point to your live server — the app loads from here
  server: {
    url: "https://inversave.space",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["*"],
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false, // set true for dev
    backgroundColor: "#000000",
    overrideUserAgent: "InversaveApp/5.7 Android",
  },
  plugins: {
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#f59e0b",
    },
    CapacitorHttp: {
      enabled: true, // bypass CORS via native HTTP
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#000000",
      overlaysWebView: false,
    },
  },
};

export default config;
