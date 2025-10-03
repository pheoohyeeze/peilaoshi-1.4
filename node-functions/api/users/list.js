// 用户列表API
export default function usersList(req, res) {
  // 模拟用户数据
  const users = [
    { id: 1, name: "张三", level: "HSK3" },
    { id: 2, name: "李四", level: "HSK4" },
    { id: 3, name: "王五", level: "HSK2" }
  ];
  
  return {
    users,
    count: users.length,
    path: "/api/users/list"
  };
}