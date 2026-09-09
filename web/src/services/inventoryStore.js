/**
 * 仓库数据：GitHub Gist JSON 云端同步（对标打卡小程序）
 * - Pages 多端打开同一网址
 * - Gist API 读写 inventory.json
 * - localStorage 缓存 + 5 秒轮询近实时同步
 */

const CONFIG_OVERRIDE_KEY = 'inventory-sync-config-v1';
const LOCAL_DATA_KEY = 'inventory-data-v1';
const SESSION_KEY = 'inventory-session-v1';
const DATA_FILE = 'inventory.json';
const POLL_MS = 5000;

const COLLECTIONS = [
  'products',
  'customers',
  'suppliers',
  'inbound',
  'outbound',
  'inboundOrders',
  'outboundOrders',
  'checks',
  'alerts',
];

export function emptyData() {
  return {
    version: 1,
    updatedAt: 0,
    products: [],
    customers: [],
    suppliers: [],
    inbound: [],
    outbound: [],
    inboundOrders: [],
    outboundOrders: [],
    checks: [],
    alerts: [],
  };
}

function stamp(record) {
  const now = Date.now();
  return {
    ...record,
    id: String(record.id || now),
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
      updatedAt: Number(item.updatedAt) || 0,
    }))
    .filter((item) => item.id);
}

export function normalizeData(raw) {
  const base = emptyData();
  if (!raw || typeof raw !== 'object') return base;
  const next = { ...base, version: 1, updatedAt: Number(raw.updatedAt) || 0 };
  for (const key of COLLECTIONS) {
    next[key] = normalizeList(raw[key]);
  }
  return next;
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
  const winCfg =
    (typeof window !== 'undefined' && window.INVENTORY_CONFIG) || {};
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

export function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.username) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(username) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ username: String(username) }));
  localStorage.setItem('isLoggedIn', 'true');
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('isLoggedIn');
}

async function fetchStore(gistId, token) {
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
  const files = gist.files || {};
  const file =
    files[DATA_FILE] ||
    files[Object.keys(files).find((k) => k.endsWith('.json'))] ||
    files[Object.keys(files)[0]];
  if (!file?.content) return emptyData();
  try {
    return normalizeData(JSON.parse(file.content));
  } catch {
    return emptyData();
  }
}

async function writeStore(gistId, token, data) {
  const payload = normalizeData({ ...data, updatedAt: Date.now(), version: 1 });
  const res = await fetch(`https://api.github.com/gists/${gistId}`, {
    method: 'PATCH',
    headers: {
      ...authHeaders(token),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      files: {
        [DATA_FILE]: {
          content: JSON.stringify(payload, null, 2),
        },
      },
    }),
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
    const content = gist.files?.[DATA_FILE]?.content;
    if (content) return normalizeData(JSON.parse(content));
  } catch {
    /* ignore */
  }
  return payload;
}

export function calcStockMap(data) {
  const map = {};
  for (const p of data.products || []) {
    map[p.id] = 0;
  }
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
    return {
      data: normalizeData(data),
      status,
      lastError,
      isCloud: useCloud,
      config: cfg,
      loggedIn: Boolean(loadSession()),
    };
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  async function pushRemote(latestRemote) {
    const latest = latestRemote || (await fetchStore(cfg.gistId, cfg.githubToken));
    const merged = mergeData(data, latest);
    merged.updatedAt = Date.now();
    data = await writeStore(cfg.gistId, cfg.githubToken, merged);
    saveLocalData(data);
    dirty = false;
  }

  async function persist(mutator) {
    writing = true;
    dirty = true;
    try {
      const draft = normalizeData(typeof mutator === 'function' ? mutator(normalizeData(data)) : mutator);
      draft.updatedAt = Date.now();
      data = draft;
      saveLocalData(data);

      if (useCloud) {
        await pushRemote();
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
    }
  }

  async function upsert(collection, record) {
    if (!COLLECTIONS.includes(collection)) throw new Error('未知数据集合');
    const row = stamp(record);
    return persist((prev) => {
      const list = [...(prev[collection] || [])];
      const idx = list.findIndex((item) => item.id === row.id);
      if (idx >= 0) list[idx] = { ...list[idx], ...row };
      else list.unshift(row);
      return { ...prev, [collection]: list };
    });
  }

  async function remove(collection, id) {
    if (!COLLECTIONS.includes(collection)) throw new Error('未知数据集合');
    return persist((prev) => ({
      ...prev,
      [collection]: (prev[collection] || []).filter((item) => item.id !== String(id)),
    }));
  }

  async function replaceCollection(collection, list) {
    if (!COLLECTIONS.includes(collection)) throw new Error('未知数据集合');
    return persist((prev) => ({
      ...prev,
      [collection]: normalizeList(list),
    }));
  }

  async function pullRemote() {
    if (!useCloud || pulling || writing) return getSnapshot();
    pulling = true;
    try {
      const remote = await fetchStore(cfg.gistId, cfg.githubToken);
      const merged = mergeData(data, remote);
      const remoteFp = fingerprint(remote);
      const mergedFp = fingerprint(merged);
      data = merged;
      saveLocalData(data);

      if (mergedFp !== remoteFp) {
        writing = true;
        try {
          data.updatedAt = Date.now();
          await pushRemote(remote);
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
      await pullRemote();
      startPolling();
      bindWake();
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
    const base = typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : '';
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
