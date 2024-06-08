import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Button, Badge, DropdownButton, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash, faUserCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import db from '../firebase';
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    addDoc,
} from 'firebase/firestore';
import ExitAlert from './ExitAlert';
import Pagination from './Pagination';

const ExamTable = () => {
    const [exams, setExams] = useState([]);
    const [editingExamId, setEditingExamId] = useState(null);
    const [editingAuthors, setEditingAuthors] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [professionsData, setProfessionsData] = useState({});
    const [qualificationName, setQualificationName] = useState({});
    const [showAlert, setShowAlert] = useState(false);
    const tableRef = useRef(null);
    const editingFieldRef = useRef(null);
    const isInsideEditingField = useRef(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [examsPerPage] = useState(10);

    const fetchExams = async () => {
        try {
            const q = query(collection(db, 'quizCode'));
            const querySnapshot = await getDocs(q);
            const examsData = querySnapshot.docs.map((doc, index) => ({
                id: doc.id,
                lp: index + 1,
                name: doc.id,
                quizCode: doc.data().quizCode,
                qualification: formatQualificationForDisplay(doc.data().Qualification),
                profession: doc.data().Profession,
                autors: doc.data().Autors || [],
            }));
            setExams(examsData);
        } catch (error) {
            console.error('Error fetching exams: ', error);
        }
    };

    const fetchUsers = async () => {
        const q = query(
            collection(db, 'users'),
            where('role', 'in', ['a', 'sa'])
        );
        const querySnapshot = await getDocs(q);
        const fetchedUsers = [];
        querySnapshot.forEach((doc) => {
            fetchedUsers.push({ id: doc.id, ...doc.data() });
        });
        setAvailableUsers(fetchedUsers);
    };

    const fetchProfessionsAndQualifications = async () => {
        try {
            const professionsSnapshot = await getDocs(collection(db, 'professions'));
            const professionsData = {};
            professionsSnapshot.forEach((doc) => {
                professionsData[doc.id] = doc.data();
            });
            setProfessionsData(professionsData);

            const qualificationsSnapshot = await getDocs(collection(db, 'qualificationName'));
            const qualificationData = {};
            qualificationsSnapshot.forEach((doc) => {
                qualificationData[doc.id] = doc.data();
            });
            setQualificationName(qualificationData);
        } catch (error) {
            console.error('Error fetching professions and qualifications: ', error);
        }
    };

    useEffect(() => {
        fetchExams();
        fetchUsers();
        fetchProfessionsAndQualifications();
    }, []);

    const handleFieldClick = async (examId, authors, field) => {
        if (editingExamId !== null) {
            await handleBlur();
        }

        setEditingExamId(examId);
        setEditingField(field);
        setEditingAuthors(
            authors.map((author, index) => {
                const [firstname, lastname] = author.split(' ');
                return { id: index === 0 ? 'main' : `${firstname} ${lastname}`, firstname, lastname };
            })
        );
    };

    const handleSelectUser = (userId) => {
        const user = availableUsers.find((user) => user.id === userId);
        if (user && !editingAuthors.some((author) => author.id === userId)) {
            setEditingAuthors((prevSelected) => [...prevSelected, { ...user, id: userId }]);
        }
    };

    const handleRemoveUser = (userId) => {
        if (userId !== 'main') {
            setEditingAuthors((prevSelected) =>
                prevSelected.filter((user) => user.id !== userId)
            );
        }
    };

    const handleBlur = async () => {
        if (editingExamId !== null && editingField === 'authors') {
            try {
                const examDocRef = doc(db, 'quizCode', editingExamId);
                const authorNames = editingAuthors.map(
                    (user) => `${user.firstname} ${user.lastname}`
                );
                await updateDoc(examDocRef, { Autors: authorNames });
                const updatedExams = exams.map((exam) =>
                    exam.id === editingExamId ? { ...exam, autors: authorNames } : exam
                );
                setExams(updatedExams);
            } catch (error) {
                console.error('Error updating authors: ', error);
            }
        }
        setEditingExamId(null);
        setEditingField(null);
    };

    const handleClickOutside = async (event) => {
        if (
            editingFieldRef.current &&
            !editingFieldRef.current.contains(event.target) &&
            !event.target.closest('.dropdown-menu') &&
            !event.target.closest('.dropdown-toggle')
        ) {
            await handleBlur();
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingExamId, editingAuthors]);

    const handleBadgeClick = (user) => {
        if (user.id === 'main') {
            setShowAlert(true);
        } else {
            handleRemoveUser(user.id);
        }
    };

    const handleDuplicate = async (exam) => {
        try {
            const examCopy = { ...exam, name: `${exam.name}_copy` };
            delete examCopy.id;
            await addDoc(collection(db, 'quizCode'), examCopy);
            fetchExams(); // Re-fetch the exams to update the list
        } catch (error) {
            console.error('Error duplicating exam: ', error);
        }
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const handleProfessionChange = async (examId, newProfession) => {
        const newQualifications = Object.keys(qualificationName).filter(
            (qualification) =>
                qualificationName[qualification].professions.includes(newProfession)
        );
        const formattedQualification = newQualifications[0];
        await updateDoc(doc(db, 'quizCode', examId), { Profession: newProfession, Qualification: formattedQualification });
        const updatedExams = exams.map((exam) =>
            exam.id === examId ? { ...exam, profession: newProfession, qualification: formattedQualification } : exam
        );
        setExams(updatedExams);
    };

    const handleQualificationChange = async (examId, newQualification) => {
        const formattedQualification = formatQualificationForStorage(newQualification);
        await updateDoc(doc(db, 'quizCode', examId), { Qualification: formattedQualification });
        const updatedExams = exams.map((exam) =>
            exam.id === examId ? { ...exam, qualification: formattedQualification } : exam
        );
        setExams(updatedExams);
    };

    const formatQualificationForDisplay = (qualification) => {
        const match = qualification.match(/([a-z]+)(\d+)/i);
        return match ? `${match[1].toUpperCase()}.${match[2]}` : qualification;
    };

    const formatQualificationForStorage = (qualification) => {
        return qualification.toLowerCase().replace('.', '');
    };

    const indexOfLastExam = currentPage * examsPerPage;
    const indexOfFirstExam = indexOfLastExam - examsPerPage;
    const currentExams = exams.slice(indexOfFirstExam, indexOfLastExam);

    return (
        <div className='mt-4' ref={tableRef}>
            <table className='table table-striped'>
                <thead>
                    <tr>
                        <th>lp</th>
                        <th>Kod egzaminu</th>
                        <th>Kwalifikacja</th>
                        <th>Zawód</th>
                        <th>Osoby z prawem edycji</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentExams.map((exam) => (
                        <tr key={exam.id} className='align-middle'>
                            <td className='align-middle'>{exam.lp}</td>
                            <td className='align-middle'>{exam.name}</td>
                            <td className='align-middle' style={{ width: '20%' }}
                                onClick={(e) => {
                                    if (!isInsideEditingField.current) {
                                        handleFieldClick(exam.id, exam.autors, 'qualification');
                                    }
                                }}
                                ref={editingExamId === exam.id && editingField === 'qualification' ? editingFieldRef : null}
                            >
                                {editingExamId === exam.id && editingField === 'qualification' ? (
                                    <div>
                                        <DropdownButton
                                            title={formatQualificationForDisplay(exam.qualification)}
                                            onSelect={(e) => handleQualificationChange(exam.id, e)}
                                            onMouseEnter={() => isInsideEditingField.current = true}
                                            onMouseLeave={() => isInsideEditingField.current = false}
                                        >
                                            {Object.keys(qualificationName)
                                                .filter(
                                                    (key) =>
                                                        qualificationName[key].professions.includes(exam.profession)
                                                )
                                                .map((key) => (
                                                    <Dropdown.Item key={key} eventKey={key}>
                                                        {formatQualificationForDisplay(key)}
                                                    </Dropdown.Item>
                                                ))}
                                        </DropdownButton>
                                    </div>
                                ) : (
                                    formatQualificationForDisplay(exam.qualification)
                                )}
                            </td>
                            <td className='align-middle' style={{ width: '20%' }}
                                onClick={(e) => {
                                    if (!isInsideEditingField.current) {
                                        handleFieldClick(exam.id, exam.autors, 'profession');
                                    }
                                }}
                                ref={editingExamId === exam.id && editingField === 'profession' ? editingFieldRef : null}
                            >
                                {editingExamId === exam.id && editingField === 'profession' ? (
                                    <div>
                                        <DropdownButton
                                            title={exam.profession}
                                            onSelect={(e) => handleProfessionChange(exam.id, e)}
                                            onMouseEnter={() => isInsideEditingField.current = true}
                                            onMouseLeave={() => isInsideEditingField.current = false}
                                        >
                                            {Object.keys(professionsData).map((profession) => (
                                                <Dropdown.Item key={profession} eventKey={profession}>
                                                    {profession}
                                                </Dropdown.Item>
                                            ))}
                                        </DropdownButton>
                                    </div>
                                ) : (
                                    exam.profession
                                )}
                            </td>
                            <td
                                className='align-middle'
                                onClick={(e) => {
                                    if (!isInsideEditingField.current) {
                                        handleFieldClick(exam.id, exam.autors, 'authors');
                                    }
                                }}
                                ref={editingExamId === exam.id && editingField === 'authors' ? editingFieldRef : null}
                            >
                                {editingExamId === exam.id && editingField === 'authors' ? (
                                    <div>
                                        <div>
                                            {editingAuthors.map((user, index) => (
                                                <Badge
                                                    key={index}
                                                    pill
                                                    bg='primary'
                                                    className='me-2'
                                                    onClick={() => handleBadgeClick(user)}
                                                    style={{ cursor: 'pointer' }}
                                                    onMouseEnter={() => isInsideEditingField.current = true}
                                                    onMouseLeave={() => isInsideEditingField.current = false}
                                                >
                                                    <FontAwesomeIcon icon={faUserCircle} /> {user.firstname} {user.lastname}
                                                </Badge>
                                            ))}
                                        </div><br />
                                        <DropdownButton
                                            title="Wybierz użytkownika"
                                            onSelect={(e) => handleSelectUser(e)}
                                            onMouseEnter={() => isInsideEditingField.current = true}
                                            onMouseLeave={() => isInsideEditingField.current = false}
                                        >
                                            {availableUsers
                                                .filter((user) =>
                                                    !editingAuthors.some(
                                                        (author) => `${author.firstname} ${author.lastname}` === `${user.firstname} ${user.lastname}`
                                                    )
                                                )
                                                .map((user) => (
                                                    <Dropdown.Item key={user.id} eventKey={user.id}>
                                                        {`${user.firstname} ${user.lastname}`}
                                                    </Dropdown.Item>
                                                ))}
                                        </DropdownButton>
                                    </div>
                                ) : (
                                    exam.autors.map((author, index) => (
                                        <div key={index}>
                                            {author}
                                            <br />
                                        </div>
                                    ))
                                )}
                            </td>
                            <td className='align-middle'>
                                <Button variant='primary' className='me-2'>
                                    <FontAwesomeIcon icon={faPencilAlt} />
                                </Button>
                                <Button variant='danger' className='me-2'>
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                                <Button variant='warning' onClick={() => handleDuplicate(exam)}>
                                    <FontAwesomeIcon icon={faCopy} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Pagination
                usersPerPage={examsPerPage}
                totalUsers={exams.length}
                paginate={paginate}
            />
            <div style={{ height: 50 }}></div>
            <ExitAlert
                header="Uwaga"
                message="Nie można edytować głównego autora arkusza egzaminacyjnego"
                show={showAlert}
                onClose={() => setShowAlert(false)}
                buttons='Ok'
            />
        </div>
    );
};

export default ExamTable;
