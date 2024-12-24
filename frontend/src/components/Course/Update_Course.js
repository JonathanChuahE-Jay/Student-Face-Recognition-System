import React, { useCallback, useEffect, useState } from "react";
import imageCompression from 'browser-image-compression';
import { AddIcon, CheckIcon, DeleteIcon, EditIcon, HamburgerIcon, Search2Icon } from "@chakra-ui/icons";
import { useToast, Button, Flex, Input, Textarea, useBreakpointValue, Box, 
        InputGroup, InputLeftElement, InputRightElement, CloseButton, Divider, 
        Accordion, AccordionItem, AccordionButton, AccordionPanel, Grid, 
        GridItem, Card, CardHeader, Image, Badge, Text, CardBody, 
        AccordionIcon, InputLeftAddon, Avatar, AvatarBadge, Modal, 
        ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, 
        ModalBody, useDisclosure, Drawer, DrawerOverlay, DrawerContent, 
        DrawerCloseButton, DrawerHeader, DrawerBody, Select, 
        Switch, IconButton, FormLabel, Popover, PopoverTrigger, 
        PopoverContent, PopoverBody, 
        Tooltip,
        useColorModeValue,
        AlertDialog,
        AlertDialogOverlay,
        AlertDialogContent,
        AlertDialogHeader,
        AlertDialogBody,
        AlertDialogFooter
    } from "@chakra-ui/react";
import AddSubjects from "./Add_Subjects";
import AddDuration from "./Add_Duration";
import axios from "axios";

