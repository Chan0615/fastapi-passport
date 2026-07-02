#!/bin/bash
# ═════════════════════════════════════════════════
# FastAPI Passport 认证中心部署脚本
# 用法：bash deploy.sh [up|down|restart|logs|clean|rebuild]
# ═════════════════════════════════════════════════
set -e

GIT_REPO="http://gitlab.ops.com/chenan02/fastapi_passport.git"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CONFIG_FILE="$PROJECT_DIR/config/config.yaml"

ACTION="${1:-up}"

export COMPOSE_PROJECT_NAME=fastapi_passport

# ── Git 拉取 ──
pull_code() {
    echo "📦 拉取最新代码..."
    cd "$PROJECT_DIR"

    if [ ! -d ".git" ]; then
        echo "🆕 首次部署，克隆代码..."
        git clone "$GIT_REPO" "$PROJECT_DIR" 2>/dev/null || true
        if [ ! -d ".git" ]; then
            git clone "$GIT_REPO" "$PROJECT_DIR"
        fi
        echo "✅ 代码已克隆"
        return
    fi

    git pull origin main
    echo "✅ 代码已更新"
}

# ── 检查 config.yaml ──
if [ ! -f "$CONFIG_FILE" ]; then
    if [ -f "$PROJECT_DIR/config/config.yaml.example" ]; then
        echo "📋 首次部署，创建 config.yaml ..."
        cp "$PROJECT_DIR/config/config.yaml.example" "$CONFIG_FILE"
        echo "⚠️  请编辑 $CONFIG_FILE 填入真实配置后重新运行"
        exit 1
    else
        echo "❌ 配置文件不存在: $CONFIG_FILE"
        exit 1
    fi
fi

# ── 执行 ──
cd "$SCRIPT_DIR"

case "$ACTION" in
    up)
        pull_code
        cd "$SCRIPT_DIR"
        echo "🚀 启动服务（不重建镜像）..."
        docker compose up -d
        echo ""
        docker compose ps
        ;;
    rebuild)
        pull_code
        cd "$SCRIPT_DIR"
        echo "🔨 构建并启动服务..."
        docker compose up -d --build
        echo ""
        docker compose ps
        echo ""
        echo "🧹 清理旧镜像..."
        docker image prune -f
        ;;
    down)
        echo "🛑 停止服务..."
        docker compose down
        ;;
    restart)
        echo "🔄 重启服务..."
        docker compose restart
        ;;
    logs)
        docker compose logs -f
        ;;
    clean)
        echo "🧹 清理旧镜像..."
        docker image prune -f
        docker builder prune -f
        ;;
    *)
        echo "用法: bash deploy.sh [up|down|restart|logs|clean|rebuild]"
        exit 1
        ;;
esac
