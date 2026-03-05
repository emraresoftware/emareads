// Shared TypeScript types for Emare Ads

export interface EmareConfig {
  apiUrl: string;
  wsUrl: string;
  userId?: string;
  apiKey?: string;
  features: FeatureFlags;
}

export interface FeatureFlags {
  adBlocker: boolean;
  trackerBlocker: boolean;
  autoFill: boolean;
  webScraping: boolean;
  screenshot: boolean;
  recording: boolean;
  aiAssistant: boolean;
  customCSS: boolean;
  darkMode: boolean;
  translator: boolean;
  passwordManager: boolean;
  cookieManager: boolean;
  networkInterceptor: boolean;
  formAutomation: boolean;
  dataExtraction: boolean;
}

export interface Message {
  type: MessageType;
  data?: any;
  tabId?: number;
  timestamp?: number;
}

export type MessageType =
  | 'SCRAPE_PAGE'
  | 'FILL_FORM'
  | 'TAKE_SCREENSHOT'
  | 'START_RECORDING'
  | 'STOP_RECORDING'
  | 'BLOCK_ADS'
  | 'INJECT_CSS'
  | 'EXTRACT_DATA'
  | 'INTERCEPT_REQUEST'
  | 'GET_COOKIES'
  | 'SET_COOKIES'
  | 'TRANSLATE_PAGE'
  | 'AI_ANALYZE'
  | 'SYNC_SETTINGS'
  | 'REMOTE_COMMAND';

export interface ScrapedData {
  url: string;
  title: string;
  content: string;
  images: string[];
  links: string[];
  metadata: Record<string, any>;
  timestamp: number;
}

export interface FormData {
  selector: string;
  fields: Record<string, string>;
}

export interface Screenshot {
  dataUrl: string;
  timestamp: number;
  url: string;
}

export interface NetworkRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
}

export interface CookieData {
  name: string;
  value: string;
  domain: string;
  path: string;
  secure: boolean;
  httpOnly: boolean;
  sameSite?: string;
  expirationDate?: number;
}

export interface CustomRule {
  id: string;
  name: string;
  enabled: boolean;
  pattern: string;
  action: 'block' | 'redirect' | 'modify' | 'inject';
  value?: string;
}

export interface RemoteCommand {
  id: string;
  command: string;
  params: Record<string, any>;
  timestamp: number;
  executedAt?: number;
  result?: any;
}
