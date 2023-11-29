import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const MyChart = ({ data, labels, label }) => {
	const chartRef = useRef(null);
	let myChart = useRef(null); // Declare a variable to hold your chart instance

	useEffect(() => {
		if (chartRef.current) {
			if (myChart.current) {
				myChart.current.destroy(); // Destroy the old chart if it exists
			}
			myChart.current = new Chart(chartRef.current, {
				type: 'line',
				data: {
					labels: labels,
					datasets: [
						{
							label: label,
							data: data,
							backgroundColor: 'rgba(75,192,192,0.2)',
							borderColor: 'rgba(75,192,192,1)',
							borderWidth: 1,
						},
					],
				},
				options: {
					responsive: true,
					scales: {
						y: {
							beginAtZero: true,
						},
					},
				},
			});
		}
	}, [data, labels]);

	return <canvas ref={chartRef} />;
};

export default MyChart;
