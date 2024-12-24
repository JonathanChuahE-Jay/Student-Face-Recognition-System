import React from 'react';
import { useLocation } from 'react-router-dom';
import {
    Box,
    Text,
    Image,
    Stack,
    Divider,
    SimpleGrid,
    Card,
    CardBody,
    Badge,
    VStack,
    useBreakpointValue,
    Button,
    useColorModeValue,
    Flex
} from '@chakra-ui/react';
import { ChevronLeftIcon } from '@chakra-ui/icons';
import { format } from 'date-fns';
import AssignedLecturer from './Assigned_Lecturer';
import AssignedStudent from './Assigned_Student';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);
const MotionStack = motion(Stack);
const MotionVStack = motion(VStack);
const MotionCard = motion(Card);

const SubjectInfo = ({user, searchQuery}) => {
    const location = useLocation();
    const subject = location.state?.subject;
    const bgBox = useColorModeValue('gray.50','gray.600');
    const HEIGHT = '100vh'
    const fontColor = useColorModeValue('gray.700', 'gray.300')

    // Ensure useBreakpointValue is called at the top level
    const columnCount = useBreakpointValue({ base: 1, md: 2 });

    if (!subject || !subject.name || !subject.code) {
        return <Text>No subject information available.</Text>;
    }    

    // Function to format time
    const formatTime = (time) => {
        if (!time) return 'N/A';

        const [hours, minutes] = time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) return 'N/A';

        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return format(date, 'HH:mm');
    };

    // Format times
    const formattedTimeAdded = format(new Date(subject.time_added), 'd MMMM, yyyy • hh:mm a');

    return (
        <MotionBox
            p={8}
            maxW="container.xl"
            mx="auto"
            borderWidth={1}
            borderRadius="lg"
            boxShadow="xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Back Button */}
            <Button
                leftIcon={<ChevronLeftIcon />}
                variant="outline"
                colorScheme="teal"
                mb={6}
                onClick={() => window.history.back()}
            >
                Back
            </Button>

            <MotionStack
                spacing={8}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header Section */}
                <MotionVStack
                    spacing={4}
                    align="center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <Image
                        src={subject.profile_picture}
                        alt={`${subject.name} profile`}
                        fallbackSrc='https://via.placeholder.com/150'
                        borderRadius='full'
                        boxSize="150px"
                        objectFit="cover"
                        borderWidth={4}
                        borderColor="teal.500"
                        boxShadow="lg"
                    />
                    <Text fontSize="4xl" fontWeight="bold" color="teal.700" textAlign="center">
                        {subject.name}
                    </Text>
                    <Badge colorScheme="teal" fontSize="lg" borderRadius="full">
                        {subject.code}
                    </Badge>
                </MotionVStack>

                {/* Divider for Separation */}
                <Divider borderColor="gray.200" />

                {/* Subject Details */}
                <MotionBox
                    borderWidth={1}
                    borderRadius="md"
                    borderColor="gray.200"
                    bg={bgBox}
                    p={6}
                    boxShadow="md"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Stack spacing={4}>
                        <Text fontSize="lg" fontWeight="semibold" color={fontColor}>
                            <b>Time Added:</b> {formattedTimeAdded}
                        </Text>
                        <Text fontSize="lg" color={fontColor}>
                            <b>Subject Section:</b> {subject.section?subject.section: 'Null'}
                        </Text>
                        <Text fontSize="lg" color={fontColor}>
                            <b>Number of Sections:</b> {subject.number_of_sections?subject.number_of_sections:'Null'}
                        </Text>
                    </Stack>
                </MotionBox>

                {/* Sections Display */}
                <MotionStack
                    spacing={6}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <Text fontSize="2xl" fontWeight="bold" color="teal.700">
                        Sections Overview
                    </Text>
                    <SimpleGrid columns={columnCount} spacing={4}>
                        {subject.sections.map((section) => (
                            <MotionCard key={section.id} boxShadow="lg" borderWidth={1} borderRadius="md" p={2}>
                                <CardBody>
                                    <Stack spacing={2}>
                                        <Text fontSize="sm" fontWeight="semibold" color={fontColor}>
                                            <b>Section Number:</b> {section.section_number}
                                        </Text>
                                        <Text fontSize="sm" color={fontColor}>
                                            <b>Day:</b> {section.day}
                                        </Text>
                                        <Text fontSize="sm" color={fontColor}>
                                            <b>Start Time:</b> {formatTime(section.start_time)}
                                        </Text>
                                        <Text fontSize="sm" color={fontColor}>
                                            <b>End Time:</b> {formatTime(section.end_time)}
                                        </Text>
                                        <Text fontSize="sm" color={fontColor}>
                                            <b>Venue:</b> {section.venue}
                                        </Text>
                                        <Text fontSize="sm" color={fontColor}>
                                            <b>Max Students:</b> {section.max_students}
                                        </Text>
                                        <Text fontSize="sm" color={fontColor}>
                                            <b>Current Lecturers:</b> {section.total_lecturers?section.total_lecturers:'None'}
                                        </Text>
                                        <Text fontSize="sm" color={fontColor}>
                                            <b>Current Students:</b> {section.total_students?section.total_students:'None'}
                                        </Text>
                                    </Stack>
                                </CardBody>
                            </MotionCard>
                        ))}
                    </SimpleGrid>
                    <SimpleGrid columns={columnCount} spacing={4} p={4}>
                        <Box>
                            <AssignedStudent
                                search={searchQuery}
                                user={user}
                                height={HEIGHT}
                                subject_id={subject.id}
                            />
                        </Box>
                        <Box>
                            <AssignedLecturer
                                search={searchQuery}
                                user={user}
                                height={HEIGHT}
                                subject_id={subject.id}
                            />
                        </Box>
                    </SimpleGrid>
                </MotionStack>
            </MotionStack>
        </MotionBox>
    );
};

export default SubjectInfo;
