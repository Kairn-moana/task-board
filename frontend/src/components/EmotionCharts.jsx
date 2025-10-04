import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Line, Pie, getElementAtEvent } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import "./EmotionCharts.css";

// 注册 Chart.js 需要的组件
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// --- 模拟数据 ---
// Y轴的情绪映射：数值越高，情绪越积极
const emotionScale = {
  "🎉": 5, // 愉快
  "😊": 4, // 开心
  "😐": 3, // 平静
  "😟": 2, // 紧张
  "😠": 1, // 焦虑
};

// 最近7天的数据
const last7DaysData = [
  { day: "周一", emotion: "😐" },
  { day: "周二", emotion: "😟" },
  { day: "周三", emotion: "😠" },
  { day: "周四", emotion: "😊" },
  { day: "周五", emotion: "🎉" },
  { day: "周六", emotion: "😐" },
  { day: "周日", emotion: "😊" },
];

// --- 图表配置 ---
// 1. 折线图配置
const lineChartData = {
  labels: last7DaysData.map((d) => d.day),
  datasets: [
    {
      label: "情绪趋势",
      data: last7DaysData.map((d) => emotionScale[d.emotion]),
      borderColor: "rgb(75, 192, 192)",
      backgroundColor: "rgba(75, 192, 192, 0.5)",
      tension: 0.3,
    },
  ],
};

// 2. 饼图配置
const pieChartData = {
  labels: ["愉快", "开心", "平静", "紧张", "焦虑"],
  datasets: [
    {
      label: "情绪分布",
      data: [1, 2, 2, 1, 1], // 根据模拟数据统计
      backgroundColor: [
        "rgba(255, 99, 132, 0.8)",
        "rgba(54, 162, 235, 0.8)",
        "rgba(255, 206, 86, 0.8)",
        "rgba(75, 192, 192, 0.8)",
        "rgba(153, 102, 255, 0.8)",
      ],
      borderColor: "var(--background-content)",
      borderWidth: 2,
    },
  ],
};

// --- Helper function to process data ---
const processDataForCharts = (logs) => {
  // ... logic to process logs and return data for line and pie charts
  // This will be a bit complex, let's assume it returns something like:
  // { lineData, pieData }
  return {
    lineData: { labels: [], datasets: [{ data: [] }] }, // placeholder
    pieData: { labels: [], datasets: [{ data: [] }] }, // placeholder
  };
};

function EmotionCharts({ logs = [] }) {
  const navigate = useNavigate();
  const lineChartRef = useRef();
  const pieChartRef = useRef();

  // Process the logs to create data for the charts
  const { lineData, pieData } = processDataForCharts(logs);

  const handleLineChartClick = (event) => {
    const element = getElementAtEvent(lineChartRef.current, event);
    if (!element.length) return;

    const { index } = element[0];
    const dateLabel = lineData.labels[index]; // Assuming labels are dates 'YYYY-MM-DD'
    navigate(`/emotion-diary?filter=date:${dateLabel}`);
  };

  const handlePieChartClick = (event) => {
    const element = getElementAtEvent(pieChartRef.current, event);
    if (!element.length) return;

    const { index } = element[0];
    const emotionLabel = pieData.labels[index]; // e.g., "开心"
    // We need a mapping from label to the emoji or identifier used in logs
    const emotionIdentifier = "😊"; // This needs to be dynamic based on the label
    navigate(`/emotion-diary?filter=emotion:${emotionIdentifier}`);
  };

  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "最近 7 天情绪变化" },
    },
    scales: {
      y: {
        min: 0,
        max: 6,
        ticks: {
          // 自定义Y轴标签
          callback: function (value) {
            const emotionMap = {
              1: "焦虑",
              2: "紧张",
              3: "平静",
              4: "开心",
              5: "愉快",
            };
            return emotionMap[value] || "";
          },
        },
      },
    },
  };

  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "情绪分布饼图" },
    },
  };

  return (
    <div className="charts-container">
      <div className="chart-wrapper">
        <Line ref={lineChartRef} options={lineChartOptions} data={lineData} />
      </div>
      <div className="chart-wrapper">
        <Pie ref={pieChartRef} options={pieChartOptions} data={pieData} />
      </div>
    </div>
  );
}

export default EmotionCharts;
