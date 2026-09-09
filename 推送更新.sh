#!/bin/bash
set -e
cd "$(dirname "$0")"

REPO_NAME="${REPO_NAME:-enter-export}"
export NODE_OPTIONS=--openssl-legacy-provider
export NODE_ENV=production
export REPO_NAME

echo "==== 构建 ===="
(
  cd web
  yarn build
)
rm -rf docs
mkdir -p docs
cp -R web/dist/* docs/
cp docs/index.html docs/404.html 2>/dev/null || true

echo "==== 提交并推送 ===="
git add -A
git commit -m "chore: update Pages build $(date +%Y%m%d%H%M)" || echo "无代码变更，仅确保远程最新"
git push origin main

GH_USER="$(gh api user -q .login 2>/dev/null || echo wangmenglei4910)"
URL="https://$GH_USER.github.io/$REPO_NAME/?v=$(date +%Y%m%d%H%M)"
echo "推送成功！稍后打开 $URL"
open "$URL" 2>/dev/null || true
