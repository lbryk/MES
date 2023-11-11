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
					<small>WERSJA 2.11.10</small>
				</div>
				<div className='col-lg-12 foot'>
					<small>
						System próbnych egzaminów zawodowych
					</small>
				</div>
			</div>
		</div>
	);
};

export default Footer;
