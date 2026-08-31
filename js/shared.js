(() => {
  "use strict";

  const STORAGE_KEYS = {
    settings: "shajan_settings",
    links: "shajan_links",
    pageViews: "shajan_page_views",
    clicks: "shajan_clicks"
  };

  const DEFAULT_SETTINGS = {
    id: 1,
    brand_name: "شَجَن",
    page_title: "شَجَن",
    bio: "جميع روابطنا في مكان واحد",
    logo_url: "",
    background_type: "color",
    background_color: "#f5f2e8",
    background_image_url: "",
    button_color: "#6f7654",
    button_text_color: "#ffffff",
    button_radius: 18,
    button_shadow: true,
    footer_text: "جميع الحقوق محفوظة لشَجَن"
  };

  const DEFAULT_LINKS = [
    {
      id: "demo-whatsapp",
      title: "تواصلي معنا عبر واتساب",
      url: "https://wa.me/966501008713",
      icon: "whatsapp",
      is_visible: true,
      open_new_tab: true,
      sort_order: 0
    },
    {
      id: "demo-instagram",
      title: "Instagram",
      url: "https://instagram.com/",
      icon: "instagram",
      is_visible: true,
      open_new_tab: true,
      sort_order: 1
    }
  ];

  const ICONS = {
    link: "fa-solid fa-link",
    globe: "fa-solid fa-globe",
    instagram: "fa-brands fa-instagram",
    tiktok: "fa-brands fa-tiktok",
    whatsapp: "fa-brands fa-whatsapp",
    youtube: "fa-brands fa-youtube",
    snapchat: "fa-brands fa-snapchat",
    "x-twitter": "fa-brands fa-x-twitter",
    facebook: "fa-brands fa-facebook",
    linkedin: "fa-brands fa-linkedin",
    "shopping-bag": "fa-solid fa-bag-shopping",
    envelope: "fa-solid fa-envelope",
    phone: "fa-solid fa-phone"
  };

  function isConfigured() {
    const config = window.SHAGEN_CONFIG || {};
    return Boolean(
      config.supabaseUrl &&
      config.supabaseAnonKey &&
      !config.supabaseUrl.includes("YOUR_") &&
      !config.supabaseAnonKey.includes("YOUR_") &&
      window.supabase?.createClient
    );
  }

  let client = null;
  function getClient() {
    if (!isConfigured()) return null;
    if (!client) {
      client = window.supabase.createClient(
        window.SHAGEN_CONFIG.supabaseUrl,
        window.SHAGEN_CONFIG.supabaseAnonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true
          }
        }
      );
    }
    return client;
  }

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`تعذر قراءة ${key}`, error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getLocalSettings() {
    const saved = readJson(STORAGE_KEYS.settings, null);
    return { ...DEFAULT_SETTINGS, ...(saved || {}) };
  }

  function saveLocalSettings(settings) {
    const merged = { ...DEFAULT_SETTINGS, ...settings, id: 1 };
    writeJson(STORAGE_KEYS.settings, merged);
    return merged;
  }

  function getLocalLinks() {
    const saved = readJson(STORAGE_KEYS.links, null);
    const links = Array.isArray(saved) ? saved : DEFAULT_LINKS;
    return [...links].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  }

  function saveLocalLinks(links) {
    const sorted = [...links].sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
    writeJson(STORAGE_KEYS.links, sorted);
    return sorted;
  }

  function createId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `link-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function iconClass(icon) {
    return ICONS[icon] || ICONS.link;
  }

  function normalizeUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";

    const lower = raw.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("data:text/html")) {
      throw new Error("نوع الرابط غير مسموح.");
    }

    if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw;
    return `https://${raw}`;
  }

  function safeImageUrl(value) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    if (/^(https?:|data:image\/)/i.test(raw)) return raw;
    return "";
  }

  function incrementLocalPageViews() {
    const current = Number(localStorage.getItem(STORAGE_KEYS.pageViews) || 0);
    localStorage.setItem(STORAGE_KEYS.pageViews, String(current + 1));
  }

  function incrementLocalClick(linkId) {
    const clicks = readJson(STORAGE_KEYS.clicks, {});
    clicks[linkId] = Number(clicks[linkId] || 0) + 1;
    writeJson(STORAGE_KEYS.clicks, clicks);
  }

  function getLocalAnalytics() {
    return {
      totalViews: Number(localStorage.getItem(STORAGE_KEYS.pageViews) || 0),
      clicks: readJson(STORAGE_KEYS.clicks, {})
    };
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  window.Shajan = {
    STORAGE_KEYS,
    DEFAULT_SETTINGS,
    DEFAULT_LINKS,
    ICONS,
    isConfigured,
    getClient,
    getLocalSettings,
    saveLocalSettings,
    getLocalLinks,
    saveLocalLinks,
    createId,
    iconClass,
    normalizeUrl,
    safeImageUrl,
    incrementLocalPageViews,
    incrementLocalClick,
    getLocalAnalytics,
    escapeHtml
  };
})();
