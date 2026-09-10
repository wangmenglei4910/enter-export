/**
 * 仓库数据：GitHub Gist 多文件 JSON 同步
 * - accounts.json          登录账号
 * - products.json          商品管理
 * - customers.json         客户管理
 * - suppliers.json         供应商管理
 * - inbound.json           入库
 * - outbound.json          出库
 * - inboundOrders.json     入库单
 * - outboundOrders.json    出库单
 * - checks.json            库存盘点
 * - alerts.json            库存预警
 */

const CONFIG_OVERRIDE_KEY = 'inventory-sync-config-v1';
const LOCAL_DATA_KEY = 'inventory-data-v2';
const LOCAL_ACCOUNTS_KEY = 'inventory-accounts-v1';
const SESSION_KEY = 'inventory-session-v1';
const POLL_MS = 5000;

/** 菜单对应的数据文件 */
export const MENU_FILES = {
  products: 'products.json',
  customers: 'customers.json',
  suppliers: 'suppliers.json',
  inbound: 'inbound.json',
  outbound: 'outbound.json',
  inboundOrders: 'inboundOrders.json',
  outboundOrders: 'outboundOrders.json',
  checks: 'checks.json',
  alerts: 'alerts.json',
};

export const ACCOUNTS_FILE = 'accounts.json';
export const COLLECTIONS = Object.keys(MENU_FILES);

const DEFAULT_ACCOUNTS = [
  {
    id: '1',
    phone: '13691054910',
    username: '13691054910',
    password: '12356336',
    name: '管理员',
    company: '默认公司',
    companyId: 'c_default',
    updatedAt: 1,
  },
];

export function emptyData() {
  const data = { version: 2, updatedAt: 0 };
  for (const key of COLLECTIONS) data[key] = [];
  return data;
}

export function emptyAccounts() {
  return {
    version: 2,
    updatedAt: 0,
    users: [],
  };
}

function makeCompanyId(company) {
  const safe = String(company || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .slice(0, 32);
  return `c_${Date.now().toString(36)}_${safe || 'co'}`;
}

export function isValidPhone(phone) {
  return /^1\d{10}$/.test(String(phone || '').trim());
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D/g, '');
}

function stamp(record, companyId) {
  const now = Date.now();
  const session = loadSession();
  const cid = companyId || record.companyId || session?.companyId || '';
  return {
    ...record,
    id: String(record.id || now),
    companyId: cid,
    updatedAt: now,
  };
}

function normalizeList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      ...item,
      id: String(item.id || ''),
      companyId: String(item.companyId || ''),
      updatedAt: Number(item.updatedAt) || 0,
    }))
    .filter((item) => item.id);
}

function normalizeUser(u) {
  const phone = normalizePhone(u.phone || u.username);
  const company = String(u.company || '').trim();
  const companyId = String(u.companyId || (company ? `c_${phone}` : '') || '').trim();
  return {
    id: String(u.id || phone),
    phone,
    username: phone,
    password: String(u.password || ''),
    name: String(u.name || phone),
    company,
    companyId,
    updatedAt: Number(u.updatedAt) || 0,
  };
}

function normalizeAccounts(raw) {
  if (!raw || typeof raw !== 'object') {
    return { version: 2, updatedAt: 0, users: [] };
  }
  let users = [];
  if (Array.isArray(raw.users)) users = raw.users;
  else if (Array.isArray(raw.list)) users = raw.list;
  else if (Array.isArray(raw)) users = raw;

  users = users
    .map(normalizeUser)
    .filter((u) => u.phone && u.phone.length >= 6);

  return {
    version: 2,
    updatedAt: Number(raw.updatedAt) || 0,
    users,
  };
}

export function normalizeData(raw) {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;
  const next = { ...base, version: 2, updatedAt: Number(raw.updatedAt) || 0 };
  for (const key of COLLECTIONS) {
    // 兼容旧单文件 inventory.json：{ products: [] }
    // 以及新文件：{ list: [] }
    if (Array.isArray(raw[key])) next[key] = normalizeList(raw[key]);
    else if (raw[key] && Array.isArray(raw[key].list)) next[key] = normalizeList(raw[key].list);
  }
  return next;
}

function collectionPayload(list, updatedAt = Date.now()) {
  return {
    updatedAt,
    list: normalizeList(list),
  };
}

function mergeLists(localList, remoteList) {
  const map = new Map();
  for (const item of [...(remoteList || []), ...(localList || [])]) {
    const id = String(item.id);
    const prev = map.get(id);
    if (!prev || (Number(item.updatedAt) || 0) >= (Number(prev.updatedAt) || 0)) {
      map.set(id, item);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0),
  );
}

