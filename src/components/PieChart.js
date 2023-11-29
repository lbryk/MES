import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const PieChart = ({ data, labels }) => {
	const chartRef = useRef(null);
	let myChart = useRef(null);

	useEffect(() => {
		if (chartRef.current) {
			if (myChart.current) {
				myChart.current.destroy();
			}
			myChart.current = new Chart(chartRef.current, {
				type: 'pie',
				data: {
					labels: labels,
					datasets: [
						{
							data: data,
							backgroundColor: [
								'rgba(75,192,192,0.2)',
								'rgba(255, 99, 132, 0.2)',
							],
							borderColor: ['rgba(75,192,192,1)', 'rgba(255, 99, 132, 1)'],
							borderWidth: 1,
						},
					],
				},
				options: {
					responsive: true,
				},
			});
		}
	}, [data, labels]);

	return <canvas ref={chartRef} />;
};

export default PieChart;
