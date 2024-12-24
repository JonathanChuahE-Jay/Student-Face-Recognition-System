import React, { useEffect, useState } from "react";
import {
    Button,
    Menu,
    MenuButton,
    MenuList,
    MenuItem,
    Text,
    Image,
    Flex,
    SimpleGrid,
    Input,
    Box,
    useToast,
    InputGroup,
    InputLeftElement,
    InputRightElement,
    CloseButton
} from "@chakra-ui/react";
import { ChevronDownIcon, Search2Icon } from "@chakra-ui/icons";
import axios from "axios";

const AssignLecturerModal = ({ onClose, currentSection, subject_id, onRefresh }) => {
    const [selectedLecturer, setSelectedLecturer] = useState(null);
    const [allLecturers, setAllLecturers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    const fetchData = async () => {
        try {
            const response = await axios.post('/display-assigned-student-and-lecturer', { subject_id });
            const { all_lecturers } = response.data;
            setAllLecturers(all_lecturers);
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
    useEffect(()=>{
        fetchData();
    },[])

    const handleAssign = async () => {
        if (!selectedLecturer) {
            toast({
                title: 'Select Lecturer',
                position: 'top-right',
                description: 'Please select a lecturer to assign.',
                status: 'warning',
                duration: 1000,
                isClosable: true,
            });
            return;
        }
        try {
            await axios.post('/alter-assigned-lecturer', {
                subject_section: currentSection,
                lecturer_id: selectedLecturer.id,
                subject_id,
                mode: 'Assign'
            });
            toast({
                title: 'Lecturer Assigned',
                position: 'top-right',
                description: `Lecturer ${selectedLecturer.name} assigned successfully.`,
                status: 'success',
                duration: 1000,
                isClosable: true,
            });
            onRefresh();
            onClose();
        } catch (error) {
            console.error(error);
            toast({
                title: 'Error',
                position: 'top-right',
                description: error.response?.data?.error || 'An unexpected error occurred.',
                status: 'error',
                duration: 1000,
                isClosable: true,
            });
        }
    };

    const filteredLecturers = allLecturers?.filter(lecturer =>
        lecturer.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];
    

    return (
        <Flex flexDirection='column' height='100%'>

            <Box mb={4} textAlign="center">
                <Image
                    src={selectedLecturer?.profile_picture || 'https://via.placeholder.com/150'}
                    alt={selectedLecturer?.name || 'Selected Lecturer'}
                    borderRadius="5px"
                    mx="auto"
                    boxSize="200px"
                />
            </Box>
            <Menu>
                <MenuButton mt={5} as={Button} rightIcon={<ChevronDownIcon />} width="full">
                    {selectedLecturer ? `Selected Lecturer: ${selectedLecturer.name}` : 'Select Lecturer'}
                </MenuButton>
                <MenuList width="full" maxHeight="300px" overflowY="auto" p={0}>
                    <InputGroup>
                        <InputLeftElement><Search2Icon/></InputLeftElement>
                        <Input
                            placeholder="Search..."
                            value={searchTerm}
                            variant='flushed'
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <InputRightElement><CloseButton onClick={()=>setSearchTerm('')}/></InputRightElement>
                    </InputGroup>
                    
                    <SimpleGrid columns={2} spacing={2} p={2} width="full">
                        {filteredLecturers.length > 0 ? (
                            filteredLecturers.map(lecturer => (
                                <MenuItem
                                    key={lecturer.id}
                                    onClick={() => setSelectedLecturer(lecturer)}
                                    width="100%"
                                >
                                    <Flex align="center" width="100%">
                                        <Image src={lecturer.profile_picture || 'https://via.placeholder.com/150'} alt={lecturer.name} boxSize="40px" borderRadius="full" mr={3} />
                                        <Text>{lecturer.name}</Text>
                                    </Flex>
                                </MenuItem>
                            ))
                        ) : (
                            <MenuItem width="100%">
                                <Text>No lecturers found</Text>
                            </MenuItem>
                        )}
                    </SimpleGrid>
                </MenuList>
            </Menu>
            <Flex mt='auto' p={4} justifyContent='space-between'>
                <Button width='40%' onClick={onClose}>
                    Back
                </Button>
                <Button width='40%' colorScheme="teal" onClick={handleAssign} isDisabled={!selectedLecturer}>
                    Assign Lecturer
                </Button>
            </Flex>
        </Flex>
    );
};

export default AssignLecturerModal;
