// API默认处理 - 通配符路由
export default function apiDefault(req, res) {
  // 获取请求路径
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  
  return {
    message: "API路径未找到",
    requestedPath: pathname,
    suggestion: "请检查API路径是否正确",
    availableAPIs: [
      "/api/users/list",
      "/api/users/geo",
      "/api/users/:id",
      "/api/visit"
    ]
  };
}