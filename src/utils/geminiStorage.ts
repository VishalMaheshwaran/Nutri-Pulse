// src/utils/geminiStorage.ts

const API_KEY_STORAGE_KEY = 'nutripulse_user_gemini_api_key';

// 1. Retrieve the API key from local storage
export const getStoredApiKey = (): string => {
  return localStorage.getItem(API_KEY_STORAGE_KEY) || '';
};

// 2. Save the API key to local storage (or remove it if empty)
export const setStoredApiKey = (key: string): void => {
  if (!key.trim()) {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } else {
    localStorage.setItem(API_KEY_STORAGE_KEY, key.trim());
  }
};

// 3. Helper to easily check if a key exists
export const hasConnectedApiKey = (): boolean => {
  return getStoredApiKey().length > 10;
};

// 4. Test if the key actually works by making a lightweight request
export const testGeminiApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey.trim()) return false;
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: 'ping' }] }] })
    });
    
    const data = await res.json();
    return res.ok && !data.error;
  } catch (err) {
    return false;
  }
};

// 5. The Infinite-Retry Wrapper that ignores usage spikes and 503 errors
export async function callGeminiWithInfiniteRetry<T>(
  apiCallFn: (apiKey: string) => Promise<T>,
  onRetryStatus?: (attempt: number, message: string) => void,
  abortSignal?: AbortSignal
): Promise<T> {
  const apiKey = getStoredApiKey();
  
  if (!apiKey) {
    throw new Error('NO_API_KEY');
  }

  let attempt = 0;

  while (true) {
    if (abortSignal?.aborted) {
      throw new Error('ABORTED');
    }

    try {
      attempt++;
      return await apiCallFn(apiKey);
    } catch (err: any) {
      const msg = (err?.message || String(err)).toLowerCase();

      // Stop immediately ONLY if the API key itself is invalid or unauthorized
      if (msg.includes('api_key_invalid') || msg.includes('401') || msg.includes('403') || msg.includes('invalid api key')) {
        throw new Error('INVALID_API_KEY');
      }

      // For temporary usage spikes (429), server errors (503), or network hiccups:
      // Ignore the error, wait a few seconds, and keep retrying in the background.
      const waitTimeMs = Math.min(2000 + attempt * 1000, 6000); // Waits 3s -> 4s -> 5s -> 6s max
      
      if (onRetryStatus) {
        onRetryStatus(
          attempt,
          `AI server is busy (attempt ${attempt}) — holding your request...`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
    }
  }
} 