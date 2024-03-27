import React, { useContext, useEffect, useState } from 'react';
import './App.css';
import AppContext from './components/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faRightFromBracket } from '@fortawesome/free-solid-svg-icons';
import Header from './components/Header';
import Content from './components/Content';
import Footer from './components/Footer';

library.add(faRightFromBracket);

function App() {
	const finish = useNavigate();
	const {
		Qualification,
		setQualification,
		Year,
		setYear,
		Session,
		setSession,
		keyExam,
		setKeyExam,
		keyQualification,
		setKeyQualification,
		userName
	} = useContext(AppContext);

	return (
		<div>
			<div className='container'>
				<Header />
				<Content />
			</div>
			<Footer />
		</div>
	);
}

export default App;
