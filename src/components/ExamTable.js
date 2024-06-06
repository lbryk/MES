import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import db from '../firebase';
import {
	collection,
	getDocs,
	query,
	where,
	doc,
	updateDoc,
} from 'firebase/firestore';
import { Select, MenuItem, InputLabel, FormControl, Chip } from '@mui/material';

const ExamTable = () => {
	const [exams, setExams] = useState([]);
	const [editingExamId, setEditingExamId] = useState(null);
	const [editingAuthors, setEditingAuthors] = useState([]);
	const [availableUsers, setAvailableUsers] = useState([]);
	const tableRef = useRef(null);

	useEffect(() => {
		const fetchExams = async () => {
			try {
				const q = query(collection(db, 'quizCode'));
				const querySnapshot = await getDocs(q);
				const examsData = querySnapshot.docs.map((doc, index) => ({
					id: doc.id,
					lp: index + 1,
					name: doc.id,
					quizCode: doc.data().quizCode,
					qualification: doc
						.data()
						.Qualification.toUpperCase()
						.replace(/(\d+)/, '-$1'),
					profession: doc.data().Profession,
					autors: doc.data().Autors || [],
				}));
				setExams(examsData);
			} catch (error) {
				console.error('Error fetching exams: ', error);
			}
		};

		const fetchUsers = async () => {
			const q = query(
				collection(db, 'users'),
				where('role', 'in', ['s', 'sa'])
			);
			const querySnapshot = await getDocs(q);
			const fetchedUsers = [];
			querySnapshot.forEach((doc) => {
				fetchedUsers.push({ id: doc.id, ...doc.data() });
			});
			setAvailableUsers(fetchedUsers);
		};

		fetchExams();
		fetchUsers();
	}, []);

	const handleDoubleClick = (examId, authors) => {
		setEditingExamId(examId);
		setEditingAuthors(
			authors.map((author) => {
				const [firstname, lastname] = author.split(' ');
				return { firstname, lastname };
			})
		);
	};

	const handleSelectUser = (userId) => {
		const user = availableUsers.find((user) => user.id === userId);
		setEditingAuthors((prevSelected) => [...prevSelected, user]);
		setAvailableUsers((prevAvailable) =>
			prevAvailable.filter((user) => user.id !== userId)
		);
	};

	const handleRemoveUser = (userId) => {
		const user = editingAuthors.find((user) => user.id === userId);
		setAvailableUsers((prevAvailable) => [...prevAvailable, user]);
		setEditingAuthors((prevSelected) =>
			prevSelected.filter((user) => user.id !== userId)
		);
	};

	const handleBlur = async (examId) => {
		try {
			const examDocRef = doc(db, 'quizCode', examId);
			const authorNames = editingAuthors.map(
				(user) => `${user.firstname} ${user.lastname}`
			);
			await updateDoc(examDocRef, { Autors: authorNames });
			const updatedExams = exams.map((exam) =>
				exam.id === examId ? { ...exam, autors: authorNames } : exam
			);
			setExams(updatedExams);
		} catch (error) {
			console.error('Error updating authors: ', error);
		}
		setEditingExamId(null);
	};

	const handleClickOutside = (event) => {
		if (tableRef.current && !tableRef.current.contains(event.target)) {
			if (editingExamId !== null) {
				handleBlur(editingExamId);
			}
		}
	};

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside);
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [editingExamId]);

	return (
		<div className='mt-4' ref={tableRef}>
			<table className='table table-striped'>
				<thead>
					<tr>
						<th>lp</th>
						<th>Kod egzaminu</th>
						<th>Kwalifikacja</th>
						<th>Zawód</th>
						<th>Osoby z prawem edycji</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{exams.map((exam) => (
						<tr key={exam.id} className='align-middle'>
							<td className='align-middle'>{exam.lp}</td>
							<td className='align-middle'>{exam.name}</td>
							<td className='align-middle'>{exam.qualification}</td>
							<td className='align-middle'>{exam.profession}</td>
							<td
								className='align-middle'
								onDoubleClick={() => handleDoubleClick(exam.id, exam.autors)}
							>
								{editingExamId === exam.id ? (
									<div>
										<div>
											{editingAuthors.map((user, index) => (
												<Chip
													key={index}
													color='primary'
													label={`${user.firstname} ${user.lastname}`}
													onClick={() => handleRemoveUser(user.id)}
													style={{ margin: '5px' }}
													icon={<FontAwesomeIcon icon={faUserCircle} />}
												/>
											))}
										</div>
										<FormControl fullWidth>
											<InputLabel id='user-select-label'>
												Wybierz użytkownika
											</InputLabel>
											<Select
												labelId='user-select-label'
												id='user-select'
												value=''
												label='Wybierz użytkownika'
												onChange={(e) => handleSelectUser(e.target.value)}
											>
												{availableUsers.map((user) => (
													<MenuItem key={user.id} value={user.id}>
														{`${user.firstname} ${user.lastname}`}
													</MenuItem>
												))}
											</Select>
										</FormControl>
									</div>
								) : (
									exam.autors.map((author, index) => (
										<div key={index}>
											{author}
											<br />
										</div>
									))
								)}
							</td>
							<td className='align-middle'>
								<Button variant='primary' className='me-2'>
									<FontAwesomeIcon icon={faPencilAlt} />
								</Button>
								<Button variant='danger'>
									<FontAwesomeIcon icon={faTrash} />
								</Button>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<div style={{ height: 50 }}></div>
		</div>
	);
};

export default ExamTable;