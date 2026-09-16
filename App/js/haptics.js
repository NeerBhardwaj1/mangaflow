// ==========================================================================
// MangaFlow App — Haptic Feedback Engine
// ==========================================================================

const Haptics = {
  enabled: true,

  init() {
    const saved = localStorage.getItem('mf_haptics');
    if (saved !== null) {
      this.enabled = saved === 'true';
    }
  },

  toggle(enable) {
    this.enabled = enable !== undefined ? enable : !this.enabled;
    localStorage.setItem('mf_haptics', this.enabled ? 'true' : 'false');
    if (this.enabled) this.light();
    return this.enabled;
  },

  // Subtle tap for tabs, buttons, page flips (12ms)
  light() {
    if (!this.enabled || !navigator.vibrate) return;
    try { navigator.vibrate(12); } catch (e) {}
  },

  // Medium tap for bookmarking, shelf changes (25ms)
  medium() {
    if (!this.enabled || !navigator.vibrate) return;
    try { navigator.vibrate(25); } catch (e) {}
  },

  // Heavy tap for warnings, deletions (45ms)
  heavy() {
    if (!this.enabled || !navigator.vibrate) return;
    try { navigator.vibrate(45); } catch (e) {}
  },

  // Success double-pulse for download complete, backup restored
  success() {
    if (!this.enabled || !navigator.vibrate) return;
    try { navigator.vibrate([15, 50, 20]); } catch (e) {}
  }
};

Haptics.init();
window.Haptics = Haptics;