const UpdateCourse = ({ course, isDisabled, onClose ,onRefresh}) => {
    const [coursePicture, setCoursePicture] = useState(course.course_profile_picture || null);
    const [courseName, setCourseName] = useState(course.course_name);
    const [courseCode, setCourseCode] = useState(course.course_code);
    const [courseDescription, setCourseDescription] = useState(course.course_description);
    const [years, setYears]= useState(course.course_years);
    const [semesters, setSemesters]= useState(course.course_semesters);
    const [subjects, setSubjects] = useState(course.subjects);
    const [currentSubjects, setCurrentSubjects] = useState([]);
    const [assignedYear, setAssignedYear] = useState('');
    const [assignedSemester, setAssignedSemester] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [programme, setProgramme] = useState(course.course_programme);
    const [removeEmptySession, setRemoveEmptySession] = useState(false);

    const toast = useToast();
    const grid = useBreakpointValue({ sm: '1fr', xl: 'repeat(2,1fr)' });

    const {isOpen: isOpenAddSubject, onOpen: onOpenAddSubject, onClose: onCloseAddSubject} = useDisclosure();
    const {isOpen: isOpenAddDuration, onOpen: onOpenAddDuration, onClose: onCloseAddDuration} = useDisclosure();
    const {isOpen: isOpenDeleteConfirmation, onOpen:onOpenDeleteConfirmation, onClose: onCloseDeleteConfirmation} = useDisclosure();

    useEffect(() => {
        setSubjects(prevSubjects => prevSubjects.filter(sub => 
            sub.year <= years && sub.semester <= semesters
        ));
    }, [years, semesters]); 
    
    const handleProfilePicture = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const options = {
                maxSizeMB: 0.1,
                maxWidthOrHeight: 200,
                useWebWorker: true,
            };

            try {
                const compressedFile = await imageCompression(file, options);
                const reader = new FileReader();
                reader.onloadend = () => {
                    setCoursePicture(reader.result);
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Failed to compress the image.',
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        }
    };

    const handleDeleteCourse = async () => {
        try {
            const response = await axios.post('/delete-course', {
                id: course.course_id
            });
    
            if (response.status === 200) {
                toast({
                    title: 'Course Deleted',
                    position: 'top-right',
                    description: 'The course has been deleted successfully.',
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });
                onRefresh();
                onClose();
            } else {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Failed to delete the course.',
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error deleting course:', error);
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'An error occurred while deleting the course.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };
    

    const handleUpdateCourse = async () => {
        const updatedCourse = {
            ...course,
            course_name: courseName,
            course_code: courseCode,
            course_description: courseDescription,
            course_profile_picture: coursePicture,
            course_years: years,
            course_semesters: semesters,
            subjects: subjects,
            course_id: course.course_id, 
            course_programme: programme,
        };
    
        try {
            const response = await axios.post('/update-course',updatedCourse);
    
            if (response.status === 200) {
                toast({
                    title: 'Course Updated',
                    position: 'top-right',
                    description: 'The course has been updated successfully.',
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });
                onRefresh();
                onClose();
            } else {
                throw new Error('Failed to update course');
            }
        } catch (error) {
            console.error('Error updating course:', error);
            toast({
                title: 'Error',
                position: 'top-right',
                description: 'There was an error updating the course.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };
    const handleDeleteSubject = useCallback((subjectId, year, semester) => {
        setSubjects(prevSubjects => prevSubjects.filter(sub => 
            !(sub.id === subjectId && sub.year === year && sub.semester === semester)
        ));
        toast({
            title: 'Subject Temporarily Deleted',
            position:'top-right',
            description: 'The subject has been temporarily deleted successfully.',
            status: 'info',
            duration: 1000,
            isClosable: true,
        });
    }, [toast]);

    const handleAddSubject = useCallback((subjects, year, semester) => {
        setAssignedSemester(semester);
        setAssignedYear(year);
    
        const filteredSubjects = subjects.filter(
            (subject) => subject.year === year && subject.semester === semester
        );
        setCurrentSubjects(filteredSubjects);
        onOpenAddSubject();
    }, [onOpenAddSubject]);

    const handleDuration = useCallback((years, semesters) => {
        setYears(years);
        setSemesters(semesters);
    }, []);
    
    const handleUpdate = useCallback((newSubjects, year, semester) => {
        setSubjects(prevSubjects => {
            const filteredSubjects = prevSubjects.filter(subject => !(subject.year === year && subject.semester === semester));
            
            const newSubjectsWithDetails = newSubjects.map(subject => ({
                ...subject,
                year: year,
                semester: semester
            }));
            
            return [...filteredSubjects, ...newSubjectsWithDetails];
        });
    }, []);

    useEffect(() => {
        if(searchQuery){
            setRemoveEmptySession(true);
        }
        if(!searchQuery){
            setRemoveEmptySession(false);
        }
    }, [searchQuery, course.subjects]);

    const filteredSubjects = searchQuery
        ? subjects.filter(sub =>
            sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sub.section.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : subjects;

    const inputBg = useColorModeValue('white','gray.600');
    
    return (
        <Box padding="20px" maxWidth="900px" margin="0 auto" boxShadow="md" borderRadius="md" >
            <Flex
                padding="10px"
                boxShadow="md"
                position="sticky"
                top="0"
                zIndex="2"
                width='100%'
                bg={inputBg}
                borderRadius="md"
                mb={5}
                alignItems="center"
                justifyContent="space-between"
            >
                <InputGroup width='90%'>
                    <InputLeftElement><Search2Icon /></InputLeftElement>
                    <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        variant='flushed'
                        placeholder="Search..."
                    />
                    <InputRightElement>
                        <Tooltip isDisabled={isDisabled} label='Clear Search Bar'><CloseButton onClick={() => setSearchQuery('')} /></Tooltip>
                    </InputRightElement>
                </InputGroup>
                <Popover>
                    <PopoverTrigger>
                        <IconButton width='10%' marginLeft='20px' icon={<HamburgerIcon boxSize={5}/>} variant='outline'/>
                    </PopoverTrigger>
                    <PopoverContent>
                        <PopoverBody display='flex' justifyContent='center' alignItems='center'>
                            <FormLabel>Hide empty sessions</FormLabel>
                            <Switch
                                isChecked={removeEmptySession}
                                onChange={(e) => setRemoveEmptySession(e.target.checked)}
                            />
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            </Flex>
            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                <Avatar
                    size="2xl"
                    src={coursePicture ||
                        'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'}
                    alt={`${courseName} Profile Picture`}
                >
                    <AvatarBadge bg={'white'} boxSize="1.25em">
                        <label
                            htmlFor="profilePictureInput"
                            style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                        >
                            <EditIcon boxSize="0.6em" color={'black'} />
                        </label>
                        <Input
                            name="profile_picture"
                            id="profilePictureInput"
                            type="file"
                            accept="image/*"
                            onChange={handleProfilePicture}
                            style={{ display: 'none' }}
                        />
                    </AvatarBadge>
                </Avatar>
                <Flex flexDirection="column" width="full" ml={6}>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Name:
                        </InputLeftAddon>
                        <Input value={courseName} onChange={(e) => setCourseName(e.target.value)} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Code:
                        </InputLeftAddon>
                        <Input value={courseCode} onChange={(e) => setCourseCode(e.target.value)} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Programme:
                        </InputLeftAddon>
                        <Select value={programme} onChange={(e)=>{setProgramme(e.target.value)}} required>
                            <option value=''>Select a programme</option>
                            <option value='Foundation'>Foundation</option>
                            <option value='Bachelor'>Bachelor</option>
                            <option value='Diploma'>Diploma</option>
                            <option value='Master'>Master</option>
                            <option value='Phd'>Phd</option>
                        </Select>
                    </InputGroup>
                    
                    <InputGroup mb={3}>
                        <InputLeftAddon height='auto' width="150px" justifyContent="center" fontWeight="bold" alignItems="flex-start" paddingY={2}>
                            Description:
                        </InputLeftAddon>
                        <Textarea resize="none" size="sm" value={courseDescription} onChange={(e) => setCourseDescription(e.target.value)} />
                    </InputGroup>
                </Flex>
            </Flex>
            <Flex justifyContent='space-between' mb={5}>
                <Tooltip label='Delete course' isDisabled={isDisabled}><Button width='40%'colorScheme="red"  onClick={onOpenDeleteConfirmation}><DeleteIcon mr={2} />Delete</Button></Tooltip>
                <Tooltip label='Confirm Update course' isDisabled={isDisabled}><Button colorScheme="teal" width='40%' onClick={handleUpdateCourse}><CheckIcon mr={2} />Update</Button></Tooltip>
            </Flex>
            <Divider mb={4} />
            <Flex mb={4}>
                <Text fontWeight="bold" mb={2}>Subjects:</Text>
                <Tooltip label='Alter total duration of the course' isDisabled={isDisabled}><Button size='sm' marginLeft='auto' onClick={onOpenAddDuration}>Alter duration</Button></Tooltip>
            </Flex>
            <Accordion allowMultiple>
                {Array.from({ length: years }, (_, yearIndex) => {
                    const totalSubjectsInYear = filteredSubjects.filter(sub => sub.year === yearIndex + 1).length;
                    // Filter semesters for the current year
                    const semestersWithSubjects = Array.from({ length: course.course_semesters }, (_, semesterIndex) => {
                        const subjectsInSemester = filteredSubjects.filter(sub =>
                            sub.year === yearIndex+1 &&
                            sub.semester === semesterIndex+1
                        );

                        return {subjectsInSemester };
                    }).filter(semesterData => semesterData.subjectsInSemester.length > 0);

                    if(removeEmptySession){
                        if(semestersWithSubjects.length > 0){
                            return (
                                <AccordionItem key={yearIndex}>
                                    <h2>
                                        <AccordionButton>
                                            <Box flex="1" textAlign="left">
                                                Year {yearIndex + 1} ({totalSubjectsInYear} subjects)
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                    </h2>
                                    <AccordionPanel pb={4}>
                                        <Accordion allowMultiple>
                                            {Array.from({ length: semesters }, (_, semesterIndex) => {
                                                const totalSubjectsInSemester = filteredSubjects.filter(sub =>
                                                    sub.year === yearIndex + 1 &&
                                                    sub.semester === semesterIndex + 1
                                                ).length;
                                                if(totalSubjectsInSemester){
                                                    return (
                                                        <AccordionItem key={semesterIndex}>
                                                            <h3>
                                                                <AccordionButton>
                                                                    <Box flex="1" textAlign="left">
                                                                        Semester {semesterIndex + 1} ({totalSubjectsInSemester} subjects)
                                                                    </Box>
                                                                    <AccordionIcon />
                                                                </AccordionButton>
                                                            </h3>
                                                            <AccordionPanel pb={4}>
                                                                <Grid templateColumns={grid} gap={2}>
                                                                    {filteredSubjects
                                                                        .filter(sub =>
                                                                            sub.year === yearIndex + 1 &&
                                                                            sub.semester === semesterIndex + 1
                                                                        )
                                                                        .map((subject) => (
                                                                            <GridItem key={subject.id}>
                                                                                <Card flexDirection='row' mb={5} variant='elevated' size='sm'>
                                                                                    <CardHeader>
                                                                                        <Image
                                                                                            src={subject.profile_picture || 'https://via.placeholder.com/100'}
                                                                                            alt={`${subject.name} Profile Picture`}
                                                                                            boxSize='60px'
                                                                                            objectFit="cover"
                                                                                            borderRadius="md"
                                                                                        />
                                                                                    </CardHeader>
                                                                                    <CardBody>
                                                                                        <Badge colorScheme="green"> {subject.section}</Badge>
                                                                                        <Text whiteSpace='nowrap' fontSize='sm'><b>Name:</b> {subject.name}</Text>
                                                                                        <Text whiteSpace='nowrap' fontSize='sm'><b>Code:</b> {subject.code}</Text>
                                                                                    </CardBody>
                                                                                    <Flex justifyContent='center' alignItems='center' mr={5}>
                                                                                        <Tooltip label='Temporary remove this subject' isDisabled={isDisabled}><Button colorScheme="red" onClick={() => handleDeleteSubject(subject.id, subject.year, subject.semester)}><DeleteIcon /></Button></Tooltip>
                                                                                    </Flex>
                                                                                </Card>
                                                                            </GridItem>
                                                                        ))}
                                                                    {totalSubjectsInSemester === 0 && (
                                                                        <Text mt={2} mb={5}>No subjects available for this semester.</Text>
                                                                    )}
                                                                </Grid>
                                                                <Tooltip label='Add subjects for this semester' isDisabled={isDisabled}>
                                                                    <Button width='100%' colorScheme='teal'  onClick={()=>handleAddSubject(subjects,yearIndex+1, semesterIndex+1)}><AddIcon mr={2}/> Add subject for Year {yearIndex + 1} Semester {semesterIndex + 1}</Button>
                                                                </Tooltip>
                                                            </AccordionPanel>
                                                        </AccordionItem>
                                                    );
                                                }else{
                                                    return null;
                                                }
                                                
                                            })}
                                        </Accordion>
                                    </AccordionPanel>
                                </AccordionItem>
                            );

                        }
                        return null;
                    }else{
                        return (
                            <AccordionItem key={yearIndex}>
                                <h2>
                                    <AccordionButton>
                                        <Box flex="1" textAlign="left">
                                            Year {yearIndex + 1} ({totalSubjectsInYear} subjects)
                                        </Box>
                                        <AccordionIcon />
                                    </AccordionButton>
                                </h2>
                                <AccordionPanel pb={4}>
                                    <Accordion allowMultiple>
                                        {Array.from({ length: semesters }, (_, semesterIndex) => {
                                            const totalSubjectsInSemester = filteredSubjects.filter(sub =>
                                                sub.year === yearIndex + 1 &&
                                                sub.semester === semesterIndex + 1
                                            ).length;
    
                                            return (
                                                <AccordionItem key={semesterIndex}>
                                                    <h3>
                                                        <AccordionButton>
                                                            <Box flex="1" textAlign="left">
                                                                Semester {semesterIndex + 1} ({totalSubjectsInSemester} subjects)
                                                            </Box>
                                                            <AccordionIcon />
                                                        </AccordionButton>
                                                    </h3>
                                                    <AccordionPanel pb={4}>
                                                        <Grid templateColumns={grid} gap={2}>
                                                            {filteredSubjects
                                                                .filter(sub =>
                                                                    sub.year === yearIndex + 1 &&
                                                                    sub.semester === semesterIndex + 1
                                                                )
                                                                .map((subject) => (
                                                                    <GridItem key={subject.id}>
                                                                        <Card flexDirection='row' mb={5} variant='elevated' size='sm'>
                                                                            <CardHeader>
                                                                                <Image
                                                                                    src={subject.profile_picture || 'https://via.placeholder.com/100'}
                                                                                    alt={`${subject.name} Profile Picture`}
                                                                                    boxSize='60px'
                                                                                    objectFit="cover"
                                                                                    borderRadius="md"
                                                                                />
                                                                            </CardHeader>
                                                                            <CardBody>
                                                                                <Badge colorScheme="green"> {subject.section}</Badge>
                                                                                <Text whiteSpace='nowrap' fontSize='sm'><b>Name:</b> {subject.name}</Text>
                                                                                <Text whiteSpace='nowrap' fontSize='sm'><b>Code:</b> {subject.code}</Text>
                                                                            </CardBody>
                                                                            <Flex justifyContent='center' alignItems='center' mr={5}>
                                                                                <Tooltip label='Temporary remove this subject' isDisabled={isDisabled}><Button colorScheme="red" onClick={() => handleDeleteSubject(subject.id, subject.year, subject.semester)}><DeleteIcon /></Button></Tooltip>
                                                                            </Flex>
                                                                        </Card>
                                                                    </GridItem>
                                                                ))}
                                                            {totalSubjectsInSemester === 0 && (
                                                                <Text mt={2} mb={5}>No subjects available for this semester.</Text>
                                                            )}
                                                        </Grid>
                                                        <Tooltip label='Add subjects temporary' isDisabled={isDisabled}><Button width='100%' colorScheme='teal'  onClick={()=>handleAddSubject(subjects,yearIndex+1, semesterIndex+1)}><AddIcon mr={2}/> Add subject for Year {yearIndex + 1} Semester {semesterIndex + 1}</Button></Tooltip>
                                                    </AccordionPanel>
                                                </AccordionItem>
                                            );
                                        })}
                                    </Accordion>
                                </AccordionPanel>
                            </AccordionItem>
                        );
                    }
                })}
            </Accordion>
            <Modal size='7xl' isOpen={isOpenAddSubject} onClose={onCloseAddSubject}>
                <ModalOverlay/>
                <ModalContent>
                    <ModalHeader>Add Subject for Year {assignedYear} Semester {assignedSemester}</ModalHeader>
                    <ModalCloseButton/>
                    <ModalBody>
                        <AddSubjects 
                            isDisabled={isDisabled}
                            allSaveSubjects={subjects}
                            handleUpdate={handleUpdate}
                            assignedYear={assignedYear} 
                            assignedSemester={assignedSemester} 
                            subjects={currentSubjects} 
                            onClose={onCloseAddSubject} 
                            isUpdate={true}/>
                    </ModalBody>
                </ModalContent>
            </Modal>
            <Drawer isOpen={isOpenAddDuration} onClose={onCloseAddDuration}>
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerCloseButton/>
                    <DrawerHeader>Add Duration</DrawerHeader>
                    <DrawerBody>
                        <AddDuration isDisabled={isDisabled} handleDuration={handleDuration} assignedYear={years} assignedSemester={semesters} onCloseSelf={onCloseAddDuration}/>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
            <AlertDialog isCentered isOpen={isOpenDeleteConfirmation} onClose={onCloseDeleteConfirmation}>
                <AlertDialogOverlay/>
                <AlertDialogContent>
                    <AlertDialogHeader>Delete Course</AlertDialogHeader>
                    <AlertDialogBody>
                        Are you sure? You want to delete this course?
                        <br/>
                        <br/>
                        <Text as='b'>{courseName}</Text>
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button onClick={onCloseDeleteConfirmation}>
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteCourse} ml={3} colorScheme="red">
                            Delete
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Box>
    );
};

export default UpdateCourse;
