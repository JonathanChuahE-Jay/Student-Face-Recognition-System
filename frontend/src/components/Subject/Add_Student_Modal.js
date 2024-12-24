import React, { useState, useEffect } from 'react';
import {
    ModalBody,
    ModalFooter,
    Button,
    Box,
    Image,
    Text,
    Flex,
    VStack,
    HStack,
    IconButton,
    Input,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    CloseButton,
    Grid,
    GridItem,
    Checkbox,
    Wrap,
    WrapItem,
    useToast,
    Badge,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogBody,
    AlertDialogFooter,
    useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import { ChevronLeftIcon, ChevronRightIcon, DeleteIcon, Search2Icon } from '@chakra-ui/icons';

const AddStudentModal = ({ subject_sections, exisitingStudents, onClose, subject_id, subject , onRefresh}) => {
    const [allStudents, setAllStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedSection, setSelectedSection] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [tempSection, setTempSection] = useState('');
    const studentsPerPage = 6;
    const toast = useToast();

    const {isOpen: isOpenIncreaseCapacity, onOpen: onOpenIncreaseCapacity, onClose: onCloseIncreaseCapacity} = useDisclosure();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const response = await axios.get('/show-students');
                setAllStudents(response.data);
            } catch (err) {
                console.error('Error fetching students:', err);
            }
        };

        setSelectedStudents([...exisitingStudents]);

        fetchStudents();
    }, []);

    const handleStudentSelect = (student) => {
        if (selectedStudents.some(s => s.id === student.id)) {
            // Remove student if already selected
            setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
        } else {
            if(!selectedSection){
                toast({
                    title: 'Unable to add student',
                    description: "Please select a section to add a student",
                    status: 'error',
                    duration: 1000,
                    position: 'top-right',
                    isClosable: true,
                  })

            }else{
                // Add student to selected list with the selected section
                const studentWithSection = { ...student, subject_section: parseInt(selectedSection, 10), subject_id };
                setSelectedStudents([...selectedStudents, studentWithSection]);
            }
        }
    };

    const handleAddStudents = () => {
        axios.post('http://localhost:5000/alter-assigned-student', {
            selectedStudents,
            mode: 'Assign',
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
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value.toLowerCase());
    };

    const handleSectionFilterChange = (section) => {
        setSelectedSection(section);
    }

    // Filter students based on search query
    const filteredStudents = allStudents.filter(student =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredSelectedStudents = selectedStudents.filter(student => {
        const sectionString = student.subject_section ? student.subject_section.toString().toLowerCase() : 'N/A';
    
        return (
            student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sectionString.includes(searchQuery.toLowerCase()) ||
            `section ${sectionString}`.includes(searchQuery.toLowerCase())
        );
    });
    const handleExceed = (section) =>{
        setTempSection(section);
        onOpenIncreaseCapacity()
    }

    // Pagination Logic
    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    return (
        <ModalBody>
            <InputGroup>
                <InputLeftElement><Search2Icon/></InputLeftElement>
                    <Input
                        variant='flushed'
                        placeholder="Search students..."
                        mb={4}
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                <InputRightElement><CloseButton onClick={()=> setSearchQuery('')}/></InputRightElement>
            </InputGroup>
            <Wrap>
                {[...Array(subject.number_of_sections)].map((_, index) => {
                    const section = (index + 1).toString();
                    const filteredSections = subject_sections.filter(sub => sub.section_number == section);
                    const currentStudents = filteredSections.length>0? filteredSections[0].current_students : 'N/A';
                    const maxStudents = filteredSections.length > 0 ? filteredSections[0].max_students : "N/A"; 
                    const exceed = currentStudents < maxStudents;
                    return (
                        <WrapItem key={section}>
                            <Box
                                border="2px"
                                borderColor={selectedSection === section ? "blue.500" : "gray.200"}
                                borderRadius="md"
                                p={2}
                                transition="all 0.2s"
                                _hover={{ borderColor: "blue.500" }}
                                _checked={{ bg: "blue.100", borderColor: "blue.500" }}
                            >
                                <Checkbox
                                    size="md"
                                    colorScheme="blue"
                                    iconColor="white"
                                    isChecked={selectedSection === section}
                                    onChange={() => {exceed? handleSectionFilterChange(section): handleExceed(section)}}
                                >
                                    Section {section}
                                    {
                                        exceed?
                                            <Badge ml='2' colorScheme='green'>{currentStudents} / {maxStudents}</Badge>
                                        :
                                            <Badge ml='2' colorScheme='red'>{currentStudents} / {maxStudents}</Badge>
                                    }
                                    
                                </Checkbox>
                            </Box>
                        </WrapItem>
                    );
                })}
            </Wrap>
            <Flex mt={2}>
                <Text flex="1" fontWeight="bold" mb={4}>Selected Students</Text>
                <Text flex="1" fontWeight="bold" mb={4}>Available Students</Text>
            </Flex>
            <Flex>
                <Box flex="1" p={4} borderRightWidth={1} height='60vh' overflowY="auto">
                    {filteredSelectedStudents.length > 0 ? (
                        filteredSelectedStudents.map((student) => (
                            <HStack key={student.id} p={2} borderWidth={1} borderRadius="md" mb={2}>
                                <Image
                                    borderRadius="full"
                                    boxSize="50px"
                                    src={student.profile_picture}
                                    alt={student.name}
                                />
                                <VStack align="start">
                                    <Text fontWeight="bold">{student.name}</Text>
                                    <Text>Section: {student.subject_section}</Text>
                                </VStack>
                                <Flex ml='auto'>
                                    <IconButton icon={<DeleteIcon />} colorScheme="red" onClick={() => handleStudentSelect(student)} />
                                </Flex>
                            </HStack>
                        ))
                    ) : (
                        <Text>No students selected</Text>
                    )}
                </Box>
                <Box flex="1" p={4} overflowY="auto">
                    <Grid
                        gap='3'
                        templateColumns='repeat(2,1fr)'
                    >
                    {currentStudents.length > 0 ? (
                        currentStudents.map((student) => (
                            <GridItem
                                key={student.id}
                                p={4}
                                borderWidth={1}
                                borderRadius="md"
                                mb={2}
                                bg={selectedStudents.some(s => s.id === student.id) ? 'green.100' : 'transparent'}
                                _hover={{ bg: selectedStudents.some(s => s.id === student.id) ? 'green.400' : 'gray.400', cursor: 'pointer' }}
                                onClick={() => handleStudentSelect(student)}
                            >
                                    <Image
                                        borderRadius="full"
                                        boxSize="50px"
                                        src={student.profile_picture}
                                        alt={student.name}
                                    />
                                    <Text fontWeight="bold">{student.name}</Text>
                            </GridItem>
                        ))
                    ) : (
                        <Text>No students available</Text>
                    )}
                    </Grid>
                    <Flex mt={4} justify="space-between">
                        <IconButton
                            icon={<ChevronLeftIcon />}
                            onClick={handlePrevPage}
                            isDisabled={currentPage === 1}
                        />
                        <Text>{`Page ${currentPage} of ${totalPages}`}</Text>
                        <IconButton
                            icon={<ChevronRightIcon />}
                            onClick={handleNextPage}
                            isDisabled={currentPage === totalPages}
                        />
                    </Flex>
                </Box>
            </Flex>
            <ModalFooter display='flex' justifyContent='space-between'>
                <Button width='40%' colorScheme="red" onClick={onClose}>Cancel</Button>
                <Button width='40%' colorScheme="blue" mr={3} onClick={handleAddStudents} isDisabled={selectedStudents.length === 0}>
                    Add Students
                </Button>
            </ModalFooter>
            <AlertDialog isCentered isOpen={isOpenIncreaseCapacity} onClose={onCloseIncreaseCapacity}>
                <AlertDialogOverlay/>
                <AlertDialogContent>
                    <AlertDialogHeader>Increase Capacity</AlertDialogHeader>
                    <AlertDialogBody>
                        The selected section is full. Would you like to increase the capacity?
                    </AlertDialogBody>
                    <AlertDialogFooter display='flex' justifyContent='space-between'>
                        <Button colorScheme="red" width='40%' onClick={onCloseIncreaseCapacity}>Cancel</Button>
                        <Button
                            colorScheme="teal"
                            width='40%'
                            ml={3}
                            onClick={() => {
                                handleSectionFilterChange(tempSection);
                                onCloseIncreaseCapacity();
                            }}
                        >
                            Increase Capacity
                        </Button>

                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ModalBody>
    );
};

export default AddStudentModal;
