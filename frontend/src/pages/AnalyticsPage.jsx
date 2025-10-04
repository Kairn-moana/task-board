import React from "react";
import AnalyticsModal from "../components/AnalyticsModal";

function AnalyticsPage() {
  // 我们直接在这里渲染 AnalyticsModal 的内容
  // isOpen 和 onClose 就不需要了，因为它现在是一个常驻页面
  return (
    <div style={{ padding: "20px" }}>
      <AnalyticsModal isOpen={true} onClose={() => {}} isPage={true} />
    </div>
  );
}

export default AnalyticsPage;
