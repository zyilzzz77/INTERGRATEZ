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

        // ── Download Handling (Native DownloadManager) ──────────
        webView.setDownloadListener(new android.webkit.DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent,
                    String contentDisposition, String mimeType, long contentLength) {

                try {
                    android.app.DownloadManager.Request request = new android.app.DownloadManager.Request(android.net.Uri.parse(url));

                    // Pass cookies from the session
                    String cookies = CookieManager.getInstance().getCookie(url);
                    if (cookies != null) {
                        request.addRequestHeader("cookie", cookies);
                    }
                    request.addRequestHeader("User-Agent", userAgent);
                    request.setMimeType(mimeType);

                    // Show notification while downloading and after completion
                    request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);

                    // Guess filename and save to public Download directory
                    String filename = android.webkit.URLUtil.guessFileName(url, contentDisposition, mimeType);
                    request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, filename);

                    // Enqueue download
                    android.app.DownloadManager dm = (android.app.DownloadManager) getSystemService(DOWNLOAD_SERVICE);
                    dm.enqueue(request);

                    android.widget.Toast.makeText(getApplicationContext(), "Mulai mengunduh...", android.widget.Toast.LENGTH_SHORT).show();
                } catch (Exception e) {
                    android.widget.Toast.makeText(getApplicationContext(), "Gagal mengunduh: " + e.getMessage(), android.widget.Toast.LENGTH_SHORT).show();
                }
            }
        });

        // ── Hardware acceleration for smooth video ──────────────
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
    }
}
