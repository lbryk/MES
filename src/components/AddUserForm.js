import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
// import { Unstable_NumberInput as NumberInput } from '@mui/base/Unstable_NumberInput';
import { doc, setDoc, getDoc, collection, addDoc } from 'firebase/firestore';
import db from '../firebase';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// import { collection, addDoc } from 'firebase/firestore';

const AddUserForm = ({ onSave, examcode, profession, refreshUsers }) => {
	const [user, setUser] = React.useState({});
	// const [inputValue, setInputValue] = useState('');
	const [regNumber, setRegNumber] = useState(1);
	const [quizcodeValue, setQuizcodeValue] = useState(null);
	const [professionValue, setProfessionValue] = useState(null);

	// const [quizTime, setQuizTime] = useState('defaultQuizTime');
	const [time, setTime] = useState('');
	const [attemptValue, setAttemptValue] = useState('nie');
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [className, setClassName] = useState('');
	const [isValid, setIsValid] = useState(false);
	const [isValidPassword, setIsValidPassword] = useState(true);
	const [login, setLogin] = useState('');
	const [password, setPassword] = useState('');

	const handleAttemptValueChange = (event, newValue) => {
		setAttemptValue(newValue);
		setUser((prevUser) => ({ ...prevUser, examcode: newValue }));
	};

	const handleAutocompleteChange = (event, newValue) => {
		setProfessionValue(newValue);
		setUser((prevUser) => ({ ...prevUser, profession: newValue }));
	};

	const replaceSpecialChars = (str) => {
		const specialCharsToEnglish = {
			ą: 'a',
			ć: 'c',
			ę: 'e',
			ł: 'l',
			ń: 'n',
			ó: 'o',
			ś: 's',
			ź: 'z',
			ż: 'z',
			Ą: 'A',
			Ć: 'C',
			Ę: 'E',
			Ł: 'L',
			Ń: 'N',
			Ó: 'O',
			Ś: 'S',
			Ź: 'Z',
			Ż: 'Z',
			ä: 'a',
			ö: 'o',
			ü: 'u',
			ß: 'ss',
			Ä: 'A',
			Ö: 'O',
			Ü: 'U',
			č: 'c',
			ď: 'd',
			ě: 'e',
			ň: 'n',
			ř: 'r',
			š: 's',
			ť: 't',
			ů: 'u',
			ž: 'z',
			Č: 'C',
			Ď: 'D',
			Ě: 'E',
			Ň: 'N',
			Ř: 'R',
			Š: 'S',
			Ť: 'T',
			Ů: 'U',
			Ž: 'Z',
		};

		return str.replace(
			/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻäöüßÄÖÜčďěňřšťůžČĎĚŇŘŠŤŮŽ]/g,
			(match) => specialCharsToEnglish[match]
		);
	};

	const validateLogin = (login) => {
		const regex = /^[a-zA-Z0-9]{5,}$/; // Regex for English characters, no special characters or whitespaces, and more than 4 characters
		setIsValid(regex.test(login));
	};

	const generateLoginName = () => {
		const firstLetter = replaceSpecialChars(firstName.charAt(0));
		const fourLetters = replaceSpecialChars(lastName.slice(0, 4).toLowerCase());
		let formattedRegNumber = regNumber;
		if (regNumber < 10) {
			formattedRegNumber = '0' + regNumber;
		}
		const login =
			firstLetter.toUpperCase() + fourLetters + className + formattedRegNumber;
		validateLogin(login);
		return login;
	};

	const generatePassword = () => {
		let formattedRegNumber = regNumber;
		if (regNumber < 10) {
			formattedRegNumber = '0' + regNumber;
		}
		if (regNumber) {
			return '$tudent' + formattedRegNumber;
		} else {
			let randomNumber = Math.floor(Math.random() * (100 - 40 + 1)) + 40;
			let formattedRegNumber = randomNumber;
			if (randomNumber < 10) {
				formattedRegNumber = '0' + randomNumber;
			}
			return '$tudent' + formattedRegNumber;
		}
	};

	const validatePassword = (password) => {
		// Regex for password: at least 8 characters, at least one digit, at least one special character
		const regex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
		setIsValidPassword(regex.test(password));
	};

	const generateLogin = () => {
		const length = 8;
		const chars =
			'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		let login = '';
		for (let i = 0; i < length; i++) {
			login += chars[Math.floor(Math.random() * chars.length)];
		}
		return login;
	};
	const [randLogin, setRandLogin] = useState(generateLogin());

	useEffect(() => {
		const newLogin = generateLoginName(
			firstName,
			lastName,
			className,
			regNumber
		);
		setLogin(newLogin);
	}, [firstName, lastName, className, regNumber]);

	useEffect(() => {
		const newPass = generatePassword(regNumber);
		setPassword(newPass);
	}, [regNumber, attemptValue]);

	const handleSubmit = async (e) => {
		const saveToast = 'addUser';
		e.preventDefault();
		const docRef = doc(db, 'users', 'user' + login);
		const docSnap = await getDoc(docRef);
		let examDateValue;
		if (attemptValue === 'Tak') {
			examDateValue = new Date()
				.toLocaleDateString('en-GB')
				.replace(/\//g, '.');
		}
		if (docSnap.exists()) {
			toast.error('Zdający o takim loginie już istnieje. Wygeneruj nowy lub utwórz nowy login ręcznie.');
		} else {
			try {
				await setDoc(doc(db, 'users', 'user' + login), {
					firstname: firstName,
					lastname: lastName,
					class: className,
					profession: professionValue,
					quizID: quizcodeValue ? quizcodeValue : 'URFvzAVO',
					quizTime: time ? time : 60,
					attemptToSolve: attemptValue == 'Tak' ? 0 : 1, //newValue === 'tak' ? 0 : 1, // === 'tak' ? '0' : '1',
					login: login,
					password: password,
					percentResult: 0,
					quizResult: 0,
					...(examDateValue && { examDate: examDateValue }),
					role: 's',
				});
				refreshUsers();
				onSave(user);
			} catch (error) {
				toast.error('Wystąpił błąd! Nie dodano zdającego do bazy danych.');
			}
		}
	};

	console.log(attemptValue);
	return (
		<div className='mt-4'>
			<Form onSubmit={handleSubmit}>
				<fieldset className='border p-2'>
					<legend className='float-none w-auto p-2 fs-6'>Dane zdającego</legend>
					<div className='row'>
						<div className='col-md-6 mb-3'>
							<TextField
								label='Imię zdającego'
								onChange={(event) => {
									const newFirstName = event.target.value;
									setFirstName(newFirstName);
								}}
								className='w-100'
								size='small'
								required
							/>
						</div>
						<div className='col-md-6 mb-3'>
							<TextField
								label='Nazwisko zdającego'
								onChange={(event) => {
									const newLastName = event.target.value;
									setLastName(newLastName);
								}}
								className='w-100'
								size='small'
								required
							/>
						</div>
					</div>
					<div className='row'>
						<div className='col-md-3 mb-3'>
							<TextField
								label='Klasa'
								onChange={(event) => {
									const newClassName = event.target.value;
									setClassName(newClassName);
								}}
								className='w-200'
								size='small'
								required
							/>
						</div>
						<div className='col-md-3 mb-3'>
							<TextField
								type='number'
								aria-label='Numer w dzienniku'
								placeholder='Numer w dzienniku'
								label='Numer w dzienniku'
								size='small'
								value={regNumber ? regNumber : 1}
								inputProps={{ min: 1, max: 40 }}
								onChange={(event) => setRegNumber(event.target.value)}
								className='w-100'
								required
							/>
						</div>
						<div className='col-md-6 mb-3'>
							<Autocomplete
								value={professionValue}
								onChange={handleAutocompleteChange}
								id='profession-autocomplete'
								size='small'
								required
								options={profession}
								getOptionLabel={(option) => option}
								renderInput={(params) => (
									<TextField {...params} label='Zawód' className='w-100' />
								)}
							/>
						</div>
					</div>
				</fieldset>
				<fieldset class='border p-2 mt-4'>
					<legend class='float-none w-auto p-2 fs-6'>
						Dostęp do arkusza egzaminacyjnego
					</legend>
					<div className='row'>
						<div className='col-md-4 mb-3'>
							<Autocomplete
								value={quizcodeValue ? quizcodeValue : 'URFvzAVO'}
								onChange={(event, newValue) => {
									setQuizcodeValue(newValue);
								}}
								id='examcode-autocomplete'
								size='small'
								required
								options={examcode}
								getOptionLabel={(option) => option}
								renderInput={(params) => (
									<TextField
										{...params}
										value='URFvzAVO'
										label='Kod egzaminu'
										className='w-100'
									/>
								)}
							/>
						</div>
						<div className='col-md-4 mb-3'>
							<TextField
								type='number'
								aria-label='Czas egzaminu'
								placeholder='Czas egzaminu'
								label='Czas egzaminu'
								size='small'
								required
								value={time ? time : 60}
								inputProps={{ min: 0 }}
								onChange={(event) => {
									setTime(event.target.value);
								}}
								className='w-100'
							/>
						</div>
						<div className='col-md-4 mb-3'>
							<Autocomplete
								value={attemptValue}
								size='small'
								required
								onChange={(event, newValue) => {
									setAttemptValue(newValue);
								}}
								id='option-autocomplete'
								getOptionLabel={(option) => option}
								options={['Tak', 'Nie']}
								renderInput={(params) => (
									<TextField
										{...params}
										label='Dostęp do arkusza'
										value='Nie'
										className='w-100'
									/>
								)}
							/>
						</div>
					</div>
				</fieldset>
				<fieldset class='border p-2 mt-4'>
					<legend class='float-none w-auto p-2 fs-6'>Dane logowania</legend>

					<div className='row'>
						<div className='col-md-4'>
							<TextField
								label='Login'
								className={`w-100 form-control ${
									isValid ? 'is-valid' : 'is-invalid'
								}`}
								size='small'
								value={login}
								onChange={(event) => {
									const newLogin = event.target.value;
									setLogin(newLogin);
									validateLogin(newLogin);
								}}
								error={!isValid}
								helperText={!isValid ? 'Nieprawidłowy login' : 'Ok'}
							/>
						</div>
						<div className='col-md-8'>
							<TextField
								label='Hasło'
								className={`w-100 form-control ${
									isValidPassword ? 'is-valid' : 'is-invalid'
								}`}
								size='small'
								value={password}
								variant='outlined'
								onChange={(event) => {
									const newPassword = event.target.value;
									setPassword(newPassword);
									validatePassword(newPassword);
								}}
								error={!isValidPassword}
								helperText={
									!isValidPassword
										? 'Nieprawidłowe hasło (minimum 8 znaków, 1 cyfra, znak specjalny)'
										: ''
								}
							/>
						</div>
					</div>
				</fieldset>
				<div className='row mt-3'>
					<div className='col-md-12'>
						<Button variant='success' type='submit' className='w-100'>
							Zapisz
						</Button>
					</div>
				</div>
			</Form>
		</div>
	);
};

export default AddUserForm;
