import React, { useState, useEffect, useContext, useRef } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import {
	collection,
	doc,
	setDoc,
	getDocs,
	getDoc,
	updateDoc,
	arrayUnion,
	query,
	where,
} from 'firebase/firestore';
import {db} from '../firebase';
import { Editor } from '@tinymce/tinymce-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
	faFloppyDisk,
	faPen,
	faUserCircle,
} from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import QuestCreator from './QuestCreator';
import AppContext from './AppContext';
import { Select, MenuItem, InputLabel, FormControl, Chip } from '@mui/material';

library.add(faFloppyDisk, faPen, faUserCircle);

const ExamCreator = ({ quizCodesData, professionsData, qualificationName, onExamCreated  }) => {
	const [selectedProfession, setSelectedProfession] = useState('');
	const [availableQualifications, setAvailableQualifications] = useState([]);
	const [qualification, setQualification] = useState('');
	const [isSaved, setIsSaved] = useState(false);
	const [showQuestCreator, setShowQuestCreator] = useState(false);
	const [examName, setExamName] = useState('');
	const { userName, setUserName } = useContext(AppContext);
	const { currentUser, setCurrentUser } = useContext(AppContext); // nazwa dokumentu aktualnie zalogowane użytkownika. Nazwa tworzona w LoginExam
	const [users, setUsers] = useState([]);
	const [selectedUsers, setSelectedUsers] = useState([]);
	const [availableUsers, setAvailableUsers] = useState([]);
	const [isFormActive, setIsFormActive] = useState(true);

	useEffect(() => {
		const fetchUsers = async () => {
			const q = query(
				collection(db, 'users'),
				where('role', 'in', ['sa', 'a'])
			);
			const querySnapshot = await getDocs(q);
			const fetchedUsers = [];
			querySnapshot.forEach((doc) => {
				if (doc.id !== currentUser) {
					fetchedUsers.push({ id: doc.id, ...doc.data() });
				}
			});
			setUsers(fetchedUsers);
			setAvailableUsers(fetchedUsers);
		};

		fetchUsers();
	}, []);

	const handleSelectUser = (userId) => {
		const user = availableUsers.find((user) => user.id === userId);
		setSelectedUsers((prevSelected) => [...prevSelected, user]);
		setAvailableUsers((prevAvailable) =>
			prevAvailable.filter((user) => user.id !== userId)
		);
	};

	const handleRemoveUser = (userId) => {
		const user = selectedUsers.find((user) => user.id === userId);
		setAvailableUsers((prevAvailable) => [...prevAvailable, user]);
		setSelectedUsers((prevSelected) =>
			prevSelected.filter((user) => user.id !== userId)
		);
	};

	useEffect(() => {
		if (selectedProfession) {
			const qualifications = Object.entries(qualificationName)
				.filter(([key, value]) =>
					value.professions.includes(selectedProfession)
				)
				.map(([key]) => key);
			setAvailableQualifications(qualifications);
		} else {
			setAvailableQualifications([]);
		}
	}, [selectedProfession, qualificationName, isSaved, examName]);

	const editorRef = useRef(null);
	const log = () => {
		if (editorRef.current) {
			console.log(editorRef.current.getContent());
		}
	};

	// Function to generate an eight-character code consisting of lowercase letters, uppercase letters, and numbers.
	const generateCode = () => {
		let code = '';
		//setIsSaved(false);
		const characters =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
		for (let i = 0; i < 8; i++) {
			code += characters.charAt(Math.floor(Math.random() * characters.length));
		}

		return code;
	};

	const [code, setCode] = useState(generateCode());

	const validateAndCreateDocument = async () => {
		// Check if code exists in quizCodesData
		if (Object.keys(quizCodesData).includes(code)) {
			toast.error(
				'Egzamin o takim identyfikatorze istnieje. Wygeneruj nowy kod.'
			);
			return;
		}

		// Check if profession and qualification are selected
		if (
			!selectedProfession ||
			selectedProfession === 'Wybierz zawód' ||
			!qualification ||
			qualification === 'Wybierz kwalifikację'
		) {
			toast.warn('Proszę wybrać zawód i kwalifikację zawodową');
			return;
		}

		// Get the qualification document
		const qualificationDocRef = doc(db, 'qualificationName', qualification);
		const qualificationDocSnap = await getDoc(qualificationDocRef);

		if (!qualificationDocSnap.exists()) {
			toast.error(
				'Arkusz o takiej nazwie już istniej. Odśwież stronę lub spróbuj ponownie.',
				{
					autoClose: 900,
				}
			);
			return;
		}

		let session = 'A1';
		let i = 0;
		let j = 1;
		let k = 1;
		let l = 1;

		const sessionsDocRef = doc(db, 'sessions', 'all');
		let sessionsDocSnap = await getDoc(sessionsDocRef);

		// Ifthe sessions document does not exist,e it undefined creatundefinedith an empty sessions array
		if (!sessionsDocSnap.exists()) {
			await setDoc(sessionsDocRef, { sessions: [] });
			sessionsDocSnap = await getDoc(sessionsDocRef);
		}

		let existingSessions = sessionsDocSnap.data().sessions || [];

		while (existingSessions.includes(session)) {
			j++;
			if (j > 9) {
				j = 1;
				i++;
				if (i > 25) {
					i = 0;
					k++;
					if (k > 9) {
						k = 1;
						l++;
					}
				}
			}
			session = `${String.fromCharCode(65 + i)}${j}`;
			if (l > 1) {
				session = `${String.fromCharCode(65 + l - 2)}${k}${session}`;
			}
		}

		// Add the new session to the sessions document
		await updateDoc(sessionsDocRef, {
			sessions: arrayUnion(session),
		});

		const quizCodeDocRef = doc(db, 'quizCode', code);
		const quizCodeDocSnap = await getDoc(quizCodeDocRef);

		if (quizCodeDocSnap.exists()) {
			toast.error('Arkusz o takim kodzie już istnieje! Wygeneruj nowy kod.', {
				autoClose: 950,
			});
			return;
		}

		try {
			const Autors = [
				userName,
				...selectedUsers.map((user) => `${user.firstname} ${user.lastname}`),
			].filter((name) => name !== undefined);
			const quizCodeDocRef = doc(db, 'quizCode', code);
			await setDoc(quizCodeDocRef, {
				Qualification: qualificationDocSnap.data().name,
				Session: session,
				Year: new Date().getFullYear(),
				Profession: selectedProfession,
				Autors: Autors,
			});

			const formattedQualification = qualification
				.toLowerCase()
				.replace('.', '');
			const newCollectionRef = collection(
				db,
				`${formattedQualification}${new Date().getFullYear()}${session}`
			);
			setExamName(
				`${formattedQualification}${new Date().getFullYear()}${session}`
			);
			const newDocRef = doc(newCollectionRef, '1');
			await setDoc(newDocRef, {
				// Add fields to the document as needed
			});
			// setCode(generateCode());
			// setSelectedProfession('');
			// setQualification('');
			// setIsSaved(false);

			  toast.success('Nowy arkusz został utworzony', {
                autoClose: 900,
                onClose: () => {
                    setIsFormActive(false);
                    onExamCreated(); // Wywołanie funkcji odświeżającej
                },
            });
			setIsSaved(true);
		} catch (error) {
			toast.error(`Wystąpił błąd ${error}. Arkusz nie został utworzony.`, {
				autoClose: 900,
			});
		}
	};

	return (
		<div className='mt-4'>
			<div className='d-flex'>
				<div className='col-2'>
					<label htmlFor='exampleFormControlInput1'>Kod egzaminu: </label>
					<input
						className='form-control text-primary'
						style={{ width: 120, height: 38 }}
						maxLength={8}
						value={code}
						onChange={(e) => setCode(e.target.value)}
						type='text'
						placeholder='wprowadź kod testu'
						disabled={!isFormActive}
					></input>
				</div>
				<div className='col-4 mt-4'>
					<button
						type='button'
						onClick={() => {
							setCode(generateCode());
							setIsSaved(false);
							setIsFormActive(true);
							setShowQuestCreator(false);
						}}
						className='btn btn-success'
						
					>
						Generuj nowy kod egzaminu
					</button>
				</div>
			</div>

			<div className='d-flex mt-5'>
				<label className='col-3' htmlFor='exampleFormControlInput2'>
					Nazwa zawodu:
				</label>
				<select
					className='form-select'
					size={{ width: 200 }}
					aria-label='Zawód'
					value={selectedProfession}
					onChange={(e) => setSelectedProfession(e.target.value)}
					disabled={!isFormActive}
				>
					<option selected disabled={!isFormActive}>
						Wybierz zawód
					</option>
					{Object.keys(professionsData).map((profession, index) => (
						<option key={index} value={profession}>
							{profession}
						</option>
					))}
				</select>
			</div>
			<div className='d-flex mt-5'>
				<label className='col-3' htmlFor='exampleFormControlInput1'>
					Kwalifikacja zawodowa:{' '}
				</label>
				<select
					className='form-select'
					size={{ width: 200 }}
					aria-label='Kwalifikacja zawodowa'
					value={qualification} // Add this line
					onChange={(e) => setQualification(e.target.value)}
					disabled={!isFormActive}
				>
					<option selected disabled={!isFormActive}>
						Wybierz kwalifikację
					</option>
					{availableQualifications.map((qualification, index) => (
						<option key={index} value={qualification}>
							{qualification}
						</option>
					))}
				</select>
			</div>
			<div className='d-flex mt-5'>
				Autor:{'  '}&nbsp;
				<InputLabel size='normal' focused color='info'>
					{userName}
				</InputLabel>{' '}
			</div>
			<div className='d-flex mt-5'>
				<div style={{ marginTop: '20px', marginRight: '40px' }}>
					<InputLabel>Osoby z dostępem do arkusza:</InputLabel>
					<div>
						{selectedUsers.map((user) => (
							<Chip
								key={user.id}
								color='primary'
								label={`${user.firstname} ${user.lastname}`}
								onClick={() => handleRemoveUser(user.id)}
								style={{ margin: '5px' }}
								disabled={!isFormActive}
								icon={<FontAwesomeIcon icon={faUserCircle} />}
							/>
						))}
					</div>
				</div>

				<FormControl fullWidth>
					<InputLabel id='user-select-label'>
						Wybierz użytkownika, któremu nadasz dostęp do arkusza
					</InputLabel>
					<Select
						labelId='user-select-label'
						id='user-select'
						value=''
						disabled={!isFormActive}
						label='Wybierz użytkownika, któremu nadasz dostęp do arkusza'
						onChange={(e) => handleSelectUser(e.target.value)}
					>
						{availableUsers.map((user) => (
							<MenuItem key={user.id} value={user.id}>
								{`${user.firstname} ${user.lastname}`}{' '}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</div>

			<div className='mt-4'>
				<div className='d-flex justify-content-end'>
					<button
						type='button'
						className='mt-4 btn btn-warning'
						onClick={() => {
							setShowQuestCreator(!showQuestCreator);
						}}
						disabled={isFormActive}
						// disabled={!isSaved}
					>
						<FontAwesomeIcon icon={faPen} />
						&nbsp; Dodaj pytania do testu
					</button>
					&nbsp;{' '}
					<button
						type='submit'
						onClick={validateAndCreateDocument}
						disabled={!isFormActive}
						className='mt-4 btn btn-success'
					>
						Zapisz <FontAwesomeIcon icon={faFloppyDisk} />
					</button>
				</div>
				<div>{showQuestCreator && <QuestCreator examName={examName} />}</div>
			</div>
			<div style={{ height: 50 }}></div>
		</div>
	);
};

export default ExamCreator;
