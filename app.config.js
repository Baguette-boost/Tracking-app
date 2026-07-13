const fs = require('fs');
const path = require('path');

// EAS 빌드 서버 환경에서 secret을 읽어 파일로 복원하는 로직
if (process.env.GOOGLE_SERVICES_BASE64 && process.env.GOOGLE_SERVICES_BASE64.trim() !== '') {
  const filePath = path.resolve(__dirname, 'google-services.json');
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, Buffer.from(process.env.GOOGLE_SERVICES_BASE64, 'base64').toString('utf-8'));
  }
}

module.exports = {
  "expo": {
    "name": "Voost",
    "slug": "safetrack",
    "version": "1.0.0",
    "orientation": "portrait",
    "scheme": "safetrack",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.anonymous.safetrack",
      "infoPlist": {
        "NSAppTransportSecurity": {
          "NSAllowsArbitraryLoads": true
        }
      }
    },
    "android": {
      "package": "com.anonymous.safetrack",
      "adaptiveIcon": {
        "backgroundColor": "#FFFFFF",
        "foregroundImage": "./assets/android-icon-foreground.png"
      },
      "predictiveBackGestureEnabled": false,

      ...(fs.existsSync(path.resolve(__dirname, 'google-services.json')) ? {
              "googleServicesFile": "./google-services.json"
            } : {}),
      "permissions": [
        "android.permission.BLUETOOTH",
        "android.permission.BLUETOOTH_ADMIN",
        "android.permission.BLUETOOTH_CONNECT"
      ],
      "config": {
        "googleMaps": {
          "apiKey": process.env.GOOGLE_MAPS_API_KEY || "LOCAL_DEVELOPMENT_KEY"
        }
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "plugins": [
      "expo-asset",
      "expo-font",
      [
        "react-native-ble-plx",
        {
          "isBackgroundEnabled": false,
          "modes": [
            "central"
          ],
          "bluetoothAlwaysPermission": "근처 Voost 트래커를 찾아 등록하기 위해 블루투스를 사용합니다."
        }
      ],
      "./plugins/withNoIosPush",
      "./plugins/withNoScriptSandbox",
      "./plugins/withAndroidCleartext"
    ],
    "extra": {
      "eas": {
        "projectId": "320990ff-8199-4e72-8a16-8fa191c1701d"
      }
    }
  }
};