function mergeData(local, remote) {
  const next = emptyData();
  next.updatedAt = Math.max(Number(local?.updatedAt) || 0, Number(remote?.updatedAt) || 0);
  for (const key of COLLECTIONS) {
    next[key] = mergeLists(local?.[key], remote?.[key]);
  }
  return next;
}

function mergeAccounts(local, remote) {
  const users = mergeLists(
    (local?.users || []).map(normalizeUser),
    (remote?.users || []).map(normalizeUser),
  );
  const byPhone = new Map();
  for (const u of users) {
    if (!u.phone) continue;
    byPhone.set(u.phone, u);
  }
  return {
    version: 2,
    updatedAt: Math.max(Number(local?.updatedAt) || 0, Number(remote?.updatedAt) || 0, Date.now()),
    users: Array.from(byPhone.values()),
  };
}

function filterDataByCompany(raw, companyId) {
  const data = normalizeData(raw);
  if (!companyId) return data;
  const next = emptyData();
  next.updatedAt = data.updatedAt;
  for (const key of COLLECTIONS) {
    next[key] = (data[key] || []).filter((item) => String(item.companyId || '') === String(companyId));
  }
  return next;
}

function fingerprint(data) {
  const d = normalizeData(data);
  return COLLECTIONS.map((key) => {
    const rows = (d[key] || [])
      .slice()
      .sort((a, b) => String(a.id).localeCompare(String(b.id)))
      .map((r) => `${r.id}:${r.updatedAt}`)
      .join(',');
    return `${key}:{${rows}}`;
  }).join('|');
}

function loadConfigOverride() {
  try {
    const raw = localStorage.getItem(CONFIG_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) || {} : {};
  } catch {
    return {};
  }
}

export function saveConfigOverride(partial) {
  const next = { ...loadConfigOverride(), ...partial };
  localStorage.setItem(CONFIG_OVERRIDE_KEY, JSON.stringify(next));
  return next;
}

export function bootstrapSyncFromUrl() {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#/, '');
  if (!hash) return false;
  const params = new URLSearchParams(hash);
  const gistId = params.get('gist');
  const token = params.get('sync');
  if (!gistId && !token) return false;
  saveConfigOverride({
    ...(gistId ? { gistId } : {}),
    ...(token ? { githubToken: token } : {}),
  });
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
  return true;
}

function resolveConfig(userConfig = {}) {
  const override = loadConfigOverride();
  const winCfg = (typeof window !== 'undefined' && window.INVENTORY_CONFIG) || {};
  return {
    gistId: String(override.gistId || userConfig.gistId || winCfg.gistId || '').trim(),
    githubToken: String(
      override.githubToken || userConfig.githubToken || winCfg.githubToken || '',
    ).trim(),
  };
}

export function isSyncReady(userConfig = {}) {
  const cfg = resolveConfig(userConfig);
  return Boolean(
    cfg.gistId &&
      cfg.gistId.length >= 10 &&
      cfg.githubToken &&
      cfg.githubToken.startsWith('gh') &&
      cfg.githubToken.length > 20 &&
      !cfg.gistId.includes('YOUR_') &&
      !cfg.githubToken.includes('YOUR_'),
  );
}

function authHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function loadLocalData() {
  try {
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    return raw ? normalizeData(JSON.parse(raw)) : emptyData();
  } catch {
    return emptyData();
  }
}

function saveLocalData(data) {
  localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(normalizeData(data)));
}

function loadLocalAccounts() {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    return raw ? normalizeAccounts(JSON.parse(raw)) : emptyAccounts();
  } catch {
    return emptyAccounts();
  }
}

function saveLocalAccounts(accounts) {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(normalizeAccounts(accounts)));
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const phone = normalizePhone(parsed.phone || parsed.username);
    if (!phone) return null;
    return {
      phone,
      username: phone,
      name: String(parsed.name || phone),
      company: String(parsed.company || ''),
      companyId: String(parsed.companyId || ''),
    };
  } catch {
    return null;
  }
}

export function saveSession(user) {
  const phone = normalizePhone(user.phone || user.username);
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      phone,
      username: phone,
      name: String(user.name || phone),
      company: String(user.company || ''),
      companyId: String(user.companyId || ''),
    }),
  );
  localStorage.setItem('isLoggedIn', 'true');
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('isLoggedIn');
}

