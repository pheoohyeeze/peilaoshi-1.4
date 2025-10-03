// 用户地理位置API
export default function usersGeo(req, res) {
  // 模拟用户地理位置数据
  const geoData = {
    regions: [
      { id: "cn", name: "中国", users: 1250 },
      { id: "th", name: "泰国", users: 450 },
      { id: "la", name: "老挝", users: 320 }
    ]
  };
  
  return {
    ...geoData,
    path: "/api/users/geo"
  };
}