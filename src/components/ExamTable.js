import React, { useState, useEffect, useContext, useRef } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Editor } from '@tinymce/tinymce-react';
import ExamCreator from './ExamCreator';

const ExamTable = () => {
    const [showExamCreator, setShowExamCreator] = useState(false);

    const handleEditClick = () => {
        setShowExamCreator(true);
    };

    if (showExamCreator) {
        return <ExamCreator />;
    }


    return (
			<div className='mt-4'>
				<table class='table table-striped'>
					<thead>
						<tr>
							<th scope='col'>lp</th>
							<th scope='col'>nazwa</th>
							<th scope='col'>kod egzaminu</th>
							<th scope='col'>kwalifikacja</th>
							<th scope='col'>operacje</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<th scope='row'>1</th>
							<td>informatyk102023</td>
							<td>Wb9Yeu73</td>
							<td>INF-03</td>
							<td>
								<button
									type='button'
									class='btn btn-dark'
									// onClick={() => }
									onClick={handleEditClick}
								>
									Edytuj
								</button>
								&nbsp;
								<button type='button' class='btn btn-danger'>
									Usuń
								</button>
							</td>
						</tr>
						<tr>
							<th scope='row'>1</th>
							<td>informatyk102023</td>
							<td>Wb9Yeu73</td>
							<td>INF-03</td>
							<td>
								<button type='button' class='btn btn-dark'>
									Edytuj
								</button>
								&nbsp;
								<button type='button' class='btn btn-danger'>
									Usuń
								</button>
							</td>
						</tr>
						<tr>
							<th scope='row'>1</th>
							<td>informatyk102023</td>
							<td>Wb9Yeu73</td>
							<td>INF-03</td>
							<td>
								<button type='button' class='btn btn-dark'>
									Edytuj
								</button>
								&nbsp;
								<button type='button' class='btn btn-danger'>
									Usuń
								</button>
							</td>
						</tr>
					</tbody>
				</table>
				<div style={{ height: 50 }}></div>
			</div>
		);
};

export default ExamTable;
