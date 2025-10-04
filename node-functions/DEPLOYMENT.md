# Edge One 部署指南

## 🚀 部署步骤

### 1. 准备工作

#### 1.1 确保文件结构正确

确保你的 `node-functions` 目录结构如下：

```
node-functions/
├── [[default]].js          # 主入口文件
├── package.json            # 依赖配置
├── config/
│   └── database.js         # 数据库配置
├── api/                    # API 路由
└── database/
    └── schema.sql          # 数据库结构
```

#### 1.2 检查 package.json

确保 `package.json` 中包含所有必要的依赖：

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.5",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0"
  }
}
```

### 2. 数据库准备

#### 2.1 创建 MySQL 数据库

在你的 MySQL 服务器上执行：

```sql
CREATE DATABASE hsk_vocabulary CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.2 导入数据库结构

```bash
mysql -u your_username -p hsk_vocabulary < database/schema.sql
```

### 3. Edge One 控制台配置

#### 3.1 登录 Edge One 控制台

1. 访问 [Edge One 控制台](https://console.cloud.tencent.com/edgeone)
2. 选择你的站点
3. 进入 "函数计算" 或 "Edge Functions" 页面

#### 3.2 创建 Node Functions

1. 点击 "新建函数"
2. 选择 "Node.js" 运行时
3. 函数名称：`hsk-backend` (或你喜欢的名称)

#### 3.3 上传代码

有两种方式上传代码：

**方式一：直接上传文件**

1. 将整个 `node-functions` 目录压缩为 ZIP 文件
2. 在 Edge One 控制台上传 ZIP 文件

**方式二：Git 集成**

1. 将代码推送到 Git 仓库
2. 在 Edge One 控制台配置 Git 集成

### 4. 环境变量配置

在 Edge One 控制台设置以下环境变量：

#### 4.1 数据库配置

```
DB_HOST=your_mysql_host
DB_PORT=3306
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password
DB_NAME=hsk_vocabulary
```

#### 4.2 应用配置

```
NODE_ENV=production
FRONTEND_URL=https://your-frontend-domain.com
```

### 5. 部署配置

#### 5.1 函数配置

- **入口文件**: `[[default]].js`
- **超时时间**: 30 秒
- **内存**: 128MB (可根据需要调整)
- **并发数**: 10 (可根据需要调整)

#### 5.2 触发配置

- **触发器类型**: HTTP 触发器
- **请求方法**: GET, POST, PUT, DELETE, PATCH
- **路径**: `/api/*` 或 `/*` (根据你的需求)

### 6. 域名绑定

#### 6.1 自定义域名

1. 在 Edge One 控制台添加自定义域名
2. 配置 CNAME 记录指向 Edge One
3. 绑定到你的 Node Functions

#### 6.2 API 路径配置

建议的 API 路径结构：

```
https://your-domain.com/api/vocabulary/list
https://your-domain.com/api/progress
https://your-domain.com/api/lessons
```

### 7. 部署和测试

#### 7.1 部署函数

1. 点击 "部署" 按钮
2. 等待部署完成
3. 查看部署日志确认无错误

#### 7.2 测试 API

部署完成后，测试以下端点：

```bash
# 健康检查
curl https://your-domain.com/health

# 获取词汇列表
curl https://your-domain.com/api/vocabulary/list

# 获取课程列表
curl https://your-domain.com/api/lessons
```

### 8. 监控和日志

#### 8.1 查看日志

在 Edge One 控制台查看函数执行日志：

1. 进入函数详情页
2. 点击 "日志" 标签
3. 查看实时日志和错误信息

#### 8.2 监控指标

监控以下指标：

- 请求数量
- 响应时间
- 错误率
- 内存使用率

### 9. 常见问题解决

#### 9.1 数据库连接失败

**问题**: `❌ Database connection failed`
**解决方案**:

1. 检查数据库主机地址和端口
2. 确认数据库用户权限
3. 检查防火墙设置
4. 验证环境变量是否正确设置

#### 9.2 模块找不到错误

**问题**: `Cannot find module 'xxx'`
**解决方案**:

1. 确认 `package.json` 包含所有依赖
2. 检查文件路径是否正确
3. 重新上传代码包

#### 9.3 CORS 错误

**问题**: 前端无法访问 API
**解决方案**:

1. 检查 `FRONTEND_URL` 环境变量
2. 确认 CORS 配置正确
3. 检查域名绑定

### 10. 性能优化建议

#### 10.1 数据库优化

- 使用连接池（已配置）
- 添加适当的索引
- 定期清理日志表

#### 10.2 缓存策略

- 对静态数据进行缓存
- 使用 Redis 缓存频繁查询的数据

#### 10.3 代码优化

- 压缩 JavaScript 代码
- 移除未使用的依赖
- 优化数据库查询

### 11. 安全配置

#### 11.1 数据库安全

- 使用强密码
- 限制数据库用户权限
- 启用 SSL 连接

#### 11.2 API 安全

- 添加请求频率限制
- 实现身份验证（如需要）
- 验证输入数据

### 12. 备份和恢复

#### 12.1 代码备份

- 使用 Git 版本控制
- 定期备份代码包

#### 12.2 数据库备份

```bash
# 备份数据库
mysqldump -u username -p hsk_vocabulary > backup.sql

# 恢复数据库
mysql -u username -p hsk_vocabulary < backup.sql
```

## 📞 技术支持

如果在部署过程中遇到问题，可以：

1. 查看 Edge One 官方文档
2. 检查函数执行日志
3. 联系腾讯云技术支持

## 🔗 相关链接

- [Edge One 官方文档](https://cloud.tencent.com/document/product/1552)
- [Node.js 函数文档](https://cloud.tencent.com/document/product/1552/81876)
- [MySQL 连接配置](https://cloud.tencent.com/document/product/236/3130)
