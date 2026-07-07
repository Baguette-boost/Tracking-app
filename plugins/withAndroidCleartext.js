// 안드로이드에서 평문(HTTP) 통신 허용 — 백엔드가 http:// 라서 필요.
// (안드로이드 9+는 기본으로 cleartext 차단. iOS는 app.json의 NSAppTransportSecurity로 처리)
const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withAndroidCleartext(config) {
  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (app && app.$) {
      app.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
};
