import React from 'react';

const WindowConfirm = ({ isOpen, onClose, onConfirm }) => {
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
				backgroundColor: 'rgba(0, 0, 0, 0.3)',
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
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
				<h2>Delete User</h2>
				<p>Are you sure you want to delete this user?</p>
				<button onClick={onConfirm}>Yes</button>
				<button onClick={onClose}>No</button>
			</div>
		</div>
	);
};

export default WindowConfirm;
