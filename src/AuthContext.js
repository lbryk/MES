import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(
		() => JSON.parse(localStorage.getItem('user')) || null
	);

	useEffect(() => {
		// This effect persists the user to localStorage whenever the user state changes.
		localStorage.setItem('user', JSON.stringify(user));
	}, [user]);

	const login = (userData) => {
		setUser(userData);
	};

	const logout = () => {
		setUser(null);
		localStorage.removeItem('user');
	};

	const value = { user, login, logout };

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
