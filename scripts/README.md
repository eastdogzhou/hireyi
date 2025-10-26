# Scripts 目录

本目录包含用于项目管理和部署的实用脚本。

## 📋 可用脚本

### `start.sh` - 一键启动脚本

自动启动后端和前端开发服务器的便捷脚本。

#### 快速开始

```bash
# 启动所有服务（后端 + 前端）
./scripts/start.sh

# 仅启动后端
./scripts/start.sh --backend-only

# 仅启动前端
./scripts/start.sh --frontend-only

# 查看所有选项
./scripts/start.sh --help
```

#### 功能特性

- ✅ 自动检查环境依赖（Python, Node.js, uv, npm）
- ✅ 验证配置文件是否存在
- ✅ 检查端口是否被占用
- ✅ 启动后端服务（FastAPI + Uvicorn）
- ✅ 启动前端服务（Vite）
- ✅ 自动在浏览器中打开应用
- ✅ 彩色输出和进度提示
- ✅ 优雅的错误处理
- ✅ 支持 Ctrl+C 停止所有服务

#### 命令选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `-h, --help` | 显示帮助信息 | `./scripts/start.sh --help` |
| `-b, --backend-only` | 仅启动后端服务 | `./scripts/start.sh -b` |
| `-f, --frontend-only` | 仅启动前端服务 | `./scripts/start.sh -f` |
| `-p, --backend-port` | 指定后端端口 | `./scripts/start.sh -p 8080` |
| `-P, --frontend-port` | 指定前端端口 | `./scripts/start.sh -P 3000` |
| `-n, --no-browser` | 不自动打开浏览器 | `./scripts/start.sh -n` |
| `-v, --verbose` | 显示详细输出 | `./scripts/start.sh -v` |
| `-s, --stop` | 停止所有服务 | `./scripts/start.sh --stop` |

#### 使用场景

**场景 1: 全栈开发**
```bash
# 启动所有服务，在浏览器中打开应用
./scripts/start.sh
```

**场景 2: 仅开发后端**
```bash
# 仅启动后端，用于 API 测试
./scripts/start.sh --backend-only
```

**场景 3: 仅开发前端**
```bash
# 假设后端已在其他地方运行
./scripts/start.sh --frontend-only
```

**场景 4: 使用自定义端口**
```bash
# 避免端口冲突
./scripts/start.sh -p 8080 -P 3000
```

**场景 5: 后台运行（CI/CD）**
```bash
# 不打开浏览器，适合自动化测试
./scripts/start.sh --no-browser
```

#### 日志查看

脚本会将日志输出到临时文件（非 verbose 模式）：

```bash
# 查看后端日志
tail -f /tmp/hireyi-backend.log

# 查看前端日志
tail -f /tmp/hireyi-frontend.log
```

#### 停止服务

```bash
# 方法 1: 在运行脚本的终端按 Ctrl+C

# 方法 2: 使用停止命令
./scripts/start.sh --stop

# 方法 3: 手动杀死进程
pkill -f "uvicorn app.main:app"
pkill -f "vite"
```

#### 故障排除

**问题 1: 脚本提示权限错误**

```bash
# 添加执行权限
chmod +x ./scripts/start.sh
```

**问题 2: 端口被占用**

脚本会自动检测并提示，你可以选择：
- 杀死占用进程（脚本会询问）
- 使用不同端口：`./scripts/start.sh -p 8080`

**问题 3: 配置文件不存在**

```bash
# 后端配置
cp backend/.env.example backend/.env
# 编辑 backend/.env

# 前端配置
cp frontend/.env.example frontend/.env
# 编辑 frontend/.env
```

**问题 4: 环境依赖缺失**

脚本会检测并提示缺失的依赖：

```bash
# 安装 uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# 安装 Node.js（通过 nvm 推荐）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
```

## 📚 相关文档

- [部署和运行指南](../docs/deployment.md) - 完整的部署文档
- [后端 README](../backend/README.md) - 后端文档
- [前端 README](../frontend/README.md) - 前端文档
- [项目指南](../CLAUDE.md) - 开发指南

---

**最后更新**: 2025-10-20
