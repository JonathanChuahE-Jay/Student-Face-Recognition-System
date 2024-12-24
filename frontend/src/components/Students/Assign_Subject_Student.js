import {
    Card,
    Image,
    Stack,
    CardBody,
    Heading,
    Text,
    Button,
    Flex,
    Tag,
    SimpleGrid,
    useToast,
    Input,
    InputGroup,
    InputLeftElement,
    HStack,
    IconButton,
    InputRightElement,
    CloseButton,
    Select,
    FormControl,
    Tooltip,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    useDisclosure,
} from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import { CheckIcon, Search2Icon, ChevronLeftIcon, ChevronRightIcon, InfoIcon } from "@chakra-ui/icons";
import axios from 'axios';

const Assign_Student_Subject = ({ allStudentSubjects, year, semester, isDisabled, studentId, onRefresh, onClose }) => {
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectSections, setSubjectSections] = useState({});
    const [assignedYear, setAssignedYear] = useState([]);
    const [assignedSemester, setAssignedSemester] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const [loading, setLoading] = useState(true);
    const [sectionChangeData, setSectionChangeData] = useState({ subjectId: null, sectionNumber: null });

    const toast = useToast();
    const cancelRef = useRef()

    const {isOpen: isOpenIncreaseCapacity, onOpen: onOpenIncreaseCapacity, onClose: onCloseIncreaseCapacity} = useDisclosure();

    console.log(data)
    // Fetch all subjects on component mount
    useEffect(() => {
        axios.get('http://localhost:5000/show-all-subjects')
            .then(res => {
                const sortedData = res.data.sort((a, b) => a.id - b.id);
                setData(sortedData);
                setLoading(false); 
            })
            .catch(error => {
                console.error('Error fetching data:', error);
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Failed to load subjects.',
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
                setLoading(false);
            });
    },[]);
    
    // Fetch assigned subjects
    useEffect(() => {
        const fetchSubjects = async () => {
            setLoading(true);
            try {
                const response = await axios.post('http://localhost:5000/display-assigned-subjects', { student_id: studentId });
                const { subjectData } = response.data;
                
                if (Array.isArray(subjectData)) {
                    // Extract assigned subject IDs and their sections
                    const assignedSubjectIds = subjectData.map(subject => subject.subject_id);
                    const assignedSections = subjectData.reduce((acc, subject) => {
                        acc[subject.subject_id] = subject.subject_section;
                        return acc;
                    }, {});
                    setSelectedSubjects(assignedSubjectIds);
                    setSubjectSections(assignedSections);
                    // Extract years and semesters for each subject
                    const allYears = subjectData.map(subject => parseInt(subject.year, 10));
                    const allSemesters = subjectData.map(subject => parseInt(subject.semester, 10));

                    setAssignedYear(allYears);
                    setAssignedSemester(allSemesters);

                } else {
                    toast({
                        title: "Error",
                        position: 'top-right',
                        description: 'Unexpected response format:',
                        status: "error",
                        duration: 5000,
                        isClosable: true,
                    });
                }
            } catch (error) {
                toast({
                    title: "Error",
                    position: 'top-right',
                    description: "Failed to fetch assigned subjects.",
                    status: "error",
                    duration: 5000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        if (studentId) {
            fetchSubjects();
        }
    }, [studentId]);

    // Toggle subject selection
    const handleSelectSubject = (id) => {
        setSelectedSubjects(prevSelectedSubjects => {
            const newSelection = prevSelectedSubjects.includes(id)
                ? prevSelectedSubjects.filter(subjectId => subjectId !== id)
                : [...prevSelectedSubjects, id];
    
            // Remove related entries for the deselected subject
            const newSubjectSections = { ...subjectSections };
            const newAssignedYear = [...assignedYear];
            const newAssignedSemester = [...assignedSemester];
    
            if (!newSelection.includes(id)) {
                delete newSubjectSections[id];
                const indexToRemove = prevSelectedSubjects.indexOf(id);
                if (indexToRemove !== -1) {
                    newAssignedYear.splice(indexToRemove, 1);
                    newAssignedSemester.splice(indexToRemove, 1);
                }
            }
            setSubjectSections(newSubjectSections);
            setAssignedYear(newAssignedYear);
            setAssignedSemester(newAssignedSemester);
    
            return newSelection;
        });
    };

    // Handle section change for a selected subject
    const handleSectionChange = (subjectId, section) => {
        setSubjectSections(prevSections => ({
            ...prevSections,
            [subjectId]: section
        }));
    };

    // Handle form submission
    const handleSubmit = () => {

        const subjects = selectedSubjects.map((subject_id, index) => {
            const subjectYear = assignedYear[index] !== undefined 
                ? assignedYear[index]
                : parseInt(year, 10);
             
            const subjectSemester = assignedSemester[index] !== undefined
                ? assignedSemester[index]
                : parseInt(semester, 10);
             
            return {
                student_id: studentId,
                subject_id: subject_id,
                subject_section: parseInt(subjectSections[subject_id], 10),
                year: subjectYear,
                semester: subjectSemester
            };
        });
        
        const filteredSectionValidation = subjects.filter(subject =>
            subject.year === year && subject.semester ===semester
        )
        // Check if all required sections are selected
        const allCurrentSectionSelected = filteredSectionValidation.every(subject => {
            const isValidSection = !isNaN(subject.subject_section) && subject.subject_section > 0;
            return isValidSection;
        });

    
        if (!allCurrentSectionSelected) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: "Please select a section for all selected subjects in the current section.",
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
            return;
        }
        
        axios.post('http://localhost:5000/assign-subject-student', {
            student_id: studentId,
            subjects
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
                onClose();
                onRefresh();
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
        });
    }        

    // Filter subjects based on search query
    const filteredData = data.filter(subject =>
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subject.section && subject.section.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Reset page number when search query changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    // Pagination logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const maxPagesToShow = 6;
    let startPage = Math.max(currentPage - Math.floor(maxPagesToShow / 2), 1);
    let endPage = startPage + maxPagesToShow - 1;

    if (endPage > totalPages) {
        endPage = totalPages;
        startPage = Math.max(endPage - maxPagesToShow + 1, 1);
    }

    // Handle page change
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const handleIncreaseCapacity = () => {
        handleSectionChange(sectionChangeData.subjectId, sectionChangeData.sectionNumber);
        onCloseIncreaseCapacity();
    }

    return (
        <Flex flexDirection='column'>
            {/* Search Input */}
            <InputGroup>
                <Input 
                    variant='flushed' 
                    placeholder="Search" 
                    marginBottom='20px' 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <InputLeftElement>
                    <Search2Icon />
                </InputLeftElement>
                <InputRightElement>
                    <Tooltip isDisabled={isDisabled} label='Clear Search Bar' fontSize='md'>
                        <CloseButton onClick={() => setSearchQuery('')} />
                    </Tooltip>
                </InputRightElement>
            </InputGroup>

            {loading ? (
                <Text>Loading subjects...</Text>
            ) : filteredData.length === 0 ? (
                <Flex justifyContent='center' alignItems="center" height="50vh" flexDirection='column'>
                    <InfoIcon boxSize={20} />
                    <Text mt={2} mb={4}>There's no existing subjects currently.</Text>
                </Flex>
            ) : (
                <>
                    {/* Display subjects in a grid */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} >
                        {currentItems.map((subject) => {
                            const isSubjectDisabled = allStudentSubjects.some(
                                assignedSubject =>
                                    assignedSubject.subject_id === subject.id &&
                                    (assignedSubject.year.toString() !== year.toString() || assignedSubject.semester.toString() !== semester.toString())
                            );
                            
                            return(
                            <Card
                                key={subject.id}
                                direction={{ base: 'column', sm: 'row' }}
                                overflow='hidden'
                                variant='outline'
                                opacity={isSubjectDisabled ? 0.5 : 1}
                                cursor={isSubjectDisabled ? 'not-allowed' : 'pointer'}
                                size='sm'
                            >
                                <Flex>
                                    <Image
                                        objectFit='cover'
                                        maxW={{ base: '100%', sm: '75px' }}
                                        maxH={{ base: '100%', sm: '75px' }}
                                        src={subject.profile_picture}
                                        alt={subject.name}
                                    />
                                    <Stack spacing={2} flex="1">
                                        <CardBody>
                                            <Flex align="center">
                                                <Heading size='xs'>{subject.code}</Heading>
                                                <Tag marginLeft='10px' size="sm">{subject.section}</Tag>
                                            </Flex>
                                            <Text fontSize='sm' py='2'>
                                                {subject.name} 
                                            </Text>
                                        </CardBody>
                                    </Stack>
                                </Flex>
                                <Flex alignItems="center" marginLeft="auto" >
                                    {/* Display section selector and buttons */}
                                    
                                    {
                                    isSubjectDisabled?
                                        <>
                                            <FormControl width='200px'>
                                                <Tooltip label='Already selected' fontSize='md'>
                                                    <Text fontSize='sm'>
                                                        This subject is already selected by other session<b>
                                                        {subjectSections[subject.id] ? ` - Section ${subjectSections[subject.id]}` : ' - No section for this subject yet'}</b>
                                                    </Text>
                                                </Tooltip>
                                            </FormControl>
                                        </>
                                    :
                                    selectedSubjects.includes(subject.id) ?
                                        <>
                                            <FormControl width='110px' isRequired >
                                                <Tooltip isDisabled={isDisabled} label='Select a Section' fontSize='md'>
                                                <Select
                                                    size='sm'
                                                    width='105px'
                                                    borderRadius='10px'
                                                    value={subjectSections[subject.id] || ''}
                                                    onChange={(e) => {
                                                        const selectedSection = e.target.value;
                                                        const currentSubjectSection = subject.sections.find(section =>
                                                            section.section_number === parseInt(selectedSection, 10)
                                                        );
                                                        const currentStudentCount = currentSubjectSection ? currentSubjectSection.total_students : 0;
                                                        const maxStudents = currentSubjectSection ? currentSubjectSection.max_students : 0;

                                                        if (maxStudents && currentStudentCount >= maxStudents) {
                                                            setSectionChangeData({ subjectId: subject.id, sectionNumber: parseInt(selectedSection, 10) });
                                                            onOpenIncreaseCapacity();
                                                        } else {
                                                            handleSectionChange(subject.id, selectedSection);
                                                        }
                                                    }}
                                                >
                                                    <option value=''>Select Section</option>
                                                    {Array.from({ length: subject.number_of_sections }, (_, i) => {
                                                        const sectionNumber = i + 1;
                                                        const currentSubjectSection = subject.sections.find(section =>
                                                            section.section_number === sectionNumber
                                                        );
                                                        const currentStudentCount = currentSubjectSection ? currentSubjectSection.total_students || 0 : 0;
                                                        const maxStudents = currentSubjectSection ? currentSubjectSection.max_students || 0 : 0;
                                                        return (
                                                            <option key={i} value={sectionNumber}>
                                                                Section {sectionNumber} ({currentStudentCount}/{maxStudents})
                                                            </option>
                                                        );
                                                    })}
                                                </Select>
                                                </Tooltip>
                                            </FormControl>
                                            <Tooltip isDisabled={isDisabled} label='Remove' fontSize='md'>
                                                <Button
                                                    variant='solid'
                                                    width='90px'
                                                    colorScheme='green'
                                                    size='sm'
                                                    marginRight='10px'
                                                    onClick={() => handleSelectSubject(subject.id)}
                                                >
                                                    <CheckIcon marginRight='5px' /> Selected
                                                </Button>
                                            </Tooltip>
                                        </>
                                        :
                                        <Tooltip isDisabled={isDisabled} label='Add' fontSize='md'>
                                            <Button
                                                marginRight='10px'
                                                width='90px'
                                                variant='outline'
                                                colorScheme='blue'
                                                size='sm'
                                                onClick={() => handleSelectSubject(subject.id)}
                                            >
                                                Add
                                            </Button>
                                        </Tooltip>
                                    }
                                </Flex>
                            </Card>
                        )})}
                    </SimpleGrid>

                    {/* Pagination Controls */}
                    <HStack spacing={4} marginTop='20px' justifyContent="center">
                        <Tooltip isDisabled={isDisabled} label='Previous Page' fontSize='md'>
                            <IconButton
                                icon={<ChevronLeftIcon />}
                                isDisabled={currentPage === 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                            />
                        </Tooltip>
                        {startPage > 1 && (
                            <>
                                <Button
                                    variant='outline'
                                    colorScheme='blue'
                                    size='sm'
                                    onClick={() => handlePageChange(1)}
                                >
                                    1
                                </Button>
                                {startPage > 2 && <Text>...</Text>}
                            </>
                        )}
                        {Array.from({ length: endPage - startPage + 1 }, (_, index) => (
                            <Button
                                key={startPage + index}
                                variant={currentPage === startPage + index ? 'solid' : 'outline'}
                                colorScheme='blue'
                                size='sm'
                                onClick={() => handlePageChange(startPage + index)}
                            >
                                {startPage + index}
                            </Button>
                        ))}
                        {endPage < totalPages && (
                            <>
                                {endPage < totalPages - 1 && <Text>...</Text>}
                                <Button
                                    variant='outline'
                                    colorScheme='blue'
                                    size='sm'
                                    onClick={() => handlePageChange(totalPages)}
                                >
                                    {totalPages}
                                </Button>
                            </>
                        )}
                        <Tooltip isDisabled={isDisabled} label='Next Page' fontSize='md'>
                            <IconButton
                                icon={<ChevronRightIcon />}
                                isDisabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            />
                        </Tooltip>
                    </HStack>
                </>
            )}

            {/* Confirm Button */}
            <Tooltip isDisabled={isDisabled} label='Confirm' fontSize='md'>
                <Button margin='20px 0' onClick={handleSubmit} colorScheme="teal" isDisabled={loading}>
                    <CheckIcon ml={1} mr={1}/> Confirm
                </Button>
            </Tooltip>

            <AlertDialog isCentered isOpen={isOpenIncreaseCapacity} onClose={onCloseIncreaseCapacity}>
                <AlertDialogOverlay/>
                <AlertDialogContent>
                    <AlertDialogHeader>Increase Capacity</AlertDialogHeader>
                    <AlertDialogBody>
                        The selected section is full. Would you like to increase the capacity?
                    </AlertDialogBody>
                    <AlertDialogFooter display='flex' justifyContent='space-between'>
                        <Button colorScheme="red" width='40%' ref={cancelRef} onClick={onCloseIncreaseCapacity}>Cancel</Button>
                        <Button colorScheme="teal" width='40%' ml={3} onClick={handleIncreaseCapacity}>
                            Increase Capacity
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Flex>
    );
};

export default Assign_Student_Subject;
