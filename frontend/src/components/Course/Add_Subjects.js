import React, { useEffect, useMemo, useState } from "react";
import { 
    Flex, useToast, Text, Box, Badge, Tooltip, Avatar, useBreakpointValue, 
    Button, Grid, IconButton, Input, InputGroup, InputLeftElement, 
    InputRightElement, CloseButton, 
    Stack,
    Checkbox,
    Switch,
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverArrow,
    PopoverCloseButton,
    PopoverHeader,
    PopoverBody
} from "@chakra-ui/react";
import axios from 'axios';
import { AddIcon, CheckIcon, ChevronLeftIcon, ChevronRightIcon, CloseIcon, DeleteIcon, Search2Icon } from "@chakra-ui/icons";
import { FaFilter } from "react-icons/fa";

const AddSubjects = ({ allSaveSubjects, subjects, assignedYear, assignedSemester, onClose, isDisabled, handleSubject, isUpdate ,handleUpdate}) => {
    const [filteredData, setFilteredData] = useState([]);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [displaySelectedSubjects, setDisplaySelectedSubjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOptions, setFilterOptions] = useState({
        freeModule: true,
        mpuCompulsory: true,
        showNotTaken: true,
        collegeCompulsory: true,
        core: true,
        technicalElectives: true,
    });

    const subjectsPerPage = useBreakpointValue({ base: 4, xl: 6 });
    const [currentPage, setCurrentPage] = useState(1);
    const toast = useToast();

    // Effect to update already assigned selectedSubjects based on assignedYear and assignedSemester
    useEffect(() => {
        const selectedSubIds = [];
        if(isUpdate){
            subjects.forEach((sub)=>{
                selectedSubIds.push(sub.id);
            })
        }else{
            subjects.forEach((subject) => {
                if (subject.year === assignedYear && subject.semester === assignedSemester) {
                    subject.subjects.forEach((sub) => {
                        selectedSubIds.push(sub.id);
                    });
                }
            });
        }
        setSelectedSubjects(selectedSubIds);
    }, [subjects, assignedYear, assignedSemester]);

    // Show all subjects in database
    useEffect(() => {
        axios.get('http://localhost:5000/show-all-subjects')
            .then((response) => {
                const sortedData = response.data.sort((a, b) => a.id - b.id);
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
            });
    }, []);  

    // Fetch and display selected subjects based on selectedSubjects
    useEffect(() => {
        const fetchSelectedSubjects = async () => {
            try {
                const response = await axios.post('/show-selected-subjects', { subject_ids: selectedSubjects, assignedSemester, assignedYear });
                setDisplaySelectedSubjects(response.data);
            } catch (error) {
                console.error("Error fetching selected subjects:", error);
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: `${error.response?.data?.error || error.message}`,
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
            }
        };
    
        if (selectedSubjects.length > 0) {
            fetchSelectedSubjects();
        } else {
            setDisplaySelectedSubjects([]);
        }
    }, [selectedSubjects, toast]);

    useEffect(() => {
        setCurrentPage(1); 
    }, [subjectsPerPage, searchQuery]);

    // Toggle selection of subjects
    const handleSelectedSubjects = (id) => {
        setSelectedSubjects(prevSelectedSubjects => {
            let updatedSubjects;
            if (prevSelectedSubjects.includes(id)) {
                updatedSubjects = prevSelectedSubjects.filter(subjectId => subjectId !== id);
            } else {
                updatedSubjects = [...prevSelectedSubjects, id];
            }
            return updatedSubjects;
        });
    };
    
    const handleSave = () => {
        if (isUpdate) {
            handleUpdate(displaySelectedSubjects, assignedYear, assignedSemester);
        } else {
            handleSubject(displaySelectedSubjects, assignedYear, assignedSemester);
        }

        toast({
            title: 'Subject temporary added',
            position: 'top-right',
            description: 'Subjects have been temporarily added to the course.',
            status: 'info',
            duration: 1000,
            isClosable: true,
        });
        onClose();
    };

    // Filter based on search query
    const filteredSubjects = useMemo(() => {
        let filteredSaveSubjects = [];
    
        if (!isUpdate) {
            const subjects = allSaveSubjects.flatMap(subject => subject.subjects);
            filteredSaveSubjects = subjects.filter(
                sub => sub.year !== assignedYear || sub.semester !== assignedSemester
            );
        } else {
            filteredSaveSubjects = allSaveSubjects.filter(
                saveSubject => saveSubject.year !== assignedYear || saveSubject.semester !== assignedSemester
            );
        }
    
        const allSaveSubjectIds = filteredSaveSubjects.map(saveSubject => saveSubject.id);
    
        return filteredData.filter(subject => {
            // Check if the subject matches the search query
            const isSearchMatch = subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                  subject.section.toLowerCase().includes(searchQuery.toLowerCase());
    
            // Check if the subject matches the section filters
            const isSectionMatch = (
                (filterOptions.freeModule && subject.section === "Free Module") ||
                (filterOptions.mpuCompulsory && subject.section === "MPU Compulsory") ||
                (filterOptions.collegeCompulsory && subject.section === "College Compulsory") ||
                (filterOptions.core && subject.section === "Core") ||
                (filterOptions.technicalElectives && subject.section === "Technical Electives")
            );
    
            // Determine if the subject is not taken (optional filter)
            const isNotTakenSubject = !filterOptions.showNotTaken || !allSaveSubjectIds.includes(subject.id);
    
            // Combine all filters
            return isSearchMatch && isSectionMatch && isNotTakenSubject;
        });
    }, [filteredData, searchQuery, filterOptions, allSaveSubjects, isUpdate, assignedYear, assignedSemester]);
    
    const filteredSelectedSubjects = useMemo(() => 
        displaySelectedSubjects.filter(subject =>
            subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.section.toLowerCase().includes(searchQuery.toLowerCase())
        ), [displaySelectedSubjects, searchQuery]);

    // Calculate the data for the current page
    const paginatedData = useMemo(() => 
    filteredSubjects.slice(
        (currentPage - 1) * subjectsPerPage,
        currentPage * subjectsPerPage
    ), [filteredSubjects, currentPage, subjectsPerPage]);

    const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage);

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
    const selectLabel = useBreakpointValue({ base: "", xl: " Select" });
    const selectedLabel = useBreakpointValue({ base: "", xl: " selected " });
    const buttonMinWidth = useBreakpointValue({ base: "50px",md: '80px', xl: "100px" });
    const buttonSize = useBreakpointValue({ base: 'sm', xl: 'md' });
    const headerSize = useBreakpointValue({ base: '15px', xl: '16px' });
    const textSize = useBreakpointValue({ base: '12px', xl: '15px' });
    const badgeSize = useBreakpointValue({ base: '10px', xl: '13px' });
    const avatarSize = useBreakpointValue({ base: "sm", xl: "md" });
    const boxPadding = useBreakpointValue({ base: 2, xl: 4 });

    return (
        <Flex flexDirection='column'>
            <Flex>
                <InputGroup width='95%'>
                    <InputLeftElement><Search2Icon /></InputLeftElement>
                    <Input 
                        value={searchQuery} 
                        onChange={(e) => setSearchQuery(e.target.value)} 
                        variant='flushed' 
                        marginBottom='20px' 
                        placeholder="Search..." 
                    />
                    <InputRightElement>
                        <CloseButton onClick={() => setSearchQuery('')} />
                    </InputRightElement>
                </InputGroup>
                <Popover>
                    <PopoverTrigger>
                        <IconButton ml={5} icon={<FaFilter />} width='5%'/>
                    </PopoverTrigger>
                    <PopoverContent width='300px'>
                        <PopoverArrow />
                        <PopoverCloseButton />
                        <PopoverHeader>Filter Options</PopoverHeader>
                        <PopoverBody>
                            <Stack>
                                <Checkbox 
                                    isChecked={filterOptions.collegeCompulsory} 
                                    onChange={(e) => setFilterOptions({ ...filterOptions, collegeCompulsory: e.target.checked })}
                                >
                                    College Compulsory
                                </Checkbox>
                                <Checkbox 
                                    isChecked={filterOptions.mpuCompulsory} 
                                    onChange={(e) => setFilterOptions({ ...filterOptions, mpuCompulsory: e.target.checked })}
                                >
                                    MPU Compulsory
                                </Checkbox>
                                <Checkbox 
                                    isChecked={filterOptions.core} 
                                    onChange={(e) => setFilterOptions({ ...filterOptions, core: e.target.checked })}
                                >
                                    Core
                                </Checkbox>
                                <Checkbox 
                                    isChecked={filterOptions.technicalElectives} 
                                    onChange={(e) => setFilterOptions({ ...filterOptions, technicalElectives: e.target.checked })}
                                >
                                    Technical Electives
                                </Checkbox>
                                <Checkbox 
                                    isChecked={filterOptions.freeModule} 
                                    onChange={(e) => setFilterOptions({ ...filterOptions, freeModule: e.target.checked })}
                                >
                                    Free Module
                                </Checkbox>
                                <Flex alignItems="center">
                                    <Text mr={4}>Show Only Not Taken Subjects</Text>
                                    <Switch
                                        isChecked={filterOptions.showNotTaken} 
                                        onChange={(e) => setFilterOptions({ ...filterOptions, showNotTaken: e.target.checked })}
                                    />
                                </Flex>
                            </Stack>
                        </PopoverBody>
                    </PopoverContent>
                </Popover>
            </Flex>
            
            <Flex>
                <Flex width={{ base: '100%', md: '40%' }} maxHeight='60vh' flexDirection='column' marginRight={{ base: '10px', md: '20px' }} mb={{ base: 4, md: 0 }} overflowY='scroll'>
                    <Text fontSize='20px' textAlign='center' mb='10px' fontWeight="bold">Selected Subjects</Text>
                    {
                        filteredSelectedSubjects.map((subject, index) => (
                            <Box key={index} mb={4} p={boxPadding} borderWidth="1px" borderRadius="md"
                                cursor='pointer'
                            >
                                <Flex alignItems="center">
                                    <Avatar
                                        src={subject.profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'}
                                        size={avatarSize}
                                    />
                                    <Box ml={3}>
                                        <Text fontWeight="bold" fontSize={headerSize}>
                                            {subject.code}
                                            <Badge ml={3} fontSize={badgeSize} variant="subtle" colorScheme="green">
                                                {subject.section}
                                            </Badge>
                                        </Text>
                                        <Text fontSize={textSize} as="u">{subject.name}</Text>
                                    </Box>
                                    <Flex ml="auto">
                                        <Tooltip isDisabled={isDisabled} label='Remove subject temporary' fontSize='md'>
                                            <Button
                                                padding='5px'
                                                colorScheme='red'
                                                minWidth={buttonMinWidth}
                                                size='sm'
                                                textAlign="center"
                                                onClick={() => handleSelectedSubjects(subject.id)}
                                            >
                                                <DeleteIcon />
                                            </Button>
                                        </Tooltip>
                                    </Flex>
                                </Flex>
                            </Box>
                        ))
                    }
                </Flex>
                <Flex width={{ base: '100%', md: '60%' }} height='100%' flexDirection='column'>
                    <Text textAlign='center' fontSize='20px' mb='10px' fontWeight="bold">Subject List</Text>
                    <Grid templateColumns={{ base: '1fr', xl: 'repeat(2,1fr)' }} gap={4}>
                        {paginatedData.map((subject, index) => {
                           
                           let filteredSaveSubjects = [];

                            if (!isUpdate) {
                                // Flatten the list of subjects
                                const subjects = allSaveSubjects.flatMap(subject =>
                                    subject.subjects
                                );

                                // Filter the flattened subjects based on year and semester
                                filteredSaveSubjects = subjects.filter(sub =>
                                    sub.year !== assignedYear || sub.semester !== assignedSemester
                                );
                            } else {
                                // If updating, filter directly from allSaveSubjects array
                                filteredSaveSubjects = allSaveSubjects.filter(saveSubject =>
                                    saveSubject.year !== assignedYear || saveSubject.semester !== assignedSemester
                                );
                            }

                            // Extract IDs from filteredSaveSubjects
                            const allSaveSubjectIds = filteredSaveSubjects.map(saveSubject => saveSubject.id);

                            // Determine if the current subject should be disabled
                            const isSubjectDisabled = allSaveSubjectIds.includes(subject.id);

                            return(
                            <Box key={index} mb={4} p={boxPadding} borderWidth="1px" borderRadius="md"                                
                                opacity={isSubjectDisabled ? 0.5 : 1}
                                cursor={isSubjectDisabled ? 'not-allowed' : 'pointer'}
                            >
                                <Flex alignItems="center">
                                    <Avatar
                                        src={subject.profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'}
                                        size={avatarSize}
                                    />
                                    <Box ml={3}>
                                        <Text fontWeight="bold" fontSize={headerSize}>
                                            {subject.code}
                                            <Badge ml={3} fontSize={badgeSize} variant="subtle" colorScheme="green">
                                                {subject.section}
                                            </Badge>
                                        </Text>
                                        <Text fontSize={textSize} as="u">{subject.name}</Text>
                                    </Box>
                                    <Flex ml="auto">
                                    <Tooltip 
                                        isDisabled={isDisabled} 
                                        label={isSubjectDisabled 
                                            ? 'Already Assigned to other sessions' 
                                            : Array.isArray(selectedSubjects) && selectedSubjects.includes(subject.id) 
                                                ? 'Remove' 
                                                : 'Select'} 
                                        fontSize='md'
                                    >
                                        <Button
                                            onClick={() => handleSelectedSubjects(subject.id)}
                                            variant={isSubjectDisabled 
                                                ? 'solid' 
                                                : Array.isArray(selectedSubjects) && selectedSubjects.includes(subject.id) 
                                                    ? 'solid' 
                                                    : 'outline'}
                                            padding='5px'
                                            colorScheme={isSubjectDisabled 
                                                ? 'red' 
                                                : Array.isArray(selectedSubjects) && selectedSubjects.includes(subject.id) 
                                                    ? 'teal' 
                                                    : 'blue'}
                                            minWidth={buttonMinWidth}
                                            size='sm'
                                            textAlign="center"
                                            isDisabled={isSubjectDisabled}
                                        >
                                            {isSubjectDisabled 
                                                ? 
                                                <CloseIcon /> 
                                                : 
                                                Array.isArray(selectedSubjects) && selectedSubjects.includes(subject.id) 
                                                    ? 
                                                        <>
                                                            <CheckIcon ml={1} mr={1} />
                                                            {selectedLabel}
                                                        </>
                                                    : 
                                                        <>
                                                            <AddIcon ml={1} mr={1} />
                                                            {selectLabel}
                                                        </>
                                            }
                                        </Button>
                                    </Tooltip>
                                    </Flex>
                                </Flex>
                            </Box>
                        )})}
                    </Grid>
                    <Tooltip label='Add subjects temporary' isDisabled={isDisabled}>
                        <Button onClick={handleSave} size={buttonSize} colorScheme="teal"><CheckIcon mr={1} />Add</Button>
                    </Tooltip>
                    <Flex mt={4} justifyContent="center">
                        <Tooltip isDisabled={isDisabled} label='Previous Page' fontSize='md'>
                            <IconButton
                                size={buttonSize}
                                icon={<ChevronLeftIcon />}
                                onClick={() => {
                                    setCurrentPage(Math.max(currentPage - 1, 1));
                                }}
                                isDisabled={currentPage === 1 || filteredData.length === 0}
                                width={'40%'}
                                marginRight={'10px'}
                            />
                        </Tooltip>
                        {startPage > 1 && (
                            <>
                                <Button
                                    size={buttonSize}
                                    mx={1}
                                    onClick={() => setCurrentPage(1)}
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
                                onClick={() => setCurrentPage(number)}
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
                                    onClick={() => setCurrentPage(totalPages)}
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
                                    setCurrentPage(Math.min(currentPage + 1, totalPages));
                                }}
                                isDisabled={currentPage === totalPages || filteredData.length === 0}
                                width={'40%'}
                                marginLeft={'10px'}
                            />
                        </Tooltip>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
}

export default AddSubjects;
