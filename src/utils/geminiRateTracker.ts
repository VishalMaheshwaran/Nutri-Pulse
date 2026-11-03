// src/utils/geminiRateTracker.ts

const USAGE_KEY = 'nutripulse_gemini_usage';

// Exact limits from your screenshot for Gemini 3.1 Flash Lite
const LIMITS = {
  RPD: 500,     // Requests Per Day
  RPM: 15,      // Requests Per Minute
  TPM: 250000,  // Tokens Per Minute
};

interface UsageStats {
  date: string; // YYYY-MM-DD
  dailyRequests: number;
  minuteRequests: number[]; // Array of timestamps (ms)
  minuteTokens: { timestamp: number; tokens: number }[];
}

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const loadStats = (): UsageStats => {
  const data = localStorage.getItem(USAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch { /* ignore bad data */ }
  }
  return { date: getTodayDateString(), dailyRequests: 0, minuteRequests: [], minuteTokens: [] };
};

const saveStats = (stats: UsageStats) => {
  localStorage.setItem(USAGE_KEY, JSON.stringify(stats));
};

const pruneOldStats = (stats: UsageStats): UsageStats => {
  const now = Date.now();
  const today = getTodayDateString();
  const oneMinuteAgo = now - 60000;

  // Reset daily count if it's a new day
  if (stats.date !== today) {
    stats.date = today;
    stats.dailyRequests = 0;
  }

  // Remove timestamps older than 60 seconds
  stats.minuteRequests = stats.minuteRequests.filter(ts => ts > oneMinuteAgo);
  stats.minuteTokens = stats.minuteTokens.filter(event => event.timestamp > oneMinuteAgo);

  return stats;
};

export const fetchWithStrictTracking = async (
  url: string,
  options: RequestInit,
  estimatedTokens: number = 1000 // Buffer estimation before exact count is returned
): Promise<Response> => {
  let stats = pruneOldStats(loadStats());
  const now = Date.now();

  // 1. Check Daily Limit (RPD)
  if (stats.dailyRequests >= LIMITS.RPD) {
    throw new Error(`Daily limit reached (${LIMITS.RPD}/${LIMITS.RPD}). Please try again tomorrow.`);
  }

  // 2. Check Minute Request Limit (RPM)
  if (stats.minuteRequests.length >= LIMITS.RPM) {
    const oldestReq = stats.minuteRequests[0];
    const waitTime = Math.ceil((oldestReq + 60000 - now) / 1000);
    throw new Error(`Minute limit reached (${LIMITS.RPM}/${LIMITS.RPM} reqs). Wait ${waitTime} seconds.`);
  }

  // 3. Check Minute Token Limit (TPM)
  const currentTokensInMinute = stats.minuteTokens.reduce((sum, evt) => sum + evt.tokens, 0);
  if (currentTokensInMinute + estimatedTokens > LIMITS.TPM) {
    const waitTime = Math.ceil((stats.minuteTokens[0].timestamp + 60000 - now) / 1000);
    throw new Error(`Token limit reached. High volume detected. Wait ${waitTime} seconds.`);
  }

  // 4. Pre-register the request to block concurrent spam clicks
  stats.dailyRequests += 1;
  stats.minuteRequests.push(now);
  saveStats(stats);

  // 5. Execute API Call
  const response = await fetch(url, options);

  // 6. If request failed entirely on server side, rollback the daily count
  if (!response.ok) {
    const freshStats = loadStats();
    freshStats.dailyRequests = Math.max(0, freshStats.dailyRequests - 1);
    freshStats.minuteRequests.pop();
    saveStats(freshStats);
    return response;
  }

  // 7. Clone response to read exact tokens safely without consuming the JSON stream for the UI
  const clone = response.clone();
  try {
    const data = await clone.json();
    const actualTokens = data.usageMetadata?.totalTokenCount || estimatedTokens;
    
    // Update token usage with the precise amount Gemini reported
    const updatedStats = loadStats();
    updatedStats.minuteTokens.push({ timestamp: Date.now(), tokens: actualTokens });
    saveStats(updatedStats);
  } catch (err) {
    // If parsing fails, just keep the estimated token cost
    const fallbackStats = loadStats();
    fallbackStats.minuteTokens.push({ timestamp: Date.now(), tokens: estimatedTokens });
    saveStats(fallbackStats);
  }

  return response;
};