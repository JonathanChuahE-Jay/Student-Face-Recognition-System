import React, { useRef, useEffect, useState } from "react";
import { 
    Drawer, DrawerBody, DrawerCloseButton, DrawerContent, useToast, 
    DrawerHeader, DrawerOverlay, Flex, useDisclosure, Accordion, 
    AccordionItem, AccordionButton, AccordionPanel, AccordionIcon, Box, Button,
    Grid, GridItem, Avatar, useBreakpointValue, Badge, Tooltip, Text
} from "@chakra-ui/react";
import AddSubjects from "./Add_Subjects";
import { ArrowBackIcon, DeleteIcon } from "@chakra-ui/icons";

const SelectDuration = ({ subjects, onOpenDuration, assignedYear, assignedSemester, onCloseSelf, isDisabled, handleSubject, selectedSubjects, handleDelete }) => {
    const [selectedYear, setSelectedYear] = useState('');
    const [selectedSemester, setSelectedSemester] = useState('');

    const { isOpen: isOpenAddSubject, onOpen: onOpenAddSubject, onClose: onCloseAddSubject } = useDisclosure();
    const toastTriggeredRef = useRef(false);
    const toast = useToast();

    useEffect(() => {
        if (assignedYear === '' || assignedSemester === '') {
            if (!toastTriggeredRef.current) {
                toastTriggeredRef.current = true;
                toast({
                    title: 'Error',
                    position: 'top-right',
                    description: 'Please add a duration of the course first.',
                    status: 'error',
                    duration: 1000,
                    isClosable: true,
                });
                onOpenDuration();
            }
        }
    }, [assignedYear, assignedSemester, toast, onOpenDuration]);

    const handleAddSubject = (year, semester) => {
        setSelectedYear(year);
        setSelectedSemester(semester);
        onOpenAddSubject();
    };

    const buttonMinWidth = useBreakpointValue({ base: "80px", md: "85px", xl: '90px' });
    const buttonMinHeight = useBreakpointValue({ base: "10px", md: "15px"});
    const headerSize = useBreakpointValue({ base: '13px', md: '14px', xl: '16px' });
    const textSize = useBreakpointValue({ base: '12px', md: '12px', xl: '15px' });
    const badgeSize = useBreakpointValue({ base: '10px', md: '11px', xl: '12px' });
    const avatarSize = useBreakpointValue({ base: "sm", md: "md" });
    const boxPadding = useBreakpointValue({ base: 2, md: 4 });
    const grid = useBreakpointValue({ base: '1fr', md: 'repeat(2, 1fr)', xl: 'repeat(3, 1fr)' });

    // Updated helper function to count subjects for each year
    const countSubjectsForYear = (year) => {
        return selectedSubjects
            .filter(subject => subject.year === year)
            .reduce((total, subject) => total + subject.subjects.length, 0);
    };

    // Helper function to count subjects for each semester within a year
    const countSubjectsForSemester = (year, semester) => {
        return selectedSubjects
            .filter(subject => subject.year === year && subject.semester === semester)
            .reduce((total, subject) => total + subject.subjects.length, 0);
    };

    return (
        <Flex direction="column" width="100%">
            <Accordion allowToggle width="100%">
                {Array.from({ length: assignedYear }).map((_, yearIndex) => (
                    <AccordionItem key={yearIndex}>
                        <AccordionButton>
                            <Box flex="1" textAlign="left">
                                Year {yearIndex + 1} ({countSubjectsForYear(yearIndex + 1)} subjects)
                            </Box>
                            <AccordionIcon />
                        </AccordionButton>
                        <AccordionPanel pb={4}>
                            <Accordion allowMultiple width="100%">
                                {Array.from({ length: assignedSemester }).map((_, semesterIndex) => (
                                    <AccordionItem key={semesterIndex}>
                                        <AccordionButton>
                                            <Box flex="1" textAlign="left">
                                                Semester {semesterIndex + 1} ({countSubjectsForSemester(yearIndex + 1, semesterIndex + 1)} subjects)
                                            </Box>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel pb={4}>
                                            {selectedSubjects
                                                .filter(subject =>
                                                    subject.year === yearIndex + 1 &&
                                                    subject.semester === semesterIndex + 1
                                                )
                                                .map((subject, idx) => (
                                                    <Grid key={idx} templateColumns={grid} gap={2}>
                                                        {subject.subjects.map((sub, subIdx) => (
                                                            <GridItem key={subIdx}>
                                                                <Box mb={4} p={boxPadding} borderWidth="1px" borderRadius="md">
                                                                    <Flex alignItems="center">
                                                                        <Avatar
                                                                            src={sub.profile_picture || 'https://t4.ftcdn.net/jpg/00/64/67/63/360_F_64676383_LdbmhiNM6Ypzb3FM4PPuFP9rHe7ri8Ju.jpg'}
                                                                            size={avatarSize}
                                                                        />
                                                                        <Box ml={3} mr={5}>
                                                                            <Text fontWeight="bold" fontSize={headerSize}>
                                                                                {sub.code}
                                                                                <Badge ml={1} fontSize={badgeSize} variant="subtle" colorScheme="green">
                                                                                    {sub.section}
                                                                                </Badge>
                                                                            </Text>
                                                                            <Text whiteSpace="nowrap" fontSize={textSize} as="u">{sub.name}</Text>
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
                                                                                    onClick={() => handleDelete(sub.id, subject.year, subject.semester)}
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
                                                ))}
                                            <Button onClick={() => handleAddSubject(yearIndex + 1, semesterIndex + 1)}>
                                                Add Subjects
                                            </Button>
                                        </AccordionPanel>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </AccordionPanel>
                    </AccordionItem>
                ))}
            </Accordion>
            <Button position='fixed' bottom='10px' left='10%' width='80%' colorScheme="blue" onClick={onCloseSelf}>
                <ArrowBackIcon mr={2}/>Back
            </Button>

            <Drawer placement="bottom" isOpen={isOpenAddSubject} onClose={onCloseAddSubject}>
                <DrawerOverlay />
                <DrawerContent>
                    <DrawerCloseButton />
                    <DrawerHeader>Add Subject for Year {selectedYear} Semester {selectedSemester}</DrawerHeader>
                    <DrawerBody>
                        <AddSubjects 
                            allSaveSubjects={subjects}
                            isUpdate={false}
                            isDisabled={isDisabled} 
                            subjects={selectedSubjects} 
                            assignedYear={selectedYear} 
                            assignedSemester={selectedSemester}  
                            handleSubject={handleSubject} 
                            onClose={onCloseAddSubject}
                        />
                    </DrawerBody>
                </DrawerContent>
            </Drawer>
        </Flex>
    );
};

export default SelectDuration;
