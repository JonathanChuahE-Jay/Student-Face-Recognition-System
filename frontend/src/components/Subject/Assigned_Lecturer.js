import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
    Card,
    CardBody,
    Image,
    Text,
    SimpleGrid,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    useDisclosure,
    useToast,
    AlertDialog,
    AlertDialogOverlay,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    InputGroup,
    InputLeftElement,
    Input,
    InputRightElement,
    CloseButton,
    useColorModeValue,
    Box,
    Flex
} from "@chakra-ui/react";
import AssignLecturerModal from "./Assign_Lecturer_Modal";
import { Search2Icon } from "@chakra-ui/icons";

const AssignedLecturer = ({ search, height, subject_id, user }) => {
    const [lecturers, setLecturers] = useState([]);
    const [subject, setSubject] = useState([]);
    const [currentSection, setCurrentSection] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentLecturer, setCurrentLecturer] = useState({ id: '', name: '', subject_section: '' });

    const cancelRef = useRef();
    const toast = useToast();

    const { isOpen: isOpenAssignLecturers, onOpen: onOpenAssignLecturers, onClose: onCloseAssignLecturers } = useDisclosure();
    const { isOpen: isOpenDeleteAlert, onOpen: onOpenDeleteAlert, onClose: onCloseDeleteAlert } = useDisclosure();

    const fetchData = async () => {
        try {
            const response = await axios.post('/display-assigned-student-and-lecturer', { subject_id });
            const { lecturers, subject } = response.data;
            setLecturers(lecturers);
            setSubject(subject);
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
        }
    };

    useEffect(() => {
        fetchData();
    }, [subject_id]);
    
    useEffect(()=>{
        setSearchQuery(search);
    },[search])

    const sectionCards = Array.from({ length: subject.number_of_sections }, (_, i) => i + 1);

    const handleAssignLecturer = (subIndex) => {
        setCurrentSection(subIndex);
        onOpenAssignLecturers();
    };

    const handleDeleteConfirmation = (lecturer) => {
        const { subject_section, id, name } = lecturer;
        setCurrentLecturer({ id, name, subject_section });
        onOpenDeleteAlert();
    };

    const handleRemoveLecturer = async (lecturer_id, subject_section) => {
        try {
            const response = await axios.post('/alter-assigned-lecturer', { lecturer_id, subject_section, subject_id, mode: 'Delete' });
            const { message } = response.data;
            toast({
                title: 'Success',
                position: 'top-right',
                description: message || 'Lecturer successfully removed',
                status: 'success',
                duration: 1000,
                isClosable: true,
            });
            onCloseDeleteAlert();
            fetchData(); 
        } catch (error) {
            console.error('Error removing lecturer:', error);
            toast({
                title: 'Error',
                position: 'top-right',
                description: error.response?.data?.error || `An error occurred: ${error.message}`,
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };
    const filteredLecturers = (searchQuery && searchQuery.length > 0)
    ? lecturers.filter((lecturer) => {
        if (!lecturer) return false;  
        return (
          (lecturer.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (lecturer.subject_section?.toString().toLowerCase().includes(searchQuery.toLowerCase())) ||
          (`Section: ${lecturer.subject_section}`.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      }) 
    : lecturers; 
    
    const sectionsToDisplay = searchQuery
        ? filteredLecturers.map(lecturer => lecturer.subject_section)
        : sectionCards;
    
    const inputBg = useColorModeValue('white','gray.600');
    return (
        <Box p={2} height={height??'100%'} overflowY='scroll'>
            <InputGroup mb={3} position="sticky" zIndex='1' top="-8px" boxShadow='lg' borderRadius='10px' bg={inputBg}>
                <InputLeftElement><Search2Icon/></InputLeftElement>
                <Input
                    variant='flushed'
                    placeholder="Search by name or section"
                    value={searchQuery}
                    onChange={(e)=>{setSearchQuery(e.target.value)}}
                />
                <InputRightElement>
                    <CloseButton onClick={() => setSearchQuery('')} />
                </InputRightElement>
            </InputGroup>
            <SimpleGrid spacing={4} templateColumns='repeat(auto-fill, minmax(250px, 1fr))'>
                {sectionsToDisplay.map(subIndex => {
                    const lecturer = lecturers.find(lecturer => lecturer.subject_section === subIndex);

                    return (
                        <Card key={subIndex}>
                            <CardBody display='flex' justifyContent='center' flexDirection='column'>
                                <Flex justifyContent='center' alignItems='center'>
                                    <Image 
                                        width='250px'
                                        height='250px'
                                        src={lecturer?.profile_picture} 
                                        alt={`${lecturer?.name || 'No lecturer'}'s profile picture`} 
                                        fallbackSrc='https://via.placeholder.com/150'
                                    />
                                </Flex>
                                
                                <Text size="md"><b>Lecturer name:</b> {lecturer?.name || 'Not Assigned'}</Text>
                                <Text mb={5}><b>Section:</b> {lecturer ? lecturer.subject_section : subIndex}</Text>

                                {
                                user.role === 'admin'?
                                    lecturer ? (
                                        <Button marginTop='auto' onClick={() => handleDeleteConfirmation(lecturer)}>Remove Lecturer</Button>
                                    ) : (
                                        <Button onClick={() => handleAssignLecturer(subIndex)} marginTop='auto'>Assign Lecturer</Button>
                                    )
                                    :
                                null
                                }
                            </CardBody>
                        </Card>
                    );
                })}
            </SimpleGrid>
            <Modal isOpen={isOpenAssignLecturers} onClose={onCloseAssignLecturers} size='lg'>
                <ModalOverlay />
                <ModalContent height='70vh'>
                    <ModalHeader>Assign Lecturer for section {currentSection} </ModalHeader>
                    <ModalCloseButton />
                    <ModalBody>
                        <AssignLecturerModal onRefresh={fetchData} onClose={onCloseAssignLecturers} currentSection={currentSection} subject_id={subject_id}/>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <AlertDialog
                motionPreset='slideInBottom'
                leastDestructiveRef={cancelRef}
                onClose={onCloseDeleteAlert}
                isOpen={isOpenDeleteAlert}
                isCentered
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>Discard Changes?</AlertDialogHeader>
                    <AlertDialogCloseButton />
                    <AlertDialogBody>
                        Are you sure you want to remove {currentLecturer.name} from section {currentLecturer.subject_section}?
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onCloseDeleteAlert}>
                            No
                        </Button>
                        <Button colorScheme='red' ml={3} onClick={() => handleRemoveLecturer(currentLecturer.id, currentLecturer.subject_section)}>
                            Yes
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
};

export default AssignedLecturer;
