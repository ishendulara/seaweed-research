import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from "recharts";

function GrowthChart({ data, harvestDay }) {
  return (
    <LineChart width={850} height={400} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="day" />
      <YAxis />
      <Tooltip />
      <Line
        type="monotone"
        dataKey="weight_g"
        stroke="#2e8b57"
        strokeWidth={3}
      />
      {harvestDay !== null && (
        <ReferenceLine
          x={harvestDay}
          stroke="red"
          label={{ value: "Harvest Day", position: "top" }}
       />

      )}
    </LineChart>
  );
}

export default GrowthChart;