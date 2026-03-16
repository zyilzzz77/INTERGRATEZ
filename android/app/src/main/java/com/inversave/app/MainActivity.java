package com.inversave.app;

import android.os.Bundle;
import android.webkit.CookieManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Get WebView and optimize settings for video streaming
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

        // ── Video playback ──────────────────────────────────────
        settings.setMediaPlaybackRequiresUserGesture(false);

        // ── Storage & Cache ─────────────────────────────────────
        settings.setDomStorageEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setDatabaseEnabled(true);

        // ── Security / Mixed content ────────────────────────────
        // Allow HTTP media loaded from HTTPS pages (some CDNs)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // ── JavaScript ──────────────────────────────────────────
        settings.setJavaScriptEnabled(true);
        settings.setJavaScriptCanOpenWindowsAutomatically(true);

        // ── Viewport & Responsive Layout ─────────────────────────
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setSupportZoom(false);
        settings.setTextZoom(100); // prevent OS font scaling from breaking layout

        // ── Cookies (required for next-auth session) ────────────
        CookieManager cookieManager = CookieManager.getInstance();
        cookieManager.setAcceptCookie(true);
        cookieManager.setAcceptThirdPartyCookies(webView, true);

        // ── Hardware acceleration for smooth video ──────────────
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
    }
}
