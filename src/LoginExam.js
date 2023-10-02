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
const LoginExam = () => {
	const { login, setLogin } = useContext(AppContext);
	const [password, setPassword] = useState('');
	const navigate = useNavigate();
	const { userName, setUserName } = useContext(AppContext);
	const { id, setId } = useContext(AppContext);
	const { timeUser, setTimeUser } = useContext(AppContext);
	const { setTimeLeft } = useTimer();
	const { setTimerInitialized } = useTimer();
	const { setTimerStarted } = useTimer();
	useEffect(() => {
		const timeInSeconds = timeUser ? parseInt(timeUser.slice(1)) * 60 : 0;
		setTimeLeft(timeInSeconds);
	}, [timeUser]);

	const handleButtonClick = async (event) => {
		event.preventDefault();
		const docRef = doc(db, 'users', `user${login}`);
		const docSnap = await getDoc(docRef);

		if (docSnap.exists() && docSnap.data().password === password) {
			if (
				docSnap.data().role == 's' &&
				docSnap.data().attemptToSolve == '0'
			) {
				setUserName(`${docSnap.data().firstname} ${docSnap.data().lastname}`);
				setId(`${docSnap.data().quizID}`);
				setTimeUser(`/${docSnap.data().quizTime}`);
				setTimerInitialized(true);
				setTimerStarted(true);
				navigate(`/${docSnap.data().quizID}`);
			} else {
				alert('Nie zalogowano!');
			}
		} else {
			alert('Invalid login or password.');
		}
	};

	return (
		<div className='bodyLog'>
			<div className='container conLog'>
				<Form onSubmit={handleButtonClick}>
					<Form.Group className='groupForm' controlId='formBasicEmail'>
						<Form.Label>Exam login:</Form.Label>
						<Form.Control
							className='fieldsLogin'
							type='text'
							placeholder='Enter exam login'
							onChange={(e) => setLogin(e.target.value)}
						/>
						<Form.Text className='text-muted'>
							We'll never share your login with anyone else.
						</Form.Text>
					</Form.Group>

					<Form.Group className='groupForm' controlId='formBasicPassword'>
						<Form.Label>Password:</Form.Label>
						<Form.Control
							className='fieldsLogin'
							type='password'
							placeholder='Exam password'
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
							Log in to the exam
						</Button>
					</div>
				</Form>
			</div>
		</div>
	);
};

export default LoginExam;
