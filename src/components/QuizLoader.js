import { useState, useEffect } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import {db} from '../firebase';

const QuizLoader = ({ keyExam }) => {
	const [quizData, setQuizData] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	const fetchQuiz = async () => {
		setIsLoading(true);
		const quizCollection = collection(db, `${keyExam}`);
		const q = query(quizCollection);
		const querySnapshot = await getDocs(q);
		
		querySnapshot.forEach((doc) => {
			quizData.push({ id: doc.id, ...doc.data() });
		});

		setIsLoading(false);
	};

	useEffect(() => {
		fetchQuiz();
	}, [keyExam]);

	return { quizData, isLoading };
};

export default QuizLoader;
