// Injected script - Runs in page context
// Sayfa context'inde çalışan script, DOM ve window objesine tam erişim

(function() {
  'use strict';
  
  console.log('[Emare Ads] Injected script loaded');
  
  // Create Emare namespace on window
  (window as any).Emare = {
    version: '1.0.0',
    
    // Network interceptor
    interceptRequests: function(callback: (url: string, data: any) => void) {
      const originalFetch = window.fetch;
      window.fetch = async function(...args) {
        const url = args[0].toString();
        console.log('[Emare] Intercepted fetch:', url);
        
        try {
          const response = await originalFetch.apply(this, args);
          const clonedResponse = response.clone();
          
          // Notify callback
          if (callback) {
            clonedResponse.json().then(data => callback(url, data)).catch(() => {});
          }
          
          return response;
        } catch (error) {
          console.error('[Emare] Fetch error:', error);
          throw error;
        }
      };
      
      // XMLHttpRequest interception
      const originalXHROpen = XMLHttpRequest.prototype.open;
      const originalXHRSend = XMLHttpRequest.prototype.send;
      
      XMLHttpRequest.prototype.open = function(...args: any[]) {
        (this as any)._emareUrl = args[1];
        return originalXHROpen.apply(this, args as any);
      };
      
      XMLHttpRequest.prototype.send = function(body) {
        const url = (this as any)._emareUrl;
        console.log('[Emare] Intercepted XHR:', url);
        
        this.addEventListener('load', function() {
          if (callback) {
            try {
              const data = JSON.parse(this.responseText);
              callback(url, data);
            } catch (e) {
              // Not JSON
            }
          }
        });
        
        return originalXHRSend.call(this, body);
      };
      
      console.log('[Emare] Request interceptor activated');
    },
    
    // Get all page data
    getPageData: function() {
      return {
        url: window.location.href,
        title: document.title,
        content: document.body.innerText,
        cookies: document.cookie,
        localStorage: { ...localStorage },
        sessionStorage: { ...sessionStorage },
        scripts: Array.from(document.scripts).map(s => s.src),
        stylesheets: Array.from(document.styleSheets).map((s: any) => s.href).filter(Boolean)
      };
    },
    
    // Execute code safely
    eval: function(code: string) {
      try {
        return eval(code);
      } catch (error) {
        console.error('[Emare] Eval error:', error);
        return null;
      }
    },
    
    // Monitor console
    monitorConsole: function(callback: (type: string, args: any[]) => void) {
      const original = {
        log: console.log,
        error: console.error,
        warn: console.warn,
        info: console.info
      };
      
      console.log = function(...args: any[]) {
        callback('log', args);
        return original.log.apply(console, args);
      };
      
      console.error = function(...args: any[]) {
        callback('error', args);
        return original.error.apply(console, args);
      };
      
      console.warn = function(...args: any[]) {
        callback('warn', args);
        return original.warn.apply(console, args);
      };
      
      console.info = function(...args: any[]) {
        callback('info', args);
        return original.info.apply(console, args);
      };
      
      console.log('[Emare] Console monitor activated');
    },
    
    // Auto-fill form
    fillForm: function(formSelector: string, data: Record<string, string>) {
      const form = document.querySelector<HTMLFormElement>(formSelector);
      if (!form) {
        console.error('[Emare] Form not found:', formSelector);
        return false;
      }
      
      for (const [name, value] of Object.entries(data)) {
        const input = form.querySelector<HTMLInputElement>(`[name="${name}"]`);
        if (input) {
          input.value = value;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
      
      console.log('[Emare] Form filled:', formSelector);
      return true;
    },
    
    // Click element
    clickElement: function(selector: string) {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        element.click();
        console.log('[Emare] Clicked:', selector);
        return true;
      }
      return false;
    },
    
    // Wait for element
    waitForElement: function(selector: string, timeout = 5000): Promise<Element | null> {
      return new Promise((resolve) => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
        
        const observer = new MutationObserver((mutations, obs) => {
          const element = document.querySelector(selector);
          if (element) {
            obs.disconnect();
            resolve(element);
          }
        });
        
        observer.observe(document.body, {
          childList: true,
          subtree: true
        });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeout);
      });
    },
    
    // Extract table data
    extractTable: function(tableSelector: string) {
      const table = document.querySelector<HTMLTableElement>(tableSelector);
      if (!table) return null;
      
      const rows = Array.from(table.rows);
      const headers = Array.from(rows[0]?.cells || []).map(cell => cell.textContent?.trim());
      
      const data = rows.slice(1).map(row => {
        const cells = Array.from(row.cells);
        const rowData: Record<string, string> = {};
        
        cells.forEach((cell, index) => {
          const header = headers[index] || `column_${index}`;
          rowData[header] = cell.textContent?.trim() || '';
        });
        
        return rowData;
      });
      
      console.log('[Emare] Table extracted:', tableSelector, data.length, 'rows');
      return data;
    }
  };
  
  // Notify extension that injected script is ready
  window.postMessage({ type: 'EMARE_INJECTED_READY' }, '*');
  
  console.log('[Emare Ads] Injected script ready, window.Emare available');
})();
