import React, { useEffect, useState } from "react";
import { Badge, Box, Divider, Flex, Image, Input, InputGroup, InputLeftAddon, InputLeftElement, InputRightElement, Table, Tbody, Td, Text, Textarea, Th, Thead, Tr, Switch, FormLabel, CloseButton, Button, IconButton, Popover, PopoverTrigger, PopoverContent, PopoverBody, PopoverHeader, Tooltip, useColorModeValue } from "@chakra-ui/react";
import { HamburgerIcon, Search2Icon } from "@chakra-ui/icons";

const MoreInfo = ({ course, isDisabled }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSubjects, setFilteredSubjects] = useState(course.subjects);
    const [removeEmptySession, setRemoveEmptySession] = useState(false);
    const [totalSubjects, setTotalSubjects] = useState(0);

    const inputBg = useColorModeValue('white','gray.600');
    useEffect(() => {
        // Filter subjects based on the search query
        const result = course.subjects.filter((subject) => 
            subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.section.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredSubjects(result);
        setTotalSubjects(result.length);
        if(searchQuery){
            setRemoveEmptySession(true);
        }
        if(!searchQuery){
            setRemoveEmptySession(false);
        }
    }, [searchQuery, course.subjects]);

    return (
        <Box padding="20px" maxWidth="800px" margin="0 auto" boxShadow="md" borderRadius="md" >
            <Flex
                padding="10px"
                boxShadow="md"
                position="sticky"
                top="0"
                zIndex="2"
                width='100%'
                borderRadius="md"
                mb={5}
                alignItems="center"
                justifyContent="space-between"
                bg={inputBg}
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
                <Image
                    src={course.course_profile_picture || 'https://via.placeholder.com/150'}
                    alt={`${course.course_name} Profile Picture`}
                    boxSize="150px"
                    objectFit="cover"
                    borderRadius="md"
                />
                <Flex flexDirection="column" width="full" ml={6}>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Name:
                        </InputLeftAddon>
                        <Input disabled value={course.course_name} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Code:
                        </InputLeftAddon>
                        <Input disabled value={course.course_code} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Total duration:
                        </InputLeftAddon>
                        <Input disabled value={`${course.course_years} Years ${course.course_semesters} Semesters`} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon width="150px" justifyContent="center" fontWeight="bold">
                            Total Subjects:
                        </InputLeftAddon>
                        <Input disabled value={totalSubjects} />
                    </InputGroup>
                    <InputGroup mb={3}>
                        <InputLeftAddon height='auto' width="150px" justifyContent="center" fontWeight="bold" alignItems="flex-start" paddingY={2}>
                            Description:
                        </InputLeftAddon>
                        <Textarea resize="none" size="sm" disabled value={course.course_description} />
                    </InputGroup>
                </Flex>
            </Flex>
            <Divider mb={4} />
            <Flex justifyContent='space-between' alignItems='center'>
                <Text fontWeight="bold" mb={2}>Subjects:</Text>
            </Flex>
            {Array.from({ length: course.course_years }, (_, yearIndex) => {
                const year = yearIndex + 1;
                // Filter semesters for the current year
                const semestersWithSubjects = Array.from({ length: course.course_semesters }, (_, semesterIndex) => {
                    const semester = semesterIndex + 1;
                    const subjectsInSemester = filteredSubjects.filter(sub =>
                        sub.year === year &&
                        sub.semester === semester
                    );

                    return { semester, subjectsInSemester, totalSubjectsInSemester: subjectsInSemester.length };
                }).filter(semesterData => semesterData.subjectsInSemester.length > 0);

                // Calculate total subjects for the year
                const totalSubjectsInYear = semestersWithSubjects.reduce((total, { totalSubjectsInSemester }) => total + totalSubjectsInSemester, 0);

                // Only render years that have at least one semester with subjects if removeEmptySession is checked
                if (removeEmptySession) {
                    if (semestersWithSubjects.length > 0) {
                        return (
                            <Box key={yearIndex} mb={6}>
                                <Text fontSize="lg" fontWeight="bold" mb={2}>Year {year} - Total Subjects: {totalSubjectsInYear}</Text>
                                {semestersWithSubjects.map(({ semester, subjectsInSemester, totalSubjectsInSemester }) => (
                                    <Box key={semester} mb={4}>
                                        <Text fontSize="md" fontWeight="bold" mb={2}>Semester {semester} - Total Subjects: {totalSubjectsInSemester}</Text>
                                        <Table variant="simple" size="sm">
                                            <Thead>
                                                <Tr>
                                                    <Th>Picture</Th>
                                                    <Th>Name</Th>
                                                    <Th>Code</Th>
                                                    <Th>Section</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {subjectsInSemester.length > 0 ? (
                                                    subjectsInSemester.map(subject => (
                                                        <Tr key={subject.id}>
                                                            <Td>
                                                                <Image src={subject.profile_picture || 'https://via.placeholder.com/150'} boxSize='50px' />
                                                            </Td>
                                                            <Td>{subject.name}</Td>
                                                            <Td>{subject.code}</Td>
                                                            <Td><Badge colorScheme="green">{subject.section}</Badge></Td>
                                                        </Tr>
                                                    ))
                                                ) : (
                                                    <Tr>
                                                        <Td colSpan="4" textAlign="center">
                                                            No subjects available for this semester.
                                                        </Td>
                                                    </Tr>
                                                )}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                ))}
                            </Box>
                        );
                    }
                    return null;
                } else {
                    return (
                        <Box key={yearIndex} mb={6}>
                            <Text fontSize="lg" fontWeight="bold" mb={2}>Year {year} - Total Subjects: {totalSubjectsInYear}</Text>
                            {Array.from({ length: course.course_semesters }, (_, semesterIndex) => {
                                const semester = semesterIndex + 1;
                                const subjectsInSemester = filteredSubjects.filter(sub =>
                                    sub.year === year &&
                                    sub.semester === semester
                                );
                                const totalSubjectsInSemester = subjectsInSemester.length;

                                return (
                                    <Box key={semester} mb={4}>
                                        <Text fontSize="md" fontWeight="bold" mb={2}>Semester {semester} - Total Subjects: {totalSubjectsInSemester}</Text>
                                        <Table variant="simple" size="sm">
                                            <Thead>
                                                <Tr>
                                                    <Th>Picture</Th>
                                                    <Th>Name</Th>
                                                    <Th>Code</Th>
                                                    <Th>Section</Th>
                                                </Tr>
                                            </Thead>
                                            <Tbody>
                                                {subjectsInSemester.length > 0 ? (
                                                    subjectsInSemester.map(subject => (
                                                        <Tr key={subject.id}>
                                                            <Td>
                                                                <Image src={subject.profile_picture || 'https://via.placeholder.com/150'} boxSize='50px' />
                                                            </Td>
                                                            <Td>{subject.name}</Td>
                                                            <Td>{subject.code}</Td>
                                                            <Td><Badge colorScheme="green">{subject.section}</Badge></Td>
                                                        </Tr>
                                                    ))
                                                ) : (
                                                    <Tr>
                                                        <Td colSpan="4" textAlign="center">
                                                            No subjects available for this semester.
                                                        </Td>
                                                    </Tr>
                                                )}
                                            </Tbody>
                                        </Table>
                                    </Box>
                                );
                            })}
                        </Box>
                    );
                }
            })}
        </Box>
    );
};

export default MoreInfo;
