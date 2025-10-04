#!/bin/bash

# Edge One 部署脚本
# 使用方法: ./deploy.sh

echo "🚀 开始部署 HSK Vocabulary Backend 到 Edge One..."

# 检查必要文件
echo "📋 检查必要文件..."
if [ ! -f "[[default]].js" ]; then
    echo "❌ 错误: 找不到 [[default]].js 文件"
    exit 1
fi

if [ ! -f "package.json" ]; then
    echo "❌ 错误: 找不到 package.json 文件"
    exit 1
fi

echo "✅ 必要文件检查完成"

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 创建部署包
echo "📦 创建部署包..."
zip -r hsk-backend-deployment.zip . -x "*.git*" "*.md" "node_modules/.cache/*" "*.log"

echo "✅ 部署包创建完成: hsk-backend-deployment.zip"

# 显示部署包内容
echo "📋 部署包内容:"
unzip -l hsk-backend-deployment.zip | head -20

echo ""
echo "🎯 接下来的步骤:"
echo "1. 登录 Edge One 控制台"
echo "2. 选择你的站点"
echo "3. 进入 '函数计算' 页面"
echo "4. 上传 hsk-backend-deployment.zip"
echo "5. 配置环境变量:"
echo "   - DB_HOST: 你的 MySQL 主机"
echo "   - DB_USER: 你的 MySQL 用户名"
echo "   - DB_PASSWORD: 你的 MySQL 密码"
echo "   - DB_NAME: hsk_vocabulary"
echo "6. 设置触发路径为 /*"
echo "7. 部署函数"

echo ""
echo "📖 详细部署指南请查看 DEPLOYMENT.md"
