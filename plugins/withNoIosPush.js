// iOS 무료(Personal) 개발자 계정으로 서명하기 위해
// 원격 푸시 엔타이틀먼트(aps-environment)를 iOS 빌드에서 제거한다.
//  - 안드로이드 푸시(FCM)·로컬 알림에는 전혀 영향 없음
//  - prebuild --clean 을 해도 이 플러그인이 매번 적용되어 유지됨
//  - 나중에 유료 계정으로 원격 푸시를 쓰려면 app.json plugins 에서 이 줄만 빼면 됨
const { withEntitlementsPlist } = require('@expo/config-plugins');

module.exports = function withNoIosPush(config) {
  return withEntitlementsPlist(config, (cfg) => {
    if (cfg.modResults && 'aps-environment' in cfg.modResults) {
      delete cfg.modResults['aps-environment'];
    }
    return cfg;
  });
};
