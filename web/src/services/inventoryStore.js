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
const LOCAL_BACKUP_KEY = 'inventory-backups-v1';
const LOCAL_DIRTY_KEY = 'inventory-dirty-v1';
const SESSION_KEY = 'inventory-session-v1';
const POLL_MS = 5000;
const MAX_LOCAL_BACKUPS = 12;
const MAX_CLOUD_DAILY_BACKUPS = 7;
const CLOUD_BACKUP_LATEST = 'backup-latest.json';

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
      _deleted: Boolean(item._deleted),
    }))
    .filter((item) => item.id);
}

function activeList(list) {
  return (list || []).filter((item) => !item._deleted);
}

function countActiveRecords(data) {
  const d = normalizeData(data);
  return COLLECTIONS.reduce((sum, key) => sum + activeList(d[key]).length, 0);
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
  // 账号以整份快照为准（按 updatedAt），避免「云端已清空但本地旧用户被合并回来」
  const localTs = Number(local?.updatedAt) || 0;
  const remoteTs = Number(remote?.updatedAt) || 0;
  const source = remoteTs >= localTs ? remote : local;
  const byPhone = new Map();
  for (const u of (source?.users || []).map(normalizeUser)) {
    if (!u.phone) continue;
    byPhone.set(u.phone, u);
  }
  return {
    version: 2,
    updatedAt: Math.max(localTs, remoteTs),
    users: Array.from(byPhone.values()),
  };
}

function filterDataByCompany(raw, companyId) {
  const data = normalizeData(raw);
  const next = emptyData();
  next.updatedAt = data.updatedAt;
  for (const key of COLLECTIONS) {
    let rows = activeList(data[key]);
    if (companyId) {
      rows = rows.filter((item) => String(item.companyId || '') === String(companyId));
    }
    next[key] = rows;
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
  try {
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(normalizeData(data)));
  } catch (err) {
    console.warn('本地数据写入失败', err);
    throw new Error('本地存储已满或不可用，请导出备份后清理浏览器空间');
  }
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
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(normalizeAccounts(accounts)));
  } catch (err) {
    console.warn('本地账号写入失败', err);
    throw new Error('本地存储已满或不可用，请导出备份后清理浏览器空间');
  }
}

function loadDirtyFlag() {
  try {
    return localStorage.getItem(LOCAL_DIRTY_KEY) === '1';
  } catch {
    return false;
  }
}

function saveDirtyFlag(flag) {
  try {
    if (flag) localStorage.setItem(LOCAL_DIRTY_KEY, '1');
    else localStorage.removeItem(LOCAL_DIRTY_KEY);
  } catch {
    /* ignore */
  }
}

function loadLocalBackupStore() {
  try {
    const raw = localStorage.getItem(LOCAL_BACKUP_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    const items = Array.isArray(parsed?.items) ? parsed.items : [];
    return { items };
  } catch {
    return { items: [] };
  }
}

function saveLocalBackupStore(store) {
  try {
    localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn('本地备份写入失败', err);
  }
}

function buildBackupPayload(data, accounts, reason = 'auto') {
  const normalizedData = normalizeData(data);
  const normalizedAccounts = normalizeAccounts(accounts);
  return {
    version: 1,
    kind: 'enter-export-backup',
    createdAt: Date.now(),
    reason: String(reason || 'auto'),
    recordCount: countActiveRecords(normalizedData),
    data: normalizedData,
    accounts: normalizedAccounts,
  };
}

function pushLocalBackup(data, accounts, reason = 'auto') {
  const payload = buildBackupPayload(data, accounts, reason);
  const store = loadLocalBackupStore();
  const item = {
    id: `bk_${payload.createdAt}`,
    createdAt: payload.createdAt,
    reason: payload.reason,
    recordCount: payload.recordCount,
    data: payload.data,
    accounts: payload.accounts,
  };
  const prev = store.items[0];
  // 同一秒内重复写入则跳过，避免刷屏
  if (prev && Math.abs((prev.createdAt || 0) - item.createdAt) < 1000 && prev.recordCount === item.recordCount) {
    return item;
  }
  store.items = [item, ...store.items].slice(0, MAX_LOCAL_BACKUPS);
  saveLocalBackupStore(store);
  return item;
}

export function listLocalBackups() {
  return loadLocalBackupStore().items.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    reason: item.reason,
    recordCount: item.recordCount,
  }));
}

