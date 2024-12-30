import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios'; 
import {
    Box,
    Flex,
    Text,
    Badge,
    Avatar,
    Spinner,
    Grid,
    SkeletonCircle,
    Divider,
    Input,
    CloseButton,
    Select,
    GridItem,
    FormLabel,
    Button,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverArrow,
    PopoverCloseButton,
    PopoverBody,
    Tooltip,
    Menu,
    MenuButton,
    MenuList,
    HStack,
    IconButton,
    Alert,
    AlertIcon,
    useToast,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionIcon,
    AccordionPanel,
    MenuItem,
    Checkbox
} from '@chakra-ui/react';
import { InfoIcon, CalendarIcon, ChevronDownIcon, EditIcon, CheckIcon, QuestionIcon } from '@chakra-ui/icons';
import PieChart from '../PieChart/Pie_Chart';
import Calendar from 'react-calendar';
import { useTooltip } from '../../Context/ToolTipContext';
import 'react-calendar/dist/Calendar.css';
import './Calendar_Styles.css';
import Excel from '../FileExport/Excel';
import Countdown from './Count_Down';
import RadioCard from '../Radio/Radio_Card';
import { FaFilter } from 'react-icons/fa';

const Show_Attendance = ({searchQuery, user}) => {
    const {isDisabled} = useTooltip();
    const location = useLocation();
    const { subjectName, numberOfSections, subject_id } = location.state || {};
    const toast = useToast();
    const navigate = useNavigate();
    const [calendarDate, setCalendarDate] = useState(new Date());

    const [attendanceData, setAttendanceData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [filteredStudent, setFilteredStudent] = useState([]);
    const [lecturerData, setLecturerData] = useState({});
    const [selectedSection, setSelectedSection] = useState('' || 'All');
    const [student , setStudent] = useState([]);
    const [sectionTime, setSectionTime] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pieChartLoading, setPieChartLoading] = useState(true);
    const [enableEditing , setEnableEditing] = useState(false);
    const [studentStatus, setStudentStatus] = useState({});
    const [showEditingAlert, setShowEditingAlert] = useState(false);
    const [filteredQueryData, setFilteredQueryData] = useState([]);
    const [filteredNullData, setFilteredNullData] = useState([]);
    const [startClass, setStartClass] = useState(Array(numberOfSections).fill(false));
    const [userSubjectsData, setUserSubjectsData] = useState([]);
    const [attendanceStatuses, setAttendanceStatuses] = useState({
        present: false,
        absent: false,
        excused: false,
        null: false
    });
    const handleNavigate = () => {
        const selectedDate = new Date(calendarDate);
        navigate('/start-class', {
            state: { section: selectedSection, subject_id, date: selectedDate },
        });
    };

    // Fetch attendance data from the server
    const fetchAttendanceData = async () => {
        try {
            const response = await axios.post(`/show-attendances`, { subject_id, selectedSection, calendarDate });
            const data = response.data;
    
            // Sort sectionTime by section_id if not already sorted by the database
            const orderedSectionTime = data.sectionTime.sort((a, b) => a.section_number - b.section_number);
    
            // Group lecturer data by section
            const lecturersBySection = {};
            data.lecturers.forEach(record => {
                if (!lecturersBySection[record.subject_section]) {
                    lecturersBySection[record.subject_section] = [];
                }
                lecturersBySection[record.subject_section].push({
                    profile_picture: record.lecturer_profile_picture,
                    name: record.lecturer_name,
                    subject_section: record.subject_section,
                });
            });
    
            setSectionTime(orderedSectionTime); 
            setStudent(data.showAll);
            setLecturerData(lecturersBySection);
            if(user.role!=='admin'){
                const userSubject = user.subjectsData.filter((subject) => subject.subject_id === subject_id);
                setUserSubjectsData(userSubject);
            }
            if (user.subjectsData && Array.isArray(user.subjectsData) && user.role !=='admin') {
                const userSections = user.subjectsData.filter((subject) => subject.subject_id === subject_id);
        
                const filteredAttendance = data.students.filter((a) => 
                    userSections.some((userSubject) => userSubject.subject_section === a.subject_section)
                );
        
                setAttendanceData(filteredAttendance);
            }else{
                setAttendanceData(data.students);
            }
        } catch (err) {
            setError('Error fetching attendance data');
        } finally {
            setLoading(false);
            setPieChartLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [subject_id, calendarDate, selectedSection]);
    

    // Set start section
    useEffect(() => {
        if (!sectionTime || sectionTime.length === 0) return;
        const currentTime = new Date();
    

        const updatedStartClass = sectionTime.map((section) => {
            const startTime = new Date();
            const endTime = new Date();
    
            const today = new Date();
            const malaysiaTimeOffset = 8 * 60 * 60 * 1000;
            const malaysiaDate = new Date(today.getTime() + malaysiaTimeOffset);
            const currentDay = malaysiaDate.toLocaleString('en-US', { weekday: 'long' });

            const [startHours, startMinutes] = section.start_time ? section.start_time.split(':') : ["0", "0"];
            const [endHours, endMinutes] = section.end_time ? section.end_time.split(':') : ["23", "59"];
            const sectionDay = section.day?? section.day; 
    
            startTime.setHours(parseInt(startHours), parseInt(startMinutes), 0);
            endTime.setHours(parseInt(endHours), parseInt(endMinutes), 0);
    
            return currentTime >= startTime && currentTime <= endTime && sectionDay == currentDay;
        });
    
        setStartClass(updatedStartClass);
    }, [sectionTime, numberOfSections]);
    const actualSectionIndex = selectedSection && selectedSection !== 'All' ? parseInt(selectedSection) - 1 : null;

    // Handle adding attendance records
    const handleAddAttendance = async () => {
        const selectedDate = new Date(calendarDate);
        const attendanceRecords = Object.entries(studentStatus).map(([studentId, status]) => ({
            student_id: studentId,
            status
        }));
        try {
            const response = await axios.post('/add-attendance', {
                subject_id,
                records: attendanceRecords,
                date: selectedDate
            });

            if (response.status === 201) {
                setShowEditingAlert(false);
                setEnableEditing(false);
                setStudentStatus({});
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: 'Attendance records successfully saved!',
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });
            }
            fetchAttendanceData();
        } catch (err) {
            console.error('Error saving attendance records:', err);
            const errorMessage = err.response?.data?.error || 'Failed to save attendance records. Please try again.';
            toast({
                title: 'Error',
                position: 'top-right',
                description: errorMessage,
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };

    useEffect(() => {
         // Filter attendance data by selected date and section
        const filtered = attendanceData.filter(
            (record) => new Date(record.date).toDateString() === calendarDate.toDateString()
        );
    
        // Apply section filtering if a specific section is selected
        const filteredBySection = selectedSection === 'All'
            ? filtered
            : filtered.filter((record) => record.subject_section === parseInt(selectedSection, 10));
    
        // Set the filtered data to state
        setFilteredData(filteredBySection);
    }, [calendarDate, attendanceData, selectedSection]);
    
    const formattedDate = (timestamp) => {
        return new Date(timestamp).toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    const handleSetSection = (e) => {
        setSelectedSection(e.target.value);
        setEnableEditing(false);
    }
    const handleStatusChange = (studentId, status) => {
        setStudentStatus((prevStatus) => ({
            ...prevStatus,
            [studentId]: status
        }));
    };

    const calculateStatusCounts = () => {
        const counts = {
            Present: 0,
            Absent: 0,
            Excused: 0,
            Null: 0
        };
    
        filteredData.forEach((record) => {
            if (record.status === '' || record.status === null || record.status === undefined) {
                counts.Null += 1;
            } else if (counts[record.status] !== undefined) {
                counts[record.status] += 1;
            }
        });
    
        const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    
        const percentages = {
            Present: total ? (counts.Present / total * 100).toFixed(2) : 0,
            Absent: total ? (counts.Absent / total * 100).toFixed(2) : 0,
            Excused: total ? (counts.Excused / total * 100).toFixed(2) : 0,
            Null: total ? (counts.Null / total * 100).toFixed(2) : 0,
        };
    
        return { counts, total, percentages };
    };

    const handleCheckboxChange = (status) => {
        setAttendanceStatuses(prevState => ({
            ...prevState,
            [status]: !prevState[status]
        }));
    };
    
    useEffect(() => {
        // Filter students based on selected section
        const filteredStudents = selectedSection
            ? student.filter(record => record.subject_section === Number(selectedSection))
            : student;
        setFilteredStudent(filteredStudents);
    }, [selectedSection, student]);
    
    useEffect(() => {
        // Set pie chart loading state based on filtered data
        if (filteredData.length === 0) {
          setPieChartLoading(true);
        } else {
          setPieChartLoading(false);
        }
    }, [filteredData]);

    useEffect(() => {
        const searchLowerCase = searchQuery.toLowerCase();
    
        // Apply search to filteredData
        let searchData = filteredData.filter(record => {
            const studentName = (record.student_name || '').toString().toLowerCase();
            return studentName.includes(searchLowerCase);
        });
    
        // Apply attendance status filter based on checked checkboxes
        if (Object.values(attendanceStatuses).some(status => status)) {
            searchData = searchData.filter((data) => {
                const status = (data.status || '').toLowerCase();
    
                return (
                    (attendanceStatuses.present && status === 'present') ||
                    (attendanceStatuses.absent && status === 'absent') ||
                    (attendanceStatuses.excused && status === 'excused') ||
                    (attendanceStatuses.null && status === '')
                );
            });
        }
        setFilteredNullData(searchLowerCase);
        setFilteredQueryData(searchData);
    }, [searchQuery, filteredData, attendanceStatuses]);
    
    if (loading) {
        return (
            <Flex height="100vh" flexDirection="column" justifyContent="center" alignItems="center">
                <Spinner size="xl" />
                <Text>Loading...</Text>
            </Flex>
        );
    }
    
    const Attendance_UI = (record, index)=> {
        const options = ['Present', 'Absent', 'Excused']
        const currentStatus = studentStatus[record.student_id] || record.status;

        if (user.role !== 'admin' && ( record.subject_section === null)) {
            return null; 
        }
        return(
                <GridItem
                    borderColor={enableEditing? 'green': 'none'}
                    key={record.id}
                    boxShadow="rgba(0, 0, 0, 0.35) 0px 5px 15px"
                    borderWidth="1px"
                    borderRadius="lg"
                    p={4}
                    mb={4}
                >            
                    <Flex 
                        alignItems="center"
                        
                    >
                        <Text fontWeight="bold" mr={4}>
                            {index+1}
                        </Text>
                        <Avatar size="md" name={`Student ${record.student_id}`} src={record.student_profile_picture} />
                        <Box ml={4}
                            width='100%'
                        >

                            {
                                record.subject_section?
                                (
                                    <Text fontWeight="bold">{record.student_name || 'Unknown Student'}</Text>
                                ) : (
                                    <Flex>
                                        <Text fontWeight="bold">{record.student_name || 'Unknown Student'}</Text>
                                        <Popover>
                                            <PopoverTrigger>
                                                <QuestionIcon ml='auto' cursor='pointer'/>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                <PopoverArrow />
                                                <PopoverCloseButton />
                                                <PopoverHeader>Why is status Null?</PopoverHeader>
                                                <PopoverBody>This student had already registered the subject but doesn't have a valid section yet. Please check and assign their section.</PopoverBody>
                                            </PopoverContent>
                                        </Popover>
                                    </Flex>
                                )

                            }
                            
                            
                            
                            <Flex alignItems='center'>
                                <Text fontSize="sm" mr={3}>
                                    Status: 
                                </Text>
                                {enableEditing?
                                    <HStack>
                                    {options.map((value) => (
                                        <RadioCard
                                            key={value}
                                            isChecked={currentStatus === value}
                                            onChange={() => handleStatusChange(record.id, value)}
                                        >
                                            {value}
                                        </RadioCard>
                                    ))}
                                    </HStack>
                                    :
                                    record.status === '' || record.status === null || record.status === undefined || record.subject_section === null? (
                                        <Badge colorScheme='grey'>Null</Badge>
                                        ) : record.status === 'Present' ? (
                                        <Badge colorScheme='green'>{record.status}</Badge>
                                        ) : (
                                        <Badge colorScheme='red'>{record.status}</Badge>
                                    )
                                }   
                                
                            </Flex>
                            <Text>Section: {record.subject_section? record.subject_section : 'Null'}</Text>
                            <Text fontSize="sm">Date & Time: { record.date?formattedDate(record.date):formattedDate(calendarDate.toDateString())}</Text>
                        </Box>
                    </Flex>
                </GridItem>
            );
    }
    
    // Handle Start Class
    const handleClass = async (section, time) => {
        try {
            if (!subject_id || !user) {
                console.error("Missing subject_id or user");
                throw new Error("Missing subject_id or user information");
            }
    
            const response = await axios.post('/alter-session-logs', {
                subject_id,
                section,
                user,
                time: time,
                date: calendarDate
            });
    
            if (response.status === 200) {
                toast({
                    title: 'Class started',
                    position: 'top-right',
                    description: `Class started by ${user.name}`,
                    status: "success",
                    duration: 1000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error("Error starting class:", error.response || error.message);
            toast({
                title: 'Error',
                position: 'top-right',
                description: error.response?.data?.message || "There was an error starting the class.",
                status: "error",
                duration: 1000,
                isClosable: true,
            });
        }
        fetchAttendanceData();
    };

    // Handle editing
    const handleEditing = (status) => {
        setEnableEditing(!enableEditing);
        setShowEditingAlert(!showEditingAlert);
        setStudentStatus({});
        
        // Display success toast
        toast({
            title: 'Editing Mode Updated',
            position: 'top-right',
            description: `Editing mode is now ${enableEditing ? 'disabled' : 'enabled'}.`,
            status: status,
            duration: 1000,
            isClosable: true,
        });
    };
    
    if (error) {
        return <Text color="red.500">{error}</Text>;
    }

    const lecturerInfo = selectedSection === 'All'
        ? Object.values(lecturerData).flat()
        : lecturerData[selectedSection] || [];
        
    return (
        <Flex flexDirection="column" p={4}>
            <Grid
                h='400px'
                templateRows='repeat(2, 1fr)'
                templateColumns='repeat(7, 1fr)'
                gap={4}
            >
                {/* Lecturer Grid Item */}
                <GridItem rowSpan={2} colSpan={4} overflowY='auto' overscrollX='none'>
                    <FormLabel textAlign='center'>Assigning Lecturer(s)</FormLabel>
                    <Grid
                        templateColumns={{ base: '1fr', sm: '1fr', md: 'repeat(2, 1fr)' }} 
                        gap={4}
                    >
                        { user.role === 'admin'? (lecturerInfo.length === 1 ? (
                            lecturerInfo.map((lecturer, index) => (
                                <GridItem overflowY='hidden' key={index} colSpan={{ base: 2, md: 2 }} rowSpan={{ base: 2, md: 2 }} padding='50px' boxShadow='rgba(0, 0, 0, 0.15) 0px 3px 3px 0px'>
                                    <Flex justifyContent='center' alignItems='center'>
                                        <Avatar
                                            size='2xl'
                                            src={lecturer.profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'}
                                            name={lecturer.name}
                                        />

                                    </Flex>
                                    <FormLabel mt={2}>Lecturer Name:</FormLabel>
                                    <Input variant='flushed' disabled value={lecturer.name} />
                                    <FormLabel mt={2}>Lecturer Section:</FormLabel>
                                    <Input variant='flushed' disabled value={`Section ` + lecturer.subject_section} />

                                </GridItem>
                            ))
                        ) : lecturerInfo.length > 1 ? (
                            lecturerInfo.map((lecturer, index) => (
                                <GridItem key={index} colSpan={{ base: 2, sm:2, md: 1 }} rowSpan={{ base: 1, sm:1, md: 2 }} padding='50px' boxShadow='rgba(0, 0, 0, 0.15) 0px 3px 3px 0px'>
                                    <Flex justifyContent='center' alignItems='center'>
                                        <Avatar
                                            size='2xl'
                                            src={lecturer.profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'}
                                            name={lecturer.name}
                                        />

                                    </Flex>
                                    <FormLabel mt={2}>Lecturer Name:</FormLabel>
                                    <Input variant='flushed' disabled value={lecturer.name} />
                                    <FormLabel mt={2}>Lecturer Section:</FormLabel>
                                    <Input variant='flushed' disabled value={`Section ` + lecturer.subject_section} />

                                </GridItem>
                            ))
                            
                        ) : (
                            <GridItem padding='50px' display='flex' flexDirection='column' alignItems='center' justifyContent='center' colSpan={2} rowSpan={2}>
                                <Avatar
                                    size='2xl'
                                    src='https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'
                                    name='Lecturer'
                                />
                                <FormLabel mt={2}>No Lecturer Assigned</FormLabel>
                            </GridItem>

                        )):(
                            lecturerInfo.map((lecturer, index) => {
                                const isSectionMatch = userSubjectsData.some((userSubject) => userSubject.subject_section === lecturer.subject_section);
                            
                                return isSectionMatch ? (
                                    <GridItem
                                        overflowY='hidden'
                                        key={index}
                                        colSpan={{ base: 2, md: 2 }}
                                        rowSpan={{ base: 2, md: 2 }}
                                        padding='50px'
                                        boxShadow='rgba(0, 0, 0, 0.15) 0px 3px 3px 0px'
                                    >
                                        <Flex justifyContent='center' alignItems='center'>
                                            <Avatar
                                                size='2xl'
                                                src={lecturer.profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'}
                                                name={lecturer.name}
                                            />
                                        </Flex>
                                        <FormLabel mt={2}>Lecturer Name:</FormLabel>
                                        <Input variant='flushed' disabled value={lecturer.name} />
                                        <FormLabel mt={2}>Lecturer Section:</FormLabel>
                                        <Input variant='flushed' disabled value={`Section ${lecturer.subject_section}`} />
                                    </GridItem>
                                ) : null;
                            })
                        )}
                    </Grid>
                </GridItem>
                {/* Pie Chart Grid Item */}
                <GridItem rowSpan={2} colSpan={3}>
                    {pieChartLoading ? (
                        <Flex direction="row" align="center" justify="center" h='100%' p={4}>
                            <Divider orientation='vertical' h='100%' w='2px' />
                            <Flex direction="column" align="center" justify="center" h='100%' w='full' p={4}>
                                <SkeletonCircle size='250'/>
                                <Text textAlign='center' mt={2} mb={4}>No attendance records found for this date.</Text>
                            </Flex>
                        </Flex>
                    ) : (
                        <Flex direction="row" align="center" justify="center" h='100%' w='full'>
                            <Divider orientation='vertical' h='100%' />
                            <PieChart isLoading={setPieChartLoading} data={calculateStatusCounts()} />
                        </Flex>
                    )}
                </GridItem>
            </Grid>

            <Divider marginBottom="20px" />
            <Flex justifyContent="center" mb={4}>
                <Tooltip isDisabled={isDisabled} label='Select a Section'>
                    <Select
                        variant='flushed'
                        marginLeft='20px'
                        width='30%'
                        onChange={handleSetSection}
                        value={selectedSection}
                    >
                        <option value="All">All Sections</option>
                        {
                            user.role ==='admin'?
                                [...Array(numberOfSections)].map((_, index) => (
                                    <option key={index + 1} value={index + 1}>
                                        Section {index + 1}
                                    </option>
                                ))
                            :
                            user.subjectsData.length > 0 ? (
                                user.subjectsData
                                  .filter(subject => subject.subject_id === subject_id) 
                                  .map((subject, index) => (
                                    <option key={index} value={subject.subject_section}>
                                      Section {subject.subject_section}
                                    </option>
                                  ))
                            ) : (
                            <option>No subjects available</option> 
                            )
                        }
                        
                    </Select>
                </Tooltip>
                <Popover placement='top-start'>
                    <PopoverTrigger>
                        <Button variant='outline' marginLeft='20px'><Tooltip isDisabled={isDisabled} label="Calender"><CalendarIcon/></Tooltip></Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverHeader fontWeight='semibold'>Calendar</PopoverHeader>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverBody>
                        <Calendar
                            onChange={setCalendarDate}
                            value={calendarDate}
                            className="custom-calendar"
                        />
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
                <Tooltip isDisabled={isDisabled} label='Edit Status'><Button colorScheme={ enableEditing? 'green' : 'gray'} variant='outline' marginLeft='10px' onClick={() => handleEditing('success')}><EditIcon/></Button></Tooltip>
                <Tooltip isDisabled={isDisabled} label='Filter'>
                <Menu>
                    <MenuButton marginLeft='10px' variant='outline' as={Button}>
                        <FaFilter/>
                    </MenuButton>
                    <MenuList zIndex='0' padding='10px' display='flex' flexDirection='column'>
                        <Checkbox
                            isChecked={attendanceStatuses.present}
                            onChange={() => handleCheckboxChange('present')}
                        >
                            Present
                        </Checkbox>
                        <Checkbox
                            isChecked={attendanceStatuses.absent}
                            onChange={() => handleCheckboxChange('absent')}
                        >
                            Absent
                        </Checkbox>
                        <Checkbox
                            isChecked={attendanceStatuses.excused}
                            onChange={() => handleCheckboxChange('excused')}
                        >
                            Excused
                        </Checkbox>
                        <Checkbox
                            isChecked={attendanceStatuses.null}
                            onChange={() => handleCheckboxChange('null')}
                        >
                            Null
                        </Checkbox>
                    </MenuList>
                </Menu></Tooltip>
            </Flex>
            {/* Students Attendance List */}
            <Box minHeight="350px">
                {/* Check if there are attendance data */}
                <Accordion allowToggle>
                    <AccordionItem>
                        <AccordionButton>
                            <Box as='span' flex='1' textAlign='left'>
                            View Section Time
                            </Box>
                          
                            <AccordionIcon/>
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                        <Countdown userSubjectsData={userSubjectsData} selectedSection={selectedSection} sectionTime={sectionTime}/>
                
                        </AccordionPanel>
                    </AccordionItem>
                </Accordion>
                {filteredQueryData.length === 0 ? (
                    selectedSection === 'All' && student.length > 0? (
                        <>
                            <Grid mt={5} templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={2}>
                                {searchQuery || attendanceStatuses? (
                                    user.role ==='admin'?
                                        student
                                            .filter((record) => record.student_name.toLowerCase().includes(filteredNullData.toLowerCase()))
                                            .map((record, index) => Attendance_UI(record, index))
                                    :
                                        student
                                            .filter((record) => record.student_name.toLowerCase().includes(filteredNullData.toLowerCase())) 
                                            .filter((record) => 
                                                user.subjectsData.some(subject => subject.subject_section === record.subject_section && subject.subject_id === subject_id)
                                            )
                                            .map((record, index) => Attendance_UI(record, index))
                                ) : (
                                    student.map((record, index) => Attendance_UI(record, index))
                                )}
                            </Grid>
                        </>
                    ) : (
                        filteredStudent.length > 0 ? (
                            <>
                                <Grid mt={5} templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={2}>
                                    {filteredStudent.map((record, index) => Attendance_UI(record, index))}
                                </Grid>
                            </>
                        ) : (
                            <>
                                <Flex minHeight="350px" justifyContent='center' alignItems="center" textAlign="center" flexDirection="column" mt={4}>
                                    <InfoIcon boxSize={20} />
                                    <Text mt={2} mb={4}>There are no existing students currently.</Text>
                                </Flex>
                            </>
                        )
                    )
                    ) : (
                    <Grid mt={5} templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={2}>
                        {filteredQueryData.map((record, index) => Attendance_UI(record, index))}
                    </Grid>
                )}
            </Box>
            {/* Download file button */}
            <Flex mt={5} justifyContent='space-between'>
                <Menu >
                    <MenuButton width='30%' as={Button} rightIcon={<ChevronDownIcon />}>Download Report</MenuButton>
                    <MenuList>
                        <Excel lecturerInfo={lecturerInfo} data={filteredData} subject_name={subjectName}/>
                    </MenuList>
                </Menu>
                {actualSectionIndex !== null && startClass[actualSectionIndex] ? (
            <Button width='30%' colorScheme='blue' onClick={handleNavigate}>
                Face Recognition
            </Button>
        ) : null}

        {selectedSection === 'All' ? (
            <Menu>
                <MenuButton colorScheme='green' width='30%' as={Button} rightIcon={<ChevronDownIcon />}>
                    Start Class
                </MenuButton>
                <MenuList>
                    {numberOfSections > 0 ? (
                        startClass.map((isClassStarted, index) => (
                            user.role !== 'admin'  && userSubjectsData.some(subject => subject.subject_section === index + 1) ? (
                                isClassStarted ? (
                                    <MenuItem 
                                        onClick={() => handleClass(index + 1, 'end')} 
                                        borderRadius='0' 
                                        key={index} 
                                        as={Button} 
                                        colorScheme='red' 
                                        width='100%'
                                    >
                                        End Section {index + 1}
                                    </MenuItem>
                                ) : (
                                    <MenuItem 
                                        onClick={() => handleClass(index + 1, 'start')} 
                                        borderRadius='0' 
                                        key={index} 
                                        as={Button} 
                                        colorScheme='green'
                                    >
                                        Start Section {index + 1}
                                    </MenuItem>
                                )
                        ): user.role === 'admin'? (
                            isClassStarted ? (
                                <MenuItem 
                                    onClick={() => handleClass(index + 1, 'end')} 
                                    borderRadius='0' 
                                    key={index} 
                                    as={Button} 
                                    colorScheme='red' 
                                    width='100%'
                                >
                                    End Section {index + 1}
                                </MenuItem>
                            ) : (
                                <MenuItem 
                                    onClick={() => handleClass(index + 1, 'start')} 
                                    borderRadius='0' 
                                    key={index} 
                                    as={Button} 
                                    colorScheme='green'
                                >
                                    Start Section {index + 1}
                                </MenuItem>
                            )
                        ): null
                        ))
                    ) : (
                        <MenuItem disabled>No Sections Available</MenuItem>
                    )}
                </MenuList>
            </Menu>
        ) : (
            actualSectionIndex !== null && startClass[actualSectionIndex] ? (
                <Button colorScheme='red' width='30%' onClick={() => handleClass(selectedSection, 'end')}>
                    End Class
                </Button>
            ) : (
                <Button colorScheme='green' width='30%' onClick={() => handleClass(selectedSection, 'start')}>
                    Start Class
                </Button>
            )
        )}
            </Flex>
            {/* Show alert if editing mode is enabled */}
            {showEditingAlert && (
                <Alert 
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
                            <IconButton icon={<CheckIcon />} width='10%' colorScheme='green' onClick={handleAddAttendance}/>
                        </Tooltip>
                    </Flex>
                </Alert>
            )}
            
        </Flex>
    );
};

export default Show_Attendance;
