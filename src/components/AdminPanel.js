import React, { useState, useEffect, useContext } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import ExamCreator from './ExamCreator';
import ExamTable from './ExamTable';
import Footer from './Footer';
import ShowUser from './ShowUser';
import RaportExam from './RaportExam';
import AdminHeader from './AdminHeader';
import AppContext from './AppContext';
import { useNavigate } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
	collection,
	getDocs,
	doc,
	updateDoc,
	deleteDoc,
} from 'firebase/firestore';
import db from '../firebase';

const AdminPanel = () => {
	const checkLogin = useNavigate();
	const [quizCodesData, setQuizCodesData] = useState({});
	const { userName, setUserName } = useContext(AppContext);
	if (userName == '') {
		checkLogin(`/login`);
	}
	
	useEffect(() => {
		const fetchQuizCodes = async () => {
			const querySnapshot = await getDocs(collection(db, 'quizCode'));
			const codesData = {};
			querySnapshot.docs.forEach((doc) => {
				codesData[doc.id] = doc.data();
			});
			setQuizCodesData(codesData);
		};
		fetchQuizCodes();
	}, []);

	const [professionsData, setProfessionsData] = useState({});

	useEffect(() => {
		const fetchProfessions = async () => {
			const querySnapshot = await getDocs(collection(db, 'professions'));
			const professions = {};
			querySnapshot.docs.forEach((doc) => {
				professions[doc.id] = doc.data();
			});
			setProfessionsData(professions);
		};
		fetchProfessions();
	}, []);

	const [qualificationNameData, setQualificationNameData] = useState({});

	useEffect(() => {
		const fetchqualificationNameData = async () => {
			const querySnapshot = await getDocs(collection(db, 'qualificationName'));
			const qualificationName = {};
			querySnapshot.docs.forEach((doc) => {
				qualificationName[doc.id] = doc.data();
			});
			setQualificationNameData(qualificationName);
		};
		fetchqualificationNameData();
	}, []);

	return (
		<div>
			<AdminHeader />
			<div className='container'>
				<nav className='mt-4'>
					<div className='nav nav-tabs' id='nav-tab' role='tablist'>
						<button
							className='nav-link active'
							id='nav-users-tab'
							data-bs-toggle='tab'
							data-bs-target='#users'
							type='button'
							role='tab'
							aria-controls='users'
							aria-selected='true'
						>
							Lista zdających
						</button>
						<button
							className='nav-link'
							id='nav-exam-list-tab'
							data-bs-toggle='tab'
							data-bs-target='#nav-exam-list'
							type='button'
							role='tab'
							aria-controls='nav-exam-list'
							aria-selected='false'
						>
							Lista egzaminów
						</button>
						<button
							className='nav-link'
							id='nav-raports-tab'
							data-bs-toggle='tab'
							data-bs-target='#nav-raports'
							type='button'
							role='tab'
							aria-controls='nav-raports'
							aria-selected='false'
						>
							Raporty
						</button>
						<button
							className='nav-link'
							id='nav-exam-maker-tab'
							data-bs-toggle='tab'
							data-bs-target='#nav-exam-maker'
							type='button'
							role='tab'
							aria-controls='nav-exam-maker'
							aria-selected='false'
						>
							Kreator egzaminów
						</button>
						<button
							className='nav-link'
							id='nav-settings-tab'
							data-bs-toggle='tab'
							data-bs-target='#nav-settings'
							type='button'
							role='tab'
							aria-controls='nav-settings'
							aria-selected='false'
						>
							Ustawienia oprogramowania
						</button>
					</div>
				</nav>
				<div className='tab-content' id='nav-tabContent'>
					<div
						className='tab-pane fade show active'
						id='users'
						role='tabpanel'
						aria-labelledby='nav-users-tab'
						tabindex='0'
					>
						<ShowUser />
					</div>
					<div
						className='tab-pane fade'
						id='nav-exam-list'
						role='tabpanel'
						aria-labelledby='nav-exam-list-tab'
						tabindex='0'
					>
						Componet 2
					</div>
					<div
						className='tab-pane fade'
						id='nav-raports'
						role='tabpanel'
						aria-labelledby='nav-raports-tab'
						tabindex='0'
					>
						<RaportExam
							quizCodesData={quizCodesData}
							professionsData={professionsData}
						/>
					</div>
					<div
						className='tab-pane fade'
						id='nav-exam-maker'
						role='tabpanel'
						aria-labelledby='nav-exam-maker'
						tabindex='0'
					>
						<div className='mt-4'>
							<ul className='nav nav-pills mb-3' id='pills-tab' role='tablist'>
								<li className='nav-item' role='presentation'>
									<button
										className='nav-link active'
										id='pills-home-tab'
										data-bs-toggle='pill'
										data-bs-target='#pills-home'
										type='button'
										role='tab'
										aria-controls='pills-home'
										aria-selected='true'
									>
										Twórz nowy egzamin
									</button>
								</li>
								<li className='nav-item' role='presentation'>
									<button
										className='nav-link'
										id='edit-exam-tab'
										data-bs-toggle='pill'
										data-bs-target='#edit-exam'
										type='button'
										role='tab'
										aria-controls='edit-exam'
										aria-selected='false'
									>
										Edytuj istniejący egzamin
									</button>
								</li>
								<li className='nav-item' role='presentation'>
									<button
										className='nav-link'
										id='pills-contact-tab'
										data-bs-toggle='pill'
										data-bs-target='#pills-contact'
										type='button'
										role='tab'
										aria-controls='pills-contact'
										aria-selected='false'
									>
										Contact
									</button>
								</li>
							</ul>
							<div className='tab-content' id='pills-tabContent'>
								<div
									className='tab-pane fade show active'
									id='pills-home'
									role='tabpanel'
									aria-labelledby='pills-home-tab'
								>
									<ExamCreator
										quizCodesData={quizCodesData}
										professionsData={professionsData}
										qualificationName={qualificationNameData}
									/>
								</div>
								<div
									className='tab-pane fade'
									id='edit-exam'
									role='tabpanel'
									aria-labelledby='edit-exam-tab'
								>
									<ExamTable />
								</div>
								<div
									className='tab-pane fade'
									id='pills-contact'
									role='tabpanel'
									aria-labelledby='pills-contact-tab'
								>
									...
								</div>
							</div>
						</div>
					</div>
					<div
						className='tab-pane fade'
						id='nav-settings'
						role='tabpanel'
						aria-labelledby='nav-settings-tab'
						tabindex='0'
					>
						Autor programu: Łukasz Bryk
					</div>
				</div>
				<div>
					<ToastContainer />
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default AdminPanel;
