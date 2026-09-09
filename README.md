# 仓库管理系统（进销存）

静态前端 + **GitHub Gist JSON** 云端数据，部署与同步方式对齐「日常打卡小程序」：

| 层 | 机制 | 作用 |
|---|---|---|
| 应用托管 | **GitHub Pages** | 手机 / 电脑打开同一网址 |
| 数据云端 | **Gist API** 读写 `inventory.json` | 多端共享业务数据 |
| 本地缓存 | `localStorage` | 离线缓存、会话、Token |
| 「实时」同步 | **5 秒轮询** + 切回前台拉取 + 写后立刻 PATCH | 近实时（非 WebSocket） |

不再依赖本机 MySQL / `admin` 服务即可多端使用。

## 本地开发

```bash
cd web
export NODE_OPTIONS=--openssl-legacy-provider   # Node 17+ 需要
yarn
yarn start
```

打开 http://localhost:8000 ，先在登录页「云端配置」填 Gist / Token，再用账号登录。

默认账号：`wangmenglei` / `111111`

## 开启多端同步（约 5 分钟）

### 1. 创建 Gist 数据仓库

1. 打开 https://gist.github.com/
2. 文件名填 `inventory.json`，内容先写 `{}`
3. 创建后，复制 URL 最后一段作为 **gistId**

### 2. 创建 Token

1. https://github.com/settings/tokens → Generate new token
2. **只勾选 `gist`**（不要勾 repo）
3. 复制 `ghp_...` / `github_pat_...`

### 3. 网页里配置

登录页 → **云端配置** → 填入 gistId、Token → 保存并连接。

其他设备可用「复制多端配置链接」（`#gist=...&sync=...`）一键写入配置。

### 4. 部署到 GitHub Pages

```bash
# 首次
./一键部署.sh

# 之后有代码更新
./推送更新.sh
```

成功后访问（把用户名换成你的）：

`https://<你的GitHub用户名>.github.io/enter-export/`

## 数据说明

云端 `inventory.json` 结构概要：

```json
{
  "version": 1,
  "updatedAt": 0,
  "products": [],
  "customers": [],
  "suppliers": [],
  "inbound": [],
  "outbound": [],
  "inboundOrders": [],
  "outboundOrders": [],
  "checks": [],
  "alerts": []
}
```

冲突策略：同一 `id` 按 `updatedAt` 取较新记录后写回 Gist。

## 安全提示

- Token 存在浏览器 localStorage，知道配置链接的人可读写整份 Gist。
- 仅个人 / 小团队内部使用；勿公开传播带 Token 的链接。
- `web/public/config.js` 里不要提交真实 Token（仓库里保留占位符即可）。

## 目录

- `web/` 前端（Umi + Ant Design）
- `admin/` 旧版 Express + MySQL（可选，已非多端同步所需）
- `docs/` 构建产物（Pages 从此目录发布）
