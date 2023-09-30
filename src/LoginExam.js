import React, { useState, useEffect, useContext } from 'react';
import './LoginExam.css';

import 'bootstrap/dist/css/bootstrap.min.css';
import { useTimer } from './components/TimerContext';
import AppContext from './components/AppContext';
import { useNavigate } from 'react-router-dom';
import { Form, Button } from 'react-bootstrap';

const LoginExam = () => {
	//const navigate = useNavigate();

	const handleButtonClick = (event) => {
		event.preventDefault();
		//navigate('/app');
		console.log('test');
	};

	return (
		<div className='container'>
			<Form onSubmit={handleButtonClick}>
				<Form.Group className='groupForm' controlId='formBasicEmail'>
					<Form.Label>Exam login:</Form.Label>
					<Form.Control
						className='fieldsLogin'
						type='text'
						placeholder='Enter exam login'
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
					/>
					<Form.Text className='text-muted'>
						We'll never share your password with anyone else.
					</Form.Text>
				</Form.Group>
				<div className='submitForm'>
					<Button className='submitLogin col-7' variant='primary' type='submit'>
						Log in to the exam
					</Button>
				</div>
			</Form>
		</div>
	);
};

export default LoginExam;
