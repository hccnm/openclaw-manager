#!/bin/bash
# OpenClaw Manager API 测试脚本

BASE_URL="http://localhost:3000"
TOKEN=""

echo "===== OpenClaw Manager API 测试 ====="
echo ""

# 启动服务器（后台）
echo "启动服务器..."
cd "$(dirname "$0")"
node server.js &
SERVER_PID=$!
sleep 2

# 清理函数
cleanup() {
  echo ""
  echo "停止服务器..."
  kill $SERVER_PID 2>/dev/null
}
trap cleanup EXIT

# 测试健康检查
echo "1. 测试健康检查..."
curl -s "$BASE_URL/api/health" | jq .
echo ""

# 测试登录
echo "2. 测试登录（错误密码）..."
curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"wrong"}' | jq .
echo ""

echo "3. 测试登录（正确密码）..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')
echo "$RESPONSE" | jq .
TOKEN=$(echo "$RESPONSE" | jq -r '.data.token // empty')
echo ""

if [ -z "$TOKEN" ]; then
  echo "登录失败，无法继续测试"
  exit 1
fi

echo "获取到 Token: ${TOKEN:0:20}..."
echo ""

# 测试获取服务器列表
echo "4. 测试获取服务器列表（空）..."
curl -s "$BASE_URL/api/servers" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 测试添加服务器
echo "5. 测试添加服务器..."
RESPONSE=$(curl -s -X POST "$BASE_URL/api/servers" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"测试服务器","ip":"192.168.1.100","ssh_user":"root","ssh_auth_type":"password","ssh_password":"test123"}')
echo "$RESPONSE" | jq .
SERVER_ID=$(echo "$RESPONSE" | jq -r '.data.id // empty')
echo ""

# 测试获取服务器列表（有数据）
echo "6. 测试获取服务器列表（有数据）..."
curl -s "$BASE_URL/api/servers" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 测试删除服务器
if [ -n "$SERVER_ID" ]; then
  echo "7. 测试删除服务器..."
  curl -s -X DELETE "$BASE_URL/api/servers/$SERVER_ID" \
    -H "Authorization: Bearer $TOKEN" | jq .
  echo ""
fi

# 测试登出
echo "8. 测试登出..."
curl -s -X POST "$BASE_URL/api/auth/logout" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 测试无 Token 访问
echo "9. 测试无 Token 访问..."
curl -s "$BASE_URL/api/servers" | jq .
echo ""

echo "===== 测试完成 ====="