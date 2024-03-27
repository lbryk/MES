import React, { useState, useEffect, useContext } from 'react';
import { useTimer, convertToTimeFormat } from './TimerContext';
import { useParams, useNavigate } from 'react-router-dom';
import Header from './Header';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
	faCheck,
	faRightFromBracket,
	faRotateLeft,
	faDoorOpen,
} from '@fortawesome/free-solid-svg-icons';
import Footer from './Footer';
import AppContext from './AppContext';
import { collection, query, getDocs, doc, setDoc } from 'firebase/firestore';
import db from '../firebase';
import { async } from '@firebase/util';

library.add(faDoorOpen);

const ExitExam = () => {
	const navigate = useNavigate();
	const {
		keyExam,
		setKeyExam,
		selectedAnswers,
		rightAnswers,
		sumOfRightAnswers,
		sumOfWrongAnswers,
		rightKeyAnswers,
		idBase,
		isDisabled,
		setIsDisabled,
		setRightKeyAnswers,
		setSelectedAnswers,
		setRightAnswers,
		qi,
		userName,
		setUserName,
		login,
		setLogin,
	} = useContext(AppContext);

	useEffect(() => {
		const fetchQuiz = async () => {
			const quizCollection = collection(db, `${keyExam}`);
			const q = query(quizCollection);
			const querySnapshot = await getDocs(q);
			const quizData = [];

			querySnapshot.forEach((doc) => {
				quizData.push({
					id: doc.id,
					...doc.data(),
					keyNumber: parseInt(doc.id),
				});
			});

			return quizData;
		};

		// Pobieranie wszystkich poprawnych odpowiedzi
		const displayAllAnswer = async () => {
			const quizData = await fetchQuiz();
			const rightKeyAnswers = [];

			quizData.sort((a, b) => a.keyNumber - b.keyNumber);

			quizData.forEach((quizItem) => {
				rightKeyAnswers.push(quizItem.answer);
			});

			setRightKeyAnswers(rightKeyAnswers);
		};

		displayAllAnswer();
	}, [keyExam, rightAnswers]);

	const { restartTimer, isPaused, setIsPaused } = useTimer();
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
	const percentResult = Math.round((sumOfRightAnswers / 40) * 100 * 100) / 100;
	const divClassName = sumOfRightAnswers >= 20 ? 'checkquest' : 'notquest';
	const divText = sumOfRightAnswers >= 20 ? 'Egzamin zdany' : 'Egzamin oblany';
	useEffect(() => {
		const docRef = doc(db, 'users', `user${login}`);
		const updateUserData = async () => {
			await setDoc(docRef, { quizResult: sumOfRightAnswers }, { merge: true });
			await setDoc(docRef, { percentResult: percentResult }, { merge: true });
			await setDoc(docRef, { attemptToSolve: 1 }, { merge: true });
		};
		updateUserData();
	}, [db, login, sumOfRightAnswers, percentResult]);
	const reset = async () => {
		setIsDisabled(false);
		setSelectedAnswers(new Array(40).fill('null'));
		restartTimer();
		setIsPaused(false);
		setRightAnswers(new Array(40).fill(0));
		setUserName('');
		window.location.href = '/login';
		navigate('/login');
		setKeyExam('');
		
	};

	let ansTab = [];
	for (let i = 0; i < 40; i++) {
		const lp = i + 1;
		ansTab.push({
			key: i,
			value: (
				<div>
					{lp}. {rightKeyAnswers[i]}
					<br />
				</div>
			),
		});
	}
	return (
		<div>
			<div className='container'>
				<Header />
				<div className='row header wrapper'>
					<div className='col list-header'>Egzamin został zakończony</div>
				</div>
				<div className='row questions-quest'>
					<div className='col-1 questions-column'></div>
					<div className='col-11 questions'>
						<div className='col-12 reportTitle'>
							<span className='raportHeadertext'>Raport</span>
						</div>
						Twój wynik: <b>{percentResult}%</b>
						<br />
						<span className={`col ${divClassName}`}>{divText}</span>
						<br />
						<hr />
						Liczba udzielonych odpowiedzi: {countUserAnswers}
						<br />
						Liczba nieudzielonych odpowiedzi: {countNull}
						<br />
						Liczba poprawnych odpowiedzi: {sumOfRightAnswers} <br />
						Liczba błędnych odpowiedzi: {sumOfWrongAnswers}
						<br />
						<br />
						{/* <div className='col-12 reportTitle'>
							<span className='raportHeadertext'>Klucz odpowiedzi</span>
						</div>
						<div>
							{ansTab.map((v) => {
								return <div key={v.key}>{v.value}</div>;
							})}
						</div> */}
					</div>
				</div>
				<div className='col-12 quest-buttons'>
					<Link to={`/`}>
						<button
							type='button'
							className='btn-classic accept-quest'
							onClick={reset}
						>
							Wyloguj się z systemu&nbsp;
							<FontAwesomeIcon icon='fa-solid fa-door-open' />
						</button>
					</Link>
				</div>
				<div className='space'></div>
			</div>
			<Footer />
		</div>
	);
};

export default ExitExam;


