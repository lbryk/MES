import React from 'react';
import ckeLogo from '../cke.png';

const Footer = () => {
	return (
		<div className='footer'>
			<div className='row'>
				<div className='col-lg-12 cke'>
					<h6>
						Wykorzystano schemat kolorystyczny z egzaminów
						<img className='logoCodenight' src={ckeLogo} />
					</h6>
				</div>
				<div className='col-lg-12 version'>
					<small>WERSJA 1.0.1</small>
				</div>
				<div className='col-lg-12 foot'>
					<small>
						PROJEKT POWSTAŁ W CELACH EDUKACYJNYCH NA PODSTAWIE AUTONOMICZNEGO SYSTEMU EGZAMINACYJNEGO.
					</small>
				</div>
			</div>
		</div>
	);
};

export default Footer;
