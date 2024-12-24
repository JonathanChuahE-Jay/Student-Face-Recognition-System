import {
    Button, 
    Flex, 
    Image, 
    Table, 
    TableContainer, 
    Tbody, 
    Td, 
    Th, 
    Box, 
    Tr, 
    useDisclosure,
    useToast, 
    Modal, 
    ModalOverlay, 
    ModalContent, 
    ModalBody, 
    ModalHeader, 
    ModalCloseButton,
    Divider,
    Text, 
    IconButton, 
    Spinner, 
    useBreakpointValue,
    AlertDialog,
    AlertDialogBody,
    AlertDialogCloseButton,
    AlertDialogOverlay,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogFooter,
    Drawer,
    DrawerOverlay,
    DrawerContent,
    DrawerCloseButton,
    DrawerHeader,
    DrawerBody,
    Tooltip,
    useColorModeValue,
    GridItem,
    UnorderedList,
    ListItem,
    Grid,
    Checkbox,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { AddIcon, CalendarIcon, DeleteIcon, EditIcon, InfoIcon, MinusIcon } from "@chakra-ui/icons";
import AddNewLecturer from "./Add_New_Lecturer";
import UpdateLecturer from "./Update_Lecturer";
import AssignLecturerSubject from './Assign_Subject_Lecturer';
import { ChevronRightIcon, ChevronLeftIcon } from "@chakra-ui/icons";
import { useTooltip } from '../../Context/ToolTipContext';
import axios from "axios";
import Timetable from "../Timetable/Timetable";

const Lecturer_Management = ({searchQuery,isMobile}) => {
    const { isDisabled } = useTooltip();
    const { page } = useParams();
    const [subjects, setSubjects] = useState({});
    const [lecturers, setLecturers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);
    const [lecturer, setLecturer] = useState('');
    const [currentSubject, setCurrentSubject]= useState([]);
    const [deleteCheckBoxBar, setDeleteCheckBoxBar] = useState(false);
    const lecturersPerPage = 4;

    //Change Color Mode
    const bgGreyColor = useColorModeValue('gray.100', 'gray.600'); 
    const bgWhiteColor = useColorModeValue('white', 'gray.700');
    
    // Disclosures for modals
    const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();
    const { isOpen: isOpenAddNewLecturerModal, onOpen: onOpenAddNewLecturerModal, onClose: onCloseAddNewLecturerModal } = useDisclosure();
    const { isOpen: isOpenAddSubject, onOpen: onOpenAddSubject, onClose: onCloseAddSubject } = useDisclosure();
    const { isOpen: isOpenUpdateLecturerModal, onOpen: onOpenUpdateLecturerModal, onClose: onCloseUpdateLecturerModal } = useDisclosure();
    const { isOpen: isOpenTimetable, onOpen: onOpenTimetable, onClose: onCloseTimetable } = useDisclosure();

    const toast = useToast();
    const navigate = useNavigate();
    const Ref = useRef();
    const prevSearchQueryRef = useRef(searchQuery);

    useEffect(() => {
        if (parseInt(page) !== currentPage) {
          setCurrentPage(parseInt(page) || 1);
        }
    }, [page]);

    const handleResetPage = () => {
        setCurrentPage(1);
        navigate(`/lecturer-management/page/1`);
    }

    useEffect(() => {
        if (prevSearchQueryRef.current !== searchQuery) {
            handleResetPage();
            prevSearchQueryRef.current = searchQuery;
        }
    }, [searchQuery]);

    // Format date function
    const formattedDate = (timestamp) => new Date(timestamp).toLocaleString('en-GB', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
    });

    // Fetch data from the server
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get('/show-lecturers');
            const sortedData = response.data.sort((a, b) => a.id - b.id);
            setLecturers(sortedData);
            await Promise.all(sortedData.map(lecturer => fetchSubjectsForLecturer(lecturer.id)));
        } catch (err) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: err.message || 'Unable to fetch data',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch subjects for a specific lecturer
    const fetchSubjectsForLecturer = async (lecturerId) => {
        setIsLoading(true);
        if (!lecturerId) return;
        try {
            const response = await axios.post('http://localhost:5000/display-assigned-subjects', { lecturer_id: lecturerId });
            const { subjectData, time_and_venue } = response.data;
    
            const subjectsWithSections = subjectData.reduce((acc, { subject_id, name, section }) => {
                if (!acc[subject_id]) {
                    acc[subject_id] = { name, sections: new Map() };
                }
                acc[subject_id].sections.set(section, { time: [], venue: [], day: [] });
                return acc;
            }, {});
    
            // Map time_and_venue to the corresponding subject and section
            time_and_venue.forEach(({ subject_id, section_number, start_time, end_time, venue, day }) => {
                if (subjectsWithSections[subject_id] && subjectsWithSections[subject_id].sections.has(section_number)) {
                    const sectionData = subjectsWithSections[subject_id].sections.get(section_number);
                    sectionData.time.push({ start_time, end_time });
                    sectionData.venue.push(venue);
                    sectionData.day.push(day); 
                }
            });
    
            setSubjects(prevState => ({
                ...prevState,
                [lecturerId]: Object.keys(subjectsWithSections).reduce((acc, subjectId) => {
                    acc[subjectId] = {
                        name: subjectsWithSections[subjectId].name,
                        sections: Array.from(subjectsWithSections[subjectId].sections).map(([section, { time, venue, day }]) => ({
                            section,
                            time,
                            venue,
                            day 
                        }))
                    };
                    return acc;
                }, {})
            }));
            
        } catch (error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchData();
        fetchSubjectsForLecturer();
    },[]);

    // Handle delete confirmation
    const handleDeleteConfirmation = (lecturer) => {
        setLecturer(lecturer);
        onOpenDeleteModal();
    };

    // Perform lecturer deletion
    const handleDeleteLecturer = async () => {
        try {
            const response = await axios.delete('http://localhost:5000/delete-lecturer', {
                data: { id: lecturer.id }
            });
    
            const data = response.data;
    
            if (data.success && data.success.includes('deleted successfully')) {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: data.success,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onCloseDeleteModal();
                handleResetPage();
                fetchData(); 
            } else {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: data.error || 'Failed to delete lecturer',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Unable to delete lecturer';
            toast({
                title: 'Error',
                position: 'top-right',
                description: errorMessage,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    // Handle updating lecturer details
    const handleUpdateClick = (lecturer) => {
        setLecturer(lecturer);
        onOpenUpdateLecturerModal();
    };

    // Handle subject assignment
    const handleAssignSubject = (lecturer) => {
        setLecturer(lecturer);
        onOpenAddSubject();
    };

    // Filter lecturers based on search query
    const filteredLecturers = useMemo(() => {
        const lowerCaseQuery = searchQuery.trim().toLowerCase();
        
        return lecturers.filter(lecturer => {
            const phoneNumberMatch = lecturer.contact_number?.toLowerCase().includes(lowerCaseQuery) ?? false;
            const idMatch = lecturer.lecturer_id?.toLowerCase().includes(lowerCaseQuery) ?? false;
            const nameMatch = lecturer.name?.toLowerCase().includes(lowerCaseQuery) ?? false;
            const emailMatch = lecturer.email?.toLowerCase().includes(lowerCaseQuery) ?? false;
            
            // Ensure subject data is not null before accessing
            const subjectsMatch = subjects[lecturer.id] && Object.values(subjects[lecturer.id]).some(subject => {
                const subjectNameMatch = subject.name?.toLowerCase().includes(lowerCaseQuery) ?? false;
                const dayMatch = subject.sections.some(section => 
                    Array.isArray(section.day) && section.day.some(day => 
                        day?.toLowerCase().includes(lowerCaseQuery) ?? false
                    )
                );
                const sectionMatch = subject.sections.some(section => 
                    typeof section.section === 'string' && section.section.toLowerCase().includes(lowerCaseQuery)
                );
                const venueMatch = subject.sections.some(section => 
                    typeof section.venue === 'string' && section.venue.toLowerCase().includes(lowerCaseQuery)
                );
    
                const combinedText = `${subject.name || ''} section: ${subject.sections
                    .map(section => section.section || '')
                    .join(', ')}`.toLowerCase();
                const combinedMatch = combinedText.includes(lowerCaseQuery);
    
                return subjectNameMatch || dayMatch || sectionMatch || venueMatch || combinedMatch;
            });
        
            return nameMatch || emailMatch || subjectsMatch || idMatch || phoneNumberMatch;
        });
    }, [searchQuery, lecturers, subjects]);
    
    
    // Pagination logic
    const totalPages = Math.ceil(filteredLecturers.length / lecturersPerPage);
    const currentLecturers = useMemo(() => {
        const startIndex = (currentPage - 1) * lecturersPerPage;
        const endIndex = startIndex + lecturersPerPage;
        return filteredLecturers.slice(startIndex, endIndex);
    }, [currentPage, filteredLecturers]);

    // Pagination button range calculation
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
    // Determine the text or icon for the buttons based on screen size
    const deleteLabel = useBreakpointValue({ base: "", md: " Delete" });
    const updateLabel = useBreakpointValue({ base: "", md: " Update" });
    const assignLabel = useBreakpointValue({ base: "", md: " Assign Subjects" });

     // Button size on screen size
    const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
    const buttonMinWidth = useBreakpointValue({ base: "33%", md: "33%" });

    const handleTimetable = (lecturer) => {
        setLecturer(lecturer);
        // Access subjects for the specific lecturer directly using their ID
        const currentLecturerSubjects = subjects[lecturer.id] || {};
        
        setCurrentSubject(currentLecturerSubjects);
        onOpenTimetable();
    };

    // Checkbox Logic
    const [checkedItems, setCheckedItems] = useState({});
    const allChecked = currentLecturers.every((lecturer) => checkedItems[lecturer.id]);
    const isIndeterminate = currentLecturers.some((lecturer) => checkedItems[lecturer.id]) && !allChecked;

    useEffect(() => {
        const hasCheckedItems = Object.values(checkedItems).some(item => item === true);
        setDeleteCheckBoxBar(hasCheckedItems);

    }, [checkedItems]);
    
    const handleDeleteSelectedLecturers = useCallback(async () => {
        const selectedLecturerIds = Object.keys(checkedItems).filter(id => checkedItems[id]);

        if (selectedLecturerIds.length === 0) {
            toast({
                title: 'No lecturer selected',
                position: 'top-right',
                description: 'Please select at least one lecturer to delete.',
                status: 'warning',
                duration: 1000,
                isClosable: true,
            });
            return;
        }
        try {
            const deleteRequests = selectedLecturerIds.map(id =>
                
                axios.delete('http://localhost:5000/delete-lecturer', {
                    headers: { "Content-Type": "application/json" },
                    data: { id: id } 
                })
            );

            const responses = await Promise.all(deleteRequests);
            
            responses.forEach(response => {
                const result = response.data;
                if (result.success && result.success.includes('deleted successfully')) {
                    toast({
                        title: 'Success',
                        position: 'top-right',
                        description: result.success,
                        status: 'success',
                        duration: 1000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: 'Error',
                        position: 'top-right',
                        description: result.error || `Failed to delete lecturer`,
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
        <>
            {/* Loader */}
            {isLoading ? (
                <Flex flexDirection='column' justifyContent="center" alignItems="center" height="100vh">
                    <Spinner />
                    <Box>Loading...</Box>
                </Flex>
            ) : (
                <>
                    {/* No Lecturers Found */}
                    {currentLecturers.length === 0 ? (
                        <Flex justifyContent="center" alignItems="center" height="50vh" flexDirection={'column'}>
                            <InfoIcon boxSize={20} />
                            <Text mt={2} mb={4}>There's no existing lecturers currently.</Text>
                        </Flex>
                    ) : (
                        <Box padding='10px'>
                            <Checkbox
                                ml={3}
                                isChecked={allChecked}
                                isIndeterminate={isIndeterminate}
                                onChange={(e) => {
                                    const isChecked = e.target.checked;
                                    const updatedCheckedItems = { ...checkedItems };

                                    currentLecturers.forEach((lecturer) => {
                                        updatedCheckedItems[lecturer.id] = isChecked;
                                    });

                                    setCheckedItems(updatedCheckedItems);
                                }}
                            >Select All</Checkbox>
                            {/* Lecturer List */}
                            {currentLecturers.map((lecturer, index) => (
                                <Flex
                                    boxShadow="rgba(0, 0, 0, 0.35) 0px 5px 15px"
                                    key={lecturer.id}
                                    justifyContent={'center'}
                                    margin={'20px'}
                                    padding={'25px'}
                                    borderRadius={'10px'}
                                    position="relative"
                                    bg={index % 2 === 0 ? bgGreyColor : bgWhiteColor}
                                >
                                    <Flex position="absolute" top="10px" left="10px">
                                        <Checkbox
                                            isChecked={!!checkedItems[lecturer.id]} 
                                            onChange={(e) => {
                                                const updatedCheckedItems = { ...checkedItems };
                                                updatedCheckedItems[lecturer.id] = e.target.checked;
                                                setCheckedItems(updatedCheckedItems);
                                            }}
                                        />
                                    </Flex>
                                    
                                    <Flex width='20%' mr={5} mb={5}>
                                        <Image
                                            maxH='300px'
                                            objectFit='cover'
                                            borderRadius={'10px'}
                                            src={lecturer.profile_picture || 'https://bit.ly/broken-link'}
                                            marginRight={'20px'}
                                            alt={`Profile picture of ${lecturer.name}`}
                                        />
                                    </Flex>
                                    <Flex
                                        direction={'column'}
                                        justifyContent={'space-between'}
                                        width={'80%'}
                                    >   
                                        <TableContainer >
                                            <Table size='sm' variant='simple' bg={index % 2 === 0 ? bgWhiteColor  : bgGreyColor} >
                                                <Tbody>
                                                    <Tr>
                                                        <Th width='20%'borderBottom={'1px solid black'}>ID:</Th>
                                                        <Td borderBottom={'1px solid black'}>{lecturer.id}</Td>
                                                    </Tr>
                                                    <Tr>
                                                        <Th borderBottom={'1px solid black'}>Lecturer ID:</Th>
                                                        <Td borderBottom={'1px solid black'}>{lecturer.lecturer_id}</Td>
                                                    </Tr>
                                                    <Tr>
                                                        <Th borderBottom={'1px solid black'}>Name:</Th>
                                                        <Td borderBottom={'1px solid black'}>{lecturer.name}</Td>
                                                    </Tr>
                                                    <Tr>
                                                        <Th borderBottom={'1px solid black'}>Email:</Th>
                                                        <Td borderBottom={'1px solid black'}>{lecturer.email}</Td>
                                                    </Tr>
                                                    <Tr>
                                                        <Th borderBottom={'1px solid black'}>Contact Number:</Th>
                                                        <Td borderBottom={'1px solid black'}>{lecturer.contact_number}</Td>
                                                    </Tr>
                                                    <Tr>
                                                        <Th borderBottom={'1px solid black'}>Joined Date:</Th>
                                                        <Td borderBottom={'1px solid black'}>{formattedDate(lecturer.joined_date)}</Td>
                                                    </Tr>
                                                    <Tr>
                                                        <Th borderBottom={'1px solid black'} width='400px'>Subjects:</Th>
                                                        <Td borderBottom={'1px solid black'}>
                                                            <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3,1fr)' }}  gap={2}>
                                                                {subjects[lecturer.id] && Object.keys(subjects[lecturer.id]).length > 0 ? (
                                                                    Object.keys(subjects[lecturer.id]).map((subjectId,index) => {
                                                                        const { name, sections } = subjects[lecturer.id][subjectId];
                                                                        // Sort sections in ascending order based on the `section` property
                                                                        const sortedSections = sections.slice().sort((a, b) => {
                                                                            if (typeof a.section === 'number' && typeof b.section === 'number') {
                                                                                return a.section - b.section;
                                                                            } else {
                                                                                return a.section.localeCompare(b.section);
                                                                            }
                                                                        });

                                                                        return (
                                                                            <GridItem key={subjectId}>
                                                                                <Box margin='5px 0px'>
                                                                                    <Text fontWeight='bold'>{index+1}. {name}</Text>
                                                                                    <UnorderedList styleType='lower-roman'>
                                                                                        {sortedSections.map(({ section, time, venue, day }) => (
                                                                                            <ListItem key={section}>
                                                                                                Section: {section}
                                                                                                <UnorderedList>
                                                                                                    {time.map((t, index) => (
                                                                                                        <>
                                                                                                        <ListItem key={index}>
                                                                                                            Time: {t.start_time} - {t.end_time}
                                                                                                        </ListItem>
                                                                                                        <ListItem>Venue: {venue[index] || 'N/A'}</ListItem>
                                                                                                        <ListItem>Day: {day[index]||'N/A'}</ListItem>
                                                                                                        </>
                                                                                                    ))}
                                                                                                </UnorderedList>
                                                                                            </ListItem>
                                                                                        ))}
                                                                                    </UnorderedList>
                                                                                </Box>
                                                                            </GridItem>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <GridItem>
                                                                        <Text>None</Text>
                                                                    </GridItem>
                                                                )}
                                                            </Grid>
                                                            <Tooltip isDisabled={isDisabled} label='View Time table' fontSize='md'>
                                                                <Button size='sm' display='flex' marginLeft='auto' bg={index % 2 === 0 ? bgGreyColor : bgWhiteColor}  onClick={()=>{handleTimetable(lecturer)}}>
                                                                    <CalendarIcon />
                                                                </Button>
                                                            </Tooltip>
                                                        </Td>
                                                    </Tr>
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
                                        <Flex justifyContent={'space-between'} padding={'20px'}>
                                            <Tooltip isDisabled={isDisabled} label='Update' fontSize='md'><Button minWidth={buttonMinWidth} size={buttonSize} textAlign="center" colorScheme='teal'onClick={() => handleUpdateClick(lecturer)}><EditIcon ml={1} mr={1}/> {updateLabel}</Button></Tooltip>
                                            <Tooltip isDisabled={isDisabled} label='Assign Subjects' fontSize='md'><Button minWidth={buttonMinWidth} size={buttonSize} textAlign="center" colorScheme='blue' onClick={() => handleAssignSubject(lecturer)}><AddIcon ml={1} mr={1}/> {assignLabel}</Button></Tooltip>
                                            <Tooltip isDisabled={isDisabled} label='Delete' fontSize='md'><Button minWidth={buttonMinWidth} size={buttonSize} textAlign="center" colorScheme='red' onClick={() => handleDeleteConfirmation(lecturer)}><DeleteIcon ml={1} mr={1}/>{deleteLabel}</Button></Tooltip>
                                        </Flex>
                                    </Flex>
                                </Flex>
                            ))}
                            {/* Pagination Controls */}
                            <Flex justifyContent='center' mt={4} padding={'40px'} alignItems='center'>
                            <Tooltip isDisabled={isDisabled} label='Previous Page' fontSize='md'>
                                <IconButton 
                                size={buttonSize}
                                icon={<ChevronLeftIcon />}
                                onClick={() => {
                                    const newPage = Math.max(currentPage - 1, 1);
                                    navigate(`/lecturer-management/page/${newPage}`);
                                }}
                                isDisabled={currentPage === 1}
                                marginRight={'10px'}
                                />
                            </Tooltip>
                                <Flex mx={2}>
                                    {startPage > 1 && (
                                        <>
                                            <Button 
                                            size={buttonSize}
                                            mx={1} 
                                            onClick={() => navigate(`/lecturer-management/page/1`)}
                                            colorScheme={currentPage === 1 ? "blue" : "gray"}
                                            >
                                            1
                                            </Button>
                                            {startPage > 2 && <Text mx={1}>...</Text>}
                                      </>
                                    )}
                                    {Array.from({ length: Math.min(maxPageButtons, endPage - startPage + 1) }, (_, i) => startPage + i).map(number => (
                                        <Button
                                        size={buttonSize}
                                        key={number}
                                        mx={1}
                                        onClick={() => navigate(`/lecturer-management/page/${number}`)}
                                        colorScheme={number === currentPage ? "blue" : "gray"}
                                        >
                                        {number}
                                        </Button>
                                    ))}
                                    {endPage < totalPages && (
                                        <>
                                            {endPage < totalPages - 1 && <Text mx={1}>...</Text>}
                                            <Button 
                                            size={buttonSize}
                                            mx={1} 
                                            onClick={() => navigate(`/lecturer-management/page/${totalPages}`)}
                                            colorScheme={totalPages === currentPage ? "blue" : "gray"}
                                            >
                                            {totalPages}
                                            </Button>
                                       </>
                                    )}
                                </Flex>
                                <Tooltip isDisabled={isDisabled} label='Next page' fontSize='md'>
                                    <IconButton icon={<ChevronRightIcon />} onClick={() => {
                                        const newPage = Math.min(currentPage + 1, totalPages);
                                        navigate(`/lecturer-management/page/${newPage}`);
                                        }}isDisabled={currentPage === totalPages} 
                                    />
                                </Tooltip>
                            </Flex>
                        </Box>
                    )}
                </>
            )}
            <Divider />
            {/* Add New Lecturer Button */}
            <Flex
                justifyContent={'center'}
                padding={'20px'}
                alignItems={'center'}
                height={'300px'}
            >
                <Tooltip isDisabled={isDisabled} label='Add New Lecturer' fontSize='md'>
                    <AddIcon
                        onClick={onOpenAddNewLecturerModal}
                        backgroundColor={bgGreyColor}
                        boxSize={20}
                        borderRadius={'80px'}
                        padding={'20px'}
                        cursor={'pointer'}
                        color={bgWhiteColor}
                        aria-label="Add new lecturer"
                    />
                </Tooltip>
            </Flex>

            {/* Modals */}
            <Modal isOpen={isOpenAddNewLecturerModal} onClose={onCloseAddNewLecturerModal}>
                <ModalOverlay />
                <ModalContent marginTop='5px'>
                    <ModalHeader>Add New Lecturer</ModalHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'><ModalCloseButton /></Tooltip>
                    <ModalBody>
                        <AddNewLecturer isDisabled={isDisabled} onClose={onCloseAddNewLecturerModal} onRefresh={() => fetchData()} />
                    </ModalBody>
                </ModalContent>
            </Modal>
            
            <Modal isOpen={isOpenTimetable} onClose={onCloseTimetable} size='2xl'>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Time table</ModalHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'><ModalCloseButton /></Tooltip>
                    <ModalBody>
                        <Timetable subjects={currentSubject} user={lecturer}/>
                    </ModalBody>
                </ModalContent>
            </Modal>


            <AlertDialog
                motionPreset='slideInBottom'
                leastDestructiveRef={Ref}
                onClose={onCloseDeleteModal}
                isOpen={isOpenDeleteModal}
                isCentered
            >
                <AlertDialogOverlay />
                <AlertDialogContent>
                <AlertDialogHeader>Delete confirmation</AlertDialogHeader>
                <Tooltip isDisabled={isDisabled} label='Close Dialog' fontSize='md'><AlertDialogCloseButton /></Tooltip>
                <AlertDialogBody>
                    Are you sure you want to delete {lecturer.name}?
                </AlertDialogBody>
                <AlertDialogFooter>
                    <Button ref={Ref} onClick={onCloseDeleteModal}>
                    No
                    </Button>
                    <Button colorScheme='red' onClick={handleDeleteLecturer} ml={3}>
                    Yes
                    </Button>
                </AlertDialogFooter>
                </AlertDialogContent>

            </AlertDialog>
            
            <Drawer
                size='md'
                isOpen={isOpenUpdateLecturerModal}
                placement='right'
                onClose={onCloseUpdateLecturerModal}
                finalFocusRef={Ref}
            >
                <DrawerOverlay />
                <DrawerContent>
                    <Tooltip isDisabled={isDisabled} label='Close Drawer' fontSize='md'><DrawerCloseButton/></Tooltip>
                    <DrawerHeader>Update Lecturer</DrawerHeader>
                    <DrawerBody>
                        <UpdateLecturer onReset={handleResetPage} isDisabled={isDisabled} onRefresh={() => fetchData()} lecturer={lecturer} onClose={onCloseUpdateLecturerModal}/>
                    </DrawerBody>
                </DrawerContent>

            </Drawer>

            <Modal scrollBehavior={'inside'} isOpen={isOpenAddSubject} size={'6xl'} onClose={onCloseAddSubject}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Assign Subjects</ModalHeader>
                    <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'><ModalCloseButton /></Tooltip>
                    <ModalBody>
                        <AssignLecturerSubject isDisabled={isDisabled} onRefresh={() => fetchData()} onClose={onCloseAddSubject} lecturerId={lecturer.id} />
                    </ModalBody>
                </ModalContent>
            </Modal>
            {
                deleteCheckBoxBar? 
                    <Flex
                        width={isMobile?'100%':'97%'}
                        height='50px'
                        position='fixed'
                        bottom='0'
                        left={isMobile?'0':'10'}
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
                        <Button width='45%' colorScheme="red" onClick={()=>{handleDeleteSelectedLecturers()}}>
                            <DeleteIcon mr={2}/>
                            Delete selected items
                        </Button>
                    </Flex>
                :
                    null
            }
        </>
    );
};

export default Lecturer_Management;
