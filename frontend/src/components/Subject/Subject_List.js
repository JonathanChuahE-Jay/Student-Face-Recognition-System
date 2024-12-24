import React, { useCallback, useEffect, useState } from "react";
import { Flex, Avatar, Box, Text, Badge, Divider, Button, useBreakpointValue, Tooltip, Checkbox, useToast } from "@chakra-ui/react";
import { CalendarIcon, DeleteIcon, EditIcon, InfoIcon, InfoOutlineIcon, MinusIcon } from "@chakra-ui/icons";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const SubjectList = ({searchQuery, user, fetchData, paginatedData, isDisabled, filteredData, handleUpdateSubject, handleDeleteConfirmation, handleMoreInfo }) => {
    const navigate = useNavigate();
    const toast = useToast();
    const [deleteCheckBoxBar, setDeleteCheckBoxBar] = useState(false);
    const [checkedItems, setCheckedItems] = useState({}); 

    const deleteLabel = useBreakpointValue({ base: "", lg: " Delete" });
    const moreInfoLabel = useBreakpointValue({ base: "", lg: " More Info" });
    const updateLabel = useBreakpointValue({ base: "", lg: " Update" });
    const calendarLabel = useBreakpointValue({ base: "", lg: " Attendance" });
    const CodeSize = useBreakpointValue({ base: '13px', lg: '15px' });
    const sectionSize = useBreakpointValue({ base: '9px', lg: '11px' });
    const textSize = useBreakpointValue({ base: 'sm', lg: 'md' });

    const buttonSize = useBreakpointValue({ base: "sm", lg: "md" });
    const buttonMinWidth = useBreakpointValue({ base: "30px", lg: "120px" });

    const handleAttendanceNavigation = (subject) => {
        navigate(`/subject-info/show-attendance/${subject.name}`, {
            state: {
                subject_id: subject.id,
                subjectName: subject.name,
                numberOfSections: subject.number_of_sections
            }
        });
    };

    useEffect(() => {
        const hasCheckedItems = Object.values(checkedItems).some(item => item === true);
        setDeleteCheckBoxBar(hasCheckedItems);
    }, [checkedItems]);

    const handleCheckboxChange = (id) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: !prev[id] 
        }));
    };

    // Handle select all checkbox
    const handleSelectAll = () => {
        const allChecked = paginatedData.every(subject => checkedItems[subject.id]);

        const newCheckedItems = {};
        paginatedData.forEach(subject => {
            newCheckedItems[subject.id] = !allChecked; 
        });

        setCheckedItems(prev => ({
            ...prev,
            ...newCheckedItems 
        }));
    };

    const handleDeleteSelectedSubjects = useCallback(async () => {
        const selectedSubjectIds = Object.keys(checkedItems).filter(id => checkedItems[id]);

        if (selectedSubjectIds.length === 0) {
            toast({
                title: 'No subjects selected',
                position: 'top-right',
                description: 'Please select at least one subject to delete.',
                status: 'warning',
                duration: 1000,
                isClosable: true,
            });
            return;
        }

        try {
            const deleteRequests = selectedSubjectIds.map(id =>
                axios.post('http://localhost:5000/delete-subject', {
                    id
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
                        description: result.error || `Failed to delete subject`,
                        status: 'error',
                        duration: 1000,
                        isClosable: true,
                    });
                }
            });

            const newCheckedItems = { ...checkedItems };
            selectedSubjectIds.forEach(id => delete newCheckedItems[id]);
            setCheckedItems(newCheckedItems);
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
        <Box minHeight="350px" mt={5}>
            {filteredData.length === 0 ? (
                <Flex alignItems="center" textAlign="center" flexDirection="column" marginTop="20px">
                    <InfoIcon boxSize={20} />
                    <Text mt={2} mb={4}>There's no existing subject currently.</Text>
                </Flex>
            ) : (
                <>
                    {
                        user.role === 'admin' && (
                            <Flex width='100%' mb={1}>
                                <Checkbox
                                    isChecked={paginatedData.every(subject => checkedItems[subject.id])}
                                    isIndeterminate={paginatedData.some(subject => checkedItems[subject.id]) && !paginatedData.every(subject => checkedItems[subject.id])}
                                    onChange={handleSelectAll}
                                >
                                    Select All
                                </Checkbox>
                            </Flex>
                        )   
                    }
                    
                    {
                        filteredData.map((subject, index) => (
                            <Box key={index} mb={4}>
                                <Divider mb={4} />
                                <Flex alignItems="center">
                                    {
                                        user.role ==='admin' && (
                                            <Checkbox
                                                isChecked={!!checkedItems[subject.id]}
                                                onChange={() => handleCheckboxChange(subject.id)}  
                                                mr={3}
                                            />

                                        )
                                    }
                                    <Avatar src={subject.profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'} />
                                    <Box ml={3}>
                                        <Text fontSize={CodeSize} fontWeight="bold">
                                            {subject.code}
                                            <Badge fontSize={sectionSize} ml={3} variant="subtle" colorScheme="green">
                                                {subject.section}
                                            </Badge>
                                        </Text>
                                        <Text fontSize={textSize} as="u">{subject.name}</Text>
                                    </Box>

                                    <Flex ml="auto">
                                        <Tooltip isDisabled={isDisabled} label='More Info' fontSize='md'>
                                            <Button
                                                padding='5px'
                                                colorScheme="green"
                                                onClick={() => handleMoreInfo(subject)}
                                                minWidth={buttonMinWidth}
                                                size={buttonSize}
                                                textAlign="center"
                                            >
                                                <InfoOutlineIcon ml={1} mr={1} />
                                                {moreInfoLabel}
                                            </Button>
                                        </Tooltip>
                                        {
                                            user.role ==='admin' && (
                                                <Tooltip isDisabled={isDisabled} label='Update' fontSize='md'>
                                                    <Button
                                                        padding='5px'
                                                        colorScheme="teal"
                                                        ml={2}
                                                        onClick={() => handleUpdateSubject(subject)}
                                                        minWidth={buttonMinWidth}
                                                        size={buttonSize}
                                                        textAlign="center"
                                                    >
                                                        <EditIcon ml={1} mr={1} />
                                                        {updateLabel}
                                                    </Button>
                                                </Tooltip>
                                            )

                                        }
                                        

                                        <Tooltip isDisabled={isDisabled} label='Attendance' fontSize='md'>
                                            <Button
                                                padding='5px'
                                                colorScheme="blue"
                                                onClick={() => handleAttendanceNavigation(subject)}
                                                ml={2}
                                                minWidth={buttonMinWidth}
                                                size={buttonSize}
                                                textAlign="center"
                                            >
                                                <CalendarIcon ml={1} mr={1} />
                                                {calendarLabel}
                                            </Button>
                                        </Tooltip>
                                        {
                                            user.role ==='admin' && (
                                                <Tooltip isDisabled={isDisabled} label='Delete' fontSize='md'>
                                                    <Button
                                                        padding='5px'
                                                        colorScheme="red"
                                                        onClick={() => handleDeleteConfirmation(subject.id)}
                                                        ml={2}
                                                        minWidth={buttonMinWidth}
                                                        size={buttonSize}
                                                        textAlign="center"
                                                    >
                                                        <DeleteIcon ml={1} mr={1} />
                                                        {deleteLabel}
                                                    </Button>
                                                </Tooltip>
                                            )
                                            
                                        }
                                        
                                    </Flex>
                                </Flex>
                            </Box>
                        ))
                    }
                    {
                      deleteCheckBoxBar? 
                          <Flex
                              zIndex='2'
                              width='100%'
                              height='50px'
                              position='fixed'
                              bottom='0'
                              left='0'
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
                              <Button width='45%' colorScheme="red" onClick={()=>{handleDeleteSelectedSubjects()}}>
                                  <DeleteIcon mr={2}/>
                                  Delete selected items
                              </Button>
                          </Flex>
                      :
                          null
                  }
                </>
            )}
        </Box>
    );
};

export default SubjectList;
