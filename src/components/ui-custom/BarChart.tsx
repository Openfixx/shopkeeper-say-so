
import React from 'react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface BarChartProps {
  data: Array<{
    name: string;
    [key: string]: any;
  }>;
  index: string;
  categories: string[];
  colors: string[];
  valueFormatter?: (value: number) => string;
  yAxisWidth?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  index,
  categories,
  colors,
  valueFormatter = (value) => value.toString(),
  yAxisWidth = 40,
}) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RechartsBarChart
        data={data}
        margin={{
          top: 10,
          right: 10,
          left: 10,
          bottom: 20,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey={index} tickLine={false} axisLine={false} />
        <YAxis 
          width={yAxisWidth}
          tickFormatter={valueFormatter}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip 
          formatter={(value: number) => [valueFormatter(value), '']}
          labelFormatter={(label) => `${label}`}
          contentStyle={{ 
            borderRadius: '8px',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        {categories.map((category, index) => (
          <Bar
            key={category}
            dataKey={category}
            fill={colors[index % colors.length]}
            radius={[4, 4, 0, 0]}
            barSize={30}
          />
        ))}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};
