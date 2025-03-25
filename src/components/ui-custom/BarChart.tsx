
import React from 'react';
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export interface BarChartProps {
  data: any[];
  xAxisKey?: string;
  dataKey?: string;
  color?: string;
  height?: number;
  index?: string;
  categories?: string[];
  colors?: string[];
  valueFormatter?: (value: any) => string;
  yAxisWidth?: number;
  children?: React.ReactNode;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xAxisKey = 'name',
  dataKey,
  color = '#8884d8',
  height = 350,
  index,
  categories,
  colors,
  valueFormatter,
  yAxisWidth = 40,
  children
}) => {
  // If both categories and dataKey are provided, use categories for Bar components
  const renderBars = () => {
    if (categories && categories.length > 0 && colors) {
      return categories.map((category, i) => (
        <Bar 
          key={`bar-${category}`}
          dataKey={category} 
          fill={colors[i % colors.length] || color}
          name={category}
        />
      ));
    } else if (dataKey) {
      return <Bar dataKey={dataKey} fill={color} />;
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <RechartsBarChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey={index || xAxisKey} 
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          width={yAxisWidth}
          tickFormatter={valueFormatter}
        />
        <Tooltip 
          formatter={valueFormatter ? valueFormatter : undefined}
        />
        <Legend />
        {children || renderBars()}
      </RechartsBarChart>
    </ResponsiveContainer>
  );
};

export default BarChart;
