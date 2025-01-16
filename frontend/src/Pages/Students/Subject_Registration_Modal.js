import React, { useState, useEffect } from 'react';
import { Modal, useToast, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Button, Select, Box, Text } from '@chakra-ui/react';
import axios from 'axios';

const SubjectRegistrationModal = ({ onRefresh, isOpen, onClose, subjectsWithSections, user }) => {
    const [selectedSubject, setSelectedSubject] = useState(null); 
    const [selectedSection, setSelectedSection] = useState(null); 
    const [availableSections, setAvailableSections] = useState([]);
    const toast = useToast();

    useEffect(() => {
        if (selectedSubject) {
            const subject = subjectsWithSections.find((s) => s.subject_id === parseInt(selectedSubject));
            setAvailableSections(subject ? subject.sections : []);
        }
    }, [selectedSubject, subjectsWithSections]);

    useEffect(() => {
        if (isOpen) {
            setSelectedSubject(null); 
            setSelectedSection(null); 
            setAvailableSections([]); 
        }
    }, [isOpen]);

    const handleSave = async () => {
        try {
            if (selectedSubject && selectedSection) {
                const updateData = {
                    subject_id: selectedSubject,
                    section: selectedSection,
                };

                const response = await axios.post('/subject-registration', {
                    role: 'Add',
                    student_id: user.id,
                    updateData,
                });
                const message = response.data.message;
                onClose();
                onRefresh();
                toast({
                    title: 'Success',
                    position: 'top-right',
                    description: message || 'Subjects successfully updated',
                    status: 'success',
                    duration: 1000,
                    isClosable: true,
                });
            }
        } catch (error) {
            console.error('Error saving section:', error);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="lg">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Select Subject and Section</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <Box mb={4}>
                        <Text fontSize="lg" fontWeight="semibold">Select a Subject</Text>
                        <Select
                            placeholder="Choose Subject"
                            value={selectedSubject || ''}
                            onChange={(e) => {
                                const subjectId = e.target.value;
                                setSelectedSubject(subjectId);
                                setSelectedSection(null);
                            }}
                            mt={2}
                        >
                            {subjectsWithSections.map((subject) => (
                                <option key={subject.subject_id} value={subject.subject_id}>
                                    {subject.name}
                                </option>
                            ))}
                        </Select>
                    </Box>

                    {selectedSubject && (
                        <Box mb={4}>
                            <Text fontSize="lg" fontWeight="semibold">Select Section</Text>
                            <Select
                                placeholder="Choose Section"
                                value={selectedSection || ''}
                                onChange={(e) => setSelectedSection(e.target.value)}
                                mt={2}
                                isDisabled={availableSections.length === 0} 
                            >
                                {availableSections.length > 0 ? (
                                    availableSections.map((section) => (
                                        <option key={section.section_number} value={section.section_number}>
                                            Section {section.section_number} - {section.start_time} to {section.end_time} ({section.day})
                                        </option>
                                    ))
                                ) : (
                                    <option value="" disabled>No sections available</option>
                                )}
                            </Select>
                        </Box>
                    )}

                    {selectedSubject && availableSections.length === 0 && (
                        <Text color="red.500">No sections available for the selected subject.</Text>
                    )}
                </ModalBody>

                <ModalFooter>
                    <Button colorScheme="blue" onClick={handleSave} isDisabled={!selectedSection}>
                        Save Changes
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default SubjectRegistrationModal;
