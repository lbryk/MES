import React, { createContext, useState, useContext, useEffect } from 'react';


const TimerContext = createContext();
//const { timeStop, setTimeStop } = useContext(AppContext);

const TimerProvider = ({ children }) => {
	// const [timeLeft, setTimeLeft] = useState(() => {
	// 	const savedTimeLeft = localStorage.getItem('timeLeft');
	// 	return savedTimeLeft !== null ? parseInt(savedTimeLeft, 10) : 3600;
	// });
	const [timeLeft, setTimeLeft] = useState(3600);
	const [timerStarted, setTimerStarted] = useState(false);
	const [timerInitialized, setTimerInitialized] = useState(false);
	const [timerKey, setTimerKey] = useState(0);
	const [isPaused, setIsPaused] = useState(false);

	useEffect(() => {
		if (!timerStarted) return;

		const interval = setInterval(() => {
			setTimeLeft((prevTime) => {
				if (isPaused) {
					return prevTime;
				}

				if (prevTime <= 0) {
					clearInterval(interval);
					return 0;
				} else {
					saveTimeLeft(prevTime - 1);
					return prevTime - 1;
				}
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isPaused, timerStarted, setTimeLeft, setIsPaused]);

	useEffect(() => {
		if (!timerInitialized) {
			setTimerStarted(true);
			setTimerInitialized(true);
		}
	}, [timerInitialized]);

	// const [currentDate, setCurrentDate] = useState(() => {
	// 	const savedCurrentDate = localStorage.getItem('currentDate');
	// 	return savedCurrentDate !== null ? new Date(savedCurrentDate) : new Date();
	// });

	// const [futureDate, setFutureDate] = useState(() => {
	// 	const savedFutureDate = localStorage.getItem('futureDate');
	// 	return savedFutureDate !== null
	// 		? new Date(savedFutureDate)
	// 		: new Date(new Date().getTime() + 3600000);
	// });

	const [currentDate, setCurrentDate] = useState(new Date());

	const [futureDate, setFutureDate] = useState(
		new Date(new Date().getTime() + 3600000)
	);

	// useEffect(() => {
	// 	localStorage.setItem('currentDate', currentDate.toISOString());
	// }, [currentDate]);

	// useEffect(() => {
	// 	localStorage.setItem('futureDate', futureDate.toISOString());
	// }, [futureDate]);

	const saveTimeLeft = (time) => {
		localStorage.setItem('timeLeft', time);
	};

	const restartTimer = () => {
		if (timerStarted) {
			setTimerInitialized(false);
			const defaultTimeLeft = 3600;
			setTimerKey((prevKey) => prevKey + 1);
			setTimeLeft(defaultTimeLeft);
			setTimerStarted(true);
			setCurrentDate(new Date());
			setFutureDate(new Date(new Date().getTime() + 3600000));
		}
	};

	return (
		<TimerContext.Provider
			value={{
				timeLeft,
				setTimeLeft,
				timerInitialized,
				setTimerInitialized,
				currentDate,
				futureDate,
				restartTimer,
				isPaused,
				setIsPaused,
			}}
		>
			{children}
		</TimerContext.Provider>
	);
};

const useTimer = () => {
	const context = useContext(TimerContext);

	if (context === undefined) {
		throw new Error('Wystąpił błąd wewnętrzny licznika czasu');
	}

	return context;
};

const convertToTimeFormat = (seconds) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;

	return { minutes, remainingSeconds };
};

const formatDate = (date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

export {
	TimerProvider,
	useTimer,
	convertToTimeFormat,
	TimerContext,
	formatDate,
};
