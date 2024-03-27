import React, { useEffect, useContext, useState } from 'react';
import { useTimer, convertToTimeFormat, formatDate } from './TimerContext';
import AppContext from './AppContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import ExitAlert from './ExitAlert';


library.add(faRightFromBracket);

const Widget = () => {
	//const [AllAnswer, setAllAnswer] = useState('');

	const { keyQualification, selectedAnswers, setIsDisabled } =
		useContext(AppContext);

	
	// funkcja licząca ilość wartości null w tablicy z zaznaczonymi odpowiedziami
	const countNullsInSelectedAnswers = () => {
		return selectedAnswers.reduce((count, answer) => {
			return answer === 'null' ? count + 1 : count;
		}, 0);
	};
	// funkcja licząca ilość udzielonych odpowiedzi
	const countAnswersInSelectedAnswers = () => {
		return selectedAnswers.reduce((count, answer) => {
			return answer !== 'null' ? count + 1 : count;
		}, 0);
	};
	const countNull = countNullsInSelectedAnswers();
	const countUserAnswers = countAnswersInSelectedAnswers();
	const styleInputRed = countNull === 40 ? 'redInput' : '';
	const {
		timeLeft,
		timerInitialized,
		setTimerInitialized,
		currentDate,
		futureDate,
		restartTimer,
		isPaused,
		setIsPaused,
	} = useTimer();
	const { minutes, remainingSeconds } = convertToTimeFormat(timeLeft);

	const finish = useNavigate();
	const [showAlert, setShowAlert] = useState(false);

	const handleAlert = () => {
		setShowAlert(true);
	};

	const closeAlert = () => {
		setShowAlert(false);
	};

	useEffect(() => {
		if (timeLeft === 0) {
			finish('/finish');
		}
	}, [timeLeft]);
	
  

	const exit = () => {
		setIsPaused(!isPaused);
		setIsDisabled(true); // blokowanie formularza
		restartTimer();
	};

	return (
		<div>
			<form>
				Kwalifikacja
				<input
					className='form-control'
					type='text'
					value={keyQualification}
					disabled
				/>
				<br />
				Czas rozpoczęcia egzaminu
				<input
					className='form-control'
					type='text'
					value={formatDate(currentDate)}
					disabled
				/>
				<br />
				Czas zakończenia egzaminu
				<input
					className='form-control'
					type='text'
					value={formatDate(futureDate)}
					disabled
				/>
				<br />
				Liczba udzielonych odpowiedzi
				<input
					className='form-control'
					type='text'
					value={countUserAnswers}
					disabled
				/>
				<br />
				Liczba nieudzielonych odpowiedzi
				<input
					className={`form-control ${styleInputRed}`}
					type='text'
					value={countNull}
					disabled
				/>
				<br />
				<div className='timer'>
					Do końca egzaminu pozostało: <br />
					{minutes < 10 ? `0${minutes}` : minutes}:
					{remainingSeconds < 10 ? `0${remainingSeconds}` : remainingSeconds}
				</div>
				<br />
			</form>
			<div className='col-12'>
				<button type='button' className='btn-end' onClick={handleAlert}>
					Zakończ egzamin &nbsp;
					<FontAwesomeIcon icon='fa-solid fa-right-from-bracket' />
				</button>
				<ExitAlert
					header='Zakończenie egzaminu'
					message='Czy na pewno chcesz zakończyć egzamin? Nie będziesz już mógł zmienić odpowiedzi'
					show={showAlert}
					onClose={closeAlert}
					buttons = 'NoYes'
				/>
			</div>
		</div>
	);
};

export default Widget;
