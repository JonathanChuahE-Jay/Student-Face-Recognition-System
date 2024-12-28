import React, { useEffect, useState } from 'react';
import {
    Box,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    Input,
    Avatar,
    useToast,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    CloseButton,
    Checkbox,
    Flex,
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverCloseButton,
    PopoverArrow,
    Wrap,
    WrapItem,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    useDisclosure,
    ModalCloseButton,
    useColorModeValue,
    IconButton,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    Spinner 
} from '@chakra-ui/react';
import axios from 'axios';
import { AddIcon, DeleteIcon, Search2Icon } from '@chakra-ui/icons';
import { FiFilter } from 'react-icons/fi';
import AssignStudentModal from './Assign_Student_Modal';

const AssignedStudent = ({ search, user, height, subject_id }) => {
    const [students, setStudents] = useState([]);
    const [lecturers, setLecturers] = useState([]);
    const [subject, setSubject] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredStudents, setFilteredStudents] = useState([]);
    const [sectionFilters, setSectionFilters] = useState([]);
    const [subjectSections,setSubjectSections] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const toast = useToast();

    const inputBg = useColorModeValue('white','gray.600');

    const { isOpen: isOpenAddStudentModal, onOpen: onOpenAddStudentModal, onClose: onCloseAddStudentModal } = useDisclosure();
    const { isOpen: isOpenDeleteAlert, onOpen: onOpenDeleteAlert, onClose: onCloseDeleteAlert } = useDisclosure();

    useEffect(()=>{
        setSearchQuery(search);
    },[search])
    
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('/display-assigned-student-and-lecturer', { subject_id });
            const { students, lecturers, subject, sections } = response.data;
            setStudents(students);
            setLecturers(lecturers);
            setSubject(subject);
            setSubjectSections(sections);
        } catch (err) {
            console.error(err);
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'Failed to fetch data',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }finally{
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
    }, [subject_id]);

    useEffect(() => {
        const filtered = students.filter(student => {
            const section = (student.subject_section || '').toString().toLowerCase();
            const currentYear = (student.current_year || '').toString().toLowerCase();
            const currentSemester = (student.current_semester || '').toString().toLowerCase();
            const search = searchQuery ? searchQuery.toLowerCase() : '';

            const isInSectionFilter = sectionFilters.length === 0 || sectionFilters.includes(section);
    
            return isInSectionFilter &&
                ((student.name && student.name.toLowerCase().includes(search)) || 
                (student.student_id && student.student_id.toLowerCase().includes(search)) ||
                (`section: ${section}`).includes(search) ||
                (`year ${currentYear} semester ${currentSemester}`).includes(search) ||
                (getLecturerName(student.subject_section) && getLecturerName(student.subject_section).toLowerCase().includes(search))
            );

        });
    
        setFilteredStudents(filtered);
    }, [searchQuery, students, sectionFilters]);
    
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleSectionFilterChange = (section) => {
        setSectionFilters(prev => 
            prev.includes(section) ? 
            prev.filter(sec => sec !== section) : 
            [...prev, section]
        );
    };
    const getLecturerName = (section) => {
        const lecturer = lecturers.find(lect => lect.subject_section === section);
        return lecturer ? lecturer.name : 'N/A';
    };

    const handleDeleteAlert = (student) => {
        setSelectedStudent(student);
        onOpenDeleteAlert();
    }
    const handleDeleteStudent = (student) => {
        setIsLoading(true);
        axios.post('http://localhost:5000/alter-assigned-student', {
            selectedStudents: [student],
            mode: 'DELETE',
            subject_id
        })
        .then(response => {
            const { message, error } = response.data;
            if (error) {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: error,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: message,
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });
                onCloseDeleteAlert();
                fetchData();
            }
        })
        .catch(error => {
            console.error('Error:', error);
            toast({
                title: 'Error',
                position: 'top-right',
                description: error.response?.data?.error || 'An error occurred while assigning subjects.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        })
        setIsLoading(false);
    }
    return (
        <Box overflowY='scroll' p={2} maxW="container.xl" mx="auto" borderWidth={1} borderRadius="lg" boxShadow="xl" height={height??'100%'}>
            <Flex spacing={4} mb={4} align="center" position="sticky" zIndex='1' top="-8px" boxShadow='lg' borderRadius='10px' bg={inputBg}>
                <InputGroup >
                    <InputLeftElement><Search2Icon/></InputLeftElement>
                    <Input
                        placeholder="Search by student ID, name, or section"
                        onChange={handleSearchChange}
                        variant='flushed'
                        value={searchQuery}
                    />
                    <InputRightElement><CloseButton onClick={() => setSearchQuery('')} /></InputRightElement>
                </InputGroup>
                <Popover>
                    <PopoverTrigger>
                        <Button variant='ghost' ml={2}><FiFilter /></Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>Select Sections</PopoverHeader>
                        <PopoverBody>
                            <Wrap spacing={4}>
                                <WrapItem key="n/a">
                                    <Checkbox 
                                        isChecked={sectionFilters.includes('n/a')}
                                        onChange={() => handleSectionFilterChange('n/a')}
                                    >
                                        N/A
                                    </Checkbox>
                                </WrapItem>
                                {[...Array(subject.number_of_sections)].map((_, index) => {
                                    const section = (index + 1).toString();
                                    return (
                                        <WrapItem key={section}>
                                            <Checkbox 
                                                isChecked={sectionFilters.includes(section)}
                                                onChange={() => handleSectionFilterChange(section)}
                                            >
                                                Section {section}
                                            </Checkbox>
                                        </WrapItem>
                                    );
                                })}
                            </Wrap>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            </Flex>
            <TableContainer>
                <Table variant="simple"  size='sm'>
                    <TableCaption>Students assigned to the subject and their sections</TableCaption>
                    <Thead>
                        <Tr>
                            <Th>Picture</Th>
                            <Th>Student ID</Th>
                            <Th>Student Name</Th>
                            <Th>Section Number</Th>
                            <Th>Current Intake</Th>
                            <Th>Current Lecturer</Th>
                            {
                                user.role === 'admin'&&
                                    <Th>Action</Th>
                            }
                        </Tr>
                    </Thead>
                    <Tbody>
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <Tr key={student.id}>
                                    <Td>
                                        <Avatar size='sm' src={student.profile_picture} />
                                    </Td>
                                    <Td>{student.student_id}</Td>
                                    <Td>{student.name}</Td>
                                    <Td>{student.subject_section || 'N/A'}</Td>
                                    <Td>
                                        {!student.current_year || !student.current_semester 
                                            ? 'N/A' 
                                            : `Year ${student.current_year} Semester ${student.current_semester}`
                                        }
                                    </Td>
                                    <Td>{getLecturerName(student.subject_section)}</Td>
                                    {
                                        user.role === 'admin' && 
                                            <Td>
                                                <IconButton onClick={() => handleDeleteAlert(student)} colorScheme='red' icon={<DeleteIcon />} />
                                            </Td>
                                    }
                                </Tr>
                            ))
                        ) : isLoading ? (
                            <Tr>
                                <Td colSpan={7} textAlign="center">
                                    <Spinner size="lg" />
                                </Td>
                            </Tr>
                        ) : (
                            <Tr>
                                <Td color='red' colSpan={7}>No students found</Td>
                            </Tr>
                        )}
                    </Tbody>
                </Table>
            </TableContainer>
            {
                user.role === 'admin'&& <Button width='100%' mt={5} onClick={onOpenAddStudentModal}><AddIcon mr={1} />Assign student</Button>
            }
            <Modal scrollBehavior='inside' size='6xl' isOpen={isOpenAddStudentModal} onClose={onCloseAddStudentModal}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Assign student</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <AssignStudentModal subject_sections={subjectSections} exisitingStudents={filteredStudents} onRefresh={fetchData} subject={subject} subject_id={subject_id} onClose={onCloseAddStudentModal}/>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <AlertDialog
                isCentered
                isOpen={isOpenDeleteAlert}
                onClose={onCloseDeleteAlert}
            >
                <AlertDialogOverlay>
                    <AlertDialogContent>
                        <AlertDialogHeader fontSize='lg' fontWeight='bold'>
                            Remove Student
                        </AlertDialogHeader>

                        <AlertDialogBody>
                            Are you sure you want to remove the following student from this subject?
                            <br/>
                            <br/>
                            <b>{selectedStudent.name}</b>
                        </AlertDialogBody>

                        <AlertDialogFooter>
                        <Button onClick={onCloseDeleteAlert}>
                            Cancel
                        </Button>
                        <Button colorScheme='red' onClick={()=>{handleDeleteStudent(selectedStudent)}}  ml={3}>
                            Delete
                        </Button>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialogOverlay>
            </AlertDialog>
        </Box>
    );
    
    
};


export default AssignedStudent;