function parseGistFiles(files) {
  const data = emptyData();
  let accounts = emptyAccounts();
  let maxUpdated = 0;

  // 兼容旧单文件 inventory.json
  const legacy = files['inventory.json'];
  if (legacy?.content) {
    try {
      const parsed = JSON.parse(legacy.content);
      const migrated = normalizeData(parsed);
      for (const key of COLLECTIONS) data[key] = migrated[key];
      maxUpdated = Math.max(maxUpdated, migrated.updatedAt || 0);
    } catch {
      /* ignore */
    }
  }

  for (const [key, filename] of Object.entries(MENU_FILES)) {
    const file = files[filename];
    if (!file?.content) continue;
    try {
      const parsed = JSON.parse(file.content);
      const list = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed.list)
          ? parsed.list
          : Array.isArray(parsed[key])
            ? parsed[key]
            : [];
      data[key] = normalizeList(list);
      maxUpdated = Math.max(maxUpdated, Number(parsed.updatedAt) || 0);
    } catch {
      /* ignore */
    }
  }

  const accFile = files[ACCOUNTS_FILE];
  if (accFile?.content) {
    try {
      accounts = normalizeAccounts(JSON.parse(accFile.content));
    } catch {
      /* ignore */
    }
  }

  data.updatedAt = maxUpdated;
  return { data: normalizeData(data), accounts };
}

function buildGistFilesPatch(data, accounts, onlyKeys) {
  const files = {};
  const now = Date.now();
  const keys = onlyKeys && onlyKeys.length ? onlyKeys : COLLECTIONS;

  for (const key of keys) {
    files[MENU_FILES[key]] = {
      content: JSON.stringify(collectionPayload(data[key] || [], now), null, 2),
    };
  }

  if (!onlyKeys || onlyKeys.includes('accounts')) {
    files[ACCOUNTS_FILE] = {
      content: JSON.stringify(
        {
          version: 1,
          updatedAt: Number(accounts.updatedAt) || now,
          users: accounts.users || [],
        },
        null,
        2,
      ),
    };
  }

  return files;
}

async function fetchGistBundle(gistId, token) {
  const res = await fetch(`https://api.github.com/gists/${gistId}?ts=${Date.now()}`, {
    method: 'GET',
    headers: authHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error('Token 无效或权限不足，请重新配置（只需勾选 gist）');
    }
    if (res.status === 404) {
      throw new Error('云端数据仓库不存在，请检查 gistId');
    }
    throw new Error(`读取云端失败(${res.status}): ${text.slice(0, 80)}`);
  }
  const gist = await res.json();
  return parseGistFiles(gist.files || {});
}

async function patchGistFiles(gistId, token, files) {
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ files }),
  });
  if (!res.ok) {
    const text = await res.text();
    if (res.status === 401 || res.status === 403) {
      throw new Error('Token 无效或权限不足，请重新配置');
    }
    throw new Error(`写入云端失败(${res.status}): ${text.slice(0, 80)}`);
  }
  try {
    const gist = await res.json();
    return parseGistFiles(gist.files || {});
  } catch {
    return null;
  }
}

export function calcStockMap(data) {
  const map = {};
  for (const p of data.products || []) map[p.id] = 0;
  for (const row of data.inbound || []) {
    const id = row.productId;
    if (!id) continue;
    map[id] = (map[id] || 0) + (Number(row.quantity) || 0);
  }
  for (const row of data.outbound || []) {
    const id = row.productId;
    if (!id) continue;
    map[id] = (map[id] || 0) - (Number(row.quantity) || 0);
  }
  return map;
}

export function todayStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

let singleton = null;

export function getInventoryStore(userConfig = {}) {
  if (singleton) return singleton;

  bootstrapSyncFromUrl();
  const cfg = resolveConfig(userConfig);
  const useCloud = isSyncReady(userConfig);

  let data = loadLocalData();
  let accounts = loadLocalAccounts();
  let pollTimer = null;
  let pulling = false;
  let writing = false;
  let dirty = false;
  let lastError = '';
  let status = useCloud ? 'idle' : 'local';
  const listeners = new Set();

  function notify(nextStatus) {
    if (nextStatus) status = nextStatus;
    for (const fn of listeners) fn(getSnapshot());
  }

  function getSnapshot() {
    const session = loadSession();
    const all = normalizeData(data);
    return {
      data: filterDataByCompany(all, session?.companyId),
      accounts: normalizeAccounts(accounts),
      session,
      status,
      lastError,
      isCloud: useCloud,
      config: cfg,
      loggedIn: Boolean(session),
      writing,
    };
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  async function ensureCloudFiles() {
    const remote = await fetchGistBundle(cfg.gistId, cfg.githubToken);
    const mergedData = mergeData(data, remote.data);
    const mergedAccounts = mergeAccounts(accounts, remote.accounts);
    // 首次：把各菜单文件 + 账号文件写全
    const files = buildGistFilesPatch(mergedData, mergedAccounts);
    const written = await patchGistFiles(cfg.gistId, cfg.githubToken, files);
    data = written?.data || mergedData;
    accounts = written?.accounts || mergedAccounts;
    saveLocalData(data);
    saveLocalAccounts(accounts);
    return getSnapshot();
  }

  async function pushRemote(changedKeys) {
    const remote = await fetchGistBundle(cfg.gistId, cfg.githubToken);
    data = mergeData(data, remote.data);
    accounts = mergeAccounts(accounts, remote.accounts);
    data.updatedAt = Date.now();
    accounts.updatedAt = Date.now();

    const keys = changedKeys && changedKeys.length ? changedKeys : null;
    const files = buildGistFilesPatch(data, accounts, keys);
    const written = await patchGistFiles(cfg.gistId, cfg.githubToken, files);
    if (written) {
      data = written.data;
      accounts = written.accounts;
    }
    saveLocalData(data);
    saveLocalAccounts(accounts);
    dirty = false;
  }

  async function persist(mutator, changedKey) {
    writing = true;
    dirty = true;
    notify(status === 'local' ? 'local' : 'idle');
    try {
      const draft = normalizeData(
        typeof mutator === 'function' ? mutator(normalizeData(data)) : mutator,
      );
      draft.updatedAt = Date.now();
      data = draft;
      saveLocalData(data);

      if (useCloud) {
        await pushRemote(changedKey ? [changedKey] : null);
        lastError = '';
        notify('online');
      } else {
        lastError = '';
        notify('local');
      }
      return getSnapshot();
    } catch (err) {
      lastError = err.message || '同步失败';
      notify('error');
      throw err;
    } finally {
      writing = false;
      notify();
    }
  }

  async function upsert(collection, record) {
    if (!COLLECTIONS.includes(collection)) throw new Error('未知数据集合');
    const session = loadSession();
    if (!session?.companyId) throw new Error('请先登录');
    const row = stamp(record, session.companyId);
    return persist((prev) => {
      const list = [...(prev[collection] || [])];
      const idx = list.findIndex((item) => item.id === row.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...row, companyId: session.companyId };
      else list.unshift(row);
      return { ...prev, [collection]: list };
    }, collection);
  }

  async function remove(collection, id) {
    if (!COLLECTIONS.includes(collection)) throw new Error('未知数据集合');
    const session = loadSession();
    return persist(
      (prev) => ({
        ...prev,
        [collection]: (prev[collection] || []).filter((item) => {
          if (item.id !== String(id)) return true;
          // 只能删本公司数据
          if (session?.companyId && item.companyId && item.companyId !== session.companyId) {
            return true;
          }
          return false;
        }),
      }),
      collection,
    );
  }

  async function replaceCollection(collection, list) {
    if (!COLLECTIONS.includes(collection)) throw new Error('未知数据集合');
    const session = loadSession();
    const companyId = session?.companyId || '';
    return persist(
      (prev) => ({
        ...prev,
        [collection]: normalizeList(list).map((item) => ({
          ...item,
          companyId: item.companyId || companyId,
        })),
      }),
      collection,
    );
  }

  async function register({ phone, password, company, name }) {
    const p = normalizePhone(phone);
    const pass = String(password || '');
    const co = String(company || '').trim();
    if (!isValidPhone(p)) throw new Error('请输入正确的11位手机号');
    if (pass.length < 4) throw new Error('密码至少4位');
    if (!co) throw new Error('请填写公司名称');
    if (!useCloud) throw new Error('请先配置云端同步 Token');

    writing = true;
    notify('idle');
    try {
      const remote = await fetchGistBundle(cfg.gistId, cfg.githubToken);
      accounts = mergeAccounts(accounts, remote.accounts);
      data = mergeData(data, remote.data);

      if ((accounts.users || []).some((u) => u.phone === p)) {
        throw new Error('该手机号已注册，请直接登录');
      }

      const user = normalizeUser({
        id: `u_${Date.now()}`,
        phone: p,
        username: p,
        password: pass,
        name: String(name || p),
        company: co,
        companyId: makeCompanyId(co),
        updatedAt: Date.now(),
      });

      accounts = {
        version: 2,
        updatedAt: Date.now(),
        users: [...(accounts.users || []), user],
      };

      await patchGistFiles(
        cfg.gistId,
        cfg.githubToken,
        buildGistFilesPatch(data, accounts, ['accounts']),
      );
      saveLocalAccounts(accounts);
      saveSession(user);
      lastError = '';
      notify('online');
      return user;
    } catch (err) {
      lastError = err.message || '注册失败';
      notify('error');
      throw err;
    } finally {
      writing = false;
      notify();
    }
  }

  async function login(phone, password) {
    const p = normalizePhone(phone);
    const pass = String(password || '');
    if (!p || !pass) throw new Error('请输入手机号和密码');
    if (!useCloud) throw new Error('请先配置云端同步 Token');

    const remote = await fetchGistBundle(cfg.gistId, cfg.githubToken);
    accounts = mergeAccounts(accounts, remote.accounts);

    let matched = (accounts.users || []).find(
      (u) => (u.phone === p || u.username === p) && String(u.password) === pass,
    );
    if (!matched) throw new Error('手机号或密码错误，请先注册');

    if (!matched.company || !matched.companyId) {
      matched = normalizeUser({
        ...matched,
        company: matched.company || '默认公司',
        companyId: matched.companyId || makeCompanyId(matched.company || '默认公司'),
        updatedAt: Date.now(),
      });
      accounts = {
        ...accounts,
        updatedAt: Date.now(),
        users: (accounts.users || []).map((u) => (u.phone === matched.phone ? matched : u)),
      };
      await patchGistFiles(
        cfg.gistId,
        cfg.githubToken,
        buildGistFilesPatch(data, accounts, ['accounts']),
      );
    }

    saveLocalAccounts(accounts);
    saveSession(matched);
    data = mergeData(data, remote.data);
    saveLocalData(data);
    lastError = '';
    notify('online');
    return matched;
  }

  async function pullRemote() {
    if (!useCloud || pulling || writing) return getSnapshot();
    pulling = true;
    try {
      const remote = await fetchGistBundle(cfg.gistId, cfg.githubToken);
      const merged = mergeData(data, remote.data);
      const mergedAccounts = mergeAccounts(accounts, remote.accounts);
      const remoteFp = fingerprint(remote.data);
      const mergedFp = fingerprint(merged);

      data = merged;
      accounts = mergedAccounts;
      saveLocalData(data);
      saveLocalAccounts(accounts);

      // 云端缺文件时补齐
      const needSeed =
        !remote.accounts?.users?.length ||
        COLLECTIONS.some((key) => {
          // 无法直接知道文件是否存在，用空且从未写过来近似；首次 ensure
          return false;
        });

      if (mergedFp !== remoteFp || needSeed) {
        writing = true;
        try {
          data.updatedAt = Date.now();
          await pushRemote();
        } finally {
          writing = false;
        }
      } else {
        dirty = false;
      }

      lastError = '';
      notify('online');
      return getSnapshot();
    } catch (err) {
      lastError = err.message || '同步失败';
      notify('error');
      return getSnapshot();
    } finally {
      pulling = false;
    }
  }

  function startPolling() {
    if (pollTimer) clearInterval(pollTimer);
    if (!useCloud) return;
    pollTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      if (writing || dirty) return;
      pullRemote().catch(() => {});
    }, POLL_MS);
  }

  function bindWake() {
    if (typeof document === 'undefined') return;
    const onWake = () => {
      if (!document.hidden) pullRemote().catch(() => {});
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    window.addEventListener('pageshow', onWake);
  }

  async function init() {
    if (!useCloud) {
      notify('local');
      return { mode: 'local', message: '未配置云端，仅本机可用' };
    }
    try {
      await ensureCloudFiles();
      startPolling();
      bindWake();
      lastError = '';
      notify('online');
      return { mode: 'online', message: '已连接云端' };
    } catch (err) {
      lastError = err.message || '同步失败';
      notify('error');
      return { mode: 'error', message: lastError };
    }
  }

  function destroy() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  function getConfigLink() {
    const { gistId, githubToken } = cfg;
    if (!gistId || !githubToken) return '';
    const base =
      typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
    return `${base}#gist=${encodeURIComponent(gistId)}&sync=${encodeURIComponent(githubToken)}`;
  }

  singleton = {
    init,
    destroy,
    onChange,
    getSnapshot,
    upsert,
    remove,
    replaceCollection,
    pullRemote,
    persist,
    login,
    register,
    isCloud: useCloud,
    config: cfg,
    getConfigLink,
    getLastError: () => lastError,
  };
  return singleton;
}

export function resetInventoryStore() {
  if (singleton) singleton.destroy();
  singleton = null;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('inventory-store-reset'));
  }
}
