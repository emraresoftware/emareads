// Background Service Worker - Emare Ads
// Eklentinin beyni, tüm koordinasyonu buradan yap

import type { Message, RemoteCommand, CustomRule } from '@shared/types';
import { storage, logger, getCurrentTab, sendMessageToTab } from '@shared/utils';
import { STORAGE_KEYS, BLOCKED_PATTERNS, CONTEXT_MENU_IDS, API_BASE_URL, WS_URL } from '@shared/constants';

// WebSocket connection for remote management
let ws: WebSocket | null = null;
let reconnectInterval: number | null = null;

// Install event
chrome.runtime.onInstalled.addListener(async (details) => {
  logger.info('Extension installed/updated:', details.reason);
  
  // Initialize storage
  await initializeStorage();
  
  // Create context menus
  createContextMenus();
  
  // Setup declarativeNetRequest rules for ad blocking
  setupAdBlocker();
  
  logger.info('Emare Ads initialized successfully');
});

// Initialize default storage
async function initializeStorage() {
  const existing = await storage.get(STORAGE_KEYS.CONFIG);
  
  if (!existing) {
    await storage.set(STORAGE_KEYS.CONFIG, {
      apiUrl: API_BASE_URL,
      wsUrl: WS_URL,
      features: {
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
      }
    });
    
    await storage.set(STORAGE_KEYS.RULES, []);
    logger.info('Default configuration created');
  }
}

// Create context menus
function createContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.SCRAPE,
      title: '📋 Scrape this page',
      contexts: ['page', 'selection']
    });
    
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.SCREENSHOT,
      title: '📸 Take screenshot',
      contexts: ['page']
    });
    
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.EXTRACT_DATA,
      title: '🔍 Extract data',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.TRANSLATE,
      title: '🌐 Translate',
      contexts: ['selection']
    });
    
    chrome.contextMenus.create({
      id: CONTEXT_MENU_IDS.AI_ANALYZE,
      title: '🤖 AI Analyze',
      contexts: ['page', 'selection']
    });
  });
}

// Context menu click handler
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;
  
  switch (info.menuItemId) {
    case CONTEXT_MENU_IDS.SCRAPE:
      await sendMessageToTab(tab.id, { type: 'SCRAPE_PAGE' });
      break;
      
    case CONTEXT_MENU_IDS.SCREENSHOT:
      await takeScreenshot(tab.id);
      break;
      
    case CONTEXT_MENU_IDS.EXTRACT_DATA:
      await sendMessageToTab(tab.id, { 
        type: 'EXTRACT_DATA',
        data: { selection: info.selectionText }
      });
      break;
      
    case CONTEXT_MENU_IDS.TRANSLATE:
      await sendMessageToTab(tab.id, {
        type: 'TRANSLATE_PAGE',
        data: { text: info.selectionText }
      });
      break;
      
    case CONTEXT_MENU_IDS.AI_ANALYZE:
      await sendMessageToTab(tab.id, { type: 'AI_ANALYZE' });
      break;
  }
});

// Message handler from content scripts and popup
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // async response
});

// Main message handler
async function handleMessage(message: Message, sender: chrome.runtime.MessageSender) {
  try {
    switch (message.type) {
      case 'SCRAPE_PAGE':
        return await scrapePage(sender.tab?.id);
        
      case 'TAKE_SCREENSHOT':
        return await takeScreenshot(sender.tab?.id);
        
      case 'GET_COOKIES':
        return await getCookies(message.data?.url);
        
      case 'SET_COOKIES':
        return await setCookies(message.data);
        
      case 'BLOCK_ADS':
        return await toggleAdBlocker(message.data?.enabled);
        
      case 'SYNC_SETTINGS':
        return await syncWithBackend();
        
      case 'REMOTE_COMMAND':
        return await executeRemoteCommand(message.data);
        
      default:
        logger.warn('Unknown message type:', message.type);
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error: any) {
    logger.error('Message handling error:', error);
    return { success: false, error: error.message };
  }
}

// Scrape page
async function scrapePage(tabId?: number) {
  if (!tabId) return { success: false, error: 'No tab ID' };
  
  try {
    const [result] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        return {
          url: window.location.href,
          title: document.title,
          content: document.body.innerText,
          images: Array.from(document.images).map(img => img.src),
          links: Array.from(document.links).map(a => a.href),
          metadata: {
            description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
            keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content'),
          },
          timestamp: Date.now()
        };
      }
    });
    
    // Save to storage
    const scraped = await storage.get(STORAGE_KEYS.SCRAPED_DATA) || [];
    scraped.push(result.result);
    await storage.set(STORAGE_KEYS.SCRAPED_DATA, scraped);
    
    // Send to backend
    await sendToBackend('/api/scrape', result.result);
    
    return { success: true, data: result.result };
  } catch (error: any) {
    logger.error('Scraping error:', error);
    return { success: false, error: error.message };
  }
}

// Take screenshot
async function takeScreenshot(tabId?: number) {
  if (!tabId) return { success: false, error: 'No tab ID' };
  
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
    const tab = await chrome.tabs.get(tabId);
    
    const screenshot = {
      dataUrl,
      timestamp: Date.now(),
      url: tab.url || ''
    };
    
    // Save to storage
    const screenshots = await storage.get(STORAGE_KEYS.SCREENSHOTS) || [];
    screenshots.push(screenshot);
    await storage.set(STORAGE_KEYS.SCREENSHOTS, screenshots);
    
    // Send to backend
    await sendToBackend('/api/screenshot', screenshot);
    
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon48.png',
      title: 'Screenshot captured',
      message: `Screenshot saved: ${tab.title}`
    });
    
    return { success: true, data: screenshot };
  } catch (error: any) {
    logger.error('Screenshot error:', error);
    return { success: false, error: error.message };
  }
}

