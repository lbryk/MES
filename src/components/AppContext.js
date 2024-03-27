import { createContext } from 'react';

const AppContext = createContext({
	userName: '',
	setUserName: () => {},
});

export default AppContext;
// import React from 'react';

// const AppContext = React.createContext();

// export default AppContext;