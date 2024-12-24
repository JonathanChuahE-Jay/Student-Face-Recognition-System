import { 
    Button, 
    Table, 
    TableCaption, 
    TableContainer, 
    Tbody, 
    Td, 
    Th, 
    Thead, 
    Tr, 
    useToast, 
    Flex, 
    useDisclosure, 
    Modal, 
    ModalOverlay, 
    ModalContent, 
    ModalHeader, 
    ModalCloseButton, 
    ModalBody, 
    Avatar, 
    Text, 
    IconButton, 
    Tooltip, 
    Spinner, 
    Box, 
    UnorderedList, 
    ListItem, 
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    Checkbox
} from "@chakra-ui/react";
import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddNewStudent from "./Add_New_Student";
import UpdateStudent from "./Update_Student";
import { ChevronLeftIcon, ChevronRightIcon, InfoIcon, DeleteIcon, AddIcon, EditIcon, MinusIcon } from "@chakra-ui/icons";
import { useTooltip } from '../../Context/ToolTipContext';
import { FaUser } from 'react-icons/fa';
import axios from "axios";
import { AnimatePresence,motion } from "framer-motion";
import ViewStudentCourse from "./View_Student_Course";

const StudentManagement = ({user, searchQuery}) => {
    const { page } = useParams();
    const toast = useToast();
    const navigate = useNavigate();
    const Ref = useRef();
    const { isDisabled } = useTooltip();
    const prevSearchQueryRef = useRef(searchQuery);

    const [selectedId, setSelectedId] = useState(null)
    const [subjects, setSubjects] = useState({});
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [student, setStudent] = useState(null);
    const [currentPage, setCurrentPage] = useState(Number(page) || 1);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteCheckBoxBar, setDeleteCheckBoxBar] = useState(false);
    const [role] = useState(user.role);

    const studentsPerPage = 10; 

    // Modal controls
    const { isOpen: isOpenAddNewStudentModal, onOpen: onOpenAddNewStudentModal, onClose: onCloseAddNewStudentModal } = useDisclosure();
    const { isOpen: isOpenUpdateStudentModal, onOpen: onOpenUpdateStudentModal, onClose: onCloseUpdateStudentModal } = useDisclosure();
    const { isOpen: isOpenDeleteStudentModal, onOpen: onOpenDeleteStudentModal, onClose: onCloseDeleteStudentModal } = useDisclosure();
    const { isOpen: isOpenViewCourseDrawer, onOpen: onOpenViewCourseDrawer, onClose: onCloseViewCourseDrawer } = useDisclosure();  

    // Format date for display
    const formattedDate = (timestamp) => new Date(timestamp).toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    // Fetch subjects for each student
    const fetchSubjectsForStudent = useCallback(async (student_id) => {
        try {
            const res = await axios.post('http://localhost:5000/display-assigned-subjects', { student_id });
            const { subjectData } = res.data;

            const subjectsWithDetails = subjectData.reduce((acc, { subject_id, name, section, year, semester }) => {
                if (!acc[subject_id]) {
                    acc[subject_id] = { name, sections: [], years: [], semesters: [] };
                }
                acc[subject_id].sections.push(section);
                acc[subject_id].years.push(parseInt(year, 10));
                acc[subject_id].semesters.push(parseInt(semester, 10));
                return acc;
            }, {});

            setSubjects(prevState => ({
                ...prevState,
                [student_id]: subjectsWithDetails
            }));
        } catch (error) {
            console.error('Error fetching subjects:', error);
            setSubjects(prevState => ({
                ...prevState,
                [student_id]: {}  
            }));
        }
    }, []);


    // Fetch student data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('http://localhost:5000/show-students');
            const data = response.data;
            const sortedData = data.sort((a, b) => a.id - b.id);
            setData(sortedData);
            setFilteredData(sortedData);
            await Promise.all(sortedData.map(student => fetchSubjectsForStudent(student.id)));
        } catch (err) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'Unable to fetch data',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    }, [fetchSubjectsForStudent, toast]);
    
    // Delete student
    const handleDeleteStudent = useCallback(async () => {
        try {
            const response = await axios.delete('http://localhost:5000/delete-student', {
                headers: { "Content-Type": 'application/json' },
                data: { id: student.id }
            });
            const result = response.data;
    
            if (result.message && result.message.includes('deleted successfully')) {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: result.message,
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });
                onCloseDeleteStudentModal();
                fetchData();
            } else {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: result.error || `Failed to delete ${student.name}`,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: `An error occurred: ${error.message}`,
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    }, [student, fetchData, onCloseDeleteStudentModal, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
    
        const filtered = data.filter(student =>
            student.name.toLowerCase().includes(query) ||
            student.email.toLowerCase().includes(query) ||
            student.student_id.toLowerCase().includes(query) ||
            (subjects[student.id] &&
                Object.values(subjects[student.id]).some(subject => {
                    const isCurrentSemester =
                        subject.years.includes(student.current_year) &&
                        subject.semesters.includes(student.current_semester);
    
                    if (isCurrentSemester) {
                        return (
                            subject.name.toLowerCase().includes(query) ||
                            subject.sections.some(section =>
                                `- Sections: ${section}`.toLowerCase().includes(query)
                            )
                        );
                    }
                    return false;
                })
            )
        );
    
        setFilteredData(filtered);
    }, [searchQuery, data, subjects]);
    

    useEffect(() => {
        if (parseInt(page) !== currentPage) {
          setCurrentPage(parseInt(page) || 1);
        }
    }, [page]);

    const handleResetPage = () => {
        setCurrentPage(1);
        navigate(`/student-management/page/1`);
    }

    useEffect(() => {
        if (prevSearchQueryRef.current !== searchQuery) {
            handleResetPage();
            prevSearchQueryRef.current = searchQuery;
        }
    }, [searchQuery]);

    // Pagination logic
    const paginatedData = filteredData.slice(
        (currentPage - 1) * studentsPerPage,
        currentPage * studentsPerPage
    );

    const totalPages = Math.ceil(filteredData.length / studentsPerPage);

    // Determine page range to display
    const maxPageButtons = 6;
    let startPage, endPage;

    if (totalPages <= maxPageButtons) {
        startPage = 1;
        endPage = totalPages;
    } else {
        const halfRange = Math.floor(maxPageButtons / 2);
        if (currentPage <= halfRange) {
            startPage = 1;
            endPage = maxPageButtons;
        } else if (currentPage + halfRange >= totalPages) {
            startPage = totalPages - maxPageButtons + 1;
            endPage = totalPages;
        } else {
            startPage = currentPage - halfRange;
            endPage = currentPage + halfRange;
        }
    }

    // Handle student update
    const handleUpdate = useCallback((student) => {
        if (student) {
            setStudent(student);
            onOpenUpdateStudentModal();
        }
    }, [onOpenUpdateStudentModal]);
    
    const handleAssignSubject = useCallback((student) => {
        if (student) {
            setStudent(student);
            onOpenViewCourseDrawer();
        }
    }, [onOpenViewCourseDrawer]);

    const handleDeleteConfirmation = useCallback((student) => {
        setStudent(student);
        onOpenDeleteStudentModal();
    }, [onOpenDeleteStudentModal]);

    // CheckBox related
    const [checkedItems, setCheckedItems] = useState({});
    const allChecked = paginatedData.every((student) => checkedItems[student.id]);
    const isIndeterminate = paginatedData.some((student) => checkedItems[student.id]) && !allChecked;

    useEffect(() => {
        const hasCheckedItems = Object.values(checkedItems).some(item => item === true);
        setDeleteCheckBoxBar(hasCheckedItems);

    }, [checkedItems]);
    
    
    const handleDeleteSelectedStudents = useCallback(async () => {
        const selectedStudentIds = Object.keys(checkedItems).filter(id => checkedItems[id]);

        if (selectedStudentIds.length === 0) {
            toast({
                title: 'No students selected',
                position: 'top-right',
                description: 'Please select at least one student to delete.',
                status: 'warning',
                duration: 1000,
                isClosable: true,
            });
            return;
        }

        try {
            const deleteRequests = selectedStudentIds.map(id =>
                axios.delete('http://localhost:5000/delete-student', {
                    headers: { "Content-Type": 'application/json' },
                    data: { id: id }
                })
            );

            const responses = await Promise.all(deleteRequests);
            
            responses.forEach(response => {
                const result = response.data;
                if (result.message && result.message.includes('deleted successfully')) {
                    toast({
                        title: 'Success',
                        position: 'top-right',
                        description: result.message,
                        status: 'success',
                        duration: 1000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: 'Error',
                        position: 'top-right',
                        description: result.error || `Failed to delete student`,
                        status: 'error',
                        duration: 1000,
                        isClosable: true,
                    });
                }
            });

            setCheckedItems({});
            fetchData(); 

        } catch (error) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: `An error occurred: ${error.message}`,
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    }, [checkedItems, fetchData, toast]);

    return (
        <Flex flexDirection={'column'} padding={'20px'}>
            <Flex flexDirection={'column'}>
                {/* Loading State */}
                {isLoading ? (
                    <Flex flexDirection='column' justifyContent='center' alignItems="center" height="100vh">
                        <Spinner />
                        <Box ml={4}>Loading...</Box>
                    </Flex>
                ) : filteredData.length === 0 ? (
                    <Flex justifyContent='center' alignItems="center" height="100vh" flexDirection='column'>
                        <InfoIcon boxSize={20} />
                        <Text mt={2} mb={4}>There's no existing students currently.</Text>
                    </Flex>
                ) : (
                    <TableContainer marginTop={'20px'}>
                        <Table variant="simple" size='sm'>
                            <TableCaption>Student Management</TableCaption>
                            <Thead>
                                <Tr>
                                    <Th>Picture</Th>
                                    <Th padding='10px 6px'>Name</Th>
                                    <Th padding='10px 6px'>Email</Th>
                                    <Th padding='10px 6px'>Student ID</Th>
                                    <Th padding='10px 20px'>Subjects</Th>
                                    <Th padding='10px 6px'>Joined Date</Th>
                                    <Th padding='10px 6px'>Current Intake</Th>
                                    <Th padding={role==='admin'? '0px 0px 0px 90px': '10px 6px'}>Actions</Th>
                                    {
                                        role ==='admin'&& (
                                            <Th>
                                                <Checkbox
                                                    isChecked={allChecked}
                                                    isIndeterminate={isIndeterminate}
                                                    onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        const updatedCheckedItems = { ...checkedItems };

                                                        paginatedData.forEach((student) => {
                                                            updatedCheckedItems[student.id] = isChecked;
                                                        });

                                                        setCheckedItems(updatedCheckedItems);
                                                    }}
                                                />
                                            </Th>
                                        )
                                    }
                                </Tr>
                            </Thead>
                            <Tbody>
                                {paginatedData.map((student) => {
                                    return(
                                    <>
                                    <Tr key={student.id}>
                                        <Td>
                                            <motion.div
                                                layoutId={student.id}
                                                onClick={() => setSelectedId(student.id)}
                                            >
                                                <Avatar cursor='pointer' src={student.profile_picture || '/default-profile.png'} size="md" />
                                            </motion.div>
                                        </Td>
                                        <Td padding='10px 6px'>{student.name}</Td>
                                        <Td padding='10px 6px'>{student.email}</Td>
                                        <Td padding='10px 6px'>{student.student_id}</Td>
                                        <Td>
                                        {subjects[student.id] && Object.keys(subjects[student.id]).some(subjectId => {
                                            const { years, semesters } = subjects[student.id][subjectId];
                                            return years.includes(student.current_year) && semesters.includes(student.current_semester);
                                        }) ? (
                                            <UnorderedList>
                                                {Object.keys(subjects[student.id]).map(subjectId => {
                                                    const { name, sections, years, semesters } = subjects[student.id][subjectId];
                                                    
                                                    // Filter subjects to only show those that match the current year and semester
                                                    if (years.includes(student.current_year) && semesters.includes(student.current_semester)) {
                                                        return (
                                                            <ListItem key={subjectId}>
                                                                {name} - Sections: {sections.join(', ')}
                                                            </ListItem>
                                                        );
                                                    }
                                                    return null;
                                                })}
                                            </UnorderedList>
                                        ) : (
                                            <Text>None</Text>
                                        )}
                                        </Td>
                                        <Td padding='10px 6px'>{formattedDate(student.joined_date)}</Td>
                                        <Td padding='10px 6px'> Year {student.current_year} Semester {student.current_semester}</Td>
                                        <Td textAlign='center'>
                                            <Tooltip isDisabled={isDisabled} label='Profile' fontSize='md'>
                                                <IconButton 
                                                aria-label="Profile" 
                                                colorScheme="blue"
                                                icon={<FaUser />} 
                                                onClick={() => navigate(`/student-management/student-profile/${student.name}`,{
                                                    state: {student}
                                                })}
                                                />
                                            </Tooltip>
                                            {
                                                role === 'admin' &&(
                                                    <>
                                                        <Tooltip isDisabled={isDisabled} label='Update Student Profile' fontSize='md'>
                                                            <IconButton 
                                                                aria-label="Update Student" 
                                                                colorScheme="teal"
                                                                icon={<EditIcon />} 
                                                                onClick={() => handleUpdate(student)} 
                                                                ml={2}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip isDisabled={isDisabled} label='Alter Subjects' fontSize='md'>
                                                            <IconButton 
                                                                colorScheme="cyan"
                                                                icon={<AddIcon />} 
                                                                onClick={()=>handleAssignSubject(student)}
                                                                ml={2}
                                                            />
                                                        </Tooltip>
                                                        <Tooltip isDisabled={isDisabled} label='Delete Student' fontSize='md'>
                                                            <IconButton 
                                                                aria-label="Delete Student" 
                                                                icon={<DeleteIcon />} 
                                                                colorScheme='red'
                                                                onClick={() => handleDeleteConfirmation(student)}
                                                                ml={2}
                                                            />
                                                        </Tooltip>
                                                    </>
                                                )
                                            }
                                             
                                            
                                        </Td>
                                        {
                                            role ==='admin'&&
                                            (
                                                <Td>
                                                    <Checkbox
                                                        isChecked={!!checkedItems[student.id]}
                                                        onChange={(e) => {
                                                            const updatedCheckedItems = { ...checkedItems };
                                                            updatedCheckedItems[student.id] = e.target.checked;
                                                            setCheckedItems(updatedCheckedItems);
                                                        }}
                                                    />
                                                </Td>
                                            )
                                        }
                                    </Tr>
                                    <AnimatePresence>
                                    {selectedId === student.id && (  
                                        <Box
                                            position="fixed"  
                                            top="50%"        
                                            left="50%"       
                                            transform="translate(-50%, -50%)" 
                                            display="flex"
                                            justifyContent="center"
                                            alignItems="center"
                                            zIndex="1000"
                                            width='100%' 
                                            height='100%'  
                                            background="rgba(0, 0, 0, 0.4)" 
                                            backdropFilter="blur(2px)" 
                                            onClick={() => setSelectedId(null)}
                                        >
                                        <motion.div
                                            layoutId={selectedId}
                                            display="flex"
                                            flexDirection="column"
                                            alignItems="center"
                                        >
                                            <Avatar src={student.profile_picture || '/default-profile.png'} width='200px' height='200px' />
                                            
                                        </motion.div>
                                        </Box>
                                    )}
                                    </AnimatePresence>
                                    </>
                                )})}
                            </Tbody>
                        </Table>
                    </TableContainer>
                )}
            </Flex>
            
            <Flex direction="column" align="center" marginTop={'20px'}>
                <Flex direction="row" align="center" mb={4}>
                    {/* Previous Page Button */}
                    <Tooltip isDisabled={isDisabled} label='Previous Page' fontSize='md'>
                                <IconButton 
                                
                                icon={<ChevronLeftIcon />}
                                onClick={() => {
                                    const newPage = Math.max(currentPage - 1, 1);
                                    navigate(`/student-management/page/${newPage}`);
                                }}
                                isDisabled={currentPage === 1}
                                marginRight={'10px'}
                                />
                            </Tooltip>

                    {/* Page Number Buttons */}
                    {startPage > 1 && (
                        <>
                            <Button 
                            
                            mx={1} 
                            onClick={() => navigate(`/student-management/page/1`)}
                            colorScheme={currentPage === 1 ? "blue" : "gray"}
                            >
                            1
                            </Button>
                            {startPage > 2 && <Text mx={1}>...</Text>}
                        </>
                    )}
                    {Array.from({ length: Math.min(maxPageButtons, endPage - startPage + 1) }, (_, i) => startPage + i).map(number => (
                        <Button
                        
                        key={number}
                        mx={1}
                        onClick={() => navigate(`/student-management/page/${number}`)}
                        colorScheme={number === currentPage ? "blue" : "gray"}
                        >
                        {number}
                        </Button>
                    ))}
                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <Text mx={1}>...</Text>}
                            <Button 
                            
                            mx={1} 
                            onClick={() => navigate(`/student-management/page/${totalPages}`)}
                            colorScheme={totalPages === currentPage ? "blue" : "gray"}
                            >
                            {totalPages}
                            </Button>
                        </>
                    )}
                    {/* Next Page Button */}
                    <Tooltip isDisabled={isDisabled} label='Next page' fontSize='md'>
                        <IconButton icon={<ChevronRightIcon />} marginLeft='10px' onClick={() => {
                            const newPage = Math.min(currentPage + 1, totalPages);
                            navigate(`/student-management/page/${newPage}`);
                            }}isDisabled={currentPage === totalPages} 
                        />
                    </Tooltip>
                </Flex>

                {/* Add New Student Button */}
                {
                    role === 'admin' && (
                    <Tooltip isDisabled={isDisabled} label='Add New Student' fontSize='md'>
                        <Button colorScheme="blue" leftIcon={<AddIcon />} width='100%' marginTop={'20px'} onClick={onOpenAddNewStudentModal}>Add New Student</Button>
                    </Tooltip>
                    )
                }
            </Flex>
            
            {/* Modals */}
            <Modal scrollBehavior="inside" isOpen={isOpenAddNewStudentModal} onClose={onCloseAddNewStudentModal}>
                <ModalOverlay />
                <ModalContent marginTop='3px'  maxHeight="100vh">
                    <ModalHeader>Add New Student</ModalHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'><ModalCloseButton /></Tooltip>
                    <ModalBody>
                        <AddNewStudent isDisabled={isDisabled} onClose={onCloseAddNewStudentModal} onRefresh={fetchData} />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Drawer isOpen={isOpenUpdateStudentModal} onClose={onCloseUpdateStudentModal} size='lg'>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHeader>Update Student</DrawerHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'><ModalCloseButton /></Tooltip>
                    <DrawerBody>
                        <UpdateStudent isDisabled={isDisabled} student={student} onClose={onCloseUpdateStudentModal} onRefresh={fetchData} />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <AlertDialog
                motionPreset='slideInBottom'
                leastDestructiveRef={Ref}
                onClose={onCloseDeleteStudentModal}
                isOpen={isOpenDeleteStudentModal}
                isCentered
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                <AlertDialogHeader>Delete confirmation</AlertDialogHeader>
                <Tooltip isDisabled={isDisabled} label='Close Dialog' fontSize='md'><AlertDialogCloseButton /></Tooltip>
                <AlertDialogBody>
                    Are you sure you want to delete {student ? student.name : 'this student'}?
                </AlertDialogBody>
                <AlertDialogFooter>
                    <Button ref={Ref} onClick={onCloseDeleteStudentModal}>
                    No
                    </Button>
                    <Button colorScheme='red' onClick={handleDeleteStudent} ml={3}>
                    Yes
                    </Button>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Drawer isOpen={isOpenViewCourseDrawer} onClose={onCloseViewCourseDrawer} size='2xl'>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHeader>View Course</DrawerHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'><ModalCloseButton /></Tooltip>
                    <DrawerBody>
                        <ViewStudentCourse subjects={subjects} student={student} isDisabled={isDisabled} onRefresh={fetchData} />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            {
                deleteCheckBoxBar? 
                    <Flex
                        width='100%'
                        height='50px'
                        position='fixed'
                        bottom='0'
                        left='0'
                        background='rgba(100, 105, 100, 0.4)'
                        boxShadow='0 4px 30px rgba(0, 0, 0, 0.9)' 
                        backdropFilter='blur(12.6px)'
                        border='1px solid rgba(255, 255, 255, 0.98)'
                        alignItems='center'
                        justifyContent='space-evenly'
                    >
                        <Button width='45%' colorScheme="green" onClick={()=>{setCheckedItems({})}}>
                            <MinusIcon mr={2} />
                            Deselect all items
                        </Button>
                        <Button width='45%' colorScheme="red" onClick={()=>{handleDeleteSelectedStudents()}}>
                            <DeleteIcon mr={2}/>
                            Delete selected items
                        </Button>
                    </Flex>
                :
                    null
            }
        </Flex>
    );
}

export default StudentManagement;
