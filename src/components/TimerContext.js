import React, { createContext, useState, useContext, useEffect } from 'react';


import AppContext from './AppContext';
const TimerContext = createContext();

const TimerProvider = ({ children }) => {
	const { timeUser } = useContext(AppContext);
	const timeInSeconds = timeUser ? parseInt(timeUser.slice(1)) * 60 : 0;
	const timeInMiliSeconds = timeUser ? parseInt(timeUser.slice(1)) * 60000 : 0;
	const [timeLeft, setTimeLeft] = useState(timeInSeconds);

	useEffect(() => {
		const timeInSeconds = timeUser ? parseInt(timeUser.slice(1)) * 60 : 0;
		setTimeLeft(timeInSeconds);
	}, [timeUser]);
	const [timerStarted, setTimerStarted] = useState(false);
	const [timerInitialized, setTimerInitialized] = useState(false);
	const [timerKey, setTimerKey] = useState(0);
	const [isPaused, setIsPaused] = useState(false);

	useEffect(() => {
		if (!timerStarted || isPaused) return;

		const interval = setInterval(() => {
			setTimeLeft((prevTime) => {
				if (prevTime <= 0) {
					clearInterval(interval);
					return 0;
				}

				return prevTime - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [isPaused, timerStarted, setTimeLeft, setIsPaused]);

	// useEffect(() => {
	// 	if (!timerInitialized) {
	// 		setTimerStarted(true);
	// 		setTimerInitialized(true);
	// 	}
	// }, [timerInitialized]);

	const [currentDate, setCurrentDate] = useState(new Date());

	const [futureDate, setFutureDate] = useState(currentDate);
	
	useEffect(() => {
		setFutureDate(new Date(currentDate.getTime() + timeInMiliSeconds));
	}, [currentDate, timeInMiliSeconds]);

	const saveTimeLeft = (time) => {
		localStorage.setItem('timeLeft', time);
	};

	const restartTimer = () => {
		if (timerStarted) {
			setTimerInitialized(false);
			const defaultTimeLeft = timeInSeconds;
			setTimerKey((prevKey) => prevKey + 1);
			setTimeLeft(defaultTimeLeft);
			setTimerStarted(true);
			setCurrentDate(new Date());
			setFutureDate(new Date(new Date().getTime() + timeInMiliSeconds));
		}
	};

	return (
		<TimerContext.Provider
			timeUser={timeUser}
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
				timerStarted,
				setTimerStarted,
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
