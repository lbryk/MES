import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import {
	collection,
	getDocs,
	getDoc,
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
	faFilePdf,
	faPrint,
} from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import robotoBase64 from '../fonts/RobotoBase64';

import { Collapse } from 'react-bootstrap';

library.add(
	faTrashCan,
	faFileExcel,
	faFile,
	faUserPlus,
	faUserMinus,
	faFilePdf,
	faPrint
);

const ExamSheet = ({ quizCodesData }) => {
	const [originalUsers, setOriginalUsers] = useState([]);
	const [selectedQuizCode, setSelectedQuizCode] = useState('URFvzAVO'); // inicjalizacja z kodem testu
	const [users, setUsers] = useState([]);
	const [currentPage, setCurrentPage] = useState(1);
	const [usersPerPage] = useState(10);
	const [selectedUser, setSelectedUser] = useState(null); // inicjalizacja z kodem testu
	const fetchData = async () => {
		const data = await getDocs(collection(db, 'users'));
		// setUsers(data.docs.map((doc) => ({ ...doc.data(), id: doc.id })));
		const usersData = data.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
		setUsers(usersData);
		setOriginalUsers(usersData);
	};

	// const [users, setUsers] = useState([]);
	// const [currentPage, setCurrentPage] = useState(1);
	// const [usersPerPage] = useState(10);
	// const [selectedUser, setSelectedUser] = useState(null);

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

	useEffect(() => {
		setCurrentPage(1);
	}, [selectedQuizCode]);

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
		(user) =>
			typeof user.role === 'string' &&
			user.role.includes('s') &&
			(user.quizID === selectedQuizCode || user.quizID === 'URFvzAVO')
		// && user.profession === quizCode.profession dla nauczycieli z 'a'
	);
	const indexOfLastUser = currentPage * usersPerPage;
	const indexOfFirstUser = indexOfLastUser - usersPerPage;
	const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

	const paginate = (pageNumber) => setCurrentPage(pageNumber);

	const handleRowClick = (user) => {
		setSelectedUser(user);
	};

	const [userIndex, setUserIndex] = useState(null);

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

	const [lpSortDirection, setLpSortDirection] = useState('asc');

	const handlePrint = (user) => {
		if (user && user.quizID) {
			const data = quizCodesData[user.quizID];
			if (data && data.Qualification) {
				const qualification = data.Qualification;
				let iframe = document.createElement('iframe');

				// Set the iframe to be invisible
				iframe.style.visibility = 'hidden';
				iframe.style.position = 'fixed';
				iframe.style.right = '0';
				iframe.style.bottom = '0';
				document.body.appendChild(iframe);
				// Generate the content for the report
				let content =
					`
        <h1>Imię i nazwisko: ${user.firstname} ${user.lastname}</h1><br />
		<hr />
        <p>Zawód:<b> ${user.profession}</b></p>
        <p>Klasa: ${user.class}</p><br/><br/>
		<p>Kwalifikacja:<b> ${qualification
			.match(/[a-zA-Z]+/g)
			.join('')
			.toUpperCase()}` +
					`.${qualification.match(/\d+/g)}</b></p>
        <p>Oznaczenie arkusza:<b> ${user.quizID}</b></p>
        <p>Wynik: ${user.quizResult} / 40</p>
        <p>Wynik procentowy: ${user.percentResult}%</p><br />
		${
			user.percentResult >= 50
				? '<p style="color: rgb(0,128,0);" >Egzamin zdany</p>'
				: '<p style="color:rgb(255,0,0);">Egzamin oblany</p>'
		} 
        <footer style="position: fixed; bottom: 0; width: 100%;">
		<small>Raport utworzony dnia: ${new Date().toLocaleDateString()}</small>
		<p><small>Zestawienie zostało wygenerowane w programie MES, aplikacji do tworzenia i przeprowadzania próbnych egzaminów zawodowych</small></p></footer>
    `;

				iframe.contentDocument.write(content);
				iframe.contentDocument.close();

				// Call the print function
				iframe.contentWindow.print();

				// Remove the iframe after printing
				iframe.contentWindow.onafterprint = () => {
					document.body.removeChild(iframe);
				};
			} else {
				console.error(
					'Qualification field is missing or invalid in the document data'
				);
			}
		} else {
			console.error('User or user.quizID is undefined or null');
		}
	};

	const formatDate = (date) => {
		if (!date) {
			return '0000-00-00'; // Default value
		}
		const [day, month, year] = date.split('.');
		return `${year}-${month}-${day}`;
	};

	const groupedUsers = users.reduce((acc, user) => {
		const key = `${user.quizID}-${user.class}-${user.examDate}`;
		if (!acc[key]) {
			acc[key] = {
				quizID: user.quizID,
				profession: user.profession,
				class: user.class,
				examDate: user.examDate,
				passed: Number(user.quizResult) > 20 ? 1 : 0,
				users: [user],
				examTerm: user.examDate,
				count: 1,
				minScore: Number(user.quizResult),
				minPerCent: Number(user.percentResult),
				maxScore: Number(user.quizResult),
				maxPerCent: Number(user.percentResult),
				totalScore: Number(user.quizResult),
				Qualification: user.Qualification,
			};
		} else {
			acc[key].users.push(user);
			acc[key].count += 1;
			acc[key].profession = acc[key].profession;
			if (Number(user.quizResult) > 20) {
				acc[key].passed += 1;
			}
			acc[key].minScore = Math.min(acc[key].minScore, Number(user.quizResult));
			acc[key].maxScore = Math.max(acc[key].maxScore, Number(user.quizResult));
			acc[key].minPerCent = Math.min(
				acc[key].minPerCent,
				Number(user.percentResult)
			);
			acc[key].maxPerCent = Math.max(
				acc[key].maxPerCent,
				Number(user.percentResult)
			);
			acc[key].totalScore += Number(user.quizResult);
			acc[key].examTerm = user.examDate;
			acc[key].Qualification = user.Qualification;
		}
		return acc;
	}, {});
	const groupedUsersArray = Object.values(groupedUsers);
	const [open, setOpen] = useState({});

	const generatePDF = (group) => {
		try {
			const docpdf = new jsPDF('p', 'pt', 'a4');

			docpdf.addFileToVFS('Roboto-Regular.ttf', robotoBase64);
			docpdf.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

			docpdf.setFont('Roboto');
			let y = 20;

			y += 20;
			docpdf.text(20, y, `Numer arkusza: ${group.quizID}`);
			y += 25;
			docpdf.text(20, y, `Kwalifikacja: ${group.Qualification}`);
			y += 30;
			docpdf.text(20, y, `Klasa:`);
			docpdf.setFont('Roboto', 'bold');
			docpdf.text(70, y, `${group.class}`);
			docpdf.setFont('Roboto', 'normal');

			const columns = ['Etap pisemny', ''];
			const rows = [
				['Liczba zdających', group.count],
				['Próg zaliczenia', '50%    20pkt'],
				['Wynik max', `${group.maxScore}    ${group.maxPerCent}%`],
				['Wynik min', `${group.minScore}    ${group.minPerCent}%`],
				['Średni wynik', (group.totalScore / group.count).toFixed(2)],
			];

			docpdf.autoTable(columns, rows, {
				margin: { top: y + 20 },
				styles: { font: 'Roboto', fontSize: 10 },
			});
			y += 20 * rows.length;

			y += 20;

			docpdf.setFontSize(10);
			const pageCount = docpdf.internal.getNumberOfPages();
			for (let i = 1; i <= pageCount; i++) {
				docpdf.setPage(i);

				docpdf.text(
					'Raport utworzony dnia: ' + new Date().toLocaleDateString(),
					20,
					docpdf.internal.pageSize.height - 40
				);
				y += 20;
				docpdf.setFontSize(8);
				docpdf.text(
					'Zestawienie zostało wygenerowane w programie MES, aplikacji do tworzenia i przeprowadzania próbnych egzaminów zawodowych ',
					20,
					docpdf.internal.pageSize.height - 20
				);
			}

			const id = toast.loading('Generowanie reportu...');
			//do something else
			setTimeout(() => {
				toast.update(id, {
					render: 'Za chwilę rozpocznie się automatyczne pobieranie...',
					type: 'success',
					isLoading: false,
					autoClose: 1500,
					onClose: () => {
						docpdf.save(`wyniki_${group.quizID}_${group.examTerm}.pdf`);
					},
				});
			}, 1000);
		} catch (error) {
			toast.error('Błąd: ' + error.message, {
				autoClose: 5000, // Close the error message after 5 seconds
			});
		}
	};
	// 	return (
	// 		<div className='mt-4'>
	// 			<div className='row d-flex align-items-center'>
	// 				<div className='col-12 d-flex justify-content-center text-primary fs-5'>
	// 					Raport według zdającego
	// 				</div>
	// 			</div>
	// 			<div className='col-3'>
	// 				<p>
	// 					Wyświetl według arkusza:
	// 					<select
	// 						className='form-select'
	// 						aria-label='Select Quiz'
	// 						onChange={(e) => setSelectedQuizCode(e.target.value)}
	// 					>
	// 						{Object.keys(quizCodesData).map((quizCode, index) => (
	// 							<option key={index} value={quizCode}>
	// 								{quizCode}
	// 							</option>
	// 						))}
	// 					</select>
	// 				</p>
	// 			</div>

	// 			<table className='table table-striped caption-top'>
	// 				<caption>Lista zdających</caption>
	// 				<thead>
	// 					<tr>
	// 						<th>lp</th>
	// 						<th onClick={() => handleSort('lastname')}>Imię i nazwisko</th>

	// 						<th onClick={() => handleSort('profession')}>Zawód</th>
	// 						<th onClick={() => handleSort('class')}>Klasa</th>
	// 						<th onClick={() => handleSort('quizID')}>Arkusz</th>
	// 						<th onClick={() => handleSort('quizResult')}>Wynik</th>
	// 						<th onClick={() => handleSort('percentResult')}>Procent</th>
	// 						<th></th>
	// 					</tr>
	// 				</thead>
	// 				<tbody>
	// 					{currentUsers.map((user, index) => (
	// 						<tr key={index} onClick={() => handleRowClick(user)}>
	// 							<td>
	// 								{lpSortDirection === 'asc'
	// 									? (currentPage - 1) * usersPerPage + index + 1
	// 									: filteredUsers.length -
	// 									  ((currentPage - 1) * usersPerPage + index)}
	// 							</td>
	// 							<td>
	// 								{user.firstname} {user.lastname}
	// 							</td>
	// 							<td>{user.profession}</td>
	// 							<td>{user.class}</td>
	// 							<td>{user.quizID}</td>
	// 							<td>{user.quizResult}</td>
	// 							<td
	// 								className={
	// 									user.percentResult >= 50 ? 'text-success' : 'text-danger'
	// 								}
	// 							>
	// 								{user.percentResult}
	// 							</td>
	// 							<td>
	// 								<button
	// 									className='btn btn-light'
	// 									onClick={() => handlePrint(user)}
	// 								>
	// 									<FontAwesomeIcon icon='fa-solid fa-print' />
	// 								</button>
	// 								&nbsp;
	// 								<button
	// 									className='btn btn-light'
	// 									onClick={() => handlePDFraport(user)}
	// 									// onClick={() => handlePDFraport(selectedUser)}
	// 								>
	// 									<FontAwesomeIcon icon='fa-solid fa-file-pdf' />
	// 								</button>
	// 							</td>
	// 						</tr>
	// 					))}
	// 				</tbody>
	// 			</table>
	// 			<Pagination
	// 				usersPerPage={usersPerPage}
	// 				totalUsers={filteredUsers.length}
	// 				paginate={paginate}
	// 			/>
	// 			<div style={{ height: 50 }}></div>
	// 		</div>
	// 	);
	// };

	return (
		<div className='mt-4'>
			<div className='row d-flex align-items-center'>
				<div className='col-12 d-flex justify-content-center text-primary fs-5'>
					Raporty według arkuszy
				</div>
			</div>
			<div className='table-responsive'>
				<table className='table table-striped caption-top'>
					<thead>
						<tr>
							<th>lp</th>
							<th>Numer arkusza</th>
							<th>Kwalifikacja</th>
							<th>Klasa</th>
							<th>Data egzaminu</th>
							<th>Zawód</th>
							<th>
								<div className='col-2'>Liczba zdających</div>
							</th>
							<th>
								<div className='col-2'>Zaliczyli etap pisemny</div>
							</th>
							<th colSpan={2}>Wynik max</th>
							<th colSpan={2}>Wynik min</th>
							<th>Średni wynik</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{groupedUsersArray
							.filter(
								(group) =>
									group.users.length > 0 && group.quizID && group.examDate
							)
							.map((group, index) => (
								<React.Fragment key={index}>
									<tr
										onDoubleClick={() =>
											setOpen((prevOpen) => ({
												...prevOpen,
												[`${group.quizID}-${group.examDate}-${group.class}`]:
													!prevOpen[
														`${group.quizID}-${group.examDate}-${group.class}`
													],
											}))
										}
										className='align-middle'
									>
										<td>
											{lpSortDirection === 'asc'
												? (currentPage - 1) * usersPerPage + index + 1
												: filteredUsers.length -
												  ((currentPage - 1) * usersPerPage + index)}
										</td>
										<td className='text-success font-weight-bold'>
											{group.quizID}
										</td>
										<td></td>
										<td>{group.class}</td>
										<td>{group.examTerm}</td>
										<td className='font-weight-bold text-white bg-dark'>
											{group.profession}
										</td>
										<td className='text-center'>{group.count}</td>
										<td className='text-center'>{group.passed}</td>

										<td>{group.maxScore}</td>
										<td>{group.maxPerCent}%</td>
										<td>{group.minScore}</td>
										<td>{group.minPerCent}%</td>
										<td>{(group.totalScore / group.count).toFixed(2)}</td>

										<td>
											<button
												className='btn btn-light'
												// onClick={() => handlePrint(user)}
											>
												<FontAwesomeIcon icon='fa-solid fa-print' />
											</button>
											&nbsp;
											<button
												className='btn btn-light'
												onClick={() => generatePDF(group)}
												// onClick={() => handlePDFraport(selectedUser)}
											>
												<FontAwesomeIcon icon='fa-solid fa-file-pdf' />
											</button>
										</td>
									</tr>
									<tr>
										<td colSpan={7}>
											<Collapse
												in={
													open[
														`${group.quizID}-${group.examDate}-${group.class}`
													]
												}
											>
												<div>
													{group.users.map((user, index) => (
														<div
															className={`alert alert-${
																user.percentResult >= 50 ? 'success' : 'danger'
															}`}
															key={index}
														>
															{index + 1}) {user.firstname} {user.lastname}
															{'  '}
															<div className='vr'></div> {user.quizResult}pkt
															{'  '}
															<div className='vr'></div> {user.percentResult}%
															{'  '}
															<button
																className='btn btn-light'
																// onClick={() => handlePrint(user)}
															>
																<FontAwesomeIcon icon='fa-solid fa-print' />
															</button>
															&nbsp;
															<button
																className='btn btn-light'
																onClick={() => generatePDF(group)}
																// onClick={() => handlePDFraport(selectedUser)}
															>
																<FontAwesomeIcon icon='fa-solid fa-file-pdf' />
															</button>
														</div>
													))}
												</div>
											</Collapse>
										</td>
									</tr>
								</React.Fragment>
							))}
					</tbody>
				</table>
			</div>
			{/* ... other elements */}
		</div>
	);
};
export default ExamSheet;
