import React, { useContext, useEffect, useState } from 'react';
import './App.css';
import AppContext from './components/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Header from './components/Header';
import Content from './components/Content';
import Footer from './components/Footer';
import { collection, query, getDocs } from 'firebase/firestore';
import db from './firebase';

library.add(faRightFromBracket);

function App() {
	const finish = useNavigate();
	const {
		Qualification,
		setQualification,
		Year,
		setYear,
		Session,
		setSession,
		keyExam,
		setKeyExam,
		keyQualification,
		setKeyQualification,
	} = useContext(AppContext);
	
	// useEffect(() => {
	// 	// Pobiera ścieżkę z SessionStorage
	// 	const pathBeforeRefresh = sessionStorage.getItem('pathBeforeRefresh');

	// 	if (pathBeforeRefresh) {
	// 		// Przenosi do poprzedniej ścieżki
	// 		finish(pathBeforeRefresh);

	// 		// Usuwa zapisaną ścieżkę
	// 		sessionStorage.removeItem('pathBeforeRefresh');
	// 	}
	// }, [finish]);

	// const navigate = useNavigate();

	// useEffect(() => {
	// 	// Check if 'pathBeforeRefresh' exists in sessionStorage
	// 	if (sessionStorage.getItem('pathBeforeRefresh')) {
	// 		// Navigate to the saved path
	// 		navigate(sessionStorage.getItem('pathBeforeRefresh'));
	// 	}
	// }, [navigate]);

	// useEffect(() => {
	// 	// const code = window.location.href.split('/').pop();
	// 	// setId(code);
	// 	// console.log(id);
	// 	const fetchSettings = async () => {
	// 		const settingsCollections = collection(db, 'quizCode');
	// 		const querySettings = query(settingsCollections);
	// 		const settingsSnapshot = await getDocs(querySettings);
	// 		const settingsData = [];

	// 		settingsSnapshot.forEach((doc) => {
	// 			settingsData.push({ id: doc.id, ...doc.data() });
	// 		});
	// 		// Sprawdź, czy istnieje id w ustawieniach
	// 		const idExists = settingsData.some((item) => item.id === id);

	// 		//Jeśli id nie istnieje, przekieruj do logowania
	// 		// if (!idExists || keyExam === '') {
	// 		// 	window.location.href = `${window.location.origin}/login`;
	// 		// }

	// 		return settingsData;
	// 	};

	// 	const displayQualification = async () => {
	// 		const settingsData = await fetchSettings();
	// 		settingsData.forEach((settingsItem) => {
	// 			if (settingsItem.id === `${id}`) {
	// 				setQualification(settingsItem.Qualification);
	// 			}
	// 		});
	// 	};

	// 	const displayYear = async () => {
	// 		const settingsData = await fetchSettings();
	// 		settingsData.forEach((settingsItem) => {
	// 			if (settingsItem.id === `${id}`) {
	// 				setYear(settingsItem.Year);
	// 			}
	// 		});
	// 	};

	// 	const displaySession = async () => {
	// 		const settingsData = await fetchSettings();
	// 		settingsData.forEach((settingsItem) => {
	// 			if (settingsItem.id === `${id}`) {
	// 				setSession(settingsItem.Session);
	// 			}
	// 		});
	// 	};

	// 	displayQualification();
	// 	displayYear();
	// 	displaySession();
	// }, []);

	// useEffect(() => {
	// 	if (Qualification && Year && Session) {
	// 		const countIdQual = Qualification.search(/\d/); // znajdowanie liter w kwalifikacji
	// 		const idQual = Qualification.substring(0, countIdQual).toUpperCase(); // zwiększenie samych liter
	// 		const NumberQual = Qualification.substring(
	// 			countIdQual,
	// 			Qualification.length
	// 		);
	// 		//const NumberQual = Qualification.substring(countIdQual).match(/^d+/)[0];

	// 		const identifier = `${idQual}-${NumberQual}`;

	// 		setKeyExam(`${Qualification}${Year}${Session}`);

	// 		setKeyQualification(identifier);
	// 	}
	// }, [Qualification, Year, Session]);

	// useEffect(() => {
	// 	const code = window.location.href.split('/').pop();
	// 	setId(code);
	
	// }, [id]);

	return (
		<div>
			<div className='container'>
				<Header />
				<Content />
			</div>
			<Footer />
		</div>
	);
}

export default App;
