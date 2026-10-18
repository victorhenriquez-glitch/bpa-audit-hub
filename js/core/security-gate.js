/**
 * Bright Pink Agency — Security Gate & Data Sanitization (v2.0)
 * Multi-layer defensive security: HTML escaping, strict URL validation,
 * Looker Studio iframe embed whitelist, and runtime schema normalization.
 */

(function(window) {
  'use strict';

  // 1. Strict HTML Entity Sanitizer
  function sanitize(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 2. Strict URL Protocol Sanitizer (Blocks javascript:, data:, vbscript:)
  function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    if (trimmed.startsWith('#')) return trimmed;
    try {
      const parsed = new URL(trimmed, window.location ? window.location.origin : 'https://brightpinkagency.com');
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:' || parsed.protocol === 'mailto:') {
        return trimmed;
      }
      return '#';
    } catch (e) {
      // Relative path check
      if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
        return trimmed;
      }
      return '#';
    }
  }

  // 3. Strict Embed URL Whitelist for Looker Studio / Data Studio iframes
  const ALLOWED_EMBED_HOSTS = [
    'lookerstudio.google.com',
    'datastudio.google.com'
  ];

  function sanitizeEmbedUrl(url) {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== 'https:') return '';
      const host = parsed.hostname.toLowerCase();
      const isAllowed = ALLOWED_EMBED_HOSTS.some(h => host === h || host.endsWith('.' + h));
      if (!isAllowed) return '';
      return parsed.toString();
    } catch (e) {
      return '';
    }
  }

  // 4. Safe Number Resolver (Distinguishes 0 from undefined/null)
  function numOr(val, fallback) {
    if (typeof val === 'number' && !isNaN(val)) return val;
    if (typeof val === 'string' && val.trim() !== '' && !isNaN(Number(val))) return Number(val);
    return fallback !== undefined ? fallback : 0;
  }

  // 5. Client Schema Normalizer & Validator Gate
  function validateClientSchema(client) {
    if (!client || typeof client !== 'object') {
      throw new Error('Invalid client payload: expected an object.');
    }

    const validated = Object.assign({}, client);
    validated.clientName = validated.clientName || 'Unnamed Client';
    validated.clientSlug = validated.clientSlug || 'client';
    validated.domain = validated.domain || 'example.com';

    // Normalizing URLs
    if (validated.workbookUrl) validated.workbookUrl = sanitizeUrl(validated.workbookUrl);
    if (validated.gdocUrl) validated.gdocUrl = sanitizeUrl(validated.gdocUrl);
    if (validated.lookerStudioUrl) validated.lookerStudioUrl = sanitizeEmbedUrl(validated.lookerStudioUrl);

    // Defensive KPIs structure
    validated.kpis = validated.kpis || {};
    validated.kpis.totalCrawledUrls = numOr(validated.kpis.totalCrawledUrls, 0);
    validated.kpis.clean200HtmlPages = numOr(validated.kpis.clean200HtmlPages, 0);
    validated.kpis.indexableHtmlCount = numOr(validated.kpis.indexableHtmlCount, 0);
    validated.kpis.internal301Redirects = numOr(validated.kpis.internal301Redirects, 0);
    validated.kpis.broken404Pages = numOr(validated.kpis.broken404Pages, 0);
    validated.kpis.wafFalsePositive403 = numOr(validated.kpis.wafFalsePositive403, 0);

    // Health scores
    validated.kpis.healthScores = validated.kpis.healthScores || {};
    validated.kpis.healthScores.rawSemrushScore = numOr(validated.kpis.healthScores.rawSemrushScore, 85);
    validated.kpis.healthScores.calibratedTrueHealth = numOr(validated.kpis.healthScores.calibratedTrueHealth, 95);

    // Arrays
    validated.tasks = Array.isArray(validated.tasks) ? validated.tasks : [];
    validated.completedTasks = Array.isArray(validated.completedTasks) ? validated.completedTasks : [];
    validated.monthlyKpiReports = Array.isArray(validated.monthlyKpiReports) ? validated.monthlyKpiReports : [];

    return validated;
  }

  // Export to window
  window.sanitize = sanitize;
  window.sanitizeUrl = sanitizeUrl;
  window.sanitizeEmbedUrl = sanitizeEmbedUrl;
  window.numOr = numOr;
  window.validateClientSchema = validateClientSchema;

  window.BPA_SECURITY = {
    sanitize: sanitize,
    sanitizeUrl: sanitizeUrl,
    sanitizeEmbedUrl: sanitizeEmbedUrl,
    numOr: numOr,
    validateClientSchema: validateClientSchema
  };

})(typeof window !== 'undefined' ? window : global);
