package com.mangaflow.app;

import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.KeyEvent;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;
import android.widget.Toast;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private boolean doubleBackToExitPressedOnce = false;
    private boolean isReaderActive = false;

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
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
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
}
