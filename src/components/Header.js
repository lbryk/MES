import React, { useContext, useState } from 'react';
import logoASE from '../ase_mini.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import AppContext from './AppContext';
import ExitAlert from './ExitAlert';
library.add(faCircleQuestion);

const Header = () => {
	const { userName, setUserName } = useContext(AppContext);
	const navigate = useNavigate();
	const [showAlert, setShowAlert] = useState(false);
	const handleAlert = () => {
		setShowAlert(true);
	};

	const closeAlert = () => {
		setShowAlert(false);
	};
	const handleLogout = () => {
		setShowAlert(true);
	};

	return (
		<div>
			<div className='row header'>
				<div className='col-lg-1 col-md-12'>
					<img className='logoCodenight' src={logoASE} />
				</div>
				<div className='col-lg-5 col-md-12 aseHeader'>
					Autonomiczny System Egzaminacyjny
				</div>
				<div className='col-3 header-right '>
					<Link
						target='_blank'
						to='https://exam.codenight.pl/instruction-exam.pdf'
					>
						<FontAwesomeIcon
							className='help'
							icon='fa-solid fa-circle-question'
						/>

						<span className='light-green'>&nbsp;Instrukcja obsługi</span>
					</Link>
				</div>
				<div className='col-3 loggedInUser'>
					<div className='row col-12 usernameDisplay'>
						<div className='headerLogin'>
							<strong>Zdający:</strong> {userName}
						</div>
					</div>
					<div className='row col-12 logOut' onClick={handleLogout}>
						Wyloguj z systemu
					</div>
					<ExitAlert
						message='Czy na pewno chcesz zakończyć egzamin? Nie będziesz już mógł zmienić odpowiedzi'
						show={showAlert}
						onClose={closeAlert}
					/>
				</div>
			</div>
		</div>
	);
};

export default Header;

