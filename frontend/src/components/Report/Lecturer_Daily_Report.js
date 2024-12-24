import { Table, TableCaption, Tbody, Td, Th, Thead, Tr } from "@chakra-ui/react";
import axios from "axios";
import React, { useEffect, useState } from "react";
import moment from 'moment-timezone';

const Lecturer_Daily_Report = ({ date, user, searchQuery }) => {
    const [subjects, setSubjects] = useState([]);

    const fetchData = async () => {
        const subjectsAndSections = user.subjectsData.map(subject => ({
            subject_id: subject.subject_id,
            subject_section: subject.subject_section,
        }));

        try {
            const localDate = moment(date).tz('Asia/Kuala_Lumpur').format('YYYY-MM-DD');
            const response = await axios.post("http://localhost:5000/display-daily-report", { date: localDate, subjectsAndSections });
            const subjectsWithSections = response.data.subjectsWithSectionsAndLecturers;

            const lecturerSubjects = user.subjectsData || [];

            const filteredSubjects = subjectsWithSections?.map((subject) => {
                const filteredSections = subject.sections.filter((section) =>
                    lecturerSubjects.some((lecturerSubject) =>
                        lecturerSubject.subject_id === subject.id &&
                        lecturerSubject.subject_section === section.section_number
                    )
                );

                return filteredSections.length > 0 ? { ...subject, sections: filteredSections } : null;
            }).filter(Boolean) || [];

            setSubjects(filteredSubjects);
        } catch (error) {
            console.error("Error fetching report:", error);
            setSubjects([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const filteredSubjects = searchQuery
        ? subjects.filter((subject) => 
            subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            subject.sections.some((section) => 
                section.section_number.toString().includes(searchQuery)
            )
        )
        : subjects;

    let i = 0;
    return (
        <Table>
            <TableCaption>Subject's report</TableCaption>
            <Thead>
                <Tr>
                    <Th>No</Th>
                    <Th>Name</Th>
                    <Th>Section</Th>
                    <Th>Total Students</Th>
                    <Th>Total Attended</Th>
                </Tr>
            </Thead>
            <Tbody>
                {filteredSubjects.map((subject, index) =>
                    subject.sections.map((section, secIndex) => {
                        i++;
                        return (
                            <Tr key={`${index}-${secIndex}`}>
                                <Td>{i}</Td>
                                <Td>{subject.name}</Td>
                                <Td>{section.section_number}</Td>
                                <Td>{section.totalStudents}</Td>
                                <Td>{section.totalAttendance}</Td>
                            </Tr>
                        );
                    })
                )}
            </Tbody>
        </Table>
    );
};

export default Lecturer_Daily_Report;
