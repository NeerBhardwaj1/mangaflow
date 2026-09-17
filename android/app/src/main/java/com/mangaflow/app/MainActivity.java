package com.mangaflow.app;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends BridgeActivity {
    private boolean doubleBackToExitPressedOnce = false;
    private boolean isReaderActive = false;
    private String pendingApkPath = null;
    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public class WebAppInterface {
        @JavascriptInterface
        public void setImmersiveMode(final boolean enable) {
            new Handler(Looper.getMainLooper()).post(new Runnable() {
                @Override
                public void run() {
                    isReaderActive = enable;
                    WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
                    if (controller != null) {
                        if (enable) {
                            controller.hide(WindowInsetsCompat.Type.systemBars());
                            controller.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                        } else {
                            controller.show(WindowInsetsCompat.Type.systemBars());
                        }
                    }
                }
            });
        }

        @JavascriptInterface
        public void downloadAndInstallApk(final String downloadUrl) {
            startDownloadAndInstall(downloadUrl);
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            android.webkit.WebView.setWebContentsDebuggingEnabled(true);
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        if (bridge != null && bridge.getWebView() != null) {
            WebSettings settings = bridge.getWebView().getSettings();
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setDomStorageEnabled(true);
            settings.setAllowFileAccess(true);
            settings.setAllowContentAccess(true);

            bridge.getWebView().addJavascriptInterface(new WebAppInterface(), "AndroidNative");
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int action = event.getAction();
        int keyCode = event.getKeyCode();

        if (action == KeyEvent.ACTION_DOWN && isReaderActive) {
            if (keyCode == KeyEvent.KEYCODE_VOLUME_UP || keyCode == KeyEvent.KEYCODE_VOLUME_DOWN) {
                final String direction = (keyCode == KeyEvent.KEYCODE_VOLUME_UP) ? "up" : "down";
                if (bridge != null && bridge.getWebView() != null) {
                    bridge.getWebView().evaluateJavascript(
                        "window.dispatchEvent(new CustomEvent('mf-volume-key', { detail: { direction: '" + direction + "' } }));",
                        null
                    );
                    return true; // Consume volume key event in reader mode
                }
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (bridge != null && bridge.getWebView() != null) {
            bridge.getWebView().evaluateJavascript(
                "(function() { " +
                "  if (typeof App !== 'undefined' && typeof App.handleBackButton === 'function') { " +
                "    return App.handleBackButton(); " +
                "  } " +
                "  return false; " +
                "})()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if (!"true".equals(value)) {
                            if (doubleBackToExitPressedOnce) {
                                MainActivity.super.onBackPressed();
                                return;
                            }
                            doubleBackToExitPressedOnce = true;
                            Toast.makeText(MainActivity.this, "Press back again to exit MangaFlow", Toast.LENGTH_SHORT).show();
                            new Handler(Looper.getMainLooper()).postDelayed(new Runnable() {
                                @Override
                                public void run() {
                                    doubleBackToExitPressedOnce = false;
                                }
                            }, 2000);
                        }
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }

    public void startDownloadAndInstall(final String downloadUrl) {
        executor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    URL currentUrl = new URL(downloadUrl);
                    HttpURLConnection conn = null;
                    int responseCode = 0;
                    int redirects = 0;
                    while (redirects < 6) {
                        conn = (HttpURLConnection) currentUrl.openConnection();
                        conn.setConnectTimeout(20000);
                        conn.setReadTimeout(30000);
                        conn.setInstanceFollowRedirects(true);
                        conn.setRequestProperty("User-Agent", "MangaFlow-App");
                        conn.connect();
                        responseCode = conn.getResponseCode();
                        if (responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
                            responseCode == HttpURLConnection.HTTP_MOVED_PERM ||
                            responseCode == HttpURLConnection.HTTP_SEE_OTHER ||
                            responseCode == 307 || responseCode == 308) {
                            String newUrl = conn.getHeaderField("Location");
                            if (newUrl != null) {
                                currentUrl = new URL(currentUrl, newUrl);
                                redirects++;
                                conn.disconnect();
                                continue;
                            }
                        }
                        break;
                    }

                    if (responseCode != HttpURLConnection.HTTP_OK) {
                        notifyUpdateError("Server returned HTTP " + responseCode);
                        return;
                    }

                    final int fileLength = conn.getContentLength();
                    File updateDir = new File(getCacheDir(), "updates");
                    if (!updateDir.exists()) {
                        updateDir.mkdirs();
                    }
                    final File apkFile = new File(updateDir, "MangaFlow_update.apk");
                    if (apkFile.exists()) {
                        apkFile.delete();
                    }

                    InputStream is = conn.getInputStream();
                    FileOutputStream fos = new FileOutputStream(apkFile);

                    byte[] buffer = new byte[8192];
                    int total = 0;
                    int count;
                    long lastProgressUpdate = 0;

                    while ((count = is.read(buffer)) != -1) {
                        total += count;
                        fos.write(buffer, 0, count);

                        long now = System.currentTimeMillis();
                        if (now - lastProgressUpdate > 120) {
                            lastProgressUpdate = now;
                            final int currentTotal = total;
                            final int percent = fileLength > 0 ? (int) ((total * 100L) / fileLength) : -1;
                            runOnUiThread(new Runnable() {
                                @Override
                                public void run() {
                                    if (bridge != null && bridge.getWebView() != null) {
                                        bridge.getWebView().evaluateJavascript(
                                            "window.dispatchEvent(new CustomEvent('mf-update-progress', { detail: { progress: " + percent + ", downloaded: " + currentTotal + ", total: " + fileLength + " } }));",
                                            null
                                        );
                                    }
                                }
                            });
                        }
                    }

                    fos.flush();
                    fos.close();
                    is.close();

                    final int finalTotal = total;
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            if (bridge != null && bridge.getWebView() != null) {
                                bridge.getWebView().evaluateJavascript(
                                    "window.dispatchEvent(new CustomEvent('mf-update-progress', { detail: { progress: 100, downloaded: " + finalTotal + ", total: " + finalTotal + " } }));",
                                    null
                                );
                            }
                            installApkFile(apkFile);
                        }
                    });

                } catch (final Exception e) {
                    runOnUiThread(new Runnable() {
                        @Override
                        public void run() {
                            notifyUpdateError(e.getMessage() != null ? e.getMessage() : "Download error");
                        }
                    });
                }
            }
        });
    }

    private void notifyUpdateError(final String error) {
        if (bridge != null && bridge.getWebView() != null) {
            String safeMsg = error.replace("'", "\\'").replace("\n", " ");
            bridge.getWebView().evaluateJavascript(
                "window.dispatchEvent(new CustomEvent('mf-update-error', { detail: { error: '" + safeMsg + "' } }));",
                null
            );
        }
    }

    private void installApkFile(File apkFile) {
        if (!apkFile.exists()) return;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            if (!getPackageManager().canRequestPackageInstalls()) {
                pendingApkPath = apkFile.getAbsolutePath();
                Toast.makeText(this, "Please allow MangaFlow to install app updates", Toast.LENGTH_LONG).show();
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                    .setData(Uri.parse("package:" + getPackageName()))
                    .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                startActivity(intent);
                return;
            }
        }

        try {
            Uri apkUri = FileProvider.getUriForFile(
                MainActivity.this,
                getPackageName() + ".fileprovider",
                apkFile
            );

            Intent installIntent = new Intent(Intent.ACTION_VIEW);
            installIntent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            installIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            installIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(installIntent);
        } catch (Exception e) {
            Toast.makeText(this, "Failed to launch installer: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        if (pendingApkPath != null) {
            File apk = new File(pendingApkPath);
            if (apk.exists()) {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O || getPackageManager().canRequestPackageInstalls()) {
                    String path = pendingApkPath;
                    pendingApkPath = null;
                    installApkFile(new File(path));
                }
            }
        }
    }
}
