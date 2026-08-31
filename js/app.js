(() => {
  "use strict";

  const linksContainer = document.getElementById("linksContainer");
  const pageBackground = document.getElementById("pageBackground");
  const brandLogo = document.getElementById("brandLogo");
  const brandFallback = document.getElementById("brandFallback");
  const pageTitle = document.getElementById("pageTitle");
  const pageBio = document.getElementById("pageBio");
  const pageFooter = document.getElementById("pageFooter");

  let currentSettings = { ...Shajan.DEFAULT_SETTINGS };

  async function loadPageData() {
    if (!Shajan.isConfigured()) {
      return {
        settings: Shajan.getLocalSettings(),
        links: Shajan.getLocalLinks().filter((item) => item.is_visible)
      };
    }

    const client = Shajan.getClient();
    const [settingsResult, linksResult] = await Promise.all([
      client.from("site_settings").select("*").eq("id", 1).maybeSingle(),
      client
        .from("links")
        .select("id,title,url,icon,is_visible,open_new_tab,sort_order")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true })
    ]);

    if (settingsResult.error) throw settingsResult.error;
    if (linksResult.error) throw linksResult.error;

    return {
      settings: { ...Shajan.DEFAULT_SETTINGS, ...(settingsResult.data || {}) },
      links: linksResult.data || []
    };
  }

  function applySettings(settings) {
    currentSettings = settings;
    const root = document.documentElement;

    const backgroundColor = settings.background_color || "#f5f2e8";
    const buttonColor = settings.button_color || "#6f7654";
    const buttonTextColor = settings.button_text_color || "#ffffff";
    const radius = Number(settings.button_radius || 18);
    const shadow = settings.button_shadow
      ? "0 14px 35px rgba(58, 61, 43, 0.18)"
      : "none";

    root.style.setProperty("--background-color", backgroundColor);
    root.style.setProperty("--button-color", buttonColor);
    root.style.setProperty("--button-text-color", buttonTextColor);
    root.style.setProperty("--button-radius", `${radius}px`);
    root.style.setProperty("--button-shadow", shadow);

    pageBackground.style.backgroundColor = backgroundColor;
    pageBackground.style.backgroundImage =
      settings.background_type === "image" && Shajan.safeImageUrl(settings.background_image_url)
        ? `url("${Shajan.safeImageUrl(settings.background_image_url)}")`
        : "none";

    const title = settings.page_title || settings.brand_name || "شَجَن";
    document.title = `روابط ${title}`;
    pageTitle.textContent = title;
    pageBio.textContent = settings.bio || "";
    pageFooter.textContent = settings.footer_text || "";

    const logoUrl = Shajan.safeImageUrl(settings.logo_url);
    if (logoUrl) {
      brandLogo.src = logoUrl;
      brandLogo.classList.remove("hidden");
      brandFallback.classList.add("hidden");
    } else {
      brandLogo.removeAttribute("src");
      brandLogo.classList.add("hidden");
      brandFallback.classList.remove("hidden");
      brandFallback.textContent = settings.brand_name || "شَجَن";
    }
  }

  function renderLinks(links) {
    linksContainer.innerHTML = "";

    if (!links.length) {
      const empty = document.createElement("div");
      empty.className = "empty-card";
      empty.textContent = "لا توجد روابط متاحة حاليًا.";
      linksContainer.appendChild(empty);
      return;
    }

    links.forEach((link) => {
      const anchor = document.createElement("a");
      anchor.className = "link-button";
      anchor.href = safeNormalize(link.url);
      anchor.target = link.open_new_tab ? "_blank" : "_self";
      if (link.open_new_tab) anchor.rel = "noopener noreferrer";
      anchor.dataset.linkId = link.id;

      const icon = document.createElement("i");
      icon.className = `${Shajan.iconClass(link.icon)} link-icon`;
      icon.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      text.textContent = link.title;

      const arrow = document.createElement("i");
      arrow.className = "fa-solid fa-arrow-up-left-from-circle link-arrow";
      arrow.setAttribute("aria-hidden", "true");

      anchor.append(icon, text, arrow);
      anchor.addEventListener("click", () => trackClick(link));
      linksContainer.appendChild(anchor);
    });
  }

  function safeNormalize(url) {
    try {
      return Shajan.normalizeUrl(url);
    } catch {
      return "#";
    }
  }

  async function trackPageView() {
    const sessionKey = "shajan_view_recorded";
    if (sessionStorage.getItem(sessionKey)) return;
    sessionStorage.setItem(sessionKey, "1");

    if (!Shajan.isConfigured()) {
      Shajan.incrementLocalPageViews();
      return;
    }

    const client = Shajan.getClient();
    const { error } = await client.from("page_views").insert({
      referrer: document.referrer || null
    });
    if (error) console.warn("تعذر تسجيل الزيارة.", error.message);
  }

  async function trackClick(link) {
    if (!Shajan.isConfigured()) {
      Shajan.incrementLocalClick(link.id);
      return;
    }

    const client = Shajan.getClient();
    const { error } = await client.from("click_events").insert({
      link_id: link.id,
      link_title: link.title,
      referrer: document.referrer || null
    });
    if (error) console.warn("تعذر تسجيل النقرة.", error.message);
  }

  function renderError(message) {
    linksContainer.innerHTML = "";
    const error = document.createElement("div");
    error.className = "error-card";
    error.textContent = message;
    linksContainer.appendChild(error);
  }

  async function init() {
    try {
      const { settings, links } = await loadPageData();
      applySettings(settings);
      renderLinks(links);
      await trackPageView();
    } catch (error) {
      console.error(error);
      applySettings(Shajan.DEFAULT_SETTINGS);
      renderError("تعذر تحميل الروابط. تحققي من إعدادات الاتصال ثم أعيدي المحاولة.");
    }
  }

  init();
})();
