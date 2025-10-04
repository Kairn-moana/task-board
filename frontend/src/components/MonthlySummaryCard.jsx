import React, { useState, useEffect } from "react";
import { getMonthlySummary } from "../api/services/analyticsService";
import "./MonthlySummaryCard.css";

const MonthlySummaryCard = ({ year, month }) => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSummary() {
      setIsLoading(true);
      try {
        const data = await getMonthlySummary(year, month);
        setSummary(data);
      } catch (error) {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchSummary();
  }, [year, month]);

  const handleCopyToClipboard = () => {
    // Logic to format summary and copy to clipboard
    const textToCopy = `...`;
    navigator.clipboard.writeText(textToCopy);
    alert("已复制到剪贴板！");
  };

  if (isLoading)
    return <div className="summary-card loading">正在生成您的月度小结...</div>;
  if (!summary)
    return <div className="summary-card error">无法加载本月小结。</div>;

  return (
    <div className="summary-card">
      <header>
        <h2>
          {year}年{month}月情绪小结
        </h2>
      </header>
      <section>
        <h4>本月最常见的情绪：</h4>
        <ul>
          {summary.topEmotions.map((e) => (
            <li key={e.emotion}>
              {e.emotion} ({e.count}次)
            </li>
          ))}
        </ul>
      </section>
      {/* ... other sections for tags, improvement, suggestions ... */}
      <footer>
        <button onClick={handleCopyToClipboard}>复制到剪贴板</button>
      </footer>
    </div>
  );
};

export default MonthlySummaryCard;
