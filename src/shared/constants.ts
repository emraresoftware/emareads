// Constants for Emare Ads

export const API_BASE_URL = 'http://localhost:8000';
export const WS_URL = 'ws://localhost:8000/ws';

export const STORAGE_KEYS = {
  CONFIG: 'emare_config',
  USER: 'emare_user',
  FEATURES: 'emare_features',
  RULES: 'emare_rules',
  SCRAPED_DATA: 'emare_scraped',
  SCREENSHOTS: 'emare_screenshots',
  COOKIES_BACKUP: 'emare_cookies',
  CUSTOM_CSS: 'emare_css',
  FORMS_DATA: 'emare_forms',
  AI_CACHE: 'emare_ai_cache'
} as const;

export const DEFAULT_FEATURES: Record<string, boolean> = {
  adBlocker: true,
  trackerBlocker: true,
  autoFill: false,
  webScraping: false,
  screenshot: true,
  recording: false,
  aiAssistant: true,
  customCSS: false,
  darkMode: true,
  translator: false,
  passwordManager: false,
  cookieManager: true,
  networkInterceptor: false,
  formAutomation: false,
  dataExtraction: false
};

// Ad/Tracker patterns (basit liste, production'da daha kapsamlı olmalı)
export const BLOCKED_PATTERNS = [
  '*://*.doubleclick.net/*',
  '*://*.googleadservices.com/*',
  '*://*.googlesyndication.com/*',
  '*://*.facebook.com/tr/*',
  '*://*.google-analytics.com/*',
  '*://analytics.google.com/*',
  '*://*.ads.*.com/*',
  '*://*.ad-*.com/*',
  '*://*/ads/*',
  '*://*/tracking/*',
  '*://*/tracker/*'
];

export const CONTEXT_MENU_IDS = {
  SCRAPE: 'emare_scrape',
  SCREENSHOT: 'emare_screenshot',
  EXTRACT_DATA: 'emare_extract',
  TRANSLATE: 'emare_translate',
  AI_ANALYZE: 'emare_ai'
};
