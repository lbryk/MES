import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'font-awesome/css/font-awesome.min.css';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCheckSquare } from '@fortawesome/free-solid-svg-icons';
import { Route, BrowserRouter, Routes, useNavigate } from 'react-router-dom';
import Quest from './components/Qeust';
import { TimerProvider } from './components/TimerContext';
import AppContext from './components/AppContext';
import { collection, query, getDocs } from 'firebase/firestore';
import db from './firebase';
import Widget from './components/Widget';
import ExitExam from './components/ExitExam';
import LoginExam from './LoginExam';

function Index() {
	const urlAdress = window.location.href;
	const [id, setId] = useState(window.location.href.split('/').pop());
	const [Qualification, setQualification] = useState('');
	const [Year, setYear] = useState('');
	const [Session, setSession] = useState('');
	const [keyExam, setKeyExam] = useState('');
	const [keyQualification, setKeyQualification] = useState('');
	const idBase = useState(id); // pobieranie Id testu lub wczytaj domyślny jeśłi puste
	const [rightAnswers, setRightAnswers] = useState(new Array(40).fill(0));
	const [selectedAnswers, setSelectedAnswers] = useState(
		new Array(40).fill('null')
	);
	const [rightKeyAnswers, setRightKeyAnswers] = useState(
		new Array(40).fill('null')
	);
	const [quizData, setQuizData] = useState([]);
	const [qi, setQi] = useState(1);
	const [userName, setUserName] = useState('');
	const sumOfRightAnswers = rightAnswers.reduce((accumulator, currentValue) => {
		return accumulator + currentValue;
	}, 0);

	const sumOfWrongAnswers = rightAnswers.reduce((count, answer) => {
		return answer !== 1 ? count + 1 : count;
	}, 0);

	const [isDisabled, setIsDisabled] = useState(false);
	const [showAlert, setShowAlert] = useState(false);
	const [login, setLogin] = useState(false);
	const [timeUser, setTimeUser] = useState(false); // czas pobierany z bazy
	useEffect(() => {
		const fetchSettings = async () => {
			const settingsCollections = collection(db, 'quizCode');
			const querySettings = query(settingsCollections);
			const settingsSnapshot = await getDocs(querySettings);
			const settingsData = [];

			settingsSnapshot.forEach((doc) => {
				settingsData.push({ id: doc.id, ...doc.data() });
			});
			// Sprawdź, czy istnieje id w ustawieniach
			const idExists = settingsData.some((item) => item.id === id);

			//Jeśli id nie istnieje, przekieruj do logowania
			// if (!idExists || keyExam === '') {
			// 	window.location.href = `${window.location.origin}/login`;
			// }

			// if(id){
			// 	window.location.reload();
			// }

			return settingsData;
		};

		const displayQualification = async () => {
			const settingsData = await fetchSettings();
			settingsData.forEach((settingsItem) => {
				if (settingsItem.id === `${id}`) {
					setQualification(settingsItem.Qualification);
				}
			});
		};

		const displayYear = async () => {
			const settingsData = await fetchSettings();
			settingsData.forEach((settingsItem) => {
				if (settingsItem.id === `${id}`) {
					setYear(settingsItem.Year);
				}
			});
		};

		const displaySession = async () => {
			const settingsData = await fetchSettings();
			settingsData.forEach((settingsItem) => {
				if (settingsItem.id === `${id}`) {
					setSession(settingsItem.Session);
				}
			});
		};

		displayQualification();
		displayYear();
		displaySession();
	}, [id]);

	useEffect(() => {
		if (Qualification && Year && Session) {
			const countIdQual = Qualification.search(/\d/); // znajdowanie liter w kwalifikacji
			const idQual = Qualification.substring(0, countIdQual).toUpperCase(); // zwiększenie samych liter
			const NumberQual = Qualification.substring(
				countIdQual,
				Qualification.length
			);
			//const NumberQual = Qualification.substring(countIdQual).match(/^d+/)[0];

			const identifier = `${idQual}-${NumberQual}`;

			setKeyExam(`${Qualification}${Year}${Session}`);

			setKeyQualification(identifier);
		}
	}, [Qualification, Year, Session]);

	function updateRightAnswers(index, value) {
		setRightAnswers((prevState) => {
			const updatedRightAnswers = [...prevState];
			updatedRightAnswers[index] = value;
			return updatedRightAnswers;
		});
	}

	function updateSelectedAnswers(index, value) {
		setSelectedAnswers((prevState) => {
			const updateSelectedAnswers = [...prevState];
			updateSelectedAnswers[index] = value;
			return updateSelectedAnswers;
		});
	}

	// setId(window.location.href.split('/').pop());
	return (
		<AppContext.Provider
			value={{
				keyExam,
				keyQualification,
				idBase,
				rightAnswers,
				setRightAnswers,
				updateRightAnswers,
				sumOfRightAnswers,
				selectedAnswers,
				setSelectedAnswers,
				updateSelectedAnswers,
				sumOfWrongAnswers,
				rightKeyAnswers,
				setRightKeyAnswers,
				isDisabled,
				setIsDisabled,
				qi,
				setQi,
				userName,
				setUserName,
				login,
				setLogin,
				setId,
				id,
				timeUser,
				setTimeUser,
				quizData,
				setQuizData,
			}}
		>
			<TimerProvider>
				<BrowserRouter>
					<Routes>
						<Route path='/' element={<App />} />
						<Route path='/:id' element={<App />} />
						<Route exact path='/widget/' element={<Widget />} />
						<Route exact path='/quest/:i' element={<Quest />} />
						<Route exact path='/quest/:idBase/:i' element={<Quest />} />
						<Route exact path='/finish/:i' element={<ExitExam />} />
						<Route exact path='/login' element={<LoginExam />} />
					</Routes>
				</BrowserRouter>
			</TimerProvider>
		</AppContext.Provider>
	);
}

library.add(faCheckSquare);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
	<React.StrictMode>
		<Index />
	</React.StrictMode>
);

reportWebVitals();
