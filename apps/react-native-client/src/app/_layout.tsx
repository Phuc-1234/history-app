import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs>
      {/* Các tab khác giữ nguyên... */}
      
      {/* Thêm tab này vào đúng vị trí bạn muốn xuất hiện */}
      <Tabs.Screen
  name="9_1_leaderboard"
  />
    </Tabs>
  );
}