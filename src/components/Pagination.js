import React from 'react';

const Pagination = ({ usersPerPage, totalUsers, paginate }) => {
	const pageNumbers = [];

	for (let i = 1; i <= Math.ceil(totalUsers / usersPerPage); i++) {
		pageNumbers.push(i);
	}

	return (
		<div className='d-flex justify-content-center mt-3'>
			<nav>
				<ul className='pagination'>
					{pageNumbers.map((number) => (
						<li key={number} className='page-item'>
							<a onClick={() => paginate(number)} className='page-link'>
								{number}
							</a>
						</li>
					))}
				</ul>
			</nav>
		</div>
	);
};

export default Pagination;
