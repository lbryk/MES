import React, { useContext, useEffect } from 'react';
import './App.css';
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

	useEffect(() => {
		// Pobiera ścieżkę z SessionStorage
		const pathBeforeRefresh = sessionStorage.getItem('pathBeforeRefresh');

		if (pathBeforeRefresh) {
			// Przenosi do poprzedniej ścieżki
			finish(pathBeforeRefresh);

			// Usuwa zapisaną ścieżkę
			sessionStorage.removeItem('pathBeforeRefresh');
		}
	}, [finish]);
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
