import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import {
	collection,
	getDocs,
	doc,
	updateDoc,
	deleteDoc,
} from 'firebase/firestore';
import db from '../firebase';
import Pagination from './Pagination';
import WindowConfirm from './WindowConfirm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faTrashCan } from '@fortawesome/free-solid-svg-icons';
library.add(faTrashCan);

const ShowUser = () => {
	const fetchData = async () => {
		const data = await getDocs(collection(db, 'users'));
		setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
	};

	const [users, setUsers] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [usersPerPage] = useState(10);
	const [selectedUser, setSelectedUser] = useState(null);
	const [oldTime, setOldTime] = useState(null);

	useEffect(() => {
		fetchData();
	}, []);

	const [quizCodes, setQuizCodes] = useState([]);

	useEffect(() => {
		const fetchQuizCodes = async () => {
			const querySnapshot = await getDocs(collection(db, 'quizCode'));
			const codes = querySnapshot.docs.map((doc) => doc.id);
			setQuizCodes(codes);
		};
		fetchQuizCodes();
	}, []);
	// Get current users
	const filteredUsers = users.filter(
		(user) => typeof user.role === 'string' && user.role.includes('s')
	);
	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

	// Change page
	const paginate = (pageNumber) => setCurrentPage(pageNumber);
	const handleRowClick = (user) => {
		setSelectedUser(user);
	};

	const [editingIndex, setEditingIndex] = useState(null);
	const [editingField, setEditingField] = useState(null);
	const [editingValue, setEditingValue] = useState('');

	const handleDoubleClick = (index, field, value) => {
		setEditingIndex(index);
		setEditingField(field);
		setEditingValue(value);
	};

	const handleKeyDown = async (event, index, field) => {
		if (event.key === 'Enter' || field === 'quizID') {
			// Calculate the index of the user in the `users` array
			const userIndex = usersPerPage * (currentPage - 1) + index;

			const newUsers = [...users];
			newUsers[userIndex][field] = editingValue;
			setUsers(newUsers);

			// Update the data in your Firebase database
			try {
				const userRef = doc(db, 'users', newUsers[userIndex].id);
				await updateDoc(userRef, { [field]: editingValue });
			} catch (error) {
				console.error('Error updating document: ', error);
			}

			// Reset oldTime when done editing quizTime

			setEditingIndex(null);
			setEditingField(null);
		}
	};
	useEffect(() => {
		if (editingIndex !== null && editingField !== null) {
			// Add event listener when the input field is being edited
			document.addEventListener('mousedown', handleClickOutside);
		} else {
			// Remove event listener when the input field is not being edited
			document.removeEventListener('mousedown', handleClickOutside);
		}

		// Cleanup function
		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [editingIndex, editingField]);

	const handleClickOutside = (event, field) => {
		if (event.target.tagName !== 'INPUT' && event.target.tagName !== 'SELECT') {
			setEditingIndex(null);
			setEditingField(null);
		}
	};

	const [modalIsOpen, setModalIsOpen] = useState(false);
	const [userIndex, setUserIndex] = useState(null);
	const handleDelete = (index) => {
		// Calculate the index of the user in the `users` array
		const userIndex = usersPerPage * (currentPage - 1) + index;
		console.log('Deleting user at index:', userIndex); // Add this line
		setUserIndex(userIndex);
		setModalIsOpen(true);
	};

	const deleteUser = async () => {
		if (userIndex === null) return;

		try {
			// Delete the user from your Firebase database
			const userRef = doc(db, 'users', users[userIndex].id);
			await deleteDoc(userRef);

			// Fetch the updated list of users from Firebase
			fetchData();
		} catch (error) {
			console.error('Error deleting document: ', error);
		}
	};

	const handleInputChange = (event, index, field) => {
		setEditingValue(event.target.value);

		// Calculate the index of the user in the `users` array
		const userIndex = usersPerPage * (currentPage - 1) + index;

		const newUsers = [...users];
		newUsers[userIndex][field] = event.target.value;
		setUsers(newUsers);
	};

	const handleSelectBlur = async (index, field) => {
		// Calculate the index of the user in the `users` array
		const userIndex = usersPerPage * (currentPage - 1) + index;

		// Update the data in your Firebase database
		try {
			const userRef = doc(db, 'users', users[userIndex].id);
			await updateDoc(userRef, { [field]: users[userIndex][field] });
		} catch (error) {
			console.error('Error updating document: ', error);
		}

		if (field === 'quizID') {
			setEditingIndex(null);
			setEditingField(null);
		}
	};

	return (
		<div className='mt-4'>
			<table className='table table-striped'>
				<thead>
					<tr>
						<th>lp</th>
						<th>Imię</th>
						<th>Nazwisko</th>
						<th>Login</th>
						<th>Hasło</th>
						<th>Role</th>
						<th>Przypisz arkusz</th>
						<th>Quiz Result</th>
						<th>Czas egzaminu</th>
						<th>Wynik egzaminu</th>
						<th>Dostęp do arkusza</th>
					</tr>
				</thead>
				<tbody>
					{currentUsers.map((user, index) => (
						<tr key={index} onClick={() => handleRowClick(user)}>
							<td>{index + 1}</td>
							<td
								onClick={() =>
									handleDoubleClick(index, 'firstname', user.firstname)
								}
							>
								{editingIndex === index && editingField === 'firstname' ? (
									<input
										className='form-control'
										type='text'
										style={{ width: '80%' }}
										value={editingValue}
										onChange={handleInputChange}
										onKeyDown={(e) => handleKeyDown(e, index, 'firstname')}
									/>
								) : (
									user.firstname
								)}
							</td>
							<td
								onClick={() =>
									handleDoubleClick(index, 'lastname', user.lastname)
								}
							>
								{editingIndex === index && editingField === 'lastname' ? (
									<input
										type='text'
										className='form-control'
										style={{ width: '80%' }}
										value={editingValue}
										onChange={handleInputChange}
										onKeyDown={(e) => handleKeyDown(e, index, 'lastname')}
									/>
								) : (
									user.lastname
								)}
							</td>

							<td>{user.login}</td>
							<td>{user.password}</td>
							<td>{user.role}</td>
							<td>
								{editingIndex === index && editingField === 'quizID' ? (
									<select
										className='form-select'
										style={{ width: '105%' }}
										value={editingValue}
										onChange={async (e) => {
											await handleInputChange(e, index, 'quizID');
											await handleSelectBlur(index, 'quizID');
										}}
									>
										{quizCodes.map((code, i) => (
											<option key={i} value={code}>
												{code}
											</option>
										))}
									</select>
								) : (
									<span
										onClick={() =>
											handleDoubleClick(index, 'quizID', user.quizID)
										}
									>
										{user.quizID || 'Przypisz egzamin'}
									</span>
								)}
							</td>
							<td>{user.quizResult}</td>
							<td
								onClick={() =>
									handleDoubleClick(index, 'quizTime', user.quizTime)
								}
							>
								{editingIndex === index && editingField === 'quizTime' ? (
									<input
										id='typeNumber'
										type='number'
										className='form-control'
										style={{ width: '80%' }}
										value={editingValue}
										onChange={async (e) => {
											await handleInputChange(e, index, 'quizTime');
											await handleSelectBlur(index, 'quizTime');
										}}
										// onChange={(e) => handleInputChange(e, index, 'quizTime')}
										onKeyDown={(e) => handleKeyDown(e, index, 'quizTime')}
									/>
								) : (
									user.quizTime
								)}
							</td>

							<td>{user.percentResult}%</td>
							<td>{user.attemptToSolve === 0 ? 'Tak' : 'Nie'}</td>
							{/* <td>{user.attemptToSolve}</td> */}
							<td>
								<button
									className='btn btn-danger'
									onClick={() => handleDelete(index)}
								>
									<FontAwesomeIcon icon='fa-solid fa-trash-can' />
								</button>
								<WindowConfirm
									isOpen={modalIsOpen}
									onClose={() => setModalIsOpen(false)}
									title='Usuwanie zdającego'
									windowText={`Czy napewno chcesz usunąć: ${users[userIndex]?.firstname} ${users[userIndex]?.lastname}?`}
									onConfirm={() => {
										setModalIsOpen(false);
										deleteUser();
									}}
								/>
							</td>
						</tr>
					))}
				</tbody>
			</table>
			<Pagination
				usersPerPage={usersPerPage}
				totalUsers={filteredUsers.length}
				paginate={paginate}
			/>
			<div style={{ height: 50 }}></div>
		</div>
	);
};

export default ShowUser;
