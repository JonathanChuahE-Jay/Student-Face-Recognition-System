import { Accordion, AccordionButton, AccordionIcon, AccordionItem, AccordionPanel, AlertDialog, AlertDialogBody, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogOverlay, Avatar, Badge, Box, Button, Divider, Flex, Grid, GridItem, Image, Input, InputGroup, InputLeftAddon, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay, Text, Textarea, Tooltip, useBreakpointValue, useDisclosure, useToast } from "@chakra-ui/react";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import AssignSubjectStudent from "./Assign_Subject_Student";
import { DeleteIcon } from "@chakra-ui/icons";
const ViewStudentCourse = ({ student, isDisabled, onRefresh }) => {
    const [courses, setCourses] = useState(null);
    const [year, setYear] = useState(0); 
    const [semester, setSemester] = useState(0); 
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [currentYear, setCurrentYear] = useState(null); 
    const [currentSemester, setCurrentSemester] = useState(null); 
    const [deleteInfo, setDeleteInfo]= useState(null)

    const cancelRef = useRef()
    const toast = useToast(); 

    const { isOpen: isOpenAddSubjectModal, onOpen: onOpenAddSubjectModal, onClose: onCloseAddSubjectModal } = useDisclosure();  
    const { isOpen: isOpenDeleteAlert, onOpen: onOpenDeleteAlert, onClose: onCloseDeleteAlert } = useDisclosure();  

    const fetchStudentCourses = async () => {
        try {
            const response = await axios.post('/display-student-course-subjects', { prefix: student.prefix , student_id: student.id});
            const { course, subjects } = response.data;
            setSelectedSubjects(subjects);
            setCourses(course);
            setYear(parseInt(course.years, 10) || 0); 
            setSemester(parseInt(course.semesters, 10) || 0); 
        } catch (error) {
            console.error('Error fetching student course subjects:', error);
        }
    };
    
    useEffect(() => {
        fetchStudentCourses();
    }, [student]);

    // Helper function to count subjects for each year and semester
    const countSubjectsForSemester = (year, semester) => {
        return selectedSubjects.filter(subject =>
            parseInt(subject.year, 10) === year && parseInt(subject.semester, 10) === semester
        ).length;
    };

    // Helper function to count subjects for a given year (across all semesters)
    const countSubjectsForYear = (year) => {
        return Array.from({ length: semester }, (_, semesterIndex) =>
            countSubjectsForSemester(year, semesterIndex + 1)
        ).reduce((total, count) => total + count, 0);
    };

    // Helper function to count the total number of subjects
    const countTotalSubjects = () => {
        return Array.from({ length: year }, (_, yearIndex) =>
            countSubjectsForYear(yearIndex + 1)
        ).reduce((total, count) => total + count, 0);
    };

    //Handle Delete
    const handleDelete = async (subject_id) => {
        try {
            await axios.post('/delete-assigned-subject', {
                subject_id
            });
            onCloseDeleteAlert();
            toast({
                title: "Subject deleted.",
                position: 'top-right',
                description: `The subject has been successfully removed.`,
                status: "success",
                duration: 5000,
                isClosable: true,
            });
            onRefresh();
            fetchStudentCourses();
        } catch (error) {
            console.error('Error deleting the subject:', error);
            const errorMessage = error.response?.data?.message || "An error occurred while deleting the subject.";

            toast({
                title: "Error deleting subject.",
                position: 'top-right',
                description: errorMessage,
                status: "error",
                duration: 5000,
                isClosable: true,
            });
        }
    };


    const openDeleteAlert = (subject_name, subject_id, year, semester) => {
        setDeleteInfo({ subject_name, subject_id, year, semester });
        onOpenDeleteAlert();
    }

    const closeAddSubjectModal = () =>{
        fetchStudentCourses();
        onCloseAddSubjectModal();
    }

    const openAddSubjectModal = (year, semester) => {
        setCurrentYear(year);
        setCurrentSemester(semester);
        onOpenAddSubjectModal();
    };
    

    const buttonMinWidth = useBreakpointValue({ base: "80px", md: "85px" });
    const buttonMinHeight = useBreakpointValue({ base: "10px", md: "15px"});
    const headerSize = useBreakpointValue({ base: '13px', md: '14px', xl: '15px' });
    const textSize = useBreakpointValue({ base: '12px', md: '12px', xl: '13px' });
    const badgeSize = useBreakpointValue({ base: '10px', md: '11px' });
    const avatarSize = useBreakpointValue({ base: "sm", md: "md" });
    const boxPadding = useBreakpointValue({ base: 2, md: 3 });
    const grid = useBreakpointValue({ base: '1fr', md: 'repeat(2,1fr)' , xl: 'repeat(3,1fr)'});

    const defaultSemesterIndex = Array.from({ length: semester }, (_, semesterIndex) => semesterIndex);
    const defaultYearIndex = Array.from({ length: year }, (_, yearIndex) => yearIndex);

    return (
        <Flex flexDirection='column'>
            <Flex direction="column" alignItems="center" mb={4}>
            <Flex width="100%" maxWidth="1200px" alignItems="center" justifyContent="space-between">
                <Box flex="1" mr={6}>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Name:
                        </InputLeftAddon>
                        <Input disabled value={courses?.name || ''} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Code:
                        </InputLeftAddon>
                        <Input disabled value={courses?.code || ''} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Total Duration:
                        </InputLeftAddon>
                        <Input disabled value={`${courses?.years || 0} Years ${courses?.semesters || 0} Semesters`} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Total Subjects:
                        </InputLeftAddon>
                        <Input disabled value={countTotalSubjects()} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Current intake:
                        </InputLeftAddon>
                        <Input disabled value={`Year ${student.current_year} Semester ${student.current_semester}`} />
                    </InputGroup>
                </Box>
                <Image
                    src={courses?.profile_picture || 'https://via.placeholder.com/150'}
                    alt={`${courses?.course_name || 'Course'} Profile Picture`}
                    boxSize="180px"
                    objectFit="cover"
                    borderRadius="md"
                />
            </Flex>
            <Box width="100%" mt={4} maxWidth="1200px">
                <InputGroup>
                    <InputLeftAddon height='auto' width="150px" justifyContent="center" fontWeight="bold" alignItems="flex-start" paddingY={2}>
                        Description:
                    </InputLeftAddon>
                    <Textarea resize="none" size="sm" disabled value={courses?.description || ''} />
                </InputGroup>
            </Box>
        </Flex>
        <Divider mb={5}/>
            <Accordion defaultIndex={defaultYearIndex} allowMultiple>
                {Array.from({ length: year }, (_, yearIndex) => (
                    <AccordionItem key={`year-${yearIndex}`}>
                        <AccordionButton>
                            <Box flex='1' textAlign='left'>
                                Year {yearIndex + 1} ({countSubjectsForYear(yearIndex + 1)} subjects)
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel>
                            <Accordion defaultIndex={defaultSemesterIndex} allowMultiple>
                                {Array.from({ length: semester }, (_, semesterIndex) => (
                                    <AccordionItem  key={`semester-${yearIndex}-${semesterIndex}`}>
                                        <AccordionButton>
                                            <Box flex='1' textAlign='left'>
                                                Semester {semesterIndex + 1}  ({countSubjectsForSemester(yearIndex + 1, semesterIndex + 1)} subjects)
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel>
                                            <Grid templateColumns={grid} gap={4}>
                                                {selectedSubjects
                                                    .filter(subject =>
                                                        parseInt(subject.year, 10) === yearIndex + 1 &&
                                                        parseInt(subject.semester, 10) === semesterIndex + 1
                                                    )
                                                    .map((subject) => (
                                                        <GridItem key={subject.id}>
                                                            <Box mb={4} p={boxPadding} borderWidth="1px" borderRadius="md">
                                                                <Flex alignItems="center">
                                                                    <Avatar
                                                                        src={subject.profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'}
                                                                        size={avatarSize}
                                                                    />
                                                                    <Box ml={3} mr={5}>
                                                                        <Text fontWeight="bold" fontSize={headerSize}>
                                                                            {subject.code}
                                                                            <Badge ml={1} fontSize={badgeSize} variant="subtle" colorScheme="green">
                                                                                {subject.section}
                                                                            </Badge>
                                                                        </Text>
                                                                        <Text whiteSpace="nowrap" fontSize={textSize} as="u">{subject.name}</Text>
                                                                    </Box>
                                                                    <Flex ml="auto">
                                                                        <Tooltip isDisabled={isDisabled} label='Delete Subject' fontSize='md'>
                                                                            <Button
                                                                                padding='5px'
                                                                                colorScheme='red'
                                                                                minHeight={buttonMinHeight}
                                                                                minWidth={buttonMinWidth}
                                                                                size='sm'
                                                                                textAlign="center"
                                                                                onClick={() => openDeleteAlert(subject.name, subject.id)}
                                                                            >
                                                                                <DeleteIcon />
                                                                            </Button>
                                                                        </Tooltip>
                                                                    </Flex>
                                                                </Flex>
                                                            </Box>
                                                        </GridItem>
                                                    ))}
                                            </Grid>
                                            <Flex justifyContent='center' mt={4}>
                                                <Button
                                                    colorScheme='blue'
                                                    size='sm'
                                                    onClick={() => openAddSubjectModal(yearIndex + 1, semesterIndex + 1)}
                                                >
                                                    Alter Subject
                                                </Button>
                                            </Flex>
                                        </AccordionPanel>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>
            <Modal isOpen={isOpenAddSubjectModal} size={'5xl'} onClose={closeAddSubjectModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add Subjects for Year {currentYear} Semester {currentSemester}</ModalHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'>
                        <ModalCloseButton />
                    </Tooltip>
                    <ModalBody>
                        <AssignSubjectStudent
                            allStudentSubjects={selectedSubjects}
                            isDisabled={isDisabled}
                            student={student}
                            studentId={student?.id}
                            onClose={closeAddSubjectModal}
                            onRefresh={onRefresh}
                            year={currentYear}
                            semester={currentSemester}
                        />
                    </ModalBody>
                </ModalContent>
            </Modal>
            <AlertDialog isCentered isOpen={isOpenDeleteAlert} onClose={onCloseDeleteAlert}>
                <AlertDialogOverlay/>
                <AlertDialogContent>
                    <AlertDialogHeader>Delete confirmation</AlertDialogHeader>
                    <AlertDialogBody>
                        {deleteInfo ? (
                            <>
                                Are you sure you want to remove this subject?
                                <br/>
                                <strong>{deleteInfo.subject_name}</strong>
                            </>
                        ) : (
                            'No subject selected.'
                        )}
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onCloseDeleteAlert}>Cancel</Button>
                        <Button colorScheme='red' onClick={()=>{handleDelete(deleteInfo.subject_id)}} ml={3}>
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Flex>
    );
};

export default ViewStudentCourse;
