#!/bin/bash
set -e
export PATH="/usr/bin:/opt/homebrew/bin:$PATH"
cd "$(dirname "$0")"

REPO_NAME="${REPO_NAME:-enter-export}"
GH_USER="$(gh api user -q .login 2>/dev/null || true)"

echo "==== 0) 检查依赖 ===="
command -v gh >/dev/null || { echo "请先安装 GitHub CLI: brew install gh"; exit 1; }
command -v yarn >/dev/null || { echo "请先安装 yarn"; exit 1; }
command -v node >/dev/null || { echo "请先安装 node"; exit 1; }

echo "==== 1) 登录 GitHub（按提示在浏览器授权）===="
gh auth status >/dev/null 2>&1 || gh auth login --hostname github.com --git-protocol https --web
GH_USER="$(gh api user -q .login)"

echo "==== 2) 构建前端（输出到 docs/）===="
export NODE_OPTIONS=--openssl-legacy-provider
export NODE_ENV=production
export REPO_NAME
(
  cd web
  yarn install
  yarn build
)
rm -rf docs
mkdir -p docs
cp -R web/dist/* docs/
# Pages 对 SPA 的兜底（hash 路由通常不需要，但保留无害）
cp docs/index.html docs/404.html 2>/dev/null || true

echo "==== 3) 初始化 / 推送 Git 仓库 ===="
if [ ! -d .git ]; then
  git init
  git checkout -b main
fi

# 确保 .gitignore
if [ ! -f .gitignore ]; then
  cat > .gitignore <<'EOF'
node_modules/
web/node_modules/
web/dist/
web/src/.umi/
web/src/.umi-production/
.DS_Store
*.log
.env
EOF
fi

git add -A
git status
git commit -m "deploy: GitHub Pages + Gist JSON sync" || echo "（无新提交或已是最新）"

if gh repo view "$GH_USER/$REPO_NAME" >/dev/null 2>&1; then
  echo "仓库已存在：$GH_USER/$REPO_NAME"
  if git remote get-url origin >/dev/null 2>&1; then
    git remote set-url origin "https://github.com/$GH_USER/$REPO_NAME.git"
  else
    git remote add origin "https://github.com/$GH_USER/$REPO_NAME.git"
  fi
  git push -u origin main
else
  if git remote get-url origin >/dev/null 2>&1; then
    git push -u origin main || gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  else
    gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
  fi
fi

echo "==== 4) 开启 GitHub Pages（/docs）===="
gh api -X POST "repos/$GH_USER/$REPO_NAME/pages" --input - <<JSON
{"build_type":"legacy","source":{"branch":"main","path":"/docs"}}
JSON
|| gh api -X PUT "repos/$GH_USER/$REPO_NAME/pages" --input - <<JSON
{"source":{"branch":"main","path":"/docs"}}
JSON
|| {
  echo "自动开启 Pages 失败，请手动打开："
  echo "https://github.com/$GH_USER/$REPO_NAME/settings/pages"
  echo "Source 选 Deploy from a branch → main → /docs → Save"
}

URL="https://$GH_USER.github.io/$REPO_NAME/"
echo ""
echo "完成！几分钟后访问："
echo "$URL"
open "$URL" 2>/dev/null || true
