// iOS 빌드 스크립트 샌드박싱(ENABLE_USER_SCRIPT_SANDBOXING)을 끈다.
//  - React Native의 "Bundle React Native code and images" 스크립트가
//    ip.txt 등 샌드박스 밖 파일을 쓰다 "Operation not permitted"로 실패하는 문제 해결.
//  - prebuild --clean 을 해도 매번 적용되어 유지됨.
const { withXcodeProject } = require('@expo/config-plugins');

module.exports = function withNoScriptSandbox(config) {
  return withXcodeProject(config, (config) => {
    const project = config.modResults;
    const buildConfigs = project.pbxXCBuildConfigurationSection();
    for (const key in buildConfigs) {
      const item = buildConfigs[key];
      if (item && typeof item === 'object' && item.buildSettings) {
        item.buildSettings.ENABLE_USER_SCRIPT_SANDBOXING = 'NO';
      }
    }
    return config;
  });
};
