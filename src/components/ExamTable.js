import React, { useState, useEffect, useRef, useContext } from 'react';
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
    deleteDoc,
    getDoc,
    setDoc,
    addDoc
} from 'firebase/firestore';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ExitAlert from './ExitAlert';
import Pagination from './Pagination';
import AppContext from './AppContext';

const ExamTable = () => {
    const [exams, setExams] = useState([]);
    const [editingExamId, setEditingExamId] = useState(null);
    const [editingAuthors, setEditingAuthors] = useState([]);
    const [editingField, setEditingField] = useState(null);
    const [availableUsers, setAvailableUsers] = useState([]);
    const [professionsData, setProfessionsData] = useState({});
    const [qualificationName, setQualificationName] = useState({});
    const [showAlert, setShowAlert] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [updateKey, setUpdateKey] = useState(0); // Declare updateKey here
    const tableRef = useRef(null);
    const editingFieldRef = useRef(null);
    const isInsideEditingField = useRef(false);
    const { userName, currentUser } = useContext(AppContext);

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
                quizCode: doc.data().quizCode,
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
    }, [userRole, userName, updateKey]); // Add updateKey here

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

    const renameCollection = async (oldCollectionName, newCollectionName) => {
        try {
            const oldCollectionRef = collection(db, oldCollectionName);
            const newCollectionRef = collection(db, newCollectionName);

            const oldDocsSnapshot = await getDocs(oldCollectionRef);

            // Przeniesienie dokumentów ze starej kolekcji do nowej kolekcji
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

        // Force re-render
        setUpdateKey(prevKey => prevKey + 1);

        toast.success(`Egzamin został pomyślnie zaktualizowany ${newCollectionName}`, {
            autoClose: 2000,
        });
    };

    const handleQualificationChange = async (examId, newQualification) => {
        const exam = exams.find(e => e.id === examId);
        const formattedQualification = formatQualificationForStorage(newQualification);

        // Optimistically update the state
        const updatedExams = exams.map((exam) =>
            exam.id === examId ? { ...exam, qualification: formattedQualification } : exam
        );
        setExams(updatedExams);

        try {
            await renameCollectionAndUpdateDoc(examId, exam, newQualification, exam.profession);
        } catch (error) {
            // Revert state if the async operation fails
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

        // Optimistically update the state
        const updatedExams = exams.map((exam) =>
            exam.id === examId ? { ...exam, profession: newProfession, qualification: formattedQualification } : exam
        );
        setExams(updatedExams);

        try {
            await renameCollectionAndUpdateDoc(examId, exam, formattedQualification, newProfession);
        } catch (error) {
            // Revert state if the async operation fails
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
            // Delete the exam document
            await deleteDoc(doc(db, 'quizCode', exam.name));

            // Get the documents in the associated collection
            const examCollectionRef = collection(db, examCollectionName);
            const examDocsSnapshot = await getDocs(examCollectionRef);

            // Usunięcie dokumentów w kolekcji egzaminu
            const docDeletionPromises = [];
            examDocsSnapshot.forEach((doc) => {
                docDeletionPromises.push(deleteDoc(doc.ref));
            });

            await Promise.all(docDeletionPromises);

            // Attempt to delete the collection itself (not directly supported by Firestore)
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
            });
        } catch (error) {
            toast.error('Błąd podczas usuwania egzaminu: ' + error.message, {
                autoClose: 5000,
            });
        }
    };

    const handleDeleteClick = (exam) => {
        deleteExam(exam);
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
                        <th>lp</th>
                        <th>Kod egzaminu</th>
                        <th>Kwalifikacja</th>
                        <th>Zawód</th>
                        <th>Osoby z prawem edycji</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {currentExams.map((exam, index) => {
                        const isTestQualification = exam.qualification.toLowerCase().includes('test');
                        return (
                            <tr key={exam.id} className={`align-middle ${isTestQualification ? 'table-warning' : ''}`}>
                                <td className='align-middle'>{index + 1}</td>
                                <td className='align-middle'>{exam.name}</td>
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
                                    <Button variant='primary' className='me-2'>
                                        <FontAwesomeIcon icon={faPencilAlt} />
                                    </Button>
                                    <Button variant='danger' className='me-2' onClick={() => handleDeleteClick(exam)}>
                                        <FontAwesomeIcon icon={faTrash} />
                                    </Button>
                                    <Button variant='warning' onClick={() => handleDuplicate(exam)}>
                                        <FontAwesomeIcon icon={faCopy} />
                                    </Button>
                                </td>
                            </tr>
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
        </div>
    );
};

export default ExamTable;
