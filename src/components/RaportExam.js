import React from 'react';
import RaportUser from './RaportUsers.js';
import ExamSheet from './ExamSheet.js';

const RaportExam = ({quizCodesData}) => {
	
	return (
		<div>
			<ExamSheet quizCodesData={quizCodesData} />
			<RaportUser quizCodesData={quizCodesData} />
		</div>
	);
};

export default RaportExam;
