import React, { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const PieChartComponent = ({ data, colors }) => {
 
    const normalizedData = useMemo(
    () =>
      (Array.isArray(data) ? data : [])
        .map((item, index) => {
          if (typeof item === "number") {
            return {
              name: `slice-${index + 1}`,
              value: item,
            };
          }

          return {
            name: item?.name || `slice-${index + 1}`,
            value: Number(item?.value) || 0,
          };
        })
        .filter((item) => item.value > 0),
    [data],
  );

  return (
    <div  style={{ width: "100%", height: 150, }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={normalizedData}
            innerRadius={42}
            outerRadius={70}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {normalizedData.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index]}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChartComponent;
