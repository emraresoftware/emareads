// Utility functions for Emare Ads

import type { Message, EmareConfig } from './types';
import { STORAGE_KEYS } from './constants';

/**
 * Chrome storage wrapper
 */
export const storage = {
  async get<T>(key: string): Promise<T | null> {
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  },

  async set(key: string, value: any): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },

  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },

  async clear(): Promise<void> {
    await chrome.storage.local.clear();
  }
};

/**
 * Send message to background script
 */
export async function sendMessage<T = any>(message: Message): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Send message to specific tab
 */
export async function sendMessageToTab<T = any>(
  tabId: number,
  message: Message
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

/**
 * Get current tab
 */
export async function getCurrentTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Execute script in tab
 */
export async function executeScript(tabId: number, func: Function, args: any[] = []) {
  return chrome.scripting.executeScript({
    target: { tabId },
    func,
    args
  });
}

/**
 * Logger
 */
export const logger = {
  info: (message: string, ...args: any[]) => {
    console.log(`[Emare Ads] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`[Emare Ads ERROR] ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[Emare Ads WARN] ${message}`, ...args);
  }
};

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format date
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('tr-TR');
}

/**
 * Wait/sleep function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sanitize HTML (basic)
 */
export function sanitizeHTML(html: string): string {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

/**
 * Download file
 */
export async function downloadFile(data: string, filename: string, type: string = 'text/plain') {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  
  await chrome.downloads.download({
    url,
    filename,
    saveAs: true
  });
  
  URL.revokeObjectURL(url);
}
