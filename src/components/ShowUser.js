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
import AddUserForm from './AddUserForm';
import WindowConfirm from './WindowConfirm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import {
	faTrashCan,
	faFileExcel,
	faFile,
	faUserPlus,
	faUserMinus,
} from '@fortawesome/free-solid-svg-icons';
library.add(faTrashCan, faFileExcel, faFile, faUserPlus, faUserMinus);

const ShowUser = () => {
	const [originalUsers, setOriginalUsers] = useState([]);
	const fetchData = async () => {
		const data = await getDocs(collection(db, 'users'));
		// setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
		const usersData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
		setUsers(usersData);
		setOriginalUsers(usersData);
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

	const [profession, setfetchProfession] = useState([]);
	useEffect(() => {
		const fetchProfession = async () => {
			const querySnapshot = await getDocs(collection(db, 'professions'));
			const codes = querySnapshot.docs.map((doc) => doc.id);
			setfetchProfession(codes);
		};
		fetchProfession();
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
		// let value = event.target.value;
		// if (field === 'attemptToSolve') {
		// 	value = parseInt(value, 10);
		// }
		// setEditingValue(value);
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
	const [sortField, setSortField] = useState(null);
	const [sortDirection, setSortDirection] = useState('asc');

	const handleSort = (field) => {
		let direction = 'asc';
		if (sortField === field && sortDirection === 'asc') {
			direction = 'desc';
		}
		setSortField(field);
		setSortDirection(direction);
	};

	useEffect(() => {
		let sortedUsers = [...users];
		if (sortField !== null) {
			sortedUsers.sort((a, b) => {
				if (a[sortField] < b[sortField]) {
					return sortDirection === 'asc' ? -1 : 1;
				}
				if (a[sortField] > b[sortField]) {
					return sortDirection === 'asc' ? 1 : -1;
				}
				return 0;
			});
		}
		setUsers(sortedUsers);
	}, [sortField, sortDirection]);

	const [selectedUsers, setSelectedUsers] = useState([]);
	const [lpSortDirection, setLpSortDirection] = useState('asc');
	const [selectAll, setSelectAll] = useState(false);
	const [deleteModalIsOpen, setDeleteModalIsOpen] = useState(false);

	const deleteSelectedUsers = async () => {
		for (const id of selectedUsers) {
			try {
				// Delete the user from your Firebase database
				const userRef = doc(db, 'users', id);
				await deleteDoc(userRef);
			} catch (error) {
				console.error('Error deleting document: ', error);
			}
		}

		fetchData();
		setSelectedUsers([]);
	};

	const updateAttemptUsers = async () => {
		for (const id of selectedUsers) {
			try {
				// Update the user in your Firebase database
				const userRef = doc(db, 'users', id);
				await updateDoc(userRef, { attemptToSolve: 0 });
			} catch (error) {
				console.error('Error updating document: ', error);
			}
		}
		fetchData();
	};

	const deactiveAttemptUsers = async () => {
		for (const id of selectedUsers) {
			try {
				// Update the user in your Firebase database
				const userRef = doc(db, 'users', id);
				await updateDoc(userRef, { attemptToSolve: 1 });
			} catch (error) {
				console.error('Error updating document: ', error);
			}
		}
		fetchData();
	};

	const [isFormVisible, setFormVisible] = useState(false);
	const handleSave = (user) => {
		// Save the user data to your collection here
		setFormVisible(false);
	};
	return (
		<div className='mt-4'>
			<table className='table table-striped'>
				<thead>
					<tr>
						<th>
							<input
								type='checkbox'
								className='form-check-input'
								checked={selectAll}
								onChange={() => {
									setSelectAll(!selectAll);
									if (!selectAll) {
										setSelectedUsers(users.map((user) => user.id));
									} else {
										setSelectedUsers([]);
									}
								}}
							/>
						</th>
						<th>lp</th>
						<th onClick={() => handleSort('firstname')}>Imię</th>
						<th onClick={() => handleSort('lastname')}>Nazwisko</th>
						<th onClick={() => handleSort('login')}>Login</th>
						<th onClick={() => handleSort('password')}>Hasło</th>
						<th onClick={() => handleSort('profession')}>Zawód</th>
						<th onClick={() => handleSort('class')}>Klasa</th>
						<th onClick={() => handleSort('quizID')}>Przypisz arkusz</th>
						<th onClick={() => handleSort('quizTime')}>Czas egzaminu</th>
						<th onClick={() => handleSort('attemptToSolve')}>
							Dostęp do arkusza
						</th>
						<th>
							<div style={{ textAlign: 'center' }}>
								<FontAwesomeIcon icon='fa-solid fa-trash-can' />
							</div>
						</th>
					</tr>
				</thead>
				<tbody>
					{currentUsers.map((user, index) => (
						<tr key={index} onClick={() => handleRowClick(user)}>
							<td>
								<input
									className='form-check-input'
									type='checkbox'
									checked={selectedUsers.includes(user.id)}
									onChange={() => {
										if (selectedUsers.includes(user.id)) {
											setSelectedUsers(
												selectedUsers.filter((id) => id !== user.id)
											);
										} else {
											setSelectedUsers([...selectedUsers, user.id]);
										}
									}}
								/>
							</td>
							<td>
								{lpSortDirection === 'asc'
									? (currentPage - 1) * usersPerPage + index + 1
									: filteredUsers.length -
									  ((currentPage - 1) * usersPerPage + index)}
							</td>
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

							<td className='text-success font-weight-bold'>{user.login}</td>
							<td className='text-success font-weight-bold'>{user.password}</td>
							<td>
								{editingIndex === index && editingField === 'profession' ? (
									<select
										className='form-select'
										style={{ width: '100%' }}
										value={editingValue}
										onChange={async (e) => {
											await handleInputChange(e, index, 'profession');
											await handleSelectBlur(index, 'profession');
										}}
									>
										{profession.map((code, i) => (
											<option key={i} value={code}>
												{code}
											</option>
										))}
									</select>
								) : (
									<span
										onClick={() =>
											handleDoubleClick(index, 'profession', user.profession)
										}
									>
										{user.profession || 'Przypisz zawód'}
									</span>
								)}
							</td>
							<td onClick={() => handleDoubleClick(index, 'class', user.class)}>
								{editingIndex === index && editingField === 'class' ? (
									<input
										type='text'
										className='form-control'
										style={{ width: '80%' }}
										value={editingValue}
										onChange={handleInputChange}
										onKeyDown={(e) => handleKeyDown(e, index, 'class')}
									/>
								) : (
									user.class
								)}
							</td>
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

							<td
								onClick={() =>
									handleDoubleClick(index, 'quizTime', user.quizTime)
								}
							>
								{editingIndex === index && editingField === 'quizTime' ? (
									<input
										id='typeNumber'
										type='number'
										min='0'
										className='form-control'
										style={{ width: '80%' }}
										value={editingValue}
										onChange={async (e) => {
											await handleInputChange(e, index, 'quizTime');
											await handleSelectBlur(index, 'quizTime');
										}}
										onKeyDown={(e) => handleKeyDown(e, index, 'quizTime')}
									/>
								) : (
									user.quizTime
								)} min
							</td>

							<td>
								{editingIndex === index && editingField === 'attemptToSolve' ? (
									<select
										className='form-select'
										style={{ width: '100%' }}
										value={editingValue}
										onChange={async (e) => {
											await handleInputChange(e, index, 'attemptToSolve');
											await handleSelectBlur(index, 'attemptToSolve');
										}}
									>
										<option value={0}>Tak</option>
										<option value={1}>Nie</option>
									</select>
								) : (
									<span
										onClick={() =>
											handleDoubleClick(
												index,
												'attemptToSolve',
												user.attemptToSolve
											)
										}
									>
										{Number(user.attemptToSolve) === 0 ? 'Tak' : 'Nie'}
									</span>
								)}
							</td>
							<td>
								<button
									className='btn btn-danger'
									onClick={() => handleDelete(index)}
									disabled={selectedUsers.length > 1}
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
			<button
				className='btn btn-danger'
				onClick={() => setDeleteModalIsOpen(true)}
				disabled={selectedUsers.length === 0}
			>
				Usuń zaznaczonych zdających &nbsp;
				<FontAwesomeIcon icon='fa-solid fa-trash-can' />
			</button>{' '}
			<button
				className='btn btn-warning'
				onClick={updateAttemptUsers}
				disabled={selectedUsers.length === 0}
			>
				Aktywuj dostęp do arkuszy &nbsp;
				<FontAwesomeIcon icon='fa-solid fa-file' />
			</button>{' '}
			<button
				className='btn btn-secondary'
				onClick={deactiveAttemptUsers}
				disabled={selectedUsers.length === 0}
			>
				Zabroń dostępu do arkuszy &nbsp;
				<FontAwesomeIcon icon='fa-solid fa-file-excel' />
			</button>{' '}
			<button
				className='btn btn-success'
				onClick={() => setFormVisible(!isFormVisible)}
			>
				{isFormVisible ? (
					<>
						Ukryj formularz <FontAwesomeIcon icon='fa-solid fa-user-minus' />
					</>
				) : (
					<>
						Dodaj zdającego <FontAwesomeIcon icon='fa-solid fa-user-plus' />
					</>
				)}
				&nbsp;
			</button>
			{isFormVisible && (
				<AddUserForm
					onSave={handleSave}
					examcode={quizCodes}
					profession={profession}
				/>
			)}
			<WindowConfirm
				isOpen={deleteModalIsOpen}
				onClose={() => setDeleteModalIsOpen(false)}
				title='Usuwanie zdającego'
				windowText={
					selectedUsers.length === 1
						? `Czy napewno chcesz usunąć: ${
								users.find((user) => user.id === selectedUsers[0])?.firstname
						  } ${
								users.find((user) => user.id === selectedUsers[0])?.lastname
						  }?`
						: `Czy napewno chcesz usunąć wszystkich zaznaczonych zdających?`
				}
				onConfirm={() => {
					setDeleteModalIsOpen(false);
					deleteSelectedUsers();
				}}
			/>
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
