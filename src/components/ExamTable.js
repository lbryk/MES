import React, { useState, useEffect, useRef, useContext } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle';
import { Button, Badge, DropdownButton, Dropdown, Collapse } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPencilAlt, faTrashCan, faUserCircle, faCopy } from '@fortawesome/free-solid-svg-icons';
import db from '../firebase';
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    updateDoc,
    deleteDoc,
    getDoc,
    setDoc,
    arrayUnion,
} from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ExitAlert from './ExitAlert';
import Pagination from './Pagination';
import AppContext from './AppContext';
import WindowConfirm from './WindowConfirm';

const ExamTable = ({ refreshKey, onExamCreated }) => {
    const [exams, setExams] = useState([]);
    const [sortField, setSortField] = useState(null);
    const [sortDirection, setSortDirection] = useState('asc');
    const [editingExamId, setEditingExamId] = useState(null);
    const [editingAuthors, setEditingAuthors] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [professionsData, setProfessionsData] = useState({});
    const [qualificationName, setQualificationName] = useState({});
    const [showAlert, setShowAlert] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [updateKey, setUpdateKey] = useState(0);
    const [newExamIds, setNewExamIds] = useState([]);
    const [expandedExams, setExpandedExams] = useState({}); // Dodano stan dla rozwiniętych egzaminów
    const tableRef = useRef(null);
    const editingFieldRef = useRef(null);
    const isInsideEditingField = useRef(false);
    const { userName, currentUser } = useContext(AppContext);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedExam, setSelectedExam] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [examsPerPage] = useState(10);

    const fetchUserRole = async () => {
        try {
            const userDoc = await getDoc(doc(db, 'users', currentUser));
            if (userDoc.exists()) {
                setUserRole(userDoc.data().role);
            }
        } catch (error) {
            console.error('Error fetching user role: ', error);
        }
    };

    const fetchExams = async () => {
        try {
            const q = query(collection(db, 'quizCode'));
            const querySnapshot = await getDocs(q);
            const examsData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                name: doc.id,
                qualification: formatQualificationForDisplay(doc.data().Qualification),
                profession: doc.data().Profession,
                year: doc.data().Year,
                session: doc.data().Session,
                autors: doc.data().Autors || [],
            }));

            let filteredExams;
            if (userRole === 'sa') {
                filteredExams = examsData;
            } else {
                filteredExams = examsData.filter(exam =>
                    exam.autors.includes(userName) || exam.qualification.toLowerCase().includes('test')
                );
            }
            setExams(filteredExams);
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
        fetchUserRole();
    }, [currentUser]);

    useEffect(() => {
        if (userRole) {
            fetchExams();
            fetchUsers();
            fetchProfessionsAndQualifications();
        }
    }, [userRole, userName, updateKey, refreshKey]);

    useEffect(() => {
        let sortedExams = [...exams];
        if (sortField !== null) {
            sortedExams.sort((a, b) => {
                if (a[sortField] < b[sortField]) {
                    return sortDirection === 'asc' ? -1 : 1;
                }
                if (a[sortField] > b[sortField]) {
                    return sortDirection === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        setExams(sortedExams);
    }, [sortField, sortDirection]);

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
            const generateCode = () => {
                let code = '';
                const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
                for (let i = 0; i < 8; i++) {
                    code += characters.charAt(Math.floor(Math.random() * characters.length));
                }
                return code;
            };

            const newCode = generateCode();
            const sessionsDocRef = doc(db, 'sessions', 'all');
            let sessionsDocSnap = await getDoc(sessionsDocRef);

            if (!sessionsDocSnap.exists()) {
                await setDoc(sessionsDocRef, { sessions: [] });
                sessionsDocSnap = await getDoc(sessionsDocRef);
            }

            let existingSessions = sessionsDocSnap.data().sessions || [];
            let newSession = 'A1';
            let i = 0, j = 1, k = 1, l = 1;

            while (existingSessions.includes(newSession)) {
                j++;
                if (j > 9) {
                    j = 1;
                    i++;
                    if (i > 25) {
                        i = 0;
                        k++;
                        if (k > 9) {
                            k = 1;
                            l++;
                        }
                    }
                }
                newSession = `${String.fromCharCode(65 + i)}${j}`;
                if (l > 1) {
                    newSession = `${String.fromCharCode(65 + l - 2)}${k}${newSession}`;
                }
            }

            await updateDoc(sessionsDocRef, { sessions: arrayUnion(newSession) });

            const examCopy = {
                Qualification: exam.qualification.toLowerCase().replace('.', ''),
                Session: newSession,
                Year: exam.year,
                Profession: exam.profession,
                Autors: exam.autors
            };

            await setDoc(doc(db, 'quizCode', newCode), examCopy);

            const oldCollectionName = `${exam.qualification.toLowerCase().replace('.', '')}${exam.year}${exam.session}`;
            const newCollectionName = `${exam.qualification.toLowerCase().replace('.', '')}${exam.year}${newSession}`;

            const oldCollectionRef = collection(db, oldCollectionName);
            const newCollectionRef = collection(db, newCollectionName);

            const oldDocsSnapshot = await getDocs(oldCollectionRef);

            const duplicateDocsPromises = oldDocsSnapshot.docs.map(async (docSnapshot) => {
                await setDoc(doc(newCollectionRef, docSnapshot.id), docSnapshot.data());
            });

            await Promise.all(duplicateDocsPromises);

            setNewExamIds((prevIds) => [...prevIds, newCode]);
            fetchExams(); // Re-fetch the exams to update the list
            toast.success(`Egzamin został pomyślnie zduplikowany: ${newCode}`);
        } catch (error) {
            console.error('Error duplicating exam: ', error);
            toast.error('Błąd podczas duplikowania egzaminu');
        }
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const renameCollection = async (oldCollectionName, newCollectionName) => {
        try {
            const oldCollectionRef = collection(db, oldCollectionName);
            const newCollectionRef = collection(db, newCollectionName);

            const oldDocsSnapshot = await getDocs(oldCollectionRef);

            const moveDocPromises = oldDocsSnapshot.docs.map(async (docSnapshot) => {
                await setDoc(doc(newCollectionRef, docSnapshot.id), docSnapshot.data());
                await deleteDoc(docSnapshot.ref);
            });

            await Promise.all(moveDocPromises);
        } catch (error) {
            console.error('Error renaming collection: ', error);
        }
    };

    const renameCollectionAndUpdateDoc = async (examId, exam, newQualification, newProfession) => {
        const formattedOldQualification = formatQualificationForStorage(exam.qualification);
        const formattedNewQualification = formatQualificationForStorage(newQualification);
        const oldCollectionName = `${formattedOldQualification}${exam.year}${exam.session}`;
        const newCollectionName = `${formattedNewQualification}${exam.year}${exam.session}`;

        if (oldCollectionName !== newCollectionName) {
            await renameCollection(oldCollectionName, newCollectionName);
        }

        await updateDoc(doc(db, 'quizCode', examId), {
            Qualification: formattedNewQualification,
            Profession: newProfession
        });

        setUpdateKey(prevKey => prevKey + 1);

    };

    const handleQualificationChange = async (examId, newQualification) => {
        const exam = exams.find(e => e.id === examId);
        const formattedQualification = formatQualificationForStorage(newQualification);

        const updatedExams = exams.map((exam) =>
            exam.id === examId ? { ...exam, qualification: formattedQualification } : exam
        );
        setExams(updatedExams);

        try {
            await renameCollectionAndUpdateDoc(examId, exam, newQualification, exam.profession);
        } catch (error) {
            const revertedExams = exams.map((exam) =>
                exam.id === examId ? { ...exam, qualification: formatQualificationForStorage(exam.qualification) } : exam
            );
            setExams(revertedExams);

            toast.error('Błąd podczas aktualizacji egzaminu', {
                autoClose: 5000,
            });
        }
    };

    const handleProfessionChange = async (examId, newProfession) => {
        const exam = exams.find(e => e.id === examId);
        const newQualifications = Object.keys(qualificationName).filter(
            (qualification) => qualificationName[qualification].professions.includes(newProfession)
        );
        const formattedQualification = newQualifications[0];

        const updatedExams = exams.map((exam) =>
            exam.id === examId ? { ...exam, profession: newProfession, qualification: formattedQualification } : exam
        );
        setExams(updatedExams);

        try {
            await renameCollectionAndUpdateDoc(examId, exam, formattedQualification, newProfession);
        } catch (error) {
            const revertedExams = exams.map((exam) =>
                exam.id === examId ? { ...exam, profession: exam.profession, qualification: formatQualificationForStorage(exam.qualification) } : exam
            );
            setExams(revertedExams);

            toast.error('Błąd podczas aktualizacji egzaminu', {
                autoClose: 5000,
            });
        }
    };

    const formatQualificationForDisplay = (qualification) => {
        const match = qualification.match(/([a-z]+)(\d+)/i);
        return match ? `${match[1].toUpperCase()}.${match[2]}` : qualification;
    };

    const formatQualificationForStorage = (qualification) => {
        return qualification.toLowerCase().replace('.', '');
    };

    const formatQualificationForDeletion = (qualification) => {
        return qualification.toLowerCase().replace('.', '');
    };

    const deleteExam = async (exam) => {
        const formattedQualification = formatQualificationForDeletion(exam.qualification);
        const examCollectionName = `${formattedQualification}${exam.year}${exam.session}`;
        try {
            await deleteDoc(doc(db, 'quizCode', exam.name));

            const examCollectionRef = collection(db, examCollectionName);
            const examDocsSnapshot = await getDocs(examCollectionRef);

            const docDeletionPromises = [];
            examDocsSnapshot.forEach((doc) => {
                docDeletionPromises.push(deleteDoc(doc.ref));
            });

            await Promise.all(docDeletionPromises);

            try {
                const collectionDocs = await getDocs(examCollectionRef);
                collectionDocs.forEach(async (doc) => {
                    await deleteDoc(doc.ref);
                });
                console.log(`Collection ${examCollectionName} cleared.`);
            } catch (error) {
                console.error(`Error clearing collection ${examCollectionName}: `, error);
            }

            const updatedExams = exams.filter((e) => e.id !== exam.id);
            setExams(updatedExams);

            toast.success(`Egzamin został pomyślnie usunięty ${examCollectionName}`, {
                autoClose: 2000,
                 onClose: () => {
                    onExamCreated(); // Wywołanie funkcji odświeżającej
                },
            });
        } catch (error) {
            toast.error('Błąd podczas usuwania egzaminu: ' + error.message, {
                autoClose: 5000,
            });
        }
    };

    const handleDeleteClick = (exam) => {
        setSelectedExam(exam);
        setModalIsOpen(true);
    };

    const handleSort = (field) => {
        let direction = 'asc';
        if (sortField === field && sortDirection === 'asc') {
            direction = 'desc';
        }
        setSortField(field);
        setSortDirection(direction);
    };

    const handleExamClick = async (exam) => {
        const expandedState = { ...expandedExams };
        if (expandedState[exam.id]) {
            expandedState[exam.id] = false;
        } else {
            const collectionName = `${exam.qualification.toLowerCase().replace('.', '')}${exam.year}${exam.session}`;
            const docsSnapshot = await getDocs(collection(db, collectionName));
            const docsData = docsSnapshot.docs.map(doc => doc.data());
            expandedState[exam.id] = docsData;
        }
        setExpandedExams(expandedState);
    };

    const indexOfLastExam = currentPage * examsPerPage;
    const indexOfFirstExam = indexOfLastExam - examsPerPage;
    const currentExams = exams.slice(indexOfFirstExam, indexOfLastExam);

    return (
        <div className='mt-4' ref={tableRef}>
            <ToastContainer />
            <table className='table table-striped'>
                <thead>
                    <tr>
                        <th onClick={() => handleSort('id')}>lp</th>
                        <th onClick={() => handleSort('name')}>Kod egzaminu</th>
                        <th onClick={() => handleSort('qualification')}>Kwalifikacja</th>
                        <th onClick={() => handleSort('profession')}>Zawód</th>
                        <th>Osoby z prawem edycji</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentExams.map((exam, index) => {
                        const isTestQualification = exam.qualification.toLowerCase().includes('test');
                        const isNewExam = newExamIds.includes(exam.id);
                        return (
                            <React.Fragment key={exam.id}>
                                <tr key={exam.id} className={`align-middle ${isTestQualification ? 'table-warning' : ''} ${isNewExam ? 'table-success' : ''}`}>
                                    <td className='align-middle'>{index + 1}</td>
                                    <td className='align-middle' onDoubleClick={() => handleExamClick(exam)}>
                                        {exam.name}
                                    </td>
                                    <td className='align-middle' style={{ width: '20%' }}
                                        onClick={(e) => {
                                            if (!isInsideEditingField.current && !isTestQualification) {
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
                                            if (!isInsideEditingField.current && !isTestQualification) {
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
                                        <Button variant='primary' className='me-2' onClick={() => handleExamClick(exam)}>
                                            <FontAwesomeIcon icon={faPencilAlt} />
                                        </Button>
                                        {!isTestQualification && (
                                            <Button variant='danger' className='me-2' onClick={() => handleDeleteClick(exam)}>
                                                <FontAwesomeIcon icon={faTrashCan} />
                                            </Button>
                                        )}
                                        <Button variant='warning' onClick={() => handleDuplicate(exam)}>
                                            <FontAwesomeIcon icon={faCopy} />
                                        </Button>
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan={6}>
                                        <Collapse in={expandedExams[exam.id]}>
                                            <div className='container-fluid'>
                                                {expandedExams[exam.id] && expandedExams[exam.id].map((doc, idx) => (
                                                    <div key={idx} className='alert alert-info'>
                                                        <strong>Pytanie {idx + 1}</strong><hr />
                                                        <div className='p-3 mb-2 bg-light text-dark rounded'>
                                                            <p><strong>Treść:</strong></p>
                                                            <p>{doc.question}</p>
                                                        </div>
                                                        <p><strong>a: </strong>
                                                            {doc.a}</p>
                                                        <p><strong>b: </strong>
                                                            {doc.b}</p>
                                                        <p><strong>c: </strong>
                                                            {doc.c}</p>
                                                        <p><strong>d: </strong>
                                                            {doc.d}</p>
                                                        <div className='p-3 mb-2 bg-dark text-white rounded'>
                                                            <p><strong>Poprawna odpowiedź: </strong>
                                                                {doc.answer}</p>
                                                        </div>
                                                        <Button variant='primary'>
                                                            <FontAwesomeIcon icon={faPencilAlt} />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>
                                        </Collapse>
                                    </td>
                                </tr>
                            </React.Fragment>
                        );
                    })}
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
            <WindowConfirm
                isOpen={modalIsOpen}
                onClose={() => setModalIsOpen(false)}
                title='Usuwanie egzaminu'
                windowText={selectedExam ? `Czy napewno chcesz usunąć egzamin: ${selectedExam.name}?` : ''}
                onConfirm={() => {
                    setModalIsOpen(false);
                    if (selectedExam) deleteExam(selectedExam);
                }}
            />
        </div>
    );
};

export default ExamTable;
