import React, { useMemo , memo} from "react";
import { Chart } from "react-google-charts";

const Pie_Chart = memo(({ data }) => {
  const chartData = useMemo(() => [
    ["Status", "Count"],
    ["Present", data.counts.Present],
    ["Absent", data.counts.Absent],
    ["Excused", data.counts.Excused],
    ["Null", data.counts.Null]
  ], [data.counts]);

  const options = useMemo(() => ({
    is3D: true,
    backgroundColor: 'transparent',
    chartArea: {
      width: '90%', 
      height: '90%', 
      left: '10%',
      top: '10%', 
      bottom: '10%',
      right: '10%'
    },
    pieSliceText: 'label',
    legend: { position: 'bottom' },
    slices: {
      0: { color: '#4CAF50' }, 
      1: { color: '#F44336' },  
      2: { color: '#FFC107' },  
      3: { color: '#9E9E9E' } 
    }
  }), []);

  return (
    <Chart
      chartType="PieChart"
      data={chartData}
      options={options}
      width={"100%"}
      height={"400px"}
    />
  );
});

export default Pie_Chart;
