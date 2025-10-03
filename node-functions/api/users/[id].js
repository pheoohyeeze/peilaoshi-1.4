// 用户详情API - 动态路由参数示例
export default function userDetail(req, res, params) {
  // 获取URL中的id参数
  const userId = params.id;
  
  // 模拟用户数据查询
  const userData = {
    id: userId,
    name: `用户${userId}`,
    level: `HSK${Math.floor(Math.random() * 6) + 1}`,
    studyTime: Math.floor(Math.random() * 1000) + " 小时",
    registeredAt: new Date().toISOString()
  };
  
  return {
    user: userData,
    path: `/api/users/${userId}`
  };
}