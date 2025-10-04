import React from "react";
import SummaryWidget from "../components/SummaryWidget";

export default function SummaryPage() {
  return (
    <div style={{ padding: 16 }}>
      <SummaryWidget days={7} />
    </div>
  );
}
