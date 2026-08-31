(() => {
  "use strict";

  const authScreen = document.getElementById("authScreen");
  const dashboard = document.getElementById("dashboard");
  const loginForm = document.getElementById("loginForm");
  const loginFields = document.getElementById("loginFields");
  const loginButton = document.getElementById("loginButton");
  const localModeNotice = document.getElementById("localModeNotice");
  const logoutButton = document.getElementById("logoutButton");
  const modeBadge = document.getElementById("modeBadge");
  const globalNotice = document.getElementById("globalNotice");
  const toast = document.getElementById("toast");

  const settingsForm = document.getElementById("settingsForm");
  const linkForm = document.getElementById("linkForm");
  const cancelEditButton = document.getElementById("cancelEditButton");
  const adminLinksList = document.getElementById("adminLinksList");
  const linksCount = document.getElementById("linksCount");

  const settingsFields = {
    brandName: document.getElementById("brandName"),
    pageTitle: document.getElementById("pageTitleInput"),
    bio: document.getElementById("pageBioInput"),
    footerText: document.getElementById("footerText"),
    logoUrl: document.getElementById("logoUrl"),
    backgroundColor: document.getElementById("backgroundColor"),
    backgroundColorText: document.getElementById("backgroundColorText"),
    backgroundImageUrl: document.getElementById("backgroundImageUrl"),
    buttonColor: document.getElementById("buttonColor"),
    buttonColorText: document.getElementById("buttonColorText"),
    buttonTextColor: document.getElementById("buttonTextColor"),
    buttonTextColorText: document.getElementById("buttonTextColorText"),
    buttonRadius: document.getElementById("buttonRadius"),
    buttonShadow: document.getElementById("buttonShadow")
  };

  const linkFields = {
    id: document.getElementById("linkId"),
    title: document.getElementById("linkTitle"),
    url: document.getElementById("linkUrl"),
    icon: document.getElementById("linkIcon"),
    visible: document.getElementById("linkVisible"),
    newTab: document.getElementById("linkNewTab")
  };

  let settings = { ...Shajan.DEFAULT_SETTINGS };
  let links = [];
  let sortable = null;
  let toastTimer = null;

  const tabMeta = {
    appearance: ["تخصيص المظهر", "عدّلي هوية الصفحة والخلفية والأزرار."],
    links: ["إدارة الروابط", "أضيفي الروابط وعدّليها ورتّبيها."],
    analytics: ["التحليلات", "تابعي الزيارات والنقرات على كل رابط."]
  };

  function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.className = `toast show${type === "error" ? " error" : ""}`;
    toastTimer = setTimeout(() => {
      toast.className = "toast";
    }, 3200);
  }

  function showNotice(message, type = "warning") {
    globalNotice.textContent = message;
    globalNotice.className = `notice ${type}`;
  }

  function hideNotice() {
    globalNotice.className = "notice hidden";
    globalNotice.textContent = "";
  }

  function setLoading(button, isLoading, originalText) {
    button.disabled = isLoading;
    button.innerHTML = isLoading
      ? '<i class="fa-solid fa-circle-notch fa-spin"></i> جارٍ التنفيذ...'
      : originalText;
  }

  async function initializeAuth() {
    if (!Shajan.isConfigured()) {
      localModeNotice.classList.remove("hidden");
      loginFields.classList.add("hidden");
      loginButton.innerHTML = '<i class="fa-solid fa-flask"></i> دخول الوضع التجريبي';
      modeBadge.textContent = "وضع محلي";
      return;
    }

    modeBadge.textContent = "Supabase";
    const client = Shajan.getClient();
    const { data } = await client.auth.getSession();
    if (data.session) {
      showDashboard();
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!Shajan.isConfigured()) {
      showDashboard();
      return;
    }

    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    const original = '<i class="fa-solid fa-right-to-bracket"></i> دخول';

    try {
      setLoading(loginButton, true, original);
      const { error } = await Shajan.getClient().auth.signInWithPassword({ email, password });
      if (error) throw error;
      showDashboard();
    } catch (error) {
      showToast(error.message || "تعذر تسجيل الدخول.", "error");
    } finally {
      setLoading(loginButton, false, original);
    }
  });

  logoutButton.addEventListener("click", async () => {
    if (Shajan.isConfigured()) {
      await Shajan.getClient().auth.signOut();
      dashboard.classList.add("hidden");
      authScreen.classList.remove("hidden");
    } else {
      dashboard.classList.add("hidden");
      authScreen.classList.remove("hidden");
    }
  });

  async function showDashboard() {
    authScreen.classList.add("hidden");
    dashboard.classList.remove("hidden");
    await loadAllData();
  }

  async function loadAllData() {
    hideNotice();
    try {
      if (!Shajan.isConfigured()) {
        settings = Shajan.getLocalSettings();
        links = Shajan.getLocalLinks();
      } else {
        const client = Shajan.getClient();
        const [settingsResult, linksResult] = await Promise.all([
          client.from("site_settings").select("*").eq("id", 1).maybeSingle(),
          client.from("links").select("*").order("sort_order", { ascending: true })
        ]);

        if (settingsResult.error) throw settingsResult.error;
        if (linksResult.error) throw linksResult.error;

        settings = { ...Shajan.DEFAULT_SETTINGS, ...(settingsResult.data || {}) };
        links = linksResult.data || [];
      }

      fillSettingsForm();
      renderAdminLinks();
      updateButtonPreview();
    } catch (error) {
      console.error(error);
      showNotice("تعذر تحميل البيانات. راجعي إعدادات Supabase وسياسات قاعدة البيانات.", "error");
    }
  }

  function fillSettingsForm() {
    settingsFields.brandName.value = settings.brand_name || "";
    settingsFields.pageTitle.value = settings.page_title || "";
    settingsFields.bio.value = settings.bio || "";
    settingsFields.footerText.value = settings.footer_text || "";
    settingsFields.logoUrl.value = settings.logo_url || "";
    settingsFields.backgroundColor.value = settings.background_color || "#f5f2e8";
    settingsFields.backgroundColorText.value = settings.background_color || "#f5f2e8";
    settingsFields.backgroundImageUrl.value = settings.background_image_url || "";
    settingsFields.buttonColor.value = settings.button_color || "#6f7654";
    settingsFields.buttonColorText.value = settings.button_color || "#6f7654";
    settingsFields.buttonTextColor.value = settings.button_text_color || "#ffffff";
    settingsFields.buttonTextColorText.value = settings.button_text_color || "#ffffff";
    settingsFields.buttonRadius.value = String(settings.button_radius || 18);
    settingsFields.buttonShadow.checked = Boolean(settings.button_shadow);

    const backgroundType = settings.background_type === "image" ? "image" : "color";
    document.querySelector(`input[name="backgroundType"][value="${backgroundType}"]`).checked = true;
  }

  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = settingsForm.querySelector('button[type="submit"]');
    const original = '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديلات';

    const payload = {
      id: 1,
      brand_name: settingsFields.brandName.value.trim(),
      page_title: settingsFields.pageTitle.value.trim(),
      bio: settingsFields.bio.value.trim(),
      footer_text: settingsFields.footerText.value.trim(),
      logo_url: settingsFields.logoUrl.value.trim(),
      background_type: document.querySelector('input[name="backgroundType"]:checked').value,
      background_color: settingsFields.backgroundColor.value,
      background_image_url: settingsFields.backgroundImageUrl.value.trim(),
      button_color: settingsFields.buttonColor.value,
      button_text_color: settingsFields.buttonTextColor.value,
      button_radius: Number(settingsFields.buttonRadius.value),
      button_shadow: settingsFields.buttonShadow.checked,
      updated_at: new Date().toISOString()
    };

    try {
      setLoading(submitButton, true, original);
      if (!Shajan.isConfigured()) {
        settings = Shajan.saveLocalSettings(payload);
      } else {
        const { data, error } = await Shajan.getClient()
          .from("site_settings")
          .upsert(payload)
          .select()
          .single();
        if (error) throw error;
        settings = data;
      }
      showToast("تم حفظ إعدادات الصفحة.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "تعذر حفظ الإعدادات.", "error");
    } finally {
      setLoading(submitButton, false, original);
    }
  });

  function syncColor(colorInput, textInput, updatePreview = false) {
    colorInput.addEventListener("input", () => {
      textInput.value = colorInput.value;
      if (updatePreview) updateButtonPreview();
    });

    textInput.addEventListener("change", () => {
      if (/^#[0-9a-f]{6}$/i.test(textInput.value.trim())) {
        colorInput.value = textInput.value.trim();
        if (updatePreview) updateButtonPreview();
      } else {
        textInput.value = colorInput.value;
      }
    });
  }

  syncColor(settingsFields.backgroundColor, settingsFields.backgroundColorText);
  syncColor(settingsFields.buttonColor, settingsFields.buttonColorText, true);
  syncColor(settingsFields.buttonTextColor, settingsFields.buttonTextColorText, true);

  settingsFields.buttonRadius.addEventListener("change", updateButtonPreview);
  settingsFields.buttonShadow.addEventListener("change", updateButtonPreview);

  function updateButtonPreview() {
    const preview = document.getElementById("buttonPreview");
    preview.style.backgroundColor = settingsFields.buttonColor.value;
    preview.style.color = settingsFields.buttonTextColor.value;
    preview.style.borderRadius = `${settingsFields.buttonRadius.value}px`;
    preview.style.boxShadow = settingsFields.buttonShadow.checked
      ? "0 12px 28px rgba(58, 61, 43, 0.16)"
      : "none";
  }

  document.getElementById("logoFile").addEventListener("change", async (event) => {
    await handleImageUpload(event.target.files?.[0], "logos", settingsFields.logoUrl);
    event.target.value = "";
  });

  document.getElementById("backgroundFile").addEventListener("change", async (event) => {
    await handleImageUpload(event.target.files?.[0], "backgrounds", settingsFields.backgroundImageUrl);
    if (event.target.files?.[0]) {
      document.querySelector('input[name="backgroundType"][value="image"]').checked = true;
    }
    event.target.value = "";
  });

  async function handleImageUpload(file, folder, targetInput) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("الملف المختار ليس صورة.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast("حجم الصورة يجب ألا يتجاوز 5 ميجابايت.", "error");
      return;
    }

    try {
      if (!Shajan.isConfigured()) {
        const dataUrl = await fileToDataUrl(file);
        targetInput.value = dataUrl;
        showToast("تم تحميل الصورة محليًا. احفظي التعديلات.");
        return;
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const filePath = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${extension}`;
      const client = Shajan.getClient();
      const { error: uploadError } = await client.storage
        .from("site-assets")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });
      if (uploadError) throw uploadError;

      const { data } = client.storage.from("site-assets").getPublicUrl(filePath);
      targetInput.value = data.publicUrl;
      showToast("تم رفع الصورة. احفظي التعديلات.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "تعذر رفع الصورة.", "error");
    }
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  linkForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = linkForm.querySelector('button[type="submit"]');
    const editingId = linkFields.id.value;
    const original = editingId
      ? '<i class="fa-solid fa-floppy-disk"></i> حفظ التعديل'
      : '<i class="fa-solid fa-plus"></i> إضافة الرابط';

    let normalizedUrl;
    try {
      normalizedUrl = Shajan.normalizeUrl(linkFields.url.value);
    } catch (error) {
      showToast(error.message, "error");
      return;
    }

    const existing = links.find((item) => String(item.id) === editingId);
    const payload = {
      title: linkFields.title.value.trim(),
      url: normalizedUrl,
      icon: linkFields.icon.value,
      is_visible: linkFields.visible.checked,
      open_new_tab: linkFields.newTab.checked,
      sort_order: existing ? existing.sort_order : links.length,
      updated_at: new Date().toISOString()
    };

    try {
      setLoading(submitButton, true, original);

      if (!Shajan.isConfigured()) {
        if (existing) {
          links = links.map((item) =>
            String(item.id) === editingId ? { ...item, ...payload } : item
          );
        } else {
          links.push({
            ...payload,
            id: Shajan.createId(),
            created_at: new Date().toISOString()
          });
        }
        links = Shajan.saveLocalLinks(links);
      } else {
        const client = Shajan.getClient();
        if (existing) {
          const { error } = await client.from("links").update(payload).eq("id", editingId);
          if (error) throw error;
        } else {
          const { error } = await client.from("links").insert(payload);
          if (error) throw error;
        }
        await loadLinksOnly();
      }

      renderAdminLinks();
      resetLinkForm();
      showToast(existing ? "تم تعديل الرابط." : "تمت إضافة الرابط.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "تعذر حفظ الرابط.", "error");
    } finally {
      const currentLabel = linkFields.id.value
        ? '<i class="fa-solid fa-floppy-disk"></i> <span id="linkSubmitText">حفظ التعديل</span>'
        : '<i class="fa-solid fa-plus"></i> <span id="linkSubmitText">إضافة الرابط</span>';
      setLoading(submitButton, false, currentLabel);
    }
  });

  async function loadLinksOnly() {
    if (!Shajan.isConfigured()) return;
    const { data, error } = await Shajan.getClient()
      .from("links")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    links = data || [];
  }

  function renderAdminLinks() {
    adminLinksList.innerHTML = "";
    linksCount.textContent = `${links.length} رابط`;

    if (!links.length) {
      adminLinksList.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-link"></i>
          <p>لا توجد روابط بعد.</p>
        </div>`;
      if (sortable) {
        sortable.destroy();
        sortable = null;
      }
      return;
    }

    links
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
      .forEach((link) => {
        const item = document.createElement("div");
        item.className = `link-item${link.is_visible ? "" : " inactive"}`;
        item.dataset.id = link.id;

        const handle = document.createElement("div");
        handle.className = "drag-handle";
        handle.innerHTML = '<i class="fa-solid fa-grip-vertical" aria-hidden="true"></i>';

        const icon = document.createElement("div");
        icon.className = "link-item-icon";
        icon.innerHTML = `<i class="${Shajan.iconClass(link.icon)}" aria-hidden="true"></i>`;

        const content = document.createElement("div");
        content.className = "link-item-content";
        const title = document.createElement("strong");
        title.textContent = link.title;
        const url = document.createElement("small");
        url.textContent = link.url;
        content.append(title, url);

        const actions = document.createElement("div");
        actions.className = "link-item-actions";

        const toggle = createIconButton(
          link.is_visible ? "fa-solid fa-eye" : "fa-solid fa-eye-slash",
          link.is_visible ? "إخفاء الرابط" : "إظهار الرابط",
          () => toggleLink(link)
        );

        const edit = createIconButton("fa-solid fa-pen", "تعديل الرابط", () => editLink(link));
        const remove = createIconButton(
          "fa-solid fa-trash",
          "حذف الرابط",
          () => deleteLink(link),
          "danger"
        );

        actions.append(toggle, edit, remove);
        item.append(handle, icon, content, actions);
        adminLinksList.appendChild(item);
      });

    initializeSortable();
  }

  function createIconButton(iconClass, label, handler, extraClass = "") {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `icon-button ${extraClass}`.trim();
    button.title = label;
    button.setAttribute("aria-label", label);
    button.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;
    button.addEventListener("click", handler);
    return button;
  }

  function initializeSortable() {
    if (sortable) sortable.destroy();
    if (!window.Sortable) return;

    sortable = new Sortable(adminLinksList, {
      animation: 160,
      handle: ".drag-handle",
      ghostClass: "inactive",
      onEnd: persistOrder
    });
  }

  async function persistOrder() {
    const ids = [...adminLinksList.querySelectorAll(".link-item")].map((item) => item.dataset.id);
    links = ids.map((id, index) => {
      const link = links.find((item) => String(item.id) === String(id));
      return { ...link, sort_order: index };
    });

    try {
      if (!Shajan.isConfigured()) {
        links = Shajan.saveLocalLinks(links);
      } else {
        const client = Shajan.getClient();
        const updates = links.map((link) =>
          client.from("links").update({ sort_order: link.sort_order }).eq("id", link.id)
        );
        const results = await Promise.all(updates);
        const failed = results.find((result) => result.error);
        if (failed) throw failed.error;
      }
      showToast("تم حفظ ترتيب الروابط.");
    } catch (error) {
      console.error(error);
      showToast("تعذر حفظ الترتيب.", "error");
    }
  }

  function editLink(link) {
    linkFields.id.value = link.id;
    linkFields.title.value = link.title;
    linkFields.url.value = link.url;
    linkFields.icon.value = link.icon || "link";
    linkFields.visible.checked = Boolean(link.is_visible);
    linkFields.newTab.checked = Boolean(link.open_new_tab);
    document.getElementById("linkFormTitle").textContent = "تعديل الرابط";
    const submitText = document.getElementById("linkSubmitText");
    if (submitText) submitText.textContent = "حفظ التعديل";
    cancelEditButton.classList.remove("hidden");
    linkForm.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function resetLinkForm() {
    linkForm.reset();
    linkFields.id.value = "";
    linkFields.visible.checked = true;
    linkFields.newTab.checked = true;
    linkFields.icon.value = "link";
    document.getElementById("linkFormTitle").textContent = "إضافة رابط جديد";
    const submitText = document.getElementById("linkSubmitText");
    if (submitText) submitText.textContent = "إضافة الرابط";
    cancelEditButton.classList.add("hidden");
  }

  cancelEditButton.addEventListener("click", resetLinkForm);

  async function toggleLink(link) {
    const newValue = !link.is_visible;
    try {
      if (!Shajan.isConfigured()) {
        links = links.map((item) =>
          String(item.id) === String(link.id) ? { ...item, is_visible: newValue } : item
        );
        links = Shajan.saveLocalLinks(links);
      } else {
        const { error } = await Shajan.getClient()
          .from("links")
          .update({ is_visible: newValue, updated_at: new Date().toISOString() })
          .eq("id", link.id);
        if (error) throw error;
        await loadLinksOnly();
      }
      renderAdminLinks();
      showToast(newValue ? "تم إظهار الرابط." : "تم إخفاء الرابط.");
    } catch (error) {
      console.error(error);
      showToast("تعذر تحديث حالة الرابط.", "error");
    }
  }

  async function deleteLink(link) {
    const confirmed = confirm(`هل تريدين حذف رابط "${link.title}"؟`);
    if (!confirmed) return;

    try {
      if (!Shajan.isConfigured()) {
        links = links.filter((item) => String(item.id) !== String(link.id));
        links = links.map((item, index) => ({ ...item, sort_order: index }));
        links = Shajan.saveLocalLinks(links);
      } else {
        const { error } = await Shajan.getClient().from("links").delete().eq("id", link.id);
        if (error) throw error;
        await loadLinksOnly();
      }
      renderAdminLinks();
      resetLinkForm();
      showToast("تم حذف الرابط.");
    } catch (error) {
      console.error(error);
      showToast("تعذر حذف الرابط.", "error");
    }
  }

  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", async () => {
      const tab = button.dataset.tab;
      document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".tab-panel").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.getElementById(`tab-${tab}`).classList.add("active");
      document.getElementById("tabTitle").textContent = tabMeta[tab][0];
      document.getElementById("tabSubtitle").textContent = tabMeta[tab][1];
      if (tab === "analytics") await loadAnalytics();
    });
  });

  document.getElementById("refreshAnalytics").addEventListener("click", loadAnalytics);

  async function loadAnalytics() {
    const refreshButton = document.getElementById("refreshAnalytics");
    const original = '<i class="fa-solid fa-rotate"></i> تحديث البيانات';

    try {
      setLoading(refreshButton, true, original);
      let totalViews = 0;
      let clickCounts = {};

      if (!Shajan.isConfigured()) {
        const local = Shajan.getLocalAnalytics();
        totalViews = local.totalViews;
        clickCounts = local.clicks;
      } else {
        const client = Shajan.getClient();
        const { data, error } = await client.rpc("get_admin_analytics");
        if (error) throw error;

        totalViews = Number(data?.total_views || 0);
        clickCounts = data?.by_link || {};
      }

      const totalClicks = Object.values(clickCounts).reduce(
        (sum, value) => sum + Number(value || 0),
        0
      );
      const clickRate = totalViews ? ((totalClicks / totalViews) * 100).toFixed(1) : "0";

      document.getElementById("totalViews").textContent = totalViews.toLocaleString("ar-SA");
      document.getElementById("totalClicks").textContent = totalClicks.toLocaleString("ar-SA");
      document.getElementById("clickRate").textContent = `${clickRate}%`;
      renderAnalyticsTable(clickCounts);
    } catch (error) {
      console.error(error);
      showToast("تعذر تحميل التحليلات.", "error");
    } finally {
      setLoading(refreshButton, false, original);
    }
  }

  function renderAnalyticsTable(clickCounts) {
    const body = document.getElementById("analyticsTableBody");
    body.innerHTML = "";

    if (!links.length) {
      body.innerHTML = '<tr><td colspan="3" class="empty-table">لا توجد روابط بعد.</td></tr>';
      return;
    }

    const sorted = [...links].sort(
      (a, b) => Number(clickCounts[b.id] || 0) - Number(clickCounts[a.id] || 0)
    );

    sorted.forEach((link) => {
      const row = document.createElement("tr");

      const titleCell = document.createElement("td");
      titleCell.textContent = link.title;

      const statusCell = document.createElement("td");
      const status = document.createElement("span");
      status.className = `status-pill${link.is_visible ? "" : " off"}`;
      status.textContent = link.is_visible ? "ظاهر" : "مخفي";
      statusCell.appendChild(status);

      const clicksCell = document.createElement("td");
      clicksCell.textContent = Number(clickCounts[link.id] || 0).toLocaleString("ar-SA");

      row.append(titleCell, statusCell, clicksCell);
      body.appendChild(row);
    });
  }

  initializeAuth();
})();