// Get cookies
async function getCookies(url?: string) {
  try {
    const cookies = await chrome.cookies.getAll(url ? { url } : {});
    return { success: true, data: cookies };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Set cookies
async function setCookies(cookieData: any) {
  try {
    await chrome.cookies.set(cookieData);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Toggle ad blocker
async function toggleAdBlocker(enabled: boolean) {
  const config = await storage.get(STORAGE_KEYS.CONFIG);
  if (config) {
    config.features.adBlocker = enabled;
    await storage.set(STORAGE_KEYS.CONFIG, config);
  }
  
  if (enabled) {
    await setupAdBlocker();
  } else {
    // Remove rules
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [1]
    });
  }
  
  return { success: true };
}

// Setup ad blocker using declarativeNetRequest
async function setupAdBlocker() {
  const config = await storage.get(STORAGE_KEYS.CONFIG);
  if (!config?.features?.adBlocker) return;
  
  // Basic ad blocking rule (production'da daha kapsamlı olmalı)
  const rules = [
    {
      id: 1,
      priority: 1,
      action: { type: 'block' as chrome.declarativeNetRequest.RuleActionType },
      condition: {
        urlFilter: '*://*.doubleclick.net/*',
        resourceTypes: ['script' as chrome.declarativeNetRequest.ResourceType, 'xmlhttprequest' as chrome.declarativeNetRequest.ResourceType]
      }
    }
  ];
  
  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
      removeRuleIds: [1]
    });
    logger.info('Ad blocker rules updated');
  } catch (error) {
    logger.error('Ad blocker setup error:', error);
  }
}

// Send data to backend
async function sendToBackend(endpoint: string, data: any) {
  const config = await storage.get(STORAGE_KEYS.CONFIG);
  if (!config?.apiUrl) return;
  
  try {
    const response = await fetch(`${config.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey || ''}`
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      throw new Error(`Backend request failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    logger.error('Backend request error:', error);
    return null;
  }
}

// Sync with backend
async function syncWithBackend() {
  const config = await storage.get(STORAGE_KEYS.CONFIG);
  if (!config?.apiUrl) {
    return { success: false, error: 'No API URL configured' };
  }
  
  try {
    const response = await fetch(`${config.apiUrl}/api/sync`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey || ''}`
      }
    });
    
    if (response.ok) {
      const serverConfig = await response.json();
      // Merge server config
      await storage.set(STORAGE_KEYS.CONFIG, {
        ...config,
        ...serverConfig
      });
      
      return { success: true };
    }
    
    return { success: false, error: 'Sync failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Execute remote command from backend
async function executeRemoteCommand(command: RemoteCommand) {
  logger.info('Executing remote command:', command.command);
  
  try {
    const tab = await getCurrentTab();
    
    switch (command.command) {
      case 'scrape':
        return await scrapePage(tab.id);
        
      case 'screenshot':
        return await takeScreenshot(tab.id);
        
      case 'navigate':
        if (tab.id && command.params.url) {
          await chrome.tabs.update(tab.id, { url: command.params.url });
          return { success: true };
        }
        break;
        
      case 'inject_css':
        if (tab.id && command.params.css) {
          await chrome.scripting.insertCSS({
            target: { tabId: tab.id },
            css: command.params.css
          });
          return { success: true };
        }
        break;
        
      case 'execute_script':
        if (tab.id && command.params.code) {
          const result = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: new Function(command.params.code) as any
          });
          return { success: true, data: result };
        }
        break;
    }
    
    return { success: false, error: 'Unknown command' };
  } catch (error: any) {
    logger.error('Remote command execution error:', error);
    return { success: false, error: error.message };
  }
}

// WebSocket connection for real-time remote management
async function connectWebSocket() {
  const config = await storage.get(STORAGE_KEYS.CONFIG);
  if (!config?.wsUrl) return;
  
  try {
    ws = new WebSocket(`${config.wsUrl}?userId=${config.userId || 'anonymous'}`);
    
    ws.onopen = () => {
      logger.info('WebSocket connected');
      if (reconnectInterval) {
        clearInterval(reconnectInterval);
        reconnectInterval = null;
      }
    };
    
    ws.onmessage = async (event) => {
      try {
        const command = JSON.parse(event.data) as RemoteCommand;
        logger.info('Received remote command:', command);
        
        const result = await executeRemoteCommand(command);
        
        // Send result back
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            commandId: command.id,
            result
          }));
        }
      } catch (error) {
        logger.error('WebSocket message handling error:', error);
      }
    };
    
    ws.onerror = (error) => {
      logger.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      logger.warn('WebSocket disconnected, will reconnect...');
      ws = null;
      
      // Auto reconnect
      if (!reconnectInterval) {
        reconnectInterval = setInterval(() => {
          connectWebSocket();
        }, 5000) as any;
      }
    };
  } catch (error) {
    logger.error('WebSocket connection error:', error);
  }
}

// Connect WebSocket on startup
connectWebSocket();

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  logger.info('Service worker started');
  connectWebSocket();
});

// Alarm for periodic tasks
chrome.alarms.create('periodic-sync', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodic-sync') {
    syncWithBackend();
  }
});

logger.info('Background service worker loaded');
