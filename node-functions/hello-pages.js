// hello-pages.js - 示例页面路由
export default function helloPages(req, res) {
  return {
    message: "Hello from pages route!",
    path: "/hello-pages"
  };
}