// Node Functions 路由系统
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 解析路由映射
export async function initializeRoutes() {
  const routeMap = {};
  await buildRouteMap(routeMap, __dirname);
  return routeMap;
}

// 递归构建路由映射
async function buildRouteMap(routeMap, dirPath, routePrefix = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    // 跳过index.js和隐藏文件
    if (entry.name === 'index.js' || entry.name.startsWith('.')) {
      continue;
    }
    
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      // 处理目录
      const newRoutePrefix = routePrefix + '/' + entry.name;
      await buildRouteMap(routeMap, fullPath, newRoutePrefix);
    } else if (entry.name.endsWith('.js')) {
      // 处理JS文件
      const routeName = entry.name.replace(/\.js$/, '');
      let routePath = '';
      
      // 处理动态路由 [param] 和 [[default]]
      if (routeName.startsWith('[') && routeName.endsWith(']')) {
        if (routeName.startsWith('[[') && routeName.endsWith(']]')) {
          // 处理 [[default]] 通配符路由
          routePath = routePrefix + '/*';
        } else {
          // 处理 [param] 参数路由
          const paramName = routeName.slice(1, -1);
          routePath = routePrefix + '/:' + paramName;
        }
      } else {
        // 普通路由
        routePath = routePrefix + '/' + routeName;
      }
      
      // 规范化路由路径
      routePath = routePath.replace(/\/+/g, '/');
      if (!routePath.startsWith('/')) {
        routePath = '/' + routePath;
      }
      
      // 导入路由处理函数
      const modulePath = path.relative(__dirname, fullPath);
      const moduleImport = `./${modulePath.replace(/\\/g, '/')}`;
      
      try {
        const module = await import(moduleImport);
        routeMap[routePath] = module.default || module;
      } catch (error) {
        console.error(`Error importing module ${moduleImport}:`, error);
      }
    }
  }
  
  // 处理目录下的index.js作为目录路由
  const indexPath = path.join(dirPath, 'index.js');
  if (fs.existsSync(indexPath)) {
    const routePath = routePrefix || '/';
    const modulePath = path.relative(__dirname, indexPath);
    const moduleImport = `./${modulePath.replace(/\\/g, '/')}`;
    
    try {
      const module = await import(moduleImport);
      routeMap[routePath] = module.default || module;
    } catch (error) {
      console.error(`Error importing module ${moduleImport}:`, error);
    }
  }
  
  return routeMap;
}

// 路由处理函数
export async function handleRequest(req, res) {
  const routes = await initializeRoutes();
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  // 查找匹配的路由
  let handler = null;
  let params = {};
  
  // 精确匹配
  if (routes[pathname]) {
    handler = routes[pathname];
  } else {
    // 参数路由匹配
    for (const route in routes) {
      if (isRouteMatch(route, pathname, params)) {
        handler = routes[route];
        break;
      }
    }
  }
  
  if (handler) {
    try {
      // 调用路由处理函数
      return await handler(req, res, params);
    } catch (error) {
      console.error('Error handling request:', error);
      res.statusCode = 500;
      return { error: 'Internal Server Error' };
    }
  } else {
    // 未找到路由
    res.statusCode = 404;
    return { error: 'Not Found' };
  }
}

// 检查路由是否匹配
function isRouteMatch(routePattern, pathname, params) {
  // 处理通配符路由
  if (routePattern.includes('*')) {
    const prefix = routePattern.replace('*', '');
    return pathname.startsWith(prefix);
  }
  
  // 处理参数路由
  if (routePattern.includes(':')) {
    const routeParts = routePattern.split('/');
    const pathParts = pathname.split('/');
    
    if (routeParts.length !== pathParts.length) {
      return false;
    }
    
    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        // 提取参数
        const paramName = routeParts[i].substring(1);
        params[paramName] = pathParts[i];
      } else if (routeParts[i] !== pathParts[i]) {
        return false;
      }
    }
    
    return true;
  }
  
  return false;
}

// 导出默认函数
export default handleRequest;