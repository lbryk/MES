import React from 'react';
import logoASE from '../ase.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faCircleQuestion } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

library.add(faCircleQuestion);

const Header = () => {
	return (
		<div>
			<div className='row header'>
				<div className='col-lg-5 col-md-12'>
					<img className='logoCodenight' src={logoASE} />
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
				<div className='col-4 loggedInUser'>
					<div className='row col-12 usernameDisplay'>
						<span className='headerLogin'><strong>Zdający:</strong> fsdfsfdf sfdfsf</span>
					</div>
					<div className='row col-12'>Wyloguj z systemu</div>
				</div>
			</div>
		</div>
	);
};

export default Header;
