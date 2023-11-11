import React from 'react';

const WindowConfirm = ({ isOpen, onClose, onConfirm, title, windowText }) => {
	if (!isOpen) {
		return null;
	}

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: 'rgba(0, 0, 0, 0.2)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				zIndex: 999,
			}}
		>
			<div
				style={{
					backgroundColor: '#fff',
					padding: '20px',
					borderRadius: '5px',
					width: '80%',
					maxWidth: '500px',
				}}
			>
				<h2>{title}</h2>
				<hr />
				<p>{windowText}</p>
				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						// gap: '10px',
					}}
				>
					<button
						className='custom-alert-button custom-alert-close'
						onClick={onConfirm}
					>
						Tak
					</button>
					<button className='custom-alert-button' onClick={onClose}>
						Nie
					</button>
				</div>
			</div>
		</div>
	);
};

export default WindowConfirm;
