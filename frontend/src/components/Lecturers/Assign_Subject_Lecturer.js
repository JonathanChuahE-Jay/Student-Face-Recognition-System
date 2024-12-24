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
    FormControl,
    Spinner,
    Tooltip,
    Menu,
    MenuButton,
    MenuItem,
    Checkbox,
    MenuList,
} from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { CheckIcon, Search2Icon, ChevronLeftIcon, ChevronRightIcon, InfoIcon, AddIcon } from "@chakra-ui/icons";
import axios from "axios";

const Assign_Lecturer_Subject = ({ isDisabled, lecturerId, onRefresh, onClose }) => {
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [subjectSections, setSubjectSections] = useState({}); 
    const [searchQuery, setSearchQuery] = useState('');
    const [data, setData] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(6);
    const [loading, setLoading] = useState(false); 
    const toast = useToast();

    // Fetch all subjects on component mount
    useEffect(() => {
        const fetchSubjects = async () => {
            setLoading(true);
            try {
                const response = await axios.get('http://localhost:5000/show-all-subjects', {
                    params: { id_not_include: lecturerId } 
                });
                const sortedData = response.data.sort((a, b) => a.id - b.id);
                setData(sortedData);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Failed to load subjects.',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSubjects();
    }, [lecturerId]);

    
    // Fetch assigned subjects id for the lecturer
    useEffect(() => {
        const fetchSubjects = async () => {
            setLoading(true);
            try {
                const response = await axios.post('http://localhost:5000/display-assigned-subjects', { lecturer_id: lecturerId });
                const { subjectData } = response.data;
    
                if (Array.isArray(subjectData)) {
                    // Extract assigned subject IDs and their sections
                    const assignedSubjectIds = subjectData.map(subject => subject.subject_id);
                    const assignedSections = subjectData.reduce((acc, subject) => {
                        if (!acc[subject.subject_id]) {
                            acc[subject.subject_id] = [];
                        }
                        acc[subject.subject_id].push(subject.subject_section);
                        return acc;
                    }, {});
                    setSelectedSubjects(assignedSubjectIds);
                    setSubjectSections(assignedSections);
    
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
    
        if (lecturerId) {
            fetchSubjects();
        }
    }, [lecturerId]); 
    

    // Toggle subject selection
    const handleSelectSubject = (id) => {
        setSelectedSubjects(prevSelectedSubjects => 
            prevSelectedSubjects.includes(id)
                ? prevSelectedSubjects.filter(subjectId => subjectId !== id)
                : [...prevSelectedSubjects, id]
        );
    };

    // Handle section change for a selected subject
    const handleSectionChange = (subjectId, section) => {
        setSubjectSections(prevSections => {
            const currentSections = Array.isArray(prevSections[subjectId])
                ? prevSections[subjectId]
                : [];
            
            const sectionInt = parseInt(section, 10);
    
            if (currentSections.includes(sectionInt)) {
                return {
                    ...prevSections,
                    [subjectId]: currentSections.filter(sec => sec !== sectionInt)
                };
            } else {
                return {
                    ...prevSections,
                    [subjectId]: [...currentSections, sectionInt]
                };
            }
        });
    };
    // Handle form submission
    const handleSubmit = () => {
        const allSectionsSelected = selectedSubjects.every(id => subjectSections[id]);

        // Check if all selected subjects have a section assigned
        if (!allSectionsSelected) {
            toast({
                title: 'Error',
                position: 'top-right',
                description: "Please select a section for all selected subjects",
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
            return;
        }

        setLoading(true); 
        // Send assignment data to server
        axios.post('http://localhost:5000/assign-subject-lecturer', {
            lecturer_id: lecturerId,
            subject_ids: selectedSubjects,
            subject_sections: selectedSubjects.map(id => subjectSections[id])
        })
        .then(response => {
            const data = response.data;
            if (data.error) {
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: data.error,
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                });
            } else {
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: data.message,
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                });
                onClose();
                onRefresh();
            }
        })
        .catch(error => {
            const errorMessage = error.response?.data?.error || 'An error occurred while assigning subjects.';
            toast({
                title: 'Error',
                position: 'top-right',
                description: errorMessage,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        })
        .finally(() => setLoading(false));
    };

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

            {/* Loading Indicator */}
            {loading ? (
                <Flex justifyContent="center" alignItems="center" height="200px">
                    <Spinner size="lg" />
                </Flex>
            ) : (
                <>
                    {/* Display subjects in a grid */}
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} position="relative">
                        {currentItems.length === 0 ? (
                            <Flex alignItems="center" textAlign="center" flexDirection="column" marginTop="20px">
                                <InfoIcon boxSize={20} />
                                <Text mt={2} mb={4}>There's no existing subjects currently.</Text>
                            </Flex>
                        ) : (
                            currentItems.map((subject) => {
                                // Check if all sections are full
                                const allSectionsFull = subject.sections.every((section) => section.isDisabled);
                                return (
                                    <Card
                                        borderRadius='5px'
                                        padding='5px'
                                        key={subject.id}
                                        direction={{ base: 'column', sm: 'row' }}
                                        overflow='visible'
                                        variant='outline'
                                        size='sm'
                                        isDisabled={allSectionsFull && !selectedSubjects.includes(subject.id)} 
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
                                        <Flex alignItems="center" marginLeft="auto">
                                            {/* Display section selector and buttons */}
                                            {selectedSubjects.includes(subject.id) ? (
                                                <>
                                                    <FormControl width='110px' isRequired>
                                                        <Tooltip isDisabled={isDisabled} label='Select a section' fontSize='md'>
                                                            <Menu closeOnSelect={false}>
                                                                <MenuButton
                                                                    as={Button}
                                                                    leftIcon={<AddIcon />}
                                                                    size='sm'
                                                                    width='100px'
                                                                    borderRadius='5px'
                                                                    colorScheme='blue'
                                                                    position="relative" 
                                                                    padding='0px 20px 0px 20px'
                                                                >
                                                                    Add
                                                                </MenuButton>
                                                                <MenuList>
                                                                    {subject.sections.map((section, index) => (
                                                                        <MenuItem
                                                                            key={index}
                                                                            isDisabled={section.isDisabled}
                                                                            style={{ color: section.isDisabled ? 'red' : 'green' }}
                                                                            zIndex="popover"
                                                                            onClick={() => handleSectionChange(subject.id, section.section_number)}
                                                                        >
                                                                            <Checkbox
                                                                                isChecked={Array.isArray(subjectSections[subject.id]) && subjectSections[subject.id].includes(section.section_number)}
                                                                                onChange={() => handleSectionChange(subject.id, section.section_number)}
                                                                                isDisabled={section.isDisabled}
                                                                            >
                                                                                Section {section.section_number}
                                                                            </Checkbox>
                                                                        </MenuItem>
                                                                    ))}
                                                                </MenuList>
                                                            </Menu>
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
                                            ) : (
                                                <Tooltip isDisabled={allSectionsFull} label={allSectionsFull ? 'All sections are full' : 'Add'} fontSize='md'>
                                                    <Button
                                                        marginRight='10px'
                                                        width='90px'
                                                        variant={allSectionsFull?'solid':'outline'}
                                                        colorScheme={allSectionsFull?'red':'blue'}
                                                        size='sm'
                                                        isDisabled={allSectionsFull} 
                                                        onClick={() => handleSelectSubject(subject.id)}
                                                    >
                                                       {allSectionsFull? 'Full' : 'Select'} 
                                                    </Button>
                                                </Tooltip>
                                            )}
                                        </Flex>
                                    </Card>
                                );
                            })
                        )}
                    </SimpleGrid>


                    {/* Pagination Controls */}
                    <HStack spacing={4} marginTop='20px' justifyContent="center">
                        <Tooltip isDisabled={isDisabled} label='Previous page' fontSize='md'>
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
                        <Tooltip isDisabled={isDisabled} label='Next page' fontSize='md'>
                            <IconButton
                                icon={<ChevronRightIcon />}
                                isDisabled={currentPage === totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                            />
                        </Tooltip>
                    </HStack>

                    {/* Confirm Button */}
                    <Tooltip isDisabled={isDisabled} label='Confirm' fontSize='md'>
                        <Button margin='10px 0' colorScheme="teal" onClick={handleSubmit}>
                            <CheckIcon ml={1} mr={1} />Confirm
                        </Button>
                    </Tooltip>
                </>
            )}
        </Flex>
    );
};

export default Assign_Lecturer_Subject;
