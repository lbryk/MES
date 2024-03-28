import React, { useState, useEffect, useContext } from 'react';
import './LoginExam.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useTimer } from './components/TimerContext';
import AppContext from './components/AppContext';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';
import db from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import { collection, query, getDocs } from 'firebase/firestore';
import ExitAlert from './components/ExitAlert';
import AdminPanel from './components/AdminPanel';
import { useAuth } from './AuthContext';

const LoginExam = () => {
	const { login, setLogin } = useContext(AppContext);
	const auth = useAuth(); 
	const [password, setPassword] = useState('');
	const [showAlert, setShowAlert] = useState(false);
	const navigate = useNavigate();
	const { userName, setUserName } = useContext(AppContext);
	const { id, setId } = useContext(AppContext);
	const { timeUser, setTimeUser } = useContext(AppContext);
	const { timeLeft, setTimeLeft } = useTimer();
	const { setTimerInitialized } = useTimer();
	const { setTimerStarted } = useTimer();
	const [showAdminPanel, setShowAdminPanel] = useState(false); // Add this line

	// const [showExitAlert, setShowExitAlert] = React.useState(false);
	const handleAlert = () => {
		setShowAlert(true);
	};

	const closeAlert = () => {
		setShowAlert(false);
	};

	// useEffect(() => {
	// 	const timeInSeconds = timeUser ? parseInt(timeUser.slice(1)) * 60 : 0;
	// 	setTimeLeft(timeInSeconds);
	// }, [timeUser]);

	useEffect(() => {
		const timeInSeconds = timeUser ? parseInt(timeUser) * 60 : 0;
		setTimeLeft(timeInSeconds);
		if (timeInSeconds > 0) {
			setTimerInitialized(true);
			setTimerStarted(true);
		}
	}, [timeUser, setTimeLeft, setTimerInitialized, setTimerStarted]);

	const handleButtonClick = async (event) => {
		event.preventDefault();
		const docRef = doc(db, 'users', `user${login}`);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists() && docSnap.data().password === password) {
			  auth.login({
					userName: `${docSnap.data().firstname} ${docSnap.data().lastname}`,
					role: docSnap.data().role,
				});

			if (docSnap.data().role == 's' && docSnap.data().attemptToSolve == '0') {
				setUserName(`${docSnap.data().firstname} ${docSnap.data().lastname}`);
				setId(`${docSnap.data().quizID}`);
				setTimeUser(`/${docSnap.data().quizTime}`);
				setTimeLeft(`/${docSnap.data().quizTime}`);
				setTimerInitialized(true);
				setTimerStarted(true);
				navigate(`/${docSnap.data().quizID}`);
			} else if (docSnap.data().role == 'sa') {
				setUserName(`${docSnap.data().firstname} ${docSnap.data().lastname}`);
				navigate(`/admin`);
			} else {
				setShowAlert(true);
				<ExitAlert
					header='System próbnych egzaminów zawodowych'
					message='Wystąpił problem z zalogowaniem'
					show={showAlert}
					onClose={closeAlert}
					buttons='Ok'
				/>;
			}
		} else {
			setShowAlert(true);
			<ExitAlert
				header='System próbnych egzaminów zawodowych'
				message='Błędny login lub hasło'
				show={showAlert}
				onClose={closeAlert}
				buttons='Ok'
			/>;
		}
	};

	return (
		<div className='bodyLog'>
			<div className='container conLog'>
				<Form onSubmit={handleButtonClick}>
					<Form.Group className='groupForm' controlId='formBasicEmail'>
						<Form.Label>Login:</Form.Label>
						<Form.Control
							className='fieldsLogin'
							type='text'
							placeholder='Podaj login zdającego'
							onChange={(e) => setLogin(e.target.value)}
						/>
						<Form.Text className='text-muted'>
							We'll never share your login with anyone else.
						</Form.Text>
					</Form.Group>

					<Form.Group className='groupForm' controlId='formBasicPassword'>
						<Form.Label>Hasło:</Form.Label>
						<Form.Control
							className='fieldsLogin'
							type='password'
							placeholder='Wprowadź hasło do egzaminu'
							onChange={(e) => setPassword(e.target.value)}
						/>
						<Form.Text className='text-muted'>
							We'll never share your password with anyone else.
						</Form.Text>
					</Form.Group>
					<div className='submitForm'>
						<Button
							className='submitLogin col-7'
							variant='primary'
							type='submit'
						>
							Start
						</Button>
					</div>
				</Form>
			</div>

			<ExitAlert
				header='System próbnych egzaminów zawodowych'
				message='Nie zalogowano.'
				show={showAlert}
				onClose={closeAlert}
				buttons='Ok'
			/>
		</div>
	);
};

export default LoginExam;
