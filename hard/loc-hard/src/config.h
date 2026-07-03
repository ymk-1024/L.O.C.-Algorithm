#ifndef CONFIG_H
#define CONFIG_H

// ====================
// SSL / Security Config
// ====================

// SSL (HTTPS) の有効/無効設定 (1: 有効, 0: 無効)
#define USE_SSL 1

// SSL有効時の証明書検証 (1: 検証する, 0: 検証しない [開発・テスト環境用])
#define SSL_VERIFY_CERT 0

// バックエンドサーバーのベースURL (USE_SSL に応じてプロトコルが変わる)
#if USE_SSL
  #define BACKEND_BASE_URL "https://loc.mattya3340.com"
#else
  #define BACKEND_BASE_URL "https://loc.mattya3340.com"
#endif

// ====================
// NTP Time Sync Config
// ====================
#define NTP_SERVER1 "pool.ntp.org"
#define NTP_SERVER2 "time.nist.gov"
#define TIME_ZONE_SEC (9 * 3600) // 日本標準時 (JST = UTC+9)
#define DAYLIGHT_OFFSET_SEC 0

#endif // CONFIG_H
