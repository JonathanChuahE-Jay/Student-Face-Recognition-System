import React, { useEffect, useState, useRef } from "react";
import {
  Flex,
  Box,
  Text,
  Checkbox,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Heading,
  useToast,
  useDisclosure,
  IconButton,
  Tooltip,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogHeader,
  AlertDialogCloseButton,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerCloseButton,
  DrawerBody,
  useBreakpointValue,
  Spinner
} from "@chakra-ui/react";
import { AddIcon, ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import {  useNavigate, useParams } from "react-router-dom";
import { useTooltip } from '../../Context/ToolTipContext'; 
import UpdateSubject from "./Update_Subject";
import AddNewSubject from './Add_New_Subject';
import SubjectList from "./Subject_List";
import axios from 'axios';

const SubjectManagement = ({searchQuery, user}) => {
  const { isOpen: isOpenUpdateModal, onOpen: onOpenUpdateModal, onClose: onCloseUpdateModal } = useDisclosure();
  const { isOpen: isOpenAddNewSubject, onOpen: onOpenAddNewSubject, onClose: onCloseAddNewSubject } = useDisclosure();
  const { isOpen: isOpenDeleteModal, onOpen: onOpenDeleteModal, onClose: onCloseDeleteModal } = useDisclosure();

  const [subjectToDelete, setSubjectToDelete] = useState(null);
  const [data, setData] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedSection, setSelectedSection] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCoursesSubjects, setSelectedCoursesSubjects] = useState([]);
  const [filters, setFilters] = useState({
    'Free Module': false,
    'Technical Electives': false,
    'College Compulsory': false,
    'MPU Compulsory': false,
    'Core': false,
  });
  const { isDisabled } = useTooltip();
  const subjectsPerPage = 4;
  const toast = useToast();
  const navigate = useNavigate();
  const Ref = useRef();
  const { page } = useParams();
  const prevSearchQueryRef = useRef(searchQuery);
  const [currentPage, setCurrentPage] = useState(parseInt(page) || 1);

  console.log(data)
  const fetchData = () => {
    setIsLoading(true);
    if(user.role === 'admin'){
      axios.get("http://localhost:5000/show-all-subjects")
      .then((response) => {
        const sortedData = response.data.sort((a, b) => a.id - b.id);
        setData(sortedData);
        setFilteredData(sortedData);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast({
          title: 'Error',
          position: 'top-right',
          description: `${error.response?.data?.error || error.message}`,
          status: 'error',
          duration: 1000,
          isClosable: true,
        });
      })
      axios.get('http://localhost:5000/show-all-courses')
        .then(response => {
            setCourses(response.data);
        })
        .catch(error => {
            console.error('Error fetching courses and subjects:', error);
            toast({
              title: 'Error',
              position: 'top-right',
              description: `${error.response?.data?.error || error.message}`,
              status: 'error',
              duration: 1000,
              isClosable: true,
            });
        }).finally(() => {
          setIsLoading(false);
      });
    }else if (user.role === 'lecturer') {
      const fetchLecturerSubjects = async () => {
          try {
              setIsLoading(true); 
              const response = await axios.get('http://localhost:5000/show-all-subjects', {
                  params: { lecturer_id: user.id }
              });
              const sortedData = response.data.sort((a, b) => a.id - b.id);
              setData(sortedData);
              setFilteredData(sortedData);
          } catch (error) {
              console.error('Error fetching data:', error);
              toast({
                  title: 'Error',
                  position: 'top-right',
                  description: error.response?.data?.error || 'Failed to load subjects.',
                  status: 'error',
                  duration: 3000,
                  isClosable: true,
              });
          } finally {
              setIsLoading(false); 
          }
      };
  
      fetchLecturerSubjects(); 
  }
  
    
  };

  useEffect(() => {
    fetchData();
  },[]);

  const handleUpdateSubject = (subject) => {
    setSelectedSubject(subject);
    setSelectedSection(subject.sections);
    onOpenUpdateModal();
  };

  const handleCloseUpdateModal = () => {
    setSelectedSubject(null);
    onCloseUpdateModal();
    fetchData();
  };

  const handleDeleteConfirmation = (id) => {
    setSubjectToDelete(id);
    onOpenDeleteModal();
  };

  const handleMoreInfo = (subject) => {
    navigate(`/subject-info/${subject.name}`, { state: { subject } });
  };
  

  const handleDeleteSubject = () => {
    axios.post('http://localhost:5000/delete-subject', { id: subjectToDelete })
      .then((response) => {
        if (response.data === 'Subject not found') {
          toast({
            title: 'Error',
            position: 'top-right',
            description: 'Subject not found',
            status: 'error',
            duration: 1000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Success',
            position: 'top-right',
            description: 'Subject successfully deleted',
            status: 'success',
            duration: 1000,
            isClosable: true,
          });
          fetchData();
          onCloseDeleteModal();
        }
      })
      .catch((error) => {
        toast({
          title: 'Error',
          position: 'top-right',
          description: `An error occurred: ${error.response?.data?.error || error.message}`,
          status: 'error',
          duration: 1000,
          isClosable: true,
        });
      }).finally(()=>{
        handleResetPage();
      })
  };

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: checked
    }));
  };

  const handleCourseCheckboxChange = (e) => {
    const { id, checked } = e.target;
    // Convert into array of Int
    const ids = id.includes(',')
      ? id.split(',').map(num => parseInt(num.trim(), 10))
      : [parseInt(id, 10)];
  
    if (checked) {
      setSelectedCoursesSubjects(prevSubjects => 
        [...new Set([...prevSubjects, ...ids])]
      );
    } else {
      setSelectedCoursesSubjects(prevSubjects => 
        prevSubjects.filter(subjectId => !ids.includes(subjectId))
      );
    }
  };

  useEffect(() => {
    let filtered = data;

    if (searchQuery) {
      filtered = filtered.filter(subject =>
        subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.section.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const activeFilters = Object.keys(filters).filter(key => filters[key]);

    if (activeFilters.length > 0) {
      filtered = filtered.filter(subject =>
        activeFilters.includes(subject.section)
      );
      handleResetPage();
    }

    if (selectedCoursesSubjects.length > 0) {
      filtered = filtered.filter(subject =>
        selectedCoursesSubjects.includes(subject.id)
      );
      handleResetPage();
    }
    
    setFilteredData(filtered);
  }, [searchQuery, filters, data, selectedCoursesSubjects]);

  useEffect(() => {
    if (parseInt(page) !== currentPage) {
      setCurrentPage(parseInt(page) || 1);
    }
  }, [page]);

  const handleResetPage = () => {
    setCurrentPage(1);
    navigate(`/subject-management/page/1`);
  }

  useEffect(() => {
    if (prevSearchQueryRef.current !== searchQuery) {
        handleResetPage();
        prevSearchQueryRef.current = searchQuery; 
    }
}, [searchQuery]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * subjectsPerPage,
    currentPage * subjectsPerPage
  );

  const totalPages = Math.ceil(filteredData.length / subjectsPerPage);

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

  const subjectListWidth = useBreakpointValue({ base: '70%', lg: '85%' });
  const filterWidth = useBreakpointValue({base:'30%',lg:'15%'});
  const buttonSize = useBreakpointValue({base:'sm',lg:'md'});
  const textSize = useBreakpointValue({base:'sm', lg:'md'});
  const headerSize = useBreakpointValue({base:'sm', lg:'md'});

  return (
    <Box overflow='hidden'>
      <Heading mt={5} textAlign={'center'}>Subject Lists</Heading>
      <Flex padding={'30px'} >
        <Box width={filterWidth} marginRight={'10px'} padding='10px' mt={4} alignItems='center'>
          <Text fontSize={headerSize} fontWeight={'bolder'} as='u' textAlign='center'>Filter By sections</Text>
          <Flex flexDirection='column'  marginBottom='15px'>
            {Object.keys(filters).map(filter => (
              <Checkbox key={filter} name={filter} isChecked={filters[filter]} onChange={handleCheckboxChange}>
                <Text fontSize={textSize}>
                  {filter}
                </Text>
              </Checkbox>
            ))}
          </Flex>
          {
            courses.length>0?
              <>
                <Text  fontSize={headerSize} fontWeight={'bolder'} as='u' textAlign='center'>Filter By course</Text>
                <Flex flexDirection='column'>
                  {courses.map(course => {
                    const subjectId = course.subjects.map(subject=>subject.id);
                    return(
                    <Checkbox 
                      key={subjectId} 
                      id={subjectId}  
                      onChange={handleCourseCheckboxChange}
                    >
                      <Text fontSize={textSize}> 
                        {course.course_name}
                      </Text>
                    </Checkbox>
                  )})}
                </Flex>
              </>
            :
              null
          }
          
        </Box>
        <Box width={subjectListWidth}>
          {isLoading? (
            <Flex justify="center" align="center" h="100vh">
              <Spinner />
            </Flex>
          ): (
            <>
              <SubjectList 
                searchQuery={searchQuery}
                user={user}
                fetchData={fetchData}
                paginatedData={paginatedData}
                handleMoreInfo={handleMoreInfo}
                isDisabled={isDisabled}
                filteredData={paginatedData} 
                handleUpdateSubject={handleUpdateSubject} 
                handleDeleteConfirmation={handleDeleteConfirmation} 
              />
              <Flex marginTop={'auto'} flexDirection={'column'} alignItems="center">
                <Flex direction="row" align="center" mb={4}>
                  <Tooltip isDisabled={isDisabled} label='Previous Page' fontSize='md'>
                    <IconButton 
                      size={buttonSize}
                      icon={<ChevronLeftIcon />}
                      onClick={() => {
                        const newPage = Math.max(currentPage - 1, 1);
                        navigate(`/subject-management/page/${newPage}`);
                      }}
                      isDisabled={currentPage === 1 || filteredData.length === 0}
                      marginRight={'10px'}
                    />
                  </Tooltip>
                  {startPage > 1 && (
                    <>
                      <Button 
                        size={buttonSize}
                        mx={1} 
                        onClick={() => navigate(`/subject-management/page/1`)}
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
                      onClick={() => navigate(`/subject-management/page/${number}`)}
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
                        onClick={() => navigate(`/subject-management/page/${totalPages}`)}
                        colorScheme={totalPages === currentPage ? "blue" : "gray"}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                  <Tooltip isDisabled={isDisabled} label='Next Page' fontSize='md'>
                    <IconButton 
                      size={buttonSize}
                      icon={<ChevronRightIcon />}
                      onClick={() => {
                        const newPage = Math.min(currentPage + 1, totalPages);
                        navigate(`/subject-management/page/${newPage}`);
                      }}
                      isDisabled={currentPage === totalPages || filteredData.length === 0}
                      marginLeft={'10px'}
                    />
                  </Tooltip>
                </Flex>
                  {
                    user.role === 'admin' && (
                      <Tooltip isDisabled={isDisabled} label='Add New Subject' fontSize='md'>
                        <Button 
                          onClick={onOpenAddNewSubject} 
                          margin={'20px 0px 20px 0px'} 
                          width='100%' 
                          leftIcon={<AddIcon/>}
                          colorScheme="blue"
                        >
                          Add New Subject
                        </Button>
                      </Tooltip>
                    )
                  }
              </Flex>
            </>
          )} 
        </Box>
      </Flex>

      {/* Modals */}
      <Drawer isOpen={isOpenUpdateModal} onClose={handleCloseUpdateModal} size="md">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader>Update Subject</DrawerHeader>
          <Tooltip isDisabled={isDisabled} label='Close Drawer' fontSize='md'><DrawerCloseButton /></Tooltip>
          <DrawerBody>
            {selectedSubject && (
              <UpdateSubject
                user={user}
                sections = {selectedSection}
                onReset={handleResetPage}
                isDisabled={isDisabled}
                subject={selectedSubject}
                onClose={handleCloseUpdateModal}
                onUpdate={fetchData}
              />
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <Modal isOpen={isOpenAddNewSubject} onClose={onCloseAddNewSubject} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Add New Subject</ModalHeader>
          <Tooltip isDisabled={isDisabled} label='Close Modal' fontSize='md'><ModalCloseButton /></Tooltip>
          <ModalBody>
            <AddNewSubject isDisabled={isDisabled} onClose={onCloseAddNewSubject} onUpdate={fetchData} />
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        motionPreset='slideInBottom'
        leastDestructiveRef={Ref}
        isOpen={isOpenDeleteModal} 
        onClose={onCloseDeleteModal}
        isCentered
      >
        <AlertDialogOverlay />
        <AlertDialogContent>
          <AlertDialogHeader>Delete Subject</AlertDialogHeader>
          <Tooltip isDisabled={isDisabled} label='Close Dialog' fontSize='md'><AlertDialogCloseButton /></Tooltip>
          <AlertDialogBody>
            Are you sure you want to delete this subject?
          </AlertDialogBody>
          <AlertDialogFooter>
            <Button ref={Ref} onClick={onCloseDeleteModal}>No</Button>
            <Button colorScheme="red" ml={3} onClick={handleDeleteSubject}>
              Yes
            </Button>
            
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
    </Box>
  );
};

export default SubjectManagement;
