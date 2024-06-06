import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Editor } from '@tinymce/tinymce-react';
import ExamCreator from './ExamCreator';
import { Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
import db from '../firebase';
import {
	collection,
	getDocs,
	query,
	where,
	getDoc,
	doc,
} from 'firebase/firestore';

const ExamTable = () => {
	const [showExamCreator, setShowExamCreator] = useState(false);
	const [exams, setExams] = useState([]);
	const [userRole, setUserRole] = useState('');
	const [userName, setUserName] = useState('');

	useEffect(() => {
		const fetchExams = async () => {
			try {
				console.log(db); // Check the db object
				const q = query(collection(db, 'quizCode')); // Use the correct collection name
				const querySnapshot = await getDocs(q);
				console.log(querySnapshot.docs); // Log the documents fetched
				const examsData = querySnapshot.docs.map((doc, index) => ({
					id: doc.id,
					lp: index + 1,
					name: doc.id, // Use document ID for "Nazwa"
					quizCode: doc.data().quizCode,
					qualification: doc
						.data()
						.Qualification.toUpperCase()
						.replace(/(\d+)/, '-$1'),
					profession: doc.data().Profession,
					autors: doc.data().Autors || [], // Ensure autors is an array
				}));
				setExams(examsData);
			} catch (error) {
				console.error('Error fetching exams: ', error);
			}
		};

		fetchExams();
	}, []);

	return (
		<div className='mt-4'>
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
							<td className='align-middle'>
								{exam.autors.map((author, index) => (
									<div key={index}>
										{author}
										<br />
									</div>
								))}
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