function dayStamp(ts = Date.now()) {
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function cloudDailyBackupName(ts = Date.now()) {
  return `backup-${dayStamp(ts)}.json`;
}

async function fetchGistRaw(gistId, token) {
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
  return res.json();
}

async function writeCloudBackup(gistId, token, data, accounts, reason = 'auto') {
  const payload = buildBackupPayload(data, accounts, reason);
  const content = JSON.stringify(payload, null, 2);
  const files = {
    [CLOUD_BACKUP_LATEST]: { content },
    [cloudDailyBackupName(payload.createdAt)]: { content },
  };

  // 清理过旧的按日备份，只保留最近 N 天
  try {
    const gist = await fetchGistRaw(gistId, token);
    const names = Object.keys(gist.files || {})
      .filter((name) => /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .sort()
      .reverse();
    names.slice(MAX_CLOUD_DAILY_BACKUPS).forEach((name) => {
      files[name] = null;
    });
  } catch {
    /* 清理失败不影响主备份 */
  }

  await patchGistFiles(gistId, token, files);
  return payload;
}

export function createExportBlob(data, accounts) {
  const payload = buildBackupPayload(data, accounts, 'export');
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export function parseBackupFile(raw) {
  const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!parsed || typeof parsed !== 'object') throw new Error('备份文件格式无效');
  const data = normalizeData(parsed.data || parsed);
  const accounts = normalizeAccounts(parsed.accounts || emptyAccounts());
  if (!countActiveRecords(data) && !(accounts.users || []).length && !parsed.data) {
    // 允许空备份，但提示可能不对
  }
  return {
    version: 1,
    kind: 'enter-export-backup',
    createdAt: Number(parsed.createdAt) || Date.now(),
    reason: String(parsed.reason || 'import'),
    recordCount: countActiveRecords(data),
    data,
    accounts,
  };
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
  const gist = await fetchGistRaw(gistId, token);
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
  for (const p of activeList(data.products || [])) map[p.id] = 0;
  for (const row of activeList(data.inbound || [])) {
    const id = row.productId;
    if (!id) continue;
    map[id] = (map[id] || 0) + (Number(row.quantity) || 0);
  }
  for (const row of activeList(data.outbound || [])) {
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
  let dirty = loadDirtyFlag();
  let lastError = '';
  let lastBackupAt = 0;
  let status = useCloud ? 'idle' : 'local';
  const listeners = new Set();

  function setDirty(flag) {
    dirty = Boolean(flag);
    saveDirtyFlag(dirty);
  }

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
      dirty,
      localBackups: listLocalBackups(),
    };
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  async function ensureCloudFiles() {
    const remote = await fetchGistBundle(cfg.gistId, cfg.githubToken);
    let mergedData = mergeData(data, remote.data);
    // 防止本地空缓存把云端有数据覆盖成空
    if (countActiveRecords(data) === 0 && countActiveRecords(remote.data) > 0) {
      mergedData = normalizeData(remote.data);
    }
    const mergedAccounts = mergeAccounts(accounts, remote.accounts);
    const files = buildGistFilesPatch(mergedData, mergedAccounts);
    const written = await patchGistFiles(cfg.gistId, cfg.githubToken, files);
    data = written?.data || mergedData;
    accounts = written?.accounts || mergedAccounts;
    pushLocalBackup(data, accounts, 'ensure-cloud');
    saveLocalData(data);
    saveLocalAccounts(accounts);
    return getSnapshot();
  }

  async function maybeCloudBackup(reason = 'auto') {
    if (!useCloud) return;
    const now = Date.now();
    // 自动备份至少间隔 2 分钟，手动 backup 不限
    if (reason === 'auto' && now - lastBackupAt < 2 * 60 * 1000) return;
    try {
      await writeCloudBackup(cfg.gistId, cfg.githubToken, data, accounts, reason);
      lastBackupAt = now;
    } catch (err) {
      console.warn('云端备份失败', err);
    }
  }

  async function pushRemote(changedKeys) {
    const remote = await fetchGistBundle(cfg.gistId, cfg.githubToken);
    let merged = mergeData(data, remote.data);
    if (countActiveRecords(data) === 0 && countActiveRecords(remote.data) > 0) {
      // 本地异常空数据时，绝不拿空数据覆盖云端
      merged = normalizeData(remote.data);
    }
    data = merged;
    accounts = normalizeAccounts(remote.accounts);
    data.updatedAt = Date.now();

    const keys = changedKeys && changedKeys.length ? changedKeys : null;
    const files = buildGistFilesPatch(data, accounts, keys);
    const written = await patchGistFiles(cfg.gistId, cfg.githubToken, files);
    if (written) {
      data = written.data;
      if (written.accounts) accounts = written.accounts;
    }
    pushLocalBackup(data, accounts, keys ? `push:${keys.join(',')}` : 'push');
    saveLocalData(data);
    saveLocalAccounts(accounts);
    setDirty(false);
    await maybeCloudBackup('auto');
  }

  async function persist(mutator, changedKey) {
    writing = true;
    setDirty(true);
    notify(status === 'local' ? 'local' : 'idle');
    try {
      const before = normalizeData(data);
      pushLocalBackup(before, accounts, 'before-write');
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
        pushLocalBackup(data, accounts, 'local-write');
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
    const targetId = String(id);
    return persist((prev) => {
      const list = [...(prev[collection] || [])];
      const idx = list.findIndex((item) => item.id === targetId);
      if (idx < 0) return prev;
      const item = list[idx];
      if (session?.companyId && item.companyId && item.companyId !== session.companyId) {
        return prev;
      }
      // 软删除：保留 tombstone，避免多端合并时旧数据复活
      list[idx] = {
        ...item,
        _deleted: true,
        updatedAt: Date.now(),
        companyId: item.companyId || session?.companyId || '',
      };
      return { ...prev, [collection]: list };
    }, collection);
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
      // 注册查重以云端为准，不合并本地旧缓存
      accounts = normalizeAccounts(remote.accounts);
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
    // 登录以云端账号为准
    accounts = normalizeAccounts(remote.accounts);

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
      const remoteFp = fingerprint(remote.data);
      const mergedFp = fingerprint(merged);

      data = merged;
      // 账号列表以云端为准，避免本地旧号写回 Gist
      accounts = normalizeAccounts(remote.accounts);
      saveLocalData(data);
      saveLocalAccounts(accounts);

      if (mergedFp !== remoteFp) {
        writing = true;
        try {
          data.updatedAt = Date.now();
          await pushRemote();
        } finally {
          writing = false;
        }
      } else {
        setDirty(false);
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
      if (writing || dirty) {
        // 有未同步脏数据时优先重试推送
        if (dirty && !writing) {
          pushRemote().catch(() => {});
        }
        return;
      }
      pullRemote().catch(() => {});
    }, POLL_MS);
  }

  function bindWake() {
    if (typeof document === 'undefined') return;
    const onWake = () => {
      if (document.hidden) return;
      if (dirty) pushRemote().catch(() => {});
      else pullRemote().catch(() => {});
    };
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('focus', onWake);
    window.addEventListener('pageshow', onWake);
  }

  async function init() {
    if (!useCloud) {
      notify('local');
      return { mode: 'local', message: '未配置云端，仅本机可用（请定期导出备份）' };
    }
    try {
      await ensureCloudFiles();
      if (dirty) {
        await pushRemote();
      }
      await maybeCloudBackup('init');
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

  function exportBackup() {
    // 导出当前内存全量（含各公司），不按公司过滤
    pushLocalBackup(data, accounts, 'export');
    return createExportBlob(data, accounts);
  }

  async function importBackup(raw, { merge = true } = {}) {
    const backup = parseBackupFile(raw);
    writing = true;
    setDirty(true);
    notify('idle');
    try {
      pushLocalBackup(data, accounts, 'before-import');
      if (merge) {
        data = mergeData(data, backup.data);
        accounts = mergeAccounts(accounts, backup.accounts);
      } else {
        data = normalizeData(backup.data);
        accounts = normalizeAccounts(backup.accounts);
      }
      data.updatedAt = Date.now();
      accounts = { ...accounts, updatedAt: Date.now() };
      saveLocalData(data);
      saveLocalAccounts(accounts);
      pushLocalBackup(data, accounts, 'after-import');
      if (useCloud) {
        await pushRemote();
        await maybeCloudBackup('import');
        notify('online');
      } else {
        notify('local');
      }
      lastError = '';
      return getSnapshot();
    } catch (err) {
      lastError = err.message || '导入失败';
      notify('error');
      throw err;
    } finally {
      writing = false;
      notify();
    }
  }

  async function restoreLocalBackup(backupId) {
    const item = loadLocalBackupStore().items.find((x) => x.id === backupId);
    if (!item) throw new Error('找不到该本地备份');
    return importBackup(
      {
        createdAt: item.createdAt,
        reason: `restore:${item.reason}`,
        data: item.data,
        accounts: item.accounts,
      },
      { merge: false },
    );
  }

  async function restoreCloudLatest() {
    if (!useCloud) throw new Error('请先配置云端同步');
    const gist = await fetchGistRaw(cfg.gistId, cfg.githubToken);
    const file = gist.files?.[CLOUD_BACKUP_LATEST];
    if (!file?.content) throw new Error('云端尚无 backup-latest.json，请先产生一次数据变更');
    return importBackup(file.content, { merge: false });
  }

  async function listCloudBackups() {
    if (!useCloud) return [];
    const gist = await fetchGistRaw(cfg.gistId, cfg.githubToken);
    return Object.keys(gist.files || {})
      .filter((name) => name === CLOUD_BACKUP_LATEST || /^backup-\d{4}-\d{2}-\d{2}\.json$/.test(name))
      .sort()
      .reverse()
      .map((name) => ({
        name,
        size: gist.files[name]?.size || 0,
      }));
  }

  async function createManualBackup() {
    pushLocalBackup(data, accounts, 'manual');
    if (useCloud) {
      await writeCloudBackup(cfg.gistId, cfg.githubToken, data, accounts, 'manual');
      lastBackupAt = Date.now();
    }
    notify();
    return getSnapshot();
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
    exportBackup,
    importBackup,
    restoreLocalBackup,
    restoreCloudLatest,
    listCloudBackups,
    createManualBackup,
    listLocalBackups,
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
