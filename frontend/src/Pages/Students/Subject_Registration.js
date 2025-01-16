import React, { useEffect, useState } from 'react';
import {
    Flex,
    Box,
    Button,
    Select,
    Text,
    Spinner,
    useToast,
    useDisclosure,
    IconButton,
} from '@chakra-ui/react';
import axios from 'axios';
import SubjectRegistrationModal from './Subject_Registration_Modal';
import { DeleteIcon } from '@chakra-ui/icons';

const SubjectRegistration = ({ user, searchQuery }) => {
    const [subjects, setSubjects] = useState([]);
    const [availableSubjects, setAvailableSubjects] = useState([]);
    const [selectedSection, setSelectedSection] = useState({});
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const {
        isOpen: isOpenAddSubjectModal,
        onOpen: onOpenAddSubjectModal,
        onClose: onCloseAddSubjectModal,
    } = useDisclosure();

    const fetchSubjects = async () => {
        setLoading(true);
        try {
            const response = await axios.post('/subject-registration', { role: 'Fetch', student_id: user.id });
            const { student_subjects, availableSubjects } = response.data;
            setSubjects(student_subjects);
            setAvailableSubjects(availableSubjects);
        } catch (error) {
            console.error('Error fetching subjects:', error);
            toast({
                title: 'Error',
                description: 'Failed to fetch subjects',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSubjects();
    }, [user.id]);

    const handleSectionUpdate = (subjectId, section) => {
        setSelectedSection((prev) => ({
            ...prev,
            [subjectId]: section,
        }));
    };

    const handleDelete = async (subject_id) => {
        try {
            setLoading(true);
            const response = await axios.post('/subject-registration', {
                role: 'Delete',
                student_id: user.id,
                subject_id,
            });
            toast({
                title: 'Success',
                description: response.data.message || 'Subject successfully deleted',
                status: 'success',
                duration: 3000,
                isClosable: true,
            });
            fetchSubjects();
        } catch (error) {
            console.error('Error deleting subject:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete subject',
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        try {
            const updateData = Object.entries(selectedSection).map(([subjectId, section]) => ({
                subject_id: subjectId,
                section,
            }));

            const response = await axios.post('/subject-registration', {
                role: 'Update',
                student_id: user.id,
                updateData,
            });

            toast({
                title: 'Success',
                description: response.data.message || 'Subjects successfully updated',
                status: 'success',
                duration: 1000,
                isClosable: true,
            });

            fetchSubjects();
        } catch (error) {
            const errorMessage = error.response?.data?.error || 'Failed to update subjects';
            toast({
                title: 'Error',
                description: errorMessage,
                status: 'error',
                duration: 3000,
                isClosable: true,
            });
        }
    };

    const displayedSubjects = subjects.filter((subject) => {
        const search = searchQuery?.toLowerCase() || '';
        const subjectName = subject.name?.toLowerCase() || '';
        const subjectDescription = subject.description?.toLowerCase() || ''; 

        return subjectName.includes(search) || subjectDescription.includes(search);
    });

    return (
        <Flex direction="column" p={6}>
            <Box mb={6}>
                <Text fontSize="xl" fontWeight="bold" mb={5}>
                    Subjects for Next Semester
                </Text>
                {loading ? (
                    <Flex justify="center" align="center" height="200px">
                        <Spinner size="lg" />
                    </Flex>
                ) : displayedSubjects.length > 0 ? (
                    displayedSubjects.map((subject) => (
                        <Flex
                            key={subject.id}
                            mb={4}
                            align="center"
                            justify="space-between"
                            border="1px solid #E2E8F0"
                            borderRadius="md"
                            p={4}
                        >
                            <Box flex="1">
                                <Text fontSize="lg" fontWeight="semibold">
                                    {subject.name}
                                </Text>
                                <Text fontSize="sm" color="gray.500">
                                    {subject.description}
                                </Text>
                            </Box>
                            <Box width="200px">
                                <Select
                                    value={
                                        selectedSection[subject.id]
                                            ? selectedSection[subject.id]
                                            : subject.subject_section || ''
                                    }
                                    onChange={(e) => handleSectionUpdate(subject.id, e.target.value)}
                                    placeholder="Select Section"
                                    variant="outline"
                                >
                                    {Array.from({ length: subject.number_of_sections }).map((_, index) => (
                                        <option key={index + 1} value={index + 1}>
                                            Section {index + 1}
                                        </option>
                                    ))}
                                </Select>
                            </Box>
                            <IconButton
                                ml={4}
                                colorScheme="red"
                                icon={<DeleteIcon />}
                                onClick={() => handleDelete(subject.id)}
                                isLoading={loading}
                            />
                        </Flex>
                    ))
                ) : (
                    <Text>No subjects match the search criteria</Text>
                )}
            </Box>
            <Flex justifyContent="space-between">
                <Button width="35%" colorScheme="blue" onClick={onOpenAddSubjectModal}>
                    Add new subjects
                </Button>
                <Button
                    width="35%"
                    colorScheme="green"
                    onClick={handleSaveChanges}
                    isDisabled={Object.keys(selectedSection).length === 0}
                    isLoading={loading}
                >
                    Save Changes
                </Button>
            </Flex>
            <SubjectRegistrationModal
                onRefresh={fetchSubjects}
                user={user}
                isOpen={isOpenAddSubjectModal}
                onClose={onCloseAddSubjectModal}
                subjectsWithSections={availableSubjects}
            />
        </Flex>
    );
};

export default SubjectRegistration;
