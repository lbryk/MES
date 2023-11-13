import React, { useState, useEffect } from 'react';
import Form from 'react-bootstrap/Form';
// import { Box } from '@mui/material';
// import FormControl from '@mui/material/FormControl';
// import Button from '@mui/material/Button';
// import { Button as BootstrapButton } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import { Unstable_NumberInput as NumberInput } from '@mui/base/Unstable_NumberInput';

const AddUserForm = ({ onSave, examcode, profession }) => {
	const [user, setUser] = React.useState({});
	// const [inputValue, setInputValue] = useState('');
	const [regNumber, setRegNumber] = useState(1);
	const [quizcodeValue, setQuizcodeValue] = useState(null);
	const [professionValue, setProfessionValue] = useState(null);
	const [value, setValue] = useState('');
	const [attemptValue, setAttemptValue] = useState(null);
	const [firstName, setFirstName] = useState('');
	const [lastName, setLastName] = useState('');
	const [className, setClassName] = useState('');
	const [loginValid, setLoginValid] = useState(false);

	const handleQuizCodeChange = (event, newValue) => {
		setQuizcodeValue(newValue);
		setUser((prevUser) => ({ ...prevUser, examcode: newValue }));
	};

	const handleAutocompleteChange = (event, newValue) => {
		setProfessionValue(newValue);
		setUser((prevUser) => ({ ...prevUser, profession: newValue }));
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		onSave(user);
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
		const regex = /^[a-zA-Z]{5,}$/; // Regex for English characters, no special characters or whitespaces, and more than 4 characters
		setLoginValid(regex.test(login));
	};

	const generateLoginName = () => {
		const firstLetter = replaceSpecialChars(firstName.charAt(0));
		const fourLetters = replaceSpecialChars(lastName.slice(0, 4).toLowerCase());
		const login = firstLetter + fourLetters + className + regNumber;
		// validateLogin(login);
		return login;
	};

	const generatePassword = () => {
		if (regNumber) {
			return '$tudent' + regNumber;
		} else {
			let randomNumber = Math.floor(Math.random() * (100 - 40 + 1)) + 40;
			return '$tudent' + randomNumber;
		}
	};

	return (
		<div className='mt-4'>
			<Form onSubmit={handleSubmit}>
				<fieldset className='border p-2'>
					<legend className='float-none w-auto p-2'>Dane zdającego</legend>
					<div className='row'>
						<div className='col-md-6 mb-3'>
							<TextField
								label='Imię zdającego'
								onChange={(event) => setFirstName(event.target.value)}
								className='w-100'
								size='small'
								required
							/>
						</div>
						<div className='col-md-6 mb-3'>
							<TextField
								label='Nazwisko zdającego'
								onChange={(event) => setLastName(event.target.value)}
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
								onChange={(event) => setClassName(event.target.value)}
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
				<fieldset class='border p-2'>
					<legend class='float-none w-auto p-2'>
						Dostęp do arkusza egzaminacyjnego
					</legend>
					<div className='row'>
						<div className='col-md-4 mb-3'>
							<Autocomplete
								value={quizcodeValue ? quizcodeValue : 'URFvzAVO'}
								onChange={handleQuizCodeChange}
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
								value={value ? value : 60}
								inputProps={{ min: 0 }}
								onChange={(event) => setValue(event.target.value)}
								className='w-100'
							/>
						</div>
						<div className='col-md-4 mb-3'>
							<Autocomplete
								value={attemptValue ? attemptValue : 'Nie'}
								size='small'
								required
								onChange={(event, newValue) => {
									setAttemptValue(newValue);
								}}
								id='option-autocomplete'
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
				<fieldset class='border p-2'>
					<legend class='float-none w-auto p-2'>Dane logowania</legend>
					<div className='row'>
						<div className='col-md-4'>
							<TextField
								label='login'
								className='w-100'
								// className={`w-100 my-form-field ${
								// 	loginValid ? 'Mui-success' : 'Mui-error'
								// }`}
								size='small'
								value={generateLoginName() === '' ? 'T' : generateLoginName()}
							/>
						</div>
						<div className='col-md-8'>
							<TextField
								label='Hasło'
								className='w-100'
								size='small'
								value={generatePassword()}
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
