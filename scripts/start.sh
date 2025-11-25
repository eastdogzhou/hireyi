#!/bin/bash

# ============================================================================
# AI Resume Scanning System - 一键启动脚本
# ============================================================================
# 功能: 自动启动后端和前端开发服务器
# 作者: AI Resume Scanning System Team
# 最后更新: 2025-10-20
# ============================================================================

set -e  # 遇到错误立即退出

# ============================================================================
# 颜色和样式定义
# ============================================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ============================================================================
# 配置变量
# ============================================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# 默认端口
BACKEND_PORT=8000
FRONTEND_PORT=5173

# 选项标志
BACKEND_ONLY=false
FRONTEND_ONLY=false
NO_BROWSER=false
VERBOSE=false

# PID 文件
BACKEND_PID_FILE="/tmp/hireyi-backend.pid"
FRONTEND_PID_FILE="/tmp/hireyi-frontend.pid"

# ============================================================================
# 辅助函数
# ============================================================================

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_header() {
    echo ""
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# 显示帮助信息
show_help() {
    cat << EOF
${BOLD}AI Resume Scanning System - 一键启动脚本${NC}

${BOLD}用法:${NC}
    $0 [选项]

${BOLD}选项:${NC}
    -h, --help              显示此帮助信息
    -b, --backend-only      仅启动后端服务
    -f, --frontend-only     仅启动前端服务
    -p, --backend-port      指定后端端口 (默认: 8000)
    -P, --frontend-port     指定前端端口 (默认: 5173)
    -n, --no-browser        不自动打开浏览器
    -v, --verbose           显示详细输出
    -s, --stop              停止所有运行中的服务

${BOLD}示例:${NC}
    $0                      # 启动所有服务
    $0 -b                   # 仅启动后端
    $0 -f                   # 仅启动前端
    $0 -p 8080              # 使用端口 8080 启动后端
    $0 -n                   # 启动但不打开浏览器
    $0 --stop               # 停止所有服务

${BOLD}访问地址:${NC}
    前端应用:   http://localhost:5173
    后端 API:   http://localhost:8000
    API 文档:   http://localhost:8000/docs

EOF
    exit 0
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "$1 未安装"
        return 1
    else
        print_success "$1 已安装"
        return 0
    fi
}

# 检查端口是否被占用
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        print_warning "端口 $port 已被占用"
        local pid=$(lsof -ti:$port)
        print_info "占用进程 PID: $pid"
        read -p "是否杀死占用进程? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            kill -9 $pid
            print_success "已杀死进程 $pid"
            sleep 1
        else
            return 1
        fi
    fi
    return 0
}

# 停止服务
stop_services() {
    print_header "停止服务"

    # 停止后端
    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 $backend_pid 2>/dev/null; then
            print_info "停止后端服务 (PID: $backend_pid)..."
            kill $backend_pid
            rm "$BACKEND_PID_FILE"
            print_success "后端服务已停止"
        fi
    fi

    # 停止前端
    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $frontend_pid 2>/dev/null; then
            print_info "停止前端服务 (PID: $frontend_pid)..."
            kill $frontend_pid
            rm "$FRONTEND_PID_FILE"
            print_success "前端服务已停止"
        fi
    fi

    # 清理残留进程
    pkill -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -f "vite" 2>/dev/null || true

    print_success "所有服务已停止"
    exit 0
}

# ============================================================================
# 参数解析
# ============================================================================
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            ;;
        -b|--backend-only)
            BACKEND_ONLY=true
            shift
            ;;
        -f|--frontend-only)
            FRONTEND_ONLY=true
            shift
            ;;
        -p|--backend-port)
            BACKEND_PORT="$2"
            shift 2
            ;;
        -P|--frontend-port)
            FRONTEND_PORT="$2"
            shift 2
            ;;
        -n|--no-browser)
            NO_BROWSER=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -s|--stop)
            stop_services
            ;;
        *)
            print_error "未知选项: $1"
            echo "使用 -h 或 --help 查看帮助"
            exit 1
            ;;
    esac
done

# ============================================================================
# 主函数
# ============================================================================

main() {
    print_header "🚀 AI Resume Scanning System - 一键启动"

    # 1. 检查项目目录
    print_info "检查项目目录..."
    if [ ! -d "$BACKEND_DIR" ] || [ ! -d "$FRONTEND_DIR" ]; then
        print_error "项目目录不完整"
        exit 1
    fi
    print_success "项目目录检查通过"

    # 2. 检查环境依赖
    print_header "检查环境依赖"

    local deps_ok=true

    if [ "$FRONTEND_ONLY" = false ]; then
        check_command "python3" || deps_ok=false
        check_command "uv" || deps_ok=false
    fi

    if [ "$BACKEND_ONLY" = false ]; then
        check_command "node" || deps_ok=false
        check_command "npm" || deps_ok=false
    fi

    if [ "$deps_ok" = false ]; then
        print_error "环境依赖检查失败，请先安装缺失的依赖"
        exit 1
    fi

    # 3. 检查配置文件
    print_header "检查配置文件"

    if [ "$FRONTEND_ONLY" = false ]; then
        if [ ! -f "$BACKEND_DIR/.env" ]; then
            print_warning "后端 .env 文件不存在"
            print_info "请先配置 backend/.env 文件"
            print_info "参考: backend/.env.example"
            exit 1
        fi
        print_success "后端配置文件存在"
    fi

    if [ "$BACKEND_ONLY" = false ]; then
        if [ ! -f "$FRONTEND_DIR/.env" ]; then
            print_warning "前端 .env 文件不存在"
            print_info "请先配置 frontend/.env 文件"
            print_info "参考: frontend/.env.example"
            exit 1
        fi
        print_success "前端配置文件存在"
    fi

    # 4. 检查端口
    print_header "检查端口"

    if [ "$FRONTEND_ONLY" = false ]; then
        check_port $BACKEND_PORT || exit 1
        print_success "后端端口 $BACKEND_PORT 可用"
    fi

    if [ "$BACKEND_ONLY" = false ]; then
        check_port $FRONTEND_PORT || exit 1
        print_success "前端端口 $FRONTEND_PORT 可用"
    fi

    # 5. 启动后端
    if [ "$FRONTEND_ONLY" = false ]; then
        print_header "启动后端服务"

        cd "$BACKEND_DIR"

        print_info "启动后端 (端口: $BACKEND_PORT)..."

        if [ "$VERBOSE" = true ]; then
            uv run uvicorn app.main:app --reload --port $BACKEND_PORT &
        else
            uv run uvicorn app.main:app --reload --port $BACKEND_PORT > /tmp/hireyi-backend.log 2>&1 &
        fi

        BACKEND_PID=$!
        echo $BACKEND_PID > "$BACKEND_PID_FILE"

        # 等待后端启动
        print_info "等待后端启动..."
        sleep 3

        # 检查后端是否启动成功
        if curl -s http://localhost:$BACKEND_PORT/health > /dev/null; then
            print_success "后端服务启动成功 (PID: $BACKEND_PID)"
            print_info "API 地址: http://localhost:$BACKEND_PORT"
            print_info "API 文档: http://localhost:$BACKEND_PORT/docs"
        else
            print_error "后端服务启动失败"
            if [ "$VERBOSE" = false ]; then
                print_info "查看日志: tail -f /tmp/hireyi-backend.log"
            fi
            exit 1
        fi
    fi

    # 6. 启动前端
    if [ "$BACKEND_ONLY" = false ]; then
        print_header "启动前端服务"

        cd "$FRONTEND_DIR"

        print_info "启动前端 (端口: $FRONTEND_PORT)..."

        if [ "$VERBOSE" = true ]; then
            npm run dev -- --port $FRONTEND_PORT &
        else
            npm run dev -- --port $FRONTEND_PORT > /tmp/hireyi-frontend.log 2>&1 &
        fi

        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$FRONTEND_PID_FILE"

        # 等待前端启动
        print_info "等待前端启动..."
        sleep 3

        # 检查前端是否启动成功
        if curl -s http://localhost:$FRONTEND_PORT > /dev/null; then
            print_success "前端服务启动成功 (PID: $FRONTEND_PID)"
            print_info "应用地址: http://localhost:$FRONTEND_PORT"
        else
            print_error "前端服务启动失败"
            if [ "$VERBOSE" = false ]; then
                print_info "查看日志: tail -f /tmp/hireyi-frontend.log"
            fi
            exit 1
        fi
    fi

    # 7. 打开浏览器
    if [ "$NO_BROWSER" = false ] && [ "$BACKEND_ONLY" = false ]; then
        print_header "打开浏览器"

        print_info "在浏览器中打开应用..."

        # 根据操作系统选择打开命令
        if command -v open &> /dev/null; then
            # macOS
            open "http://localhost:$FRONTEND_PORT"
        elif command -v xdg-open &> /dev/null; then
            # Linux
            xdg-open "http://localhost:$FRONTEND_PORT"
        elif command -v start &> /dev/null; then
            # Windows
            start "http://localhost:$FRONTEND_PORT"
        else
            print_warning "无法自动打开浏览器"
            print_info "请手动访问: http://localhost:$FRONTEND_PORT"
        fi

        sleep 1
    fi

    # 8. 显示总结
    print_header "🎉 启动完成"

    echo ""
    echo -e "${BOLD}${GREEN}所有服务已成功启动！${NC}"
    echo ""

    if [ "$FRONTEND_ONLY" = false ]; then
        echo -e "${BOLD}后端服务:${NC}"
        echo -e "  • API 地址:  ${CYAN}http://localhost:$BACKEND_PORT${NC}"
        echo -e "  • API 文档:  ${CYAN}http://localhost:$BACKEND_PORT/docs${NC}"
        echo -e "  • 进程 PID:  $BACKEND_PID"
        echo ""
    fi

    if [ "$BACKEND_ONLY" = false ]; then
        echo -e "${BOLD}前端应用:${NC}"
        echo -e "  • 应用地址:  ${CYAN}http://localhost:$FRONTEND_PORT${NC}"
        echo -e "  • 进程 PID:  $FRONTEND_PID"
        echo ""
    fi

    echo -e "${BOLD}停止服务:${NC}"
    echo -e "  • 按 ${YELLOW}Ctrl+C${NC} 停止所有服务"
    echo -e "  • 或运行: ${YELLOW}$0 --stop${NC}"
    echo ""

    if [ "$VERBOSE" = false ]; then
        echo -e "${BOLD}查看日志:${NC}"
        if [ "$FRONTEND_ONLY" = false ]; then
            echo -e "  • 后端: ${YELLOW}tail -f /tmp/hireyi-backend.log${NC}"
        fi
        if [ "$BACKEND_ONLY" = false ]; then
            echo -e "  • 前端: ${YELLOW}tail -f /tmp/hireyi-frontend.log${NC}"
        fi
        echo ""
    fi

    # 9. 等待用户中断
    print_info "服务正在运行中... (按 Ctrl+C 停止)"

    # 设置 trap 处理 Ctrl+C
    trap cleanup INT TERM

    # 保持脚本运行
    wait
}

# 清理函数
cleanup() {
    echo ""
    print_header "清理资源"

    if [ -f "$BACKEND_PID_FILE" ]; then
        local backend_pid=$(cat "$BACKEND_PID_FILE")
        if kill -0 $backend_pid 2>/dev/null; then
            print_info "停止后端服务..."
            kill $backend_pid
        fi
        rm "$BACKEND_PID_FILE"
    fi

    if [ -f "$FRONTEND_PID_FILE" ]; then
        local frontend_pid=$(cat "$FRONTEND_PID_FILE")
        if kill -0 $frontend_pid 2>/dev/null; then
            print_info "停止前端服务..."
            kill $frontend_pid
        fi
        rm "$FRONTEND_PID_FILE"
    fi

    print_success "所有服务已停止"
    exit 0
}

# ============================================================================
# 运行主函数
# ============================================================================
main
