import React, { useEffect, useState, lazy, Suspense, useMemo, useRef, useCallback } from "react";
import { Button, Card, CardBody, Image, Grid, Heading, Stack, Text, Flex, Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, useDisclosure, Divider, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, Skeleton, CardFooter, Tooltip, Spinner, InputGroup, InputLeftElement, Input, InputRightElement, CloseButton, useBreakpointValue, IconButton, useColorModeValue, Checkbox, useToast } from '@chakra-ui/react';
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon, MinusIcon} from "@chakra-ui/icons";
import { useTooltip } from '../../Context/ToolTipContext';
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const AddNewCourse = lazy(() => import("./Add_New_Course"));
const UpdateCourse = lazy(() => import("./Update_Course"));
const MoreInfo = lazy(() => import("./More_Info"));

const CourseManagement = ({searchQuery, isMobile}) => {
    const [courses, setCourses] = useState([]);
    const [course, setCourse] = useState([]);
    const [deleteCheckBoxBar, setDeleteCheckBoxBar] = useState(false);

    const { isOpen: isOpenCreateModal, onOpen: onOpenCreateModal, onClose: onCloseCreateModal } = useDisclosure();
    const { isOpen: isOpenUpdateDrawer, onOpen: onOpenUpdateDrawer, onClose: onCloseUpdateDrawer } = useDisclosure();
    const { isOpen: isOpenInfoDrawer, onOpen: onOpenInfoDrawer, onClose: onCloseInfoDrawer } = useDisclosure();

    const { isDisabled } = useTooltip();
    const coursePerPage = useBreakpointValue({ base: 3, md: 5, lg: 7 , xl: 10 });
    const navigate = useNavigate();
    const { page } = useParams();
    const prevSearchQueryRef = useRef(searchQuery);
    const [currentPage, setCurrentPage] = useState(1);
    const toast = useToast();

    const fetchData = () => {
        axios.get('http://localhost:5000/show-all-courses')
            .then(response => {
                setCourses(response.data);
            })
            .catch(error => {
                console.error('Error fetching courses and subjects:', error);
            });
    }

    useEffect(() => {
        fetchData();
    }, []);

    const handleMoreInfo = (course) => {
        setCourse(course);
        onOpenInfoDrawer();
    }

    const handleUpdate = (course) => {
        setCourse(course);
        onOpenUpdateDrawer();
    }

    // Handle searchQuery onchange page change
    useEffect(() => {
        if (parseInt(page) !== currentPage) {
          setCurrentPage(parseInt(page) || 1);
        }
    }, [page]);

    const handleResetPage = () => {
        setCurrentPage(1);
        navigate(`/course-management/page/1`);
    }

    useEffect(() => {
        if (prevSearchQueryRef.current !== searchQuery) {
            handleResetPage();
            prevSearchQueryRef.current = searchQuery;
        }
    }, [searchQuery]);

    // Filter based on search query
    const filteredSubjects = useMemo(() => 
        courses.filter(course =>
            course.course_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.course_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.course_description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.course_programme.toLowerCase().includes(searchQuery.toLowerCase())
        ), [courses, searchQuery]);    

    // Calculate the data for the current page
    const paginatedData = useMemo(() => 
        filteredSubjects.slice(
            (currentPage - 1) * coursePerPage,
            currentPage * coursePerPage
        ), [filteredSubjects, currentPage, coursePerPage]);
    
    
        const totalPages = Math.ceil(filteredSubjects.length / coursePerPage);
    
        const maxPageButtons = 4;
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
    
    const buttonSize = useBreakpointValue({ base: 'sm', md: 'md' });
    
    // CheckBox related
    const [checkedItems, setCheckedItems] = useState({});
    const allChecked = paginatedData.every((course) => checkedItems[course.course_id]);
    const isIndeterminate = paginatedData.some((course) => checkedItems[course.course_id]) && !allChecked;

    useEffect(() => {
        const hasCheckedItems = Object.values(checkedItems).some(item => item === true);
        setDeleteCheckBoxBar(hasCheckedItems);

    }, [checkedItems]);
    
    
    const handleDeleteSelectedCourses = useCallback(async () => {
        const selectedCoursesIds = Object.keys(checkedItems).filter(id => checkedItems[id]);

        if (selectedCoursesIds.length === 0) {
            toast({
                title: 'No courses selected',
                position: 'top-right',
                description: 'Please select at least one course to delete.',
                status: 'warning',
                duration: 1000,
                isClosable: true,
            });
            return;
        }

        try {
            const deleteRequests = selectedCoursesIds.map(id =>
                
                axios.post('http://localhost:5000/delete-course', {
                    id: id 
                })
            );

            const responses = await Promise.all(deleteRequests);
            
            responses.forEach(response => {
                const result = response.data;
                if (result.message && result.message.includes('deleted successfully')) {
                    toast({
                        title: 'Success',
                        position: 'top-right',
                        description: result.message,
                        status: 'success',
                        duration: 1000,
                        isClosable: true,
                    });
                } else {
                    toast({
                        title: 'Error',
                        position: 'top-right',
                        description: result.error || `Failed to delete student`,
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
        <Flex flexDirection='column' padding='10px'>
            <Flex ml='auto'mr={5} mt={2}>
                Select All
                <Checkbox
                    ml={3}
                    isChecked={allChecked}
                    isIndeterminate={isIndeterminate}
                    onChange={(e) => {
                        const isChecked = e.target.checked;
                        const updatedCheckedItems = { ...checkedItems };

                        paginatedData.forEach((course) => {
                            updatedCheckedItems[course.course_id] = isChecked;
                        });

                        setCheckedItems(updatedCheckedItems);
                    }}
                />
            </Flex>
            <Grid gap={5} templateColumns={{base: '1fr', sm: 'repeat(2, 1fr)',lg: 'repeat(3, 1fr)', xl: 'repeat(4, 1fr)'}} p={4}>
                <Tooltip label='Create course' isDisabled={isDisabled}>
                <Card onClick={onOpenCreateModal} cursor='pointer' position="relative">
                    <CardBody height='76%'>
                        <Stack spacing={4} >
                            <Skeleton height='200px' />
                            <Skeleton height='20px' />
                            <Skeleton height='20px' />
                            <Skeleton height='20px' />
                        </Stack>
                    </CardBody>
                    <Divider my={3} />
                    <CardFooter  height='19%'>
                        <Flex direction="column" alignItems="center" justifyContent="center" width="100%">
                            <Flex
                                position="absolute"
                                top="50%"
                                left="50%"
                                transform="translate(-50%, -50%)"
                                zIndex="1"
                            >
                                <Button colorScheme='blackAlpha' color='whitesmoke' width='200px'>
                                    <AddIcon mr={1}/>Create
                                </Button>
                            </Flex>
                            <Flex width="100%" justifyContent="space-between">
                                <Skeleton height='20px' width='40%' />
                                <Skeleton height='20px' width='40%' />
                            </Flex>
                        </Flex>
                    </CardFooter>
                </Card>
                </Tooltip>
                {paginatedData.map(course => (
                    <Card
                        padding={5}
                        key={course.course_id}
                        position="relative"
                    >
                        <Checkbox
                            mb={2}
                            isChecked={!!checkedItems[course.course_id]} 
                            onChange={(e) => {
                                const updatedCheckedItems = { ...checkedItems };
                                updatedCheckedItems[course.course_id] = e.target.checked;
                                setCheckedItems(updatedCheckedItems);
                            }}
                        />

                        <Flex justifyContent='center' height='40%'>
                            <Image
                                objectFit='cover'
                                maxW={{ base: '50%', sm: '200px' }}
                                maxH={{ base: '50%', sm: '200px' }}
                                src={course.course_profile_picture || 'https://via.placeholder.com/150'}
                                alt='Course Image'
                            />
                        </Flex>
                        <Stack width='100%' height='100%'>
                            <CardBody height='40%'>
                                <Heading mt={2} mb={2} size='md'>{course.course_name}</Heading>
                                <Text><b>Code:</b> {course.course_code}</Text>
                                <Text><b>Description:</b>  {course.course_description}</Text>
                                <Text><b>Programme:</b> {course.course_programme}</Text>
                                <Text><b>Date Created:</b>  {new Date(course.course_date_created).toLocaleDateString()}</Text>
                            </CardBody>
                            <Divider my={4} />
                            <Flex justifyContent='space-evenly' height='20%' marginTop='auto'>
                                <Tooltip label='More info' isDisabled={isDisabled}>
                                <Button onClick={() => handleMoreInfo(course)} width='40%' variant='solid' colorScheme='blue'>
                                    More Info
                                </Button>
                                </Tooltip>
                                <Tooltip label='Update course' isDisabled={isDisabled}>
                                <Button onClick={()=> handleUpdate(course)} width='40%' variant='solid' colorScheme='teal'>
                                    Update
                                </Button>
                                </Tooltip>
                            </Flex>
                        </Stack>
                    </Card>
                ))}
            </Grid>
            <Flex mt={4} justifyContent="space-around" mb={deleteCheckBoxBar?"50px": ''}>
                <Tooltip isDisabled={isDisabled} label='Previous Page' fontSize='md'>
                    <IconButton 
                    size={buttonSize}
                    icon={<ChevronLeftIcon />}
                    onClick={() => {
                        const newPage = Math.max(currentPage - 1, 1);
                        navigate(`/course-management/page/${newPage}`);
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
                            onClick={() => navigate(`/course-management/page/1`)}
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
                        onClick={() => navigate(`/course-management/page/${number}`)}
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
                            onClick={() => navigate(`/course-management/page/${totalPages}`)}
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
                        navigate(`/course-management/page/${newPage}`);
                        }}isDisabled={currentPage === totalPages} 
                    />
                </Tooltip>
            </Flex>
            {/* Modals & Drawer*/}
            <Modal size='xl' scrollBehavior="inside" isOpen={isOpenCreateModal} onClose={onCloseCreateModal}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Add New Course</ModalHeader>
                    <ModalCloseButton />
                    <ModalBody overflow='hidden'>
                        <Suspense fallback={<Flex height='100vh' alignItems='center' justifyContent='center' flexDirection='column'><Text mb={5}>Loading... </Text><Spinner /></Flex>}>
                            <AddNewCourse onRefresh={fetchData} isDisabled={isDisabled} onClose={onCloseCreateModal} />
                        </Suspense>
                        <Divider />
                    </ModalBody>
                </ModalContent>
            </Modal>

            <Drawer placement="top" isOpen={isOpenUpdateDrawer} onClose={onCloseUpdateDrawer}>
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Update Course</DrawerHeader>
                    <DrawerBody>
                        <Suspense fallback={<Flex height='100vh' alignItems='center' justifyContent='center' flexDirection='column'><Text  mb={5}>Loading... </Text><Spinner /></Flex>}>
                            <UpdateCourse course={course} isDisabled={isDisabled} onClose={onCloseUpdateDrawer} onRefresh={fetchData}/>
                        </Suspense>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>

            <Drawer placement="bottom" isOpen={isOpenInfoDrawer} onClose={onCloseInfoDrawer}>
                <DrawerOverlay/>
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>More info</DrawerHeader>
                    <DrawerBody>
                        <Suspense fallback={<Flex height='100vh' alignItems='center' justifyContent='center' flexDirection='column'><Text  mb={5}>Loading... </Text><Spinner /></Flex>}>
                            <MoreInfo isDisabled={isDisabled} course={course} onClose={onCloseInfoDrawer} />
                        </Suspense>
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
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
                        <Button width='45%' colorScheme="red" onClick={()=>{handleDeleteSelectedCourses()}}>
                            <DeleteIcon mr={2}/>
                            Delete selected items
                        </Button>
                    </Flex>
                :
                    null
            }
        </Flex>
    );
}

export default CourseManagement;
