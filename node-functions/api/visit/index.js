// 访问统计API - 目录索引路由
export default function visitStats(req, res) {
  // 模拟访问统计数据
  const stats = {
    totalVisits: 12580,
    uniqueUsers: 3450,
    averageTimeSpent: "15分钟",
    lastUpdated: new Date().toISOString()
  };
  
  return {
    ...stats,
    path: "/api/visit"
  };
}