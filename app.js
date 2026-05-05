"use strict";

const STORE_KEY = "vaultnote.encrypted.v1";
const CLIPBOARD_CLEAR_MS = 30000;
const icons = {
  plus: "M12 5v14M5 12h14",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  unlock: "M7 11V8a5 5 0 0 1 9.5-2.2M6 11h12v9H6z",
  copy: "M8 8h11v11H8zM5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1",
  eye: "M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  eyeOff: "M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a17.8 17.8 0 0 1-3.3 4.5M6.6 6.6C3.6 8.7 2 12 2 12a17.7 17.7 0 0 0 7.8 7.4",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z",
  trash: "M3 6h18M8 6V4h8v2M6 6l1 15h10l1-15",
  search: "M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  apple: "M15.5 4.5c-.9.8-1.8 1.3-3 1.2-.1-1.1.4-2.2 1.2-3 .8-.8 2-1.4 3-1.3.1 1.2-.4 2.3-1.2 3.1zM19 17.2c-.5 1.1-.8 1.6-1.5 2.6-1 1.4-2.3 3.1-4 3.1-1.5 0-1.9-1-3.9-1s-2.4 1-3.9 1c-1.7 0-3-1.6-4-3.1-2.8-4.1-3.1-8.9-1.4-11.5 1.2-1.8 3-2.8 4.8-2.8 1.9 0 3 1 4.5 1 1.5 0 2.4-1 4.5-1 1.6 0 3.2.9 4.4 2.3-3.9 2.1-3.3 7.7.5 9.4z",
  repeat: "M17 1l4 4-4 4M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 0 1-4 4H3",
  tag: "M20.5 13.5 13.5 20.5a2 2 0 0 1-2.8 0L3 12.8V3h9.8l7.7 7.7a2 2 0 0 1 0 2.8zM7.5 7.5h.01",
  shield: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  download: "M12 3v12M7 10l5 5 5-5M5 21h14",
  upload: "M12 21V9M7 14l5-5 5 5M5 3h14",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  settings: "M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM19.4 15a1.8 1.8 0 0 0 .4 2l.1.1-2 3.5-.2-.1a1.8 1.8 0 0 0-2 .4l-.2.2h-4l-.2-.2a1.8 1.8 0 0 0-2-.4l-.2.1-2-3.5.1-.1a1.8 1.8 0 0 0 .4-2l-.1-.3-2-1.2v-4l2-1.2.1-.3a1.8 1.8 0 0 0-.4-2l-.1-.1 2-3.5.2.1a1.8 1.8 0 0 0 2-.4l.2-.2h4l.2.2a1.8 1.8 0 0 0 2 .4l.2-.1 2 3.5-.1.1a1.8 1.8 0 0 0-.4 2l.1.3 2 1.2v4l-2 1.2z",
  chevronDown: "M6 9l6 6 6-6",
  chevronUp: "M18 15l-6-6-6 6",
  x: "M18 6 6 18M6 6l12 12",
  key: "M21 2l-2 2M15 8l-8.5 8.5a4 4 0 1 1-3-3L12 5a5 5 0 0 1 7 7zM7 17h.01",
};

const defaultData = {
  records: [],
  settings: { autoLockMinutes: 10 },
  updatedAt: new Date().toISOString(),
};

let state = {
  hasVault: false,
  unlocked: false,
  key: null,
  data: structuredClone(defaultData),
  activeView: "all",
  revealAll: false,
  expanded: new Set(),
  modal: null,
  toast: "",
  lockTimer: null,
};

const app = document.querySelector("#app");

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function enc(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function dec(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${icons[name]}"></path></svg>`;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptData(data, key, salt) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const body = new TextEncoder().encode(JSON.stringify(data));
  const cipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, body);
  return {
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations: 310000,
    salt: enc(salt),
    iv: enc(iv),
    cipher: enc(cipher),
  };
}

async function decryptVault(password, payload) {
  const salt = dec(payload.salt);
  const key = await deriveKey(password, salt);
  const body = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: dec(payload.iv) },
    key,
    dec(payload.cipher)
  );
  return { key, data: JSON.parse(new TextDecoder().decode(body)) };
}

function loadPayload() {
  const raw = localStorage.getItem(STORE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveVault() {
  if (!state.key) return;
  const existing = loadPayload();
  const salt = existing?.salt ? dec(existing.salt) : crypto.getRandomValues(new Uint8Array(16));
  state.data.updatedAt = new Date().toISOString();
  localStorage.setItem(STORE_KEY, JSON.stringify(await encryptData(state.data, state.key, salt)));
  resetLockTimer();
}

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand("copy");
    helper.remove();
    return ok;
  }
}

function resetLockTimer() {
  if (state.lockTimer) window.clearTimeout(state.lockTimer);
  const minutes = Number(state.data.settings?.autoLockMinutes || 10);
  state.lockTimer = window.setTimeout(lockVault, minutes * 60 * 1000);
}

function lockVault() {
  state.unlocked = false;
  state.key = null;
  state.data = structuredClone(defaultData);
  state.revealAll = false;
  state.expanded = new Set();
  render();
}

function showToast(message) {
  state.toast = message;
  render();
  window.setTimeout(() => {
    state.toast = "";
    render();
  }, 2100);
}

function filteredRecords() {
  return state.data.records
    .filter((record) => state.activeView === "all" || record.label === state.activeView)
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
}

function labelOptions() {
  return Array.from(new Set(state.data.records.map((record) => record.label).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "zh-Hans-CN")
  );
}

function normalizeData(data) {
  return {
    ...data,
    records: (data.records || []).map((record) => {
      const label = record.label || record.category || "未分组";
      return { ...record, label, category: label };
    }),
  };
}

function urlForLabel(label, ignoreId = "") {
  const key = String(label || "").trim();
  if (!key) return "";
  const found = state.data.records.find((record) => record.id !== ignoreId && record.label === key && record.url);
  return found?.url || "";
}

function sensitive(value) {
  if (!value) return "未填写";
  return state.revealAll ? value : "••••••••";
}

function authView() {
  const hasVault = Boolean(loadPayload());
  return `
    <main class="auth-wrap">
      <section class="auth">
        <div class="auth-copy">
          <div>
            <h1>VaultNote</h1>
            <p>本地加密的账号资料库，适合记录邮箱、社交账号、订阅关系和私密备注。</p>
          </div>
          <p>数据保存在当前浏览器本地，不会上传。请记住主密码，忘记后无法解密。</p>
        </div>
        <form class="auth-form" data-action="${hasVault ? "login" : "register"}">
          <h2>${hasVault ? "解锁资料库" : "创建本地资料库"}</h2>
          <p>${hasVault ? "输入主密码后查看和复制记录。" : "第一次使用需要设置一个主密码。"}</p>
          <div class="field">
            <label for="master-password">主密码</label>
            <input id="master-password" name="password" type="password" autocomplete="current-password" required minlength="6" />
          </div>
          ${
            hasVault
              ? ""
              : `<div class="field">
                  <label for="confirm-password">确认主密码</label>
                  <input id="confirm-password" name="confirm" type="password" autocomplete="new-password" required minlength="6" />
                </div>`
          }
          <button class="primary" type="submit">${icon(hasVault ? "unlock" : "shield")}${hasVault ? "解锁" : "创建并进入"}</button>
          <div class="notice">建议只在自己的设备上使用。需要迁移时，请用导出加密备份。</div>
          <div class="notice error hidden" data-error></div>
        </form>
      </section>
    </main>
  `;
}

function shellView() {
  return `
    <main class="shell">
      <aside class="sidebar">
        <div class="brand">
          <div>
            <h1>VaultNote</h1>
            <p class="micro">本地账号库</p>
          </div>
        </div>
        <div class="nav-title">筛选</div>
        <nav class="nav">
          ${navButton("all", "全部记录", "list")}
          ${labelOptions().map((label) => navButton(label, label, categoryIcon(label))).join("")}
        </nav>
        <div class="sidebar-footer">
          <button class="secondary" data-action="settings">${icon("settings")}设置</button>
        </div>
      </aside>
      <section class="content">
        <div class="workspace">
          ${recordsView()}
        </div>
      </section>
      <nav class="bottom-dock" aria-label="底部菜单">
        ${dockButton("all", "全部", "list")}
        <button class="dock-add" data-action="new" title="新建记录">${icon("plus")}<span>新建</span></button>
        <button data-action="toggle-reveal" title="显示或隐藏">${icon(state.revealAll ? "eyeOff" : "eye")}<span>${state.revealAll ? "隐藏" : "显示"}</span></button>
        <button data-action="settings" title="设置">${icon("settings")}<span>设置</span></button>
      </nav>
      ${state.modal ? modalView(state.modal) : ""}
      ${state.toast ? `<div class="toast">${escapeHtml(state.toast)}</div>` : ""}
    </main>
  `;
}

function navButton(view, label, iconName) {
  return `<button class="${state.activeView === view ? "active" : ""}" data-action="view" data-view="${escapeHtml(view)}">${icon(iconName)}${escapeHtml(label)}</button>`;
}

function categoryIcon(category) {
  const map = {
    邮箱: "tag",
    社交: "key",
    订阅: "repeat",
    支付: "shield",
    虚拟卡: "shield",
    eSIM: "repeat",
    工作: "list",
    其他: "list",
  };
  return map[category] || "tag";
}

function dockButton(view, label, iconName) {
  return `<button class="${state.activeView === view ? "active" : ""}" data-action="view" data-view="${escapeHtml(view)}" title="${escapeHtml(label)}">${icon(iconName)}<span>${escapeHtml(label)}</span></button>`;
}

function recordsView() {
  const list = filteredRecords();
  if (!list.length) {
    return `<div class="empty"><div><h3>还没有匹配的记录</h3><p>新建一条邮箱、社交、订阅或其他账号记录后，这里会变成你的资料索引。</p></div></div>`;
  }
  return `<div class="records">${list.map(recordView).join("")}</div>`;
}

function recordView(record) {
  const subClass = record.subscription && record.subscription !== "未订阅" ? "good" : "";
  const isOpen = state.expanded.has(record.id);
  const accountName = record.username || record.email || record.relatedAccount || record.chatgptAccount || "未填写账号";
  const subtitle = record.url || record.label || record.category || "账号记录";
  return `
    <article class="record ${isOpen ? "open" : ""}" data-id="${record.id}">
      <div>
        <button class="record-summary" data-action="toggle-record" data-id="${record.id}" aria-expanded="${isOpen}">
          <span>
            <strong>${escapeHtml(accountName)}</strong>
            <small>${escapeHtml(subtitle)}</small>
          </span>
          ${icon(isOpen ? "chevronUp" : "chevronDown")}
        </button>
        <div class="record-meta">
          ${record.issueNote ? `<span class="chip danger-chip">异常</span>` : `<span class="chip good">正常</span>`}
          ${record.label ? `<span class="chip good">${escapeHtml(record.label)}</span>` : ""}
          ${record.url ? `<span class="chip">${escapeHtml(record.url)}</span>` : ""}
          ${(record.relatedAccount || record.chatgptAccount) ? `<span class="chip warn">有关联账号</span>` : ""}
          ${(record.esimIccid || record.esimCarrier) ? `<span class="chip warn">eSIM / 保卡</span>` : ""}
          ${(record.cardNumber || record.cardPlatform) ? `<span class="chip warn">虚拟卡</span>` : ""}
          ${(record.identityName || record.identityAddress) ? `<span class="chip warn">注册信息</span>` : ""}
        </div>
        ${
          isOpen
            ? `<div class="detail-grid">
                ${copyRow("账号", record.username || record.email, "username", record.id)}
                ${copyRow("密码", sensitive(record.password), "password", record.id, Boolean(record.password))}
                ${copyRow("网址", record.url, "url", record.id)}
                ${copyRow("关联账号", record.relatedAccount || record.chatgptAccount, "relatedAccount", record.id)}
                ${copyRow("关联账号密码", sensitive(record.relatedPassword || record.appleId), "relatedPassword", record.id, Boolean(record.relatedPassword || record.appleId))}
                ${copyRow("标签", record.label, "label", record.id)}
                ${record.issueNote ? copyRow("异常说明", record.issueNote, "issueNote", record.id) : ""}
                ${record.esimIccid || record.esimCarrier || record.esimRechargeUrl || record.esimPlan || record.esimExpiresAt ? esimRows(record) : ""}
                ${record.cardPlatform || record.cardNumber || record.cardExpiry || record.cardCvv || record.cardBillingAddress ? cardRows(record) : ""}
                ${record.identityName || record.identityAddress || record.identityZip || record.identityCity || record.identityState || record.identityCountry || record.identityPhone || record.identitySsn || record.identityId || record.identityBirthday ? identityRows(record) : ""}
              </div>
              ${record.notes ? `<div class="copy-row full" style="margin-top:12px"><div><span>备注</span><strong>${escapeHtml(state.revealAll ? record.notes : "••••••••")}</strong></div><button class="icon-button" title="复制备注" data-action="copy" data-field="notes" data-id="${record.id}">${icon("copy")}</button></div>` : ""}`
            : ""
        }
      </div>
      <div class="record-actions">
        <button class="icon-button" title="${state.revealAll ? "隐藏敏感信息" : "显示敏感信息"}" data-action="toggle-reveal">${icon(state.revealAll ? "eyeOff" : "eye")}</button>
        <button class="icon-button" title="编辑" data-action="edit" data-id="${record.id}">${icon("edit")}</button>
        <button class="icon-button" title="删除" data-action="delete" data-id="${record.id}">${icon("trash")}</button>
      </div>
    </article>
  `;
}

function copyRow(label, value, field, id, isSecret = false) {
  return `
    <div class="copy-row">
      <div>
        <span>${escapeHtml(label)}</span>
        <code>${escapeHtml(value || "未填写")}</code>
      </div>
      <button class="icon-button" title="复制${escapeHtml(label)}" data-action="copy" data-field="${field}" data-secret="${isSecret ? "1" : "0"}" data-id="${id}">${icon("copy")}</button>
    </div>
  `;
}

function esimRows(record) {
  return `
    ${copyRow("ICCID / 卡号", record.esimIccid, "esimIccid", record.id)}
    ${copyRow("运营商", record.esimCarrier, "esimCarrier", record.id)}
    ${copyRow("充值网址", record.esimRechargeUrl, "esimRechargeUrl", record.id)}
    ${copyRow("套餐 / 余额", record.esimPlan, "esimPlan", record.id)}
    ${copyRow("保号到期", record.esimExpiresAt, "esimExpiresAt", record.id)}
  `;
}

function cardRows(record) {
  return `
    ${copyRow("开卡平台", record.cardPlatform, "cardPlatform", record.id)}
    ${copyRow("卡号", sensitive(record.cardNumber), "cardNumber", record.id, Boolean(record.cardNumber))}
    ${copyRow("有效期", sensitive(record.cardExpiry), "cardExpiry", record.id, Boolean(record.cardExpiry))}
    ${copyRow("CVV", sensitive(record.cardCvv), "cardCvv", record.id, Boolean(record.cardCvv))}
    ${copyRow("账单地址", record.cardBillingAddress, "cardBillingAddress", record.id)}
    ${copyRow("卡备注", record.cardNote, "cardNote", record.id)}
  `;
}

function identityRows(record) {
  return `
    ${copyRow("姓名", record.identityName, "identityName", record.id)}
    ${copyRow("住址", record.identityAddress, "identityAddress", record.id)}
    ${copyRow("邮编", record.identityZip, "identityZip", record.id)}
    ${copyRow("城市", record.identityCity, "identityCity", record.id)}
    ${copyRow("州 / 省", record.identityState, "identityState", record.id)}
    ${copyRow("国家 / 地区", record.identityCountry, "identityCountry", record.id)}
    ${copyRow("电话", record.identityPhone, "identityPhone", record.id)}
    ${copyRow("SSN", sensitive(record.identitySsn), "identitySsn", record.id, Boolean(record.identitySsn))}
    ${copyRow("证件 ID", sensitive(record.identityId), "identityId", record.id, Boolean(record.identityId))}
    ${copyRow("出生日期", sensitive(record.identityBirthday), "identityBirthday", record.id, Boolean(record.identityBirthday))}
  `;
}

function modalView(modal) {
  if (modal.type === "record") return recordModal(modal.record);
  if (modal.type === "reveal") {
    return `
      <div class="modal-backdrop">
        <section class="modal">
          <header><h3>显示敏感信息</h3><button class="icon-button" data-action="close-modal">${icon("x")}</button></header>
          <form data-action="verify-reveal">
            <div class="form-grid">
              <div class="field full"><label>再次输入主密码</label><input name="password" type="password" required autocomplete="current-password" /></div>
              <div class="notice full">认证通过后会显示密码和私密备注，锁定或点击隐藏会再次收起。</div>
            </div>
            <div class="modal-actions">
              <button class="secondary" type="button" data-action="close-modal">取消</button>
              <button class="primary" type="submit">${icon("unlock")}显示</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }
  if (modal.type === "settings") {
    return `
      <div class="modal-backdrop">
        <section class="modal settings-modal">
          <header><h3>设置</h3><button class="icon-button" data-action="close-modal">${icon("x")}</button></header>
          <div class="settings-body">
            <section>
              <h4>工具说明</h4>
              <p>这是一个本地加密账号记事本，用来记录邮箱、社交平台、订阅、支付和其他账号。敏感字段默认隐藏，需要认证后显示。</p>
            </section>
            <section>
              <h4>主界面</h4>
              <p>主页直接显示词条列表。词条外显名称优先使用账号本身，比如邮箱地址、手机号或登录 ID；侧边栏可以按标签筛选。</p>
            </section>
            <section>
              <h4>数据安全</h4>
              <p>数据保存在当前浏览器本地，不会上传。主密码不会明文保存，忘记后无法恢复资料。</p>
            </section>
            <section class="settings-actions">
              <button class="secondary" data-action="export">${icon("download")}导出备份</button>
              <button class="secondary" data-action="export-csv">${icon("download")}导出表格</button>
              <button class="secondary" data-action="import">${icon("upload")}导入备份</button>
              <button class="danger" data-action="lock">${icon("logout")}锁定</button>
            </section>
          </div>
        </section>
      </div>
    `;
  }
  if (modal.type === "confirm") {
    return `
      <div class="modal-backdrop">
        <section class="modal">
          <header><h3>确认删除</h3><button class="icon-button" data-action="close-modal">${icon("x")}</button></header>
          <div class="form-grid"><p class="full">这条记录会从本地加密库中删除。</p></div>
          <div class="modal-actions">
            <button class="secondary" data-action="close-modal">取消</button>
            <button class="danger" data-action="confirm-delete" data-id="${modal.id}">${icon("trash")}删除</button>
          </div>
        </section>
      </div>
    `;
  }
  if (modal.type === "import") {
    return `
      <div class="modal-backdrop">
        <section class="modal">
          <header><h3>导入加密备份</h3><button class="icon-button" data-action="close-modal">${icon("x")}</button></header>
          <form data-action="import-submit">
            <div class="form-grid">
              <div class="field full"><label>备份 JSON</label><textarea name="payload" required placeholder="粘贴导出的备份内容"></textarea></div>
              <div class="field full"><label>备份主密码</label><input name="password" type="password" required /></div>
              <div class="notice full">导入会替换当前本地资料库，请确认备份来源可信。</div>
            </div>
            <div class="modal-actions">
              <button class="secondary" type="button" data-action="close-modal">取消</button>
              <button class="primary" type="submit">${icon("upload")}导入</button>
            </div>
          </form>
        </section>
      </div>
    `;
  }
  return "";
}

function recordModal(record = {}) {
  const isEdit = Boolean(record.id);
  return `
    <div class="modal-backdrop">
      <section class="modal">
        <header><h3>${isEdit ? "编辑记录" : "新建记录"}</h3><button class="icon-button" data-action="close-modal">${icon("x")}</button></header>
        <form data-action="save-record" data-id="${record.id || ""}">
          <div class="form-grid">
            <section class="form-section account-section full">
              <h4>账号信息</h4>
              <div class="section-grid">
                ${field("标签", "label", record.label, "例如：谷歌邮箱、苹果ID、微信、美区ID")}
                ${field("账号", "username", record.username || record.email, "邮箱、手机号或登录 ID")}
                ${field("密码", "password", record.password, "记录后默认隐藏", "password")}
                ${field("网址", "url", record.url, "https://example.com")}
              </div>
            </section>
            <section class="form-section full">
              <h4>其他信息</h4>
              <div class="section-grid">
                ${field("关联账号", "relatedAccount", record.relatedAccount || record.chatgptAccount, "例如绑定邮箱、Apple ID、备用账号")}
                ${field("关联账号密码", "relatedPassword", record.relatedPassword || record.appleId, "记录后默认隐藏", "password")}
                ${field("标签", "extraLabel", record.extraLabel || record.tags, "补充标签或备注标签")}
                ${field("异常", "issueNote", record.issueNote, "账号异常、无法登录、待充值、需验证等")}
              </div>
            </section>
            <section class="form-section full">
              <h4>eSIM / 保卡充值</h4>
              <div class="section-grid">
                ${field("ICCID / 卡号", "esimIccid", record.esimIccid, "eSIM ICCID、手机号或卡号")}
                ${field("运营商", "esimCarrier", record.esimCarrier, "例如 T-Mobile、3HK、Airalo")}
                ${field("充值网址", "esimRechargeUrl", record.esimRechargeUrl, "充值或保号入口")}
                ${field("套餐 / 余额", "esimPlan", record.esimPlan, "套餐、余额、保号金额")}
                ${field("保号到期", "esimExpiresAt", record.esimExpiresAt, "YYYY-MM-DD", "date")}
              </div>
            </section>
            <section class="form-section full">
              <h4>虚拟信用卡</h4>
              <div class="section-grid">
                ${field("开卡平台", "cardPlatform", record.cardPlatform, "例如 WildCard、Depay、Nobepay")}
                ${field("卡号", "cardNumber", record.cardNumber, "记录后默认隐藏")}
                ${field("有效期", "cardExpiry", record.cardExpiry, "MM/YY")}
                ${field("CVV", "cardCvv", record.cardCvv, "记录后默认隐藏", "password")}
                ${field("账单地址", "cardBillingAddress", record.cardBillingAddress, "虚拟卡账单地址")}
                ${field("卡备注", "cardNote", record.cardNote, "用途、额度、充值方式")}
              </div>
            </section>
            <section class="form-section full">
              <h4>注册信息</h4>
              <div class="section-grid">
                ${field("姓名", "identityName", record.identityName, "注册资料姓名")}
                ${field("住址", "identityAddress", record.identityAddress, "街道地址")}
                ${field("邮编", "identityZip", record.identityZip, "ZIP / Postal Code")}
                ${field("城市", "identityCity", record.identityCity, "City")}
                ${field("州 / 省", "identityState", record.identityState, "State / Province")}
                ${field("国家 / 地区", "identityCountry", record.identityCountry, "Country / Region")}
                ${field("电话", "identityPhone", record.identityPhone, "Phone")}
                ${field("SSN", "identitySsn", record.identitySsn, "找回账号可能需要", "password")}
                ${field("证件 ID", "identityId", record.identityId, "虚拟身份 ID / Driver License / Passport", "password")}
                ${field("出生日期", "identityBirthday", record.identityBirthday, "YYYY-MM-DD", "date")}
              </div>
            </section>
            <div class="field full"><label>备注</label><textarea name="notes" placeholder="付款方式、恢复码、注意事项等">${escapeHtml(record.notes || "")}</textarea></div>
          </div>
          <div class="modal-actions">
            <button class="secondary" type="button" data-action="close-modal">取消</button>
            <button class="primary" type="submit">${icon("shield")}保存</button>
          </div>
        </form>
      </section>
    </div>
  `;
}

function field(label, name, value = "", placeholder = "", type = "text") {
  return `<div class="field"><label>${escapeHtml(label)}</label><input name="${name}" type="${type}" value="${escapeHtml(value || "")}" placeholder="${escapeHtml(placeholder)}" /></div>`;
}

function render() {
  state.hasVault = Boolean(loadPayload());
  app.innerHTML = state.unlocked ? shellView() : authView();
}

async function copyValue(id, field, secret) {
  const record = state.data.records.find((item) => item.id === id);
  if (!record) return;
  if (secret && !state.revealAll) {
    showToast("请先点击显示，再复制敏感字段");
    return;
  }
  const value = record[field] || "";
  if (!value) {
    showToast("这个字段还没有内容");
    return;
  }
  const copied = await copyText(value);
  if (!copied) {
    showToast("复制失败，请检查浏览器权限");
    return;
  }
  showToast("已复制，30 秒后尝试清空剪贴板");
  window.setTimeout(async () => {
    try {
      if ((await navigator.clipboard.readText()) === value) await navigator.clipboard.writeText("");
    } catch {
      // Some browsers block clipboard reads on file pages.
    }
  }, CLIPBOARD_CLEAR_MS);
}

async function register(form) {
  const password = form.password.value;
  const confirm = form.confirm.value;
  const error = form.querySelector("[data-error]");
  if (password !== confirm) {
    error.textContent = "两次输入的主密码不一致。";
    error.classList.remove("hidden");
    return;
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);
  state.key = key;
  state.data = structuredClone(defaultData);
  localStorage.setItem(STORE_KEY, JSON.stringify(await encryptData(state.data, key, salt)));
  state.unlocked = true;
  resetLockTimer();
  render();
}

async function login(form) {
  const error = form.querySelector("[data-error]");
  try {
    const { key, data } = await decryptVault(form.password.value, loadPayload());
    state.key = key;
    state.data = normalizeData({ ...structuredClone(defaultData), ...data });
    state.unlocked = true;
    state.expanded = new Set();
    resetLockTimer();
    render();
  } catch {
    error.textContent = "主密码不正确，或本地资料库已损坏。";
    error.classList.remove("hidden");
  }
}

async function verifyReveal(form) {
  try {
    await decryptVault(form.password.value, loadPayload());
    state.revealAll = true;
    state.modal = null;
    render();
    showToast("敏感信息已显示");
  } catch {
    showToast("主密码不正确");
  }
}

async function saveRecord(form) {
  const formData = new FormData(form);
  const id = form.dataset.id || uid();
  const now = new Date().toISOString();
  const primaryLabel = formData.get("label").trim() || "未分组";
  const matchedUrl = urlForLabel(primaryLabel, id);
  const finalUrl = formData.get("url").trim() || matchedUrl;
  const next = {
    id,
    label: primaryLabel,
    category: primaryLabel,
    username: formData.get("username").trim(),
    email: "",
    password: formData.get("password"),
    url: finalUrl,
    relatedAccount: formData.get("relatedAccount").trim(),
    relatedPassword: formData.get("relatedPassword"),
    extraLabel: formData.get("extraLabel").trim(),
    issueNote: formData.get("issueNote").trim(),
    esimIccid: formData.get("esimIccid").trim(),
    esimCarrier: formData.get("esimCarrier").trim(),
    esimRechargeUrl: formData.get("esimRechargeUrl").trim(),
    esimPlan: formData.get("esimPlan").trim(),
    esimExpiresAt: formData.get("esimExpiresAt"),
    cardPlatform: formData.get("cardPlatform").trim(),
    cardNumber: formData.get("cardNumber").trim(),
    cardExpiry: formData.get("cardExpiry").trim(),
    cardCvv: formData.get("cardCvv"),
    cardBillingAddress: formData.get("cardBillingAddress").trim(),
    cardNote: formData.get("cardNote").trim(),
    identityName: formData.get("identityName").trim(),
    identityAddress: formData.get("identityAddress").trim(),
    identityZip: formData.get("identityZip").trim(),
    identityCity: formData.get("identityCity").trim(),
    identityState: formData.get("identityState").trim(),
    identityCountry: formData.get("identityCountry").trim(),
    identityPhone: formData.get("identityPhone").trim(),
    identitySsn: formData.get("identitySsn"),
    identityId: formData.get("identityId"),
    identityBirthday: formData.get("identityBirthday"),
    title: "",
    region: "",
    appleId: "",
    chatgptAccount: "",
    subscription: "",
    expiresAt: "",
    tags: "",
    notes: formData.get("notes").trim(),
    createdAt: state.data.records.find((item) => item.id === id)?.createdAt || now,
    updatedAt: now,
  };
  state.data.records = state.data.records.some((item) => item.id === id)
    ? state.data.records.map((item) => (item.id === id ? next : item))
    : [next, ...state.data.records];
  if (finalUrl) {
    state.data.records = state.data.records.map((item) =>
      item.label === primaryLabel && !item.url ? { ...item, url: finalUrl, updatedAt: now } : item
    );
  }
  state.modal = null;
  await saveVault();
  render();
  showToast("记录已加密保存");
}

async function exportVault() {
  const payload = localStorage.getItem(STORE_KEY);
  const copied = await copyText(payload);
  showToast(copied ? "加密备份已复制到剪贴板" : "复制失败，请检查浏览器权限");
}

function csvCell(value = "") {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportCsv() {
  if (!window.confirm("导出表格会包含明文账号、密码、虚拟卡和身份信息。确认导出吗？")) return;
  const headers = [
    "标签",
    "账号",
    "密码",
    "网址",
    "关联账号",
    "关联账号密码",
    "补充标签",
    "ICCID/卡号",
    "运营商",
    "充值网址",
    "套餐/余额",
    "保号到期",
    "开卡平台",
    "卡号",
    "有效期",
    "CVV",
    "账单地址",
    "卡备注",
    "姓名",
    "住址",
    "邮编",
    "城市",
    "州/省",
    "国家/地区",
    "电话",
    "SSN",
    "证件ID",
    "出生日期",
    "备注",
    "更新时间",
  ];
  const rows = state.data.records.map((record) => [
    record.label,
    record.username || record.email,
    record.password,
    record.url,
    record.relatedAccount || record.chatgptAccount,
    record.relatedPassword || record.appleId,
    record.extraLabel || record.tags,
    record.esimIccid,
    record.esimCarrier,
    record.esimRechargeUrl,
    record.esimPlan,
    record.esimExpiresAt,
    record.cardPlatform,
    record.cardNumber,
    record.cardExpiry,
    record.cardCvv,
    record.cardBillingAddress,
    record.cardNote,
    record.identityName,
    record.identityAddress,
    record.identityZip,
    record.identityCity,
    record.identityState,
    record.identityCountry,
    record.identityPhone,
    record.identitySsn,
    record.identityId,
    record.identityBirthday,
    record.notes,
    record.updatedAt,
  ]);
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `vaultnote-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("表格已导出");
}

async function importVault(form) {
  try {
    const payload = JSON.parse(form.payload.value);
    const { key, data } = await decryptVault(form.password.value, payload);
    localStorage.setItem(STORE_KEY, JSON.stringify(payload));
    state.key = key;
    state.data = normalizeData({ ...structuredClone(defaultData), ...data });
    state.modal = null;
    await saveVault();
    render();
    showToast("备份已导入");
  } catch {
    showToast("导入失败，请检查备份内容和主密码");
  }
}

app.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  const action = form.dataset.action;
  if (action === "register") await register(form);
  if (action === "login") await login(form);
  if (action === "save-record") await saveRecord(form);
  if (action === "import-submit") await importVault(form);
  if (action === "verify-reveal") await verifyReveal(form);
});

app.addEventListener("input", (event) => {
  if (event.target.name !== "label") return;
  const form = event.target.closest('form[data-action="save-record"]');
  if (!form) return;
  const urlInput = form.querySelector('input[name="url"]');
  if (!urlInput || urlInput.value.trim()) return;
  const matchedUrl = urlForLabel(event.target.value, form.dataset.id);
  if (matchedUrl) urlInput.value = matchedUrl;
});

app.addEventListener("click", async (event) => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "view") {
    state.activeView = target.dataset.view;
    render();
  }
  if (action === "new") {
    const fallbackLabel = state.activeView === "all" ? "" : state.activeView;
    state.modal = { type: "record", record: { label: fallbackLabel, category: fallbackLabel } };
    render();
  }
  if (action === "edit") {
    const record = state.data.records.find((item) => item.id === target.dataset.id);
    state.modal = { type: "record", record };
    render();
  }
  if (action === "delete") {
    state.modal = { type: "confirm", id: target.dataset.id };
    render();
  }
  if (action === "settings") {
    state.modal = { type: "settings" };
    render();
  }
  if (action === "toggle-record") {
    const id = target.dataset.id;
    if (state.expanded.has(id)) state.expanded.delete(id);
    else state.expanded.add(id);
    render();
  }
  if (action === "confirm-delete") {
    state.data.records = state.data.records.filter((item) => item.id !== target.dataset.id);
    state.expanded.delete(target.dataset.id);
    state.modal = null;
    await saveVault();
    render();
    showToast("记录已删除");
  }
  if (action === "close-modal") {
    state.modal = null;
    render();
  }
  if (action === "toggle-reveal") {
    if (state.revealAll) {
      state.revealAll = false;
    } else {
      state.modal = { type: "reveal" };
    }
    render();
  }
  if (action === "copy") await copyValue(target.dataset.id, target.dataset.field, target.dataset.secret === "1");
  if (action === "lock") lockVault();
  if (action === "export") await exportVault();
  if (action === "export-csv") exportCsv();
  if (action === "import") {
    state.modal = { type: "import" };
    render();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.modal) {
    state.modal = null;
    render();
  }
});

render();
