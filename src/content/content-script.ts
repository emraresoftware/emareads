// Content Script - Runs in every page
// Tüm sayfa manipülasyon yetenekleri burada

import type { Message } from '@shared/types';
import { logger } from '@shared/utils';

logger.info('Content script loaded for:', window.location.href);

// Inject the isolated script into page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = () => script.remove();
(document.head || document.documentElement).appendChild(script);

// Listen for messages from background
chrome.runtime.onMessage.addListener((message: Message, sender, sendResponse) => {
  handleMessage(message).then(sendResponse);
  return true; // async
});

// Handle messages
async function handleMessage(message: Message) {
  try {
    switch (message.type) {
      case 'SCRAPE_PAGE':
        return scrapePage();
        
      case 'FILL_FORM':
        return fillForm(message.data);
        
      case 'INJECT_CSS':
        return injectCSS(message.data.css);
        
      case 'EXTRACT_DATA':
        return extractData(message.data);
        
      case 'TRANSLATE_PAGE':
        return translatePage(message.data);
        
      case 'AI_ANALYZE':
        return analyzeWithAI();
        
      default:
        return { success: false, error: 'Unknown message type' };
    }
  } catch (error: any) {
    logger.error('Content script error:', error);
    return { success: false, error: error.message };
  }
}

// Scrape current page
function scrapePage() {
  try {
    const data = {
      url: window.location.href,
      title: document.title,
      content: document.body.innerText,
      html: document.documentElement.outerHTML,
      images: Array.from(document.images).map(img => ({
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height
      })),
      links: Array.from(document.links).map(a => ({
        href: a.href,
        text: a.textContent?.trim()
      })),
      headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        level: h.tagName,
        text: h.textContent?.trim()
      })),
      metadata: {
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        keywords: document.querySelector('meta[name="keywords"]')?.getAttribute('content'),
        author: document.querySelector('meta[name="author"]')?.getAttribute('content'),
        og: {
          title: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
          description: document.querySelector('meta[property="og:description"]')?.getAttribute('content'),
          image: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        }
      },
      forms: Array.from(document.forms).map(form => ({
        action: form.action,
        method: form.method,
        fields: Array.from(form.elements).map((el: any) => ({
          type: el.type,
          name: el.name,
          id: el.id,
          placeholder: el.placeholder
        }))
      })),
      timestamp: Date.now()
    };
    
    logger.info('Page scraped:', data.title);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Fill form automatically
function fillForm(formData: { selector: string; fields: Record<string, string> }) {
  try {
    const form = document.querySelector<HTMLFormElement>(formData.selector);
    if (!form) {
      throw new Error('Form not found');
    }
    
    for (const [name, value] of Object.entries(formData.fields)) {
      const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
      if (input) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
    
    logger.info('Form filled successfully');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Inject custom CSS
function injectCSS(css: string) {
  try {
    const existingStyle = document.getElementById('emare-custom-css');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'emare-custom-css';
    style.textContent = css;
    document.head.appendChild(style);
    
    logger.info('Custom CSS injected');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Extract specific data from page
function extractData(params: { selection?: string; selectors?: string[] }) {
  try {
    const result: any = {};
    
    if (params.selection) {
      result.selection = params.selection;
    }
    
    if (params.selectors) {
      result.extracted = {};
      for (const selector of params.selectors) {
        const elements = document.querySelectorAll(selector);
        result.extracted[selector] = Array.from(elements).map(el => ({
          text: el.textContent?.trim(),
          html: el.innerHTML,
          attributes: Array.from((el as HTMLElement).attributes).reduce((acc, attr) => {
            acc[attr.name] = attr.value;
            return acc;
          }, {} as Record<string, string>)
        }));
      }
    }
    
    logger.info('Data extracted');
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Translate page (basit implementasyon, production'da Google Translate API kullan)
async function translatePage(params: { text?: string; targetLang?: string }) {
  try {
    // Bu basit bir örnek, gerçekte Google Translate API veya Emare AI kullanılacak
    const text = params.text || document.body.innerText;
    
    // Simulate translation
    logger.info('Translation requested for text length:', text.length);
    
    return { 
      success: true, 
      data: {
        original: text,
        translated: text, // Production'da gerçek çeviri
        targetLang: params.targetLang || 'tr'
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// AI analyze page
async function analyzeWithAI() {
  try {
    const pageData = scrapePage();
    
    if (!pageData.success) {
      throw new Error('Failed to scrape page');
    }
    
    // Send to Emare AI backend for analysis
    logger.info('Sending page data to AI for analysis');
    
    // This would call Emare AI API in production
    return {
      success: true,
      data: {
        summary: 'AI analysis result will appear here',
        keywords: [],
        sentiment: 'neutral',
        topics: []
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Auto-detect and block ads (DOM-based)
function blockAds() {
  const adSelectors = [
    '[id*="ad-"]',
    '[class*="ad-"]',
    '[class*="advertisement"]',
    'iframe[src*="doubleclick"]',
    'iframe[src*="googlesyndication"]',
    'iframe[src*="ads"]',
    '.sponsored',
    '.ad-banner',
    '.ad-container'
  ];
  
  for (const selector of adSelectors) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
      logger.info('Ad blocked:', selector);
    });
  }
}

// Monitor DOM changes for dynamic ads
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      blockAds();
    }
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Initial ad blocking
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', blockAds);
} else {
  blockAds();
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+E: Open popup (handled by manifest)
  // Ctrl+Shift+S: Quick screenshot
  if (e.ctrlKey && e.shiftKey && e.key === 'S') {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'TAKE_SCREENSHOT' });
  }
  
  // Ctrl+Shift+D: Scrape page
  if (e.ctrlKey && e.shiftKey && e.key === 'D') {
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'SCRAPE_PAGE' });
  }
});

// Dark mode injection (example)
function applyDarkMode() {
  const darkCSS = `
    html, body {
      background-color: #1a1a1a !important;
      color: #e0e0e0 !important;
    }
    
    * {
      background-color: #1a1a1a !important;
      color: #e0e0e0 !important;
      border-color: #333 !important;
    }
    
    img, video {
      filter: brightness(0.8);
    }
  `;
  
  injectCSS(darkCSS);
}

// Listen for dark mode toggle
chrome.storage.onChanged.addListener((changes) => {
  if (changes.emare_config?.newValue?.features?.darkMode) {
    applyDarkMode();
  }
});

logger.info('Content script ready');
