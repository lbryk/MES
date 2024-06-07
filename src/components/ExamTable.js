import React, { useState, useEffect, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Button, Dropdown, DropdownButton, Badge } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrash, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import db from '../firebase';
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
} from 'firebase/firestore';
import ExitAlert from './ExitAlert';

const ExamTable = () => {
    const [exams, setExams] = useState([]);
    const [editingExamId, setEditingExamId] = useState(null);
    const [editingAuthors, setEditingAuthors] = useState([]);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [showAlert, setShowAlert] = useState(false);
    const tableRef = useRef(null);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const q = query(collection(db, 'quizCode'));
                const querySnapshot = await getDocs(q);
                const examsData = querySnapshot.docs.map((doc, index) => ({
                    id: doc.id,
                    lp: index + 1,
                    name: doc.id,
                    quizCode: doc.data().quizCode,
                    qualification: doc
                        .data()
                        .Qualification.toUpperCase()
                        .replace(/(\d+)/, '-$1'),
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

        fetchExams();
        fetchUsers();
    }, []);

    const handleDoubleClick = (examId, authors) => {
        setEditingExamId(examId);
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
        if (editingExamId !== null) {
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
            } finally {
                setEditingExamId(null);
            }
        }
    };

    const handleClickOutside = async (event) => {
        if (
            tableRef.current &&
            !tableRef.current.contains(event.target)
        ) {
            await handleBlur();
        }
    };

    const handleBadgeClick = (user) => {
        if (user.id === 'main') {
            setShowAlert(true);
        } else {
            handleRemoveUser(user.id);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [editingExamId, editingAuthors]);

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
                    {exams.map((exam) => (
                        <tr key={exam.id} className='align-middle'>
                            <td className='align-middle'>{exam.lp}</td>
                            <td className='align-middle'>{exam.name}</td>
                            <td className='align-middle'>{exam.qualification}</td>
                            <td className='align-middle'>{exam.profession}</td>
                            <td
                                className='align-middle'
                                onDoubleClick={() => handleDoubleClick(exam.id, exam.autors)}
                            >
                                {editingExamId === exam.id ? (
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
                                                >
                                                    <FontAwesomeIcon icon={faUserCircle} /> {user.firstname} {user.lastname}
                                                </Badge>
                                            ))}
                                        </div>
                                        <DropdownButton
                                            id="dropdown-basic-button"
                                            title="Wybierz użytkownika"
                                            onSelect={(userId) => handleSelectUser(userId)}
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
                                <Button variant='danger'>
                                    <FontAwesomeIcon icon={faTrash} />
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
