import React, { useEffect, useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Widget from './Widget';
import Quest from './Qeust';
import AppContext from './AppContext';
import { useTimer } from './TimerContext';

import { doc, updateDoc, setDoc, getDoc } from "firebase/firestore"; // Poprawny import Firebase
import {db} from "../firebase";

library.add(faRightFromBracket);

const Content = () => {
	const {
		rightAnswers,
		sumOfRightAnswers,
		idBase,
		selectedAnswers,
		isDisabled,
		setIsDisabled,
		qi,
		setQi,
		
	} = useContext(AppContext);
	const { id, setId } = useContext(AppContext);
	// setId(useState(window.location.href.split('/').pop()));
	
	 const { userName, keyExam, role } = useContext(AppContext);

     useEffect(() => {
       // Logowanie wszystkich wartości w celu debugowania
       console.log("userName:", userName);
       console.log("keyExam:", keyExam);
       console.log("role:", role);

       const registerUserActivity = async () => {
         // Rejestruj tylko, jeśli użytkownik jest zdającym
         if (role === "zdający" && userName && keyExam) {
           const userRef = doc(db, "users", userName);
           try {
             const userSnap = await getDoc(userRef);

             // Jeśli dokument użytkownika nie istnieje, tworzymy go
             if (!userSnap.exists()) {
               await setDoc(userRef, {
                 firstname: "Imię", // dynamicznie ustaw właściwe dane użytkownika
                 lastname: "Nazwisko",
                 role: "zdający",
                 isActive: true,
                 quizID: keyExam,
               });
               console.log(
                 `Utworzono nowy dokument dla użytkownika: ${userName}`
               );
             } else {
               // Jeśli dokument istnieje, aktualizujemy isActive i quizID
               await updateDoc(userRef, {
                 isActive: true,
                 quizID: keyExam,
               });
               console.log(
                 `Zarejestrowano aktywność użytkownika: ${userName} dla quizu: ${keyExam}`
               );
             }
           } catch (error) {
             console.error(
               "Błąd podczas rejestrowania aktywności użytkownika",
               error
             );
           }
         } else {
           console.log(
             "Brak userName, keyExam albo użytkownik nie jest zdającym"
           );
         }
       };

       registerUserActivity();
     }, [userName, keyExam, role]);


	const { timeLeft, timerInitialized, setTimerInitialized } = useTimer();
	const [showError, setShowError] = useState(false);

	useEffect(() => {
		if (!timerInitialized) {
			setTimerInitialized(true);
		}
	}, []);
	
	const log = useNavigate();
	if (id === undefined || id == "" || id == " "){	
		log('/login');
	} 
	const finish = useNavigate();
	
	useEffect(() => {
		if (timeLeft === 0) {
			finish('/finish');
		}
	}, [timeLeft]);
	
	let tab = [];

	useEffect(() => {
		if (isDisabled === true) {
			setShowError(true);
		} else {
			setShowError(false);
		}
	}, [showError]);

	for (let i = 1; i <= 40; i++) {
		const answer = selectedAnswers[i - 1];
		const divClassName = answer === 'null' ? 'notquest' : 'checkquest';
		const divText =
			answer === 'null'
				? 'Nie udzielono odpowiedzi'
				: 'Udzielono odpowiedzi (możesz zmienić odpowiedź)';
		const infoQ =
			isDisabled === true
				? 'Nie można zmieniać odpowiedzi po zakończonym egzaminie'
				: '';
		tab.push({
			key: i,
			value: (
				<div className='row task'>
					<div className='col-lg-5 col-md-12 col-sm-12 col-xs-11'>
						{/* <Link to={`/quest/${i}`}> */}
						<Link to={`/quest/${i}/${id}`}>
							<button
								type='button'
								className='btn-classic'
								onClick={() => setQi(i)}
								disabled={isDisabled}
							>
								Zadanie {i}
							</button>
						</Link>
					</div>

					<div className={`col ${divClassName}`}>{divText}</div>
					<div>{infoQ}</div>
				</div>
			),
		});
	}

	return (
		<div>
			<div className='row header wrapper'>
				<div className='col-12 list-header'>Egzamin lista zadań</div>
				{showError && (
					<div className='col- 12 alert alert-danger' role='alert'>
						Egzamin został zakończony! <br /> Odśwież stronę aby rozpocząć
						ponownie egzamin lub klinkij "zakończ egzamin" aby zobaczyć wynik i
						raport ostatniego egzaminu
					</div>
				)}
			</div>
			<div className='row'>
				<div className='col-8 list-task'>
					{tab.map((v) => {
						return <div key={v.key}>{v.value}</div>;
					})}
				</div>
				<div className='col-lg-3 col-md-11 col-sm-8 col-xs-5 widget'>
					<Widget />
				</div>
			</div>
			<div className='space'></div>
		</div>
	);
};

export default Content;
