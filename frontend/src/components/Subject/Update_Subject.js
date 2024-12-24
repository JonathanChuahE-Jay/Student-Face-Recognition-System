import React, { useEffect, useState,useRef } from 'react';
import {
    Flex,
    FormControl,
    FormLabel,
    Input,
    Avatar,
    Button,
    AvatarBadge,
    useToast,
    Select,
    useDisclosure,
    NumberInput,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    NumberInputField,
    Tooltip,
    useBreakpointValue,
    AlertDialog,
    AlertDialogContent,
    AlertDialogOverlay,
    AlertDialogHeader,
    AlertDialogCloseButton,
    AlertDialogBody,
    AlertDialogFooter,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerHeader,
    DrawerBody,
    IconButton,
    DrawerCloseButton,
} from '@chakra-ui/react';
import { ArrowBackIcon, CheckIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import imageCompression from 'browser-image-compression';
import axios from 'axios';
import AssignedLecturer from './Assigned_Lecturer';
import SubjectSections from './Subject_Sections';
import AssignedStudent from './Assigned_Student';

const UpdateSubject = ({user, onReset, sections, isDisabled, subject, onClose }) => {
    
    // State management
    const [sectionTimes, setSectionTimes] = useState([]);
    const [subjectCode, setSubjectCode] = useState(subject.code || '');
    const [subjectName, setSubjectName] = useState(subject.name || '');
    const [subjectPicture, setSubjectPicture] = useState(subject.profile_picture || null);
    const [subjectSection, setSubjectSection] = useState(subject.section || '');
    const [subjectSectionOthers, setSubjectSectionOthers] = useState('');
    const [numberOfSections , setNumberOfSections] = useState(subject.number_of_sections || '');
    const [day, setDay]= useState(Array(numberOfSections).fill(''));
    const [venue, setVenue] = useState(Array(numberOfSections).fill(''));
    const [maxStudents, setMaxStudents]= useState([]);
    
    // Modal management for delete confirmation
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
    const { isOpen: isOpenSectionDrawer, onOpen: onOpenSectionDrawer, onClose: onCloseSectionDrawer} = useDisclosure();
    const { isOpen: isOpenAssignStudent, onOpen: onOpenAssignStudent, onClose: onCloseAssignStudent } = useDisclosure()
    const { isOpen: isOpenAssignLecturer, onOpen: onOpenAssignLecturer, onClose: onCloseAssignLecturer} = useDisclosure()

    const toast = useToast();
    const Ref = useRef();

    // Handle changes in subject section and set "Others" if needed
    useEffect(() => {
        if (!['Free Module', 'Technical Electives', 'College Compulsory', 'MPU Compulsory', 'Core'].includes(subject.section)) {
            setSubjectSection('None of these above');
            setSubjectSectionOthers(subject.section);
        }
    }, [subject.section]);

    useEffect(() => {
        if (subject.number_of_sections === null || subject.number_of_sections === undefined) {
            setNumberOfSections(1);
        } else {
            setNumberOfSections(subject.number_of_sections);
        }
    }, [subject.number_of_sections]);

    const handleSetSectionTimes = (e) => {
        setSectionTimes(e)
    }

    // Handlers for form inputs
    const handleSubjectCode = (e) => setSubjectCode(e.target.value);
    const handleSubjectName = (e) => setSubjectName(e.target.value);
    const handleNumberOfSectionsChange = (value) => setNumberOfSections(parseInt(value));

    // Handle image compression and preview
    const handleProfilePicture = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const options = {
                maxSizeMB: 0.1,
                maxWidthOrHeight: 200,
                useWebWorker: true
            };
            try {
                const compressedFile = await imageCompression(file, options);
                const reader = new FileReader();
                reader.onloadend = () => setSubjectPicture(reader.result);
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error compressing image:', error);
            }
        }
    };

    // Handle selection of subject section
    const handleSubjectSectionChange = (e) => {
        const selectedSection = e.target.value;
        setSubjectSection(selectedSection);
        if (selectedSection !== 'None of these above') {
            setSubjectSectionOthers('');
        }
    };

    // Submit handler for updating subject
    const handleSubmit = (e) => {
        e.preventDefault();

        const formattedSectionTimes = sectionTimes.map((time, index) => {
            const startTime = `${String(time.startHours).padStart(2, '0')}:${String(time.startMinutes).padStart(2, '0')}`;
            const endTime = `${String(time.endHours).padStart(2, '0')}:${String(time.endMinutes).padStart(2, '0')}`;
            return {
                sectionNumber: index + 1,
                startTime,
                endTime,
                day: time.day,
                venue: time.venue, 
                max_students: maxStudents[index]
            };
        });
        const updatedSubject = {
            id: subject.id,
            subjectCode,
            subjectName,
            subjectPicture,
            subjectSection: subjectSection === 'None of these above' ? subjectSectionOthers : subjectSection,
            numberOfSections,
            sectionTimes: formattedSectionTimes,
            venue
        };
    
        axios.post('http://localhost:5000/update-subject', updatedSubject)
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
                        description: message || 'Subject successfully updated',
                        status: 'success',
                        duration: 1000,
                        isClosable: true,
                    });
                    onClose();
                }
            })
            .catch((error) => {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: error.response?.data?.error || `An error occurred: ${error.message}`,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            });
    };

    // Submit handler for deleting subject
    const handleDeleteSubject = () => {
        axios.post('http://localhost:5000/delete-subject', { id: subject.id })
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
                        description: message || 'Subject successfully deleted',
                        status: 'success',
                        duration: 1000,
                        isClosable: true,
                    });
                    onCloseDeleteModal();
                    onClose();
                }
            })
            .catch((error) => {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: error.response?.data?.error || `An error occurred: ${error.message}`,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }).finally(()=>{
                onReset();
            })
    };
    
    // Determine the text or icon for the buttons based on screen size
    const deleteLabel = useBreakpointValue({ base: "", md: " Delete" });
    const updateLabel = useBreakpointValue({ base: "", md: " Update" });
    const backLabel = useBreakpointValue({ base: "", md: " Back" });
    
    const fetchSections = () => {
        const initialSectionTimes = Array.from({ length: numberOfSections }, (_, index) => 
            sections[index] || { startHours: 0, startMinutes: 0, endHours: 0, endMinutes: 0, venue: '', day: '' }
        );
        setSectionTimes(initialSectionTimes);
        setVenue(initialSectionTimes.map(section => section.venue || ''));
        setDay(initialSectionTimes.map(section => section.day || ''));
        setMaxStudents(initialSectionTimes.map(section => section.max_students || ''))
    };
    
    useEffect(() => {
        fetchSections();
    }, [numberOfSections, sections, setSectionTimes, setVenue]);    
    
    
    return (
        <Flex alignItems={'center'} justifyContent={'center'}>
            <FormControl as="form" padding={'20px'} borderRadius={'20px'} onSubmit={handleSubmit}>
                <Flex justifyContent={'center'}>
                    <Avatar size='2xl' src={subjectPicture || 'https://static.vecteezy.com/system/resources/thumbnails/004/141/669/small/no-photo-or-blank-image-icon-loading-images-or-missing-image-mark-image-not-available-or-image-coming-soon-sign-simple-nature-silhouette-in-frame-isolated-illustration-vector.jpg'}>
                        <AvatarBadge bg={'white'} boxSize='1.25em'>
                            <label htmlFor="profilePictureInput" style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                                <EditIcon boxSize="0.6em" color={'black'} />
                            </label>
                            <Input
                                name="profile_picture"
                                id="profilePictureInput"
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePicture}
                                style={{ display: "none" }}
                            />
                        </AvatarBadge>
                    </Avatar>
                </Flex>
                <FormLabel marginTop={'15px'}>Subject Code:</FormLabel>
                <Input
                    variant='flushed'
                    name='code'
                    placeholder='Enter subject code'
                    value={subjectCode}
                    onChange={handleSubjectCode}
                />
                <FormLabel marginTop={'15px'}>Subject Name:</FormLabel>
                <Input
                    variant='flushed'
                    name='name'
                    placeholder='Enter subject name'
                    value={subjectName}
                    onChange={handleSubjectName}
                />
                <FormLabel marginTop={'15px'}>Subject Section:</FormLabel>
                <Select
                    onChange={handleSubjectSectionChange}
                    placeholder='Select option'
                    value={subjectSection}
                >
                    <option value='Free Module'>Free Module</option>
                    <option value='Technical Electives'>Technical Electives</option>
                    <option value='College Compulsory'>College Compulsory</option>
                    <option value='MPU Compulsory'>MPU Compulsory</option>
                    <option value='Core'>Core</option>
                    <option value='None of these above'>None of these above</option>
                </Select>
                {subjectSection === 'None of these above' && (
                    <Input
                        marginTop={'10px'}
                        placeholder='Specify others'
                        value={subjectSectionOthers}
                        onChange={(e) => setSubjectSectionOthers(e.target.value)}
                    />
                )}
                <FormLabel marginTop={'15px'}>Number of Sections:</FormLabel>
                <Flex>
                    <NumberInput
                        width='90%'
                        min={1}
                        defaultValue={numberOfSections}
                        value={numberOfSections}
                        onChange={handleNumberOfSectionsChange}
                    >
                        <NumberInputField/>
                        <NumberInputStepper>
                            <NumberIncrementStepper/>
                            <NumberDecrementStepper />
                        </NumberInputStepper>
                    </NumberInput>
                    <Tooltip isDisabled={isDisabled} label="Edit section's time" fontSize='md'><IconButton onClick={onOpenSectionDrawer} icon={<EditIcon/>} marginLeft='5px'/></Tooltip>
                </Flex>
                <Flex marginTop={'10px'} justifyContent={'space-between'}>
                    <Button onClick={onOpenAssignLecturer} width='40%'>Assign Lecturer</Button>
                    <Button onClick={onOpenAssignStudent} width='40%'>Assign Students</Button>
                </Flex>
                <Flex marginTop={'10px'} justifyContent={'space-between'}>
                    <Tooltip isDisabled={isDisabled} label='Back' fontSize='md'>
                        <Button width='33%' textAlign="center" colorScheme='blue' onClick={onClose}>
                            <ArrowBackIcon ml={1} mr={1}/>{backLabel}
                        </Button>
                    </Tooltip>
                    <Tooltip isDisabled={isDisabled} label='Delete' fontSize='md'><Button width='33%' colorScheme="red" onClick={onOpenDeleteModal}><DeleteIcon ml={1} mr={1}/> {deleteLabel}</Button></Tooltip>
                    <Tooltip isDisabled={isDisabled} label='Update' fontSize='md'><Button width='33%' colorScheme="teal" type='submit'><CheckIcon  ml={1} mr={1}/> {updateLabel}</Button></Tooltip>
                </Flex>
                
            </FormControl>
            
            <AlertDialog 
                motionPreset='slideInBottom'
                leastDestructiveRef={Ref}
                isOpen={isOpenDeleteModal} 
                onClose={onCloseDeleteModal}
                isCentered
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                    <AlertDialogHeader>Delete Confirmation</AlertDialogHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Dialog' fontSize='md'><AlertDialogCloseButton /></Tooltip>
                    <AlertDialogBody>
                        Are you sure you want to delete this subject?
                    </AlertDialogBody>
                    <AlertDialogFooter>
                        <Button variant="ghost" onClick={onCloseDeleteModal}>No</Button>
                        <Button colorScheme="red" mr={3} onClick={handleDeleteSubject}>
                            Yes
                        </Button>
                        
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <Drawer placement='bottom' isOpen={isOpenSectionDrawer} onClose={onCloseSectionDrawer}>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerHeader>Section Time</DrawerHeader>
                    <SubjectSections maxStudents={maxStudents} setMaxStudents={setMaxStudents} sectionTimes={sectionTimes} setSectionTimes={handleSetSectionTimes} day={day} setDay={setDay} venue={venue} setVenue={setVenue} subject={subject} numberOfSections={numberOfSections} fetchSections={fetchSections} onCloseSectionDrawer={onCloseSectionDrawer} isDisabled={isDisabled} backLabel={backLabel}/>
                </DrawerContent>
            </Drawer>
            <Drawer  placement='top' onClose={onCloseAssignStudent} isOpen={isOpenAssignStudent} size='full'>
                <DrawerOverlay />
                <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Assigned Students</DrawerHeader>
                <DrawerBody>
                    <AssignedStudent user={user} subject_id={subject.id}/>
                </DrawerBody>
                </DrawerContent>
            </Drawer>
            <Drawer  placement='top' onClose={onCloseAssignLecturer} isOpen={isOpenAssignLecturer} size='full'>
                <DrawerOverlay />
                <DrawerContent>
                <DrawerCloseButton />
                <DrawerHeader>Assigned Lecturers</DrawerHeader>
                <DrawerBody>
                    <AssignedLecturer user={user} subject_id={subject.id} onClose={onCloseAssignLecturer}/>
                </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Flex>
    );
};

export default UpdateSubject;
