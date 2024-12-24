import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Flex, Avatar, Text, Spinner, Box, Table, Thead, Tbody, Tr, Th, Td, useToast, Heading, Button, Tooltip, IconButton, Select, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, Grid, useBreakpointValue, Badge, HStack, Alert, AlertIcon, CloseButton, Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, GridItem } from '@chakra-ui/react';
import { CalendarIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, EditIcon } from '@chakra-ui/icons';
import axios from 'axios';
import { motion } from 'framer-motion';
import Update_Student from './Update_Student';
import { useTooltip } from '../../Context/ToolTipContext';
import ViewStudentCourse from './View_Student_Course';
import RadioCard from '../Radio/Radio_Card';
import Timetable from '../Timetable/Timetable';

const MotionFlex = motion(Flex);
const MotionBox = motion(Box);
const MotionButton = motion(Button);
const MotionTable = motion(Table);

const StudentProfile = ({ user, searchQuery }) => {
    const [role] = useState(user.role);
    const [loading, setLoading] = useState(true);
    const [studentData, setStudentData] = useState(null);
    const [attendanceData, setAttendanceData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState('asc');
    const [attendanceFilter, setAttendanceFilter] = useState('');
    const [subjects, setSubjects] = useState([]);
    const [enableEditing, setEnableEditing] = useState(false);
    const [currentStatus, setCurrentStatus] = useState({});
    const [showEditingAlert, setShowEditingAlert] = useState(false);

    const [options] = useState(['Present', 'Absent', 'Excused']);
    const itemsPerPage = 5;
    const maxPageButtons = 5;
    const { student } = useLocation().state || {};
    const toast = useToast();
    const navigate = useNavigate();
    const {isDisabled} = useTooltip();

    const {isOpen: isOpenUpdateStudent, onOpen: onOpenUpdateStudent, onClose: onCloseUpdateStudent} = useDisclosure();
    const {isOpen: isOpenAlterSubjects, onOpen: onOpenAlterSubjects, onClose: onCloseAlterSubjects} = useDisclosure();
    const { isOpen: isOpenTimetable, onOpen: onOpenTimetable, onClose: onCloseTimetable } = useDisclosure();

    const grid = useBreakpointValue({base: '1fr', lg:'repeat(3,1fr)'});
    const rightBorder = useBreakpointValue({base: '1px solid #e2e8f0', lg:'none'});
    const leftBorder = useBreakpointValue({base: '1px solid #e2e8f0', lg:'none'});
    const rightBorderRadius = useBreakpointValue({base: '10px', lg:'0px 10px 10px 0px'});
    const leftBorderRadius = useBreakpointValue({base: '10px', lg:'10px 0px 0px 10px'});
    const buttonWidth = useBreakpointValue({base: '100%', lg:'60%'});
    const columnSpanButton = useBreakpointValue({base: '3', lg: role !== "admin"? '3': '0'});
    const colSpanSubjects = useBreakpointValue({base: '3', lg: '2'});
    
    const fetchAttendanceData = () => {
        setLoading(true); 
        axios.get(`/show-students/${student.id}`)
            .then(response=> {
                setStudentData(response.data);
            })
        axios.post('/show-attendances', { student_id: student.id })
            .then(response => {
                setAttendanceData(response.data.studentAttendance); 
                setLoading(false);  
            })
            .catch(error => {
                const errorMessage = error.response?.data?.error || error.message;
                console.error(errorMessage);
                setLoading(false);
            })
    };

    const fetchSubjectsForStudent = async (student_id) => {
        try {
            if (!studentData) return;
    
            const res = await axios.post('/display-assigned-subjects', { student_id });
            const { subjectData, time_and_venue } = res.data;
            
            // Filter subjects based on year and semester
            const filteredSubjects = subjectData.reduce((acc, { subject_id, code, name, section, year, semester }) => {
                if (parseInt(year, 10) === parseInt(studentData.current_year, 10) &&
                    parseInt(semester, 10) === parseInt(studentData.current_semester, 10)) {
                    
                    if (!acc[subject_id]) {
                        acc[subject_id] = { code, name, sections: new Map() };  // Add code and name here
                    }
                    
                    // Initialize section data
                    acc[subject_id].sections.set(section, { time: [], venue: [], day: [] });
                }
                return acc;
            }, {});
    
            // Map time_and_venue to the corresponding subject and section
            time_and_venue.forEach(({ subject_id, section_number, start_time, end_time, venue, day }) => {
                if (filteredSubjects[subject_id] && filteredSubjects[subject_id].sections.has(section_number)) {
                    const sectionData = filteredSubjects[subject_id].sections.get(section_number);
                    sectionData.time.push({ start_time, end_time });
                    sectionData.venue.push(venue);
                    sectionData.day.push(day);
                }
            });
    
            // Set subjects in the state
            setSubjects(
                Object.keys(filteredSubjects).reduce((acc, subjectId) => {
                    acc[subjectId] = {
                        code: filteredSubjects[subjectId].code,
                        name: filteredSubjects[subjectId].name,
                        sections: Array.from(filteredSubjects[subjectId].sections).map(([section, { time, venue, day }]) => ({
                            section,
                            time,
                            venue,
                            day
                        }))
                    };
                    return acc;
                }, {})
            );
        } catch (error) {
            console.error('Error fetching subjects:', error);
            setSubjects([]);
        }
    };
    
    
    const handleSave = async () => {
        try {
            const updatedAttendance = attendanceData.map(record => ({
                ...record,
                status: currentStatus[record.id] || record.status
            }));
            await axios.post('/update-attendance', { attendance: updatedAttendance });
    
            toast({
                title: "Success",
                description: "Attendance records have been updated.",
                status: "success",
                duration: 1000,
                isClosable: true,
            });
            setShowEditingAlert(false);
            setEnableEditing(false);
            fetchAttendanceData(); 
        } catch (error) {
            const errorMessage = error.response?.data?.error || error.message;
            toast({
                title: "Error",
                description: errorMessage,
                status: "error",
                duration: 1000,
                isClosable: true,
            });
        }
    };
    
    // Function to handle status changes
    const handleStatusChange = (recordId, value) => {
        setCurrentStatus(prevState => ({
            ...prevState,
            [recordId]: value,
        }));
    };

    const handleEditing = (status) => {
        setEnableEditing(!enableEditing);
        setCurrentStatus({});
        setShowEditingAlert(!showEditingAlert);
        // Display success toast
        toast({
            title: 'Editing Mode Updated',
            position: 'top-right',
            description: `Editing mode is now ${enableEditing ? 'disabled' : 'enabled'}.`,
            status: status,
            duration: 1000,
            isClosable: true,
        });
    }
    // Filter subjects based on search query
    const filteredSubjects = searchQuery
    ? Object.values(subjects).filter(subject => {
        const codeMatch = subject.code?.toLowerCase().includes(searchQuery.toLowerCase());
        const nameMatch = subject.name?.toLowerCase().includes(searchQuery.toLowerCase());

        const sectionMatch = subject.sections && subject.sections.length > 0
            ? subject.sections.some(section => {
                return (section.section && typeof section.section === 'string' && section.section.toLowerCase().includes(searchQuery.toLowerCase())) || 
                    (typeof section.section !== 'string' && false); 
            })
            : false;
        return codeMatch || nameMatch || sectionMatch;
    })
    : Object.values(subjects);


    // Filter attendance data based on search query and other filters
    const filterAttendanceData = () => {
    let filteredData = attendanceData;

    // Filter by search query
    if (searchQuery) {
        filteredData = filteredData.filter(record =>
            record.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            record.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (record.section && record.section.subject_section && record.section.subject_section.toString().toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    // Filter by attendance status
    if (attendanceFilter) {
        filteredData = filteredData.filter(record =>
            record.status.toLowerCase() === attendanceFilter.toLowerCase()
        );
    }

    // Sort the data based on sortOrder
    filteredData.sort((a, b) => {
        if (sortOrder === 'asc') {
            return new Date(a.date) - new Date(b.date);
        } else {
            return new Date(b.date) - new Date(a.date);
        }
    });

    return filteredData;
    };


    useEffect(() => {
        fetchAttendanceData();
    }, []);
    
    useEffect(() => {
        if (studentData) {
            fetchSubjectsForStudent(student.id);
        }
    }, [studentData, student.id]);


    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, attendanceFilter]);

    if (loading) {
        return (
            <Flex justifyContent="center" alignItems="center" height="100vh" flexDirection='column'>
                <Spinner size="lg" />
                <Text>Loading...</Text>
            </Flex>
        );
    }

    if (!studentData) {
        return <Text>No student data found</Text>;
    }
    // Filtered and sorted attendance records based on search query and sort order
    const filteredAttendanceData = filterAttendanceData();

    // Group attendance records by date
    const groupedAttendance = filteredAttendanceData.reduce((acc, record) => {
        const date = new Date(record.date).toLocaleDateString();
        if (!acc[date]) {
            acc[date] = [];
        }
        acc[date].push(record);
        return acc;
    }, {});

    const totalPages = Math.ceil(Object.keys(groupedAttendance).length / itemsPerPage);
    const startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
    const endPage = Math.min(totalPages, startPage + maxPageButtons - 1);

    // Calculate pagination
    const paginatedAttendanceData = Object.entries(groupedAttendance).slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    
    return (
        <MotionFlex
            flexDirection="column"
            alignItems="center"
            padding="20px"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <MotionButton
                marginRight='auto'
                onClick={() => navigate(-1)}
                mb="20px"
                colorScheme="teal"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.3 }}
            >
                Back
            </MotionButton>
            {/* Profile Information */}
            <Grid width='90%' templateColumns={grid} p="20px" borderWidth="1px" borderRadius="lg" boxShadow="md">
                <GridItem as="fieldset" border='1px solid #e2e8f0' borderRight={rightBorder} p="20px" borderRadius={leftBorderRadius}>
                    <legend style={{ fontWeight: 'bold', fontSize: 'lg', marginBottom: '10px' }}>Student Profile</legend>
                    <Flex justifyContent='center' alignItems='center'>
                        <Avatar borderRadius='20px' size="2xl" src={studentData.profile_picture || 'https://via.placeholder.com/150'} />
                        <Flex ml={5} flexDirection='column'>
                        <Text fontSize="sm" marginTop="5px"><b>Name: </b>{studentData.name}</Text>
                        <Text fontSize="sm" marginTop="5px"><b>ID: </b>{studentData.student_id}</Text>
                        <Text fontSize="sm" marginTop="5px"><b>Email: </b>{studentData.email}</Text>
                        <Text fontSize="sm" marginTop="5px"><b>Current Intake: </b>Year {studentData.current_year} Semester {studentData.current_semester}</Text>

                        </Flex>
                    </Flex>
                </GridItem>
                <GridItem colSpan={colSpanSubjects} p="20px" mt={3} border='1px solid #e2e8f0' borderLeft={leftBorder} borderRadius={rightBorderRadius} overflow='auto'>
                    <Heading size="md" mb="20px">Current Intake Subjects</Heading>
                    <Table variant="simple" size='sm'>
                    <Thead>
                        <Tr>
                            <Th>Subject Code</Th>
                            <Th>Subject Name</Th>
                            <Th>Section</Th>
                            <Th>Day</Th>
                            <Th>Time</Th>
                            <Th>Venue</Th>
                        </Tr>
                    </Thead>
                    <Tbody>
                    {filteredSubjects.length > 0 ? (
                        filteredSubjects.flatMap((subject, index) => 
                            subject.sections.length > 0
                            && subject.sections.map((section, secIndex) => (
                                <Tr key={`${index}-${secIndex}`} _hover={{ bg: "gray.100" }}>
                                    <Td>{subject.code}</Td>
                                    <Td>{subject.name}</Td>
                                    <Td>{section.section || 'N/A'}</Td>
                                    <Td>{section.day && section.day.length > 0 ? section.day.join(', ') : 'N/A'}</Td>
                                    <Td>
                                        {section.time && section.time.length > 0 
                                            ? section.time.map((timeSlot, timeIndex) => (
                                                <Box key={timeIndex}>
                                                    {timeSlot.start_time} - {timeSlot.end_time}
                                                </Box>
                                            )) 
                                            : 'N/A'}
                                    </Td>
                                    <Td>{section.venue  && section.venue.length > 0? section.venue.join(', ') : 'N/A'}</Td>
                                </Tr>
                            ))
                        )
                    ) : (
                        <Tr>
                            <Td colSpan={6}>No subjects assigned for this semester.</Td>
                        </Tr>
                    )}
                    </Tbody>
                    </Table>
                </GridItem>
                {
                    role === 'admin' && (
                        <>
                            <GridItem colSpan={columnSpanButton} mt={2} justifyContent='center' display='flex'>
                                <Tooltip label='Alter student profile' isDisabled={isDisabled}>
                                    <Button width={buttonWidth} onClick={onOpenUpdateStudent}> {<EditIcon mr={1} ml={1}/>}Edit Student Profile</Button>
                                </Tooltip>
                            </GridItem>
                            <GridItem colSpan={columnSpanButton} mt={2} justifyContent='center' display='flex'> 
                                <Tooltip label='Alter student subjects' isDisabled={isDisabled}>
                                    <Button width={buttonWidth} onClick={onOpenAlterSubjects}> {<EditIcon mr={1} ml={1}/>}Alter Student Subjects</Button>
                                </Tooltip>
                            </GridItem>
                        </>

                    )
                }
                
                <GridItem colSpan={columnSpanButton} mt={2} justifyContent='center' display='flex'>
                    <Tooltip label='View timetable' isDisabled={isDisabled}>
                        <Button width={buttonWidth} onClick={onOpenTimetable}> {<CalendarIcon mr={1} ml={1}/>}Time table</Button>
                    </Tooltip>
                </GridItem>
            </Grid>
            
            {/* Attendance Section */}
            <MotionBox
                mt="20px"
                w="100%"
                maxW="1200px"
                p="4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
            >
                <Heading size="lg" mb="10px">Attendance Record</Heading>

                {/* Attendance Filter */}
                <Flex justifyContent='space-between'>
                    <Tooltip label='Sort by date' isDisabled={isDisabled}>
                        <MotionButton
                            width='40%'
                            mb="20px"
                            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            Sort by Date: {sortOrder === 'asc' ? 'Descending': 'Ascending'}
                        </MotionButton>
                    </Tooltip>
                    <Tooltip label='Filter by attendance' isDisabled={isDisabled}>
                        <Select width='40%' placeholder="Filter by Attendance" mb="20px" onChange={(e) => setAttendanceFilter(e.target.value)}>
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="excused">Excused</option>
                            <option value="n/a">N/A</option>
                        </Select>
                    </Tooltip>
                    <Tooltip label='Alter student attendance' isDisabled={isDisabled}>
                        <IconButton onClick={()=>handleEditing('success')} icon={<EditIcon/>} />
                    </Tooltip>
                </Flex>

                {paginatedAttendanceData.length > 0 ? (
                    paginatedAttendanceData.map(([date, records]) => (
                        <MotionBox
                            key={date}
                            mb="20px"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Heading size="md" mb="10px">{date}</Heading>
                            <MotionTable variant="striped" colorScheme="teal" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.3 }}>
                                <Thead>
                                    <Tr>
                                        <Th>Subject</Th>
                                        <Th>Section</Th>
                                        <Th>Attendance</Th>
                                    </Tr>
                                </Thead>
                                <Tbody>
                                    {records.map(record => {
                                        const stats = currentStatus[record.id] || record.status;
                                        return (
                                            <Tr key={record.subject_id}>
                                                <Td>{record.subject_name}</Td>
                                                <Td>{record.section.subject_section ? record.section.subject_section : 'N/A'}</Td>
                                                {enableEditing ? (
                                                    <Td>
                                                        <HStack>
                                                            {options.map(value => (
                                                                <RadioCard
                                                                    key={value}
                                                                    isChecked={stats === value}
                                                                    onChange={() => handleStatusChange(record.id, value)}
                                                                >
                                                                    {value}
                                                                </RadioCard>
                                                            ))}
                                                        </HStack>
                                                    </Td>
                                                ) : (
                                                    <Td>
                                                        {record.status ? (
                                                            record.status === 'Present' ? (
                                                                <Flex>
                                                                    <Text>{record.status}</Text>
                                                                    <Badge ml={2} colorScheme='green'><CheckIcon/></Badge>
                                                                </Flex>
                                                            ) : (
                                                                <Flex>
                                                                    <Text>{record.status}</Text>
                                                                    <Badge ml={2} colorScheme='red'><CloseIcon/></Badge>
                                                                </Flex>
                                                            )
                                                        ) : (
                                                            "Null"
                                                        )}
                                                    </Td>
                                                )}
                                            </Tr>
                                        );
                                    })}
                                </Tbody>

                            </MotionTable>
                        </MotionBox>
                    ))
                ) : (
                    <Text>No attendance records found</Text>
                )}
                {/* Pagination Controls */}
                <Flex direction="column" align="center" marginTop="20px">
                    <Flex direction="row" align="center" mb={4}>
                        {/* Previous Page Button */}
                        <Tooltip label='Previous Page' fontSize='md'>
                            <IconButton 
                                icon={<ChevronLeftIcon />}
                                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                                isDisabled={currentPage === 1}
                                marginRight="10px"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                            />
                        </Tooltip>

                        {/* Page Number Buttons */}
                        {startPage > 1 && (
                            <>
                                <Button 
                                    mx={1} 
                                    onClick={() => setCurrentPage(1)}
                                    colorScheme={currentPage === 1 ? "blue" : "gray"}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
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
                                onClick={() => setCurrentPage(number)}
                                colorScheme={number === currentPage ? "blue" : "gray"}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                            >
                                {number}
                            </Button>
                        ))}
                        {endPage < totalPages && (
                            <>
                                {endPage < totalPages - 1 && <Text mx={1}>...</Text>}
                                <Button 
                                    mx={1} 
                                    onClick={() => setCurrentPage(totalPages)}
                                    colorScheme={totalPages === currentPage ? "blue" : "gray"}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {totalPages}
                                </Button>
                            </>
                        )}

                        {/* Next Page Button */}
                        <Tooltip label='Next Page' fontSize='md'>
                            <IconButton 
                                marginLeft='10px'
                                icon={<ChevronRightIcon />} 
                                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                                isDisabled={currentPage === totalPages} 
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.3 }}
                            />
                        </Tooltip>
                    </Flex>
                </Flex>
            </MotionBox>
            <Drawer size='md' isOpen={isOpenUpdateStudent} onClose={onCloseUpdateStudent}>
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerCloseButton/>
                    <DrawerHeader>Update Student</DrawerHeader>
                    <DrawerBody>
                        <Update_Student isDisabled={isDisabled} onRefresh={fetchAttendanceData} student={studentData} onClose={onCloseUpdateStudent}/>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <Drawer size='xl' isOpen={isOpenAlterSubjects} onClose={onCloseAlterSubjects}>
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerCloseButton/>
                    <DrawerHeader>Update Student</DrawerHeader>
                    <DrawerBody>
                        <ViewStudentCourse onRefresh={fetchAttendanceData} student={studentData} isDisabled={isDisabled}/>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <Modal isOpen={isOpenTimetable} onClose={onCloseTimetable} size='2xl'>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Time table</ModalHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'><ModalCloseButton /></Tooltip>
                    <ModalBody>
                        <Timetable subjects={subjects} user={student}/>
                    </ModalBody>
                </ModalContent>
            </Modal>
            {/* Show alert if editing mode is enabled */}
            {showEditingAlert && (
                <Alert 
                    zIndex={3}
                    status='success' 
                    position='fixed' 
                    bottom='0' 
                    left='0' 
                >
                    <AlertIcon />
                    You're currently in Editing Mode
                    <Flex marginLeft='auto' alignItems='center'>
                        <Tooltip isDisabled={isDisabled} label='Cancel'>
                            <IconButton icon={<CloseButton />}  colorScheme='red' mr='2' onClick={()=>{handleEditing('warning')}}/>
                        </Tooltip>
                        <Tooltip isDisabled={isDisabled} label='Save'>
                            <IconButton icon={<CheckIcon />} width='10%' colorScheme='green' onClick={handleSave}/>
                        </Tooltip>
                    </Flex>
                </Alert>
            )}
            
        </MotionFlex>
    );
};

export default StudentProfile;
