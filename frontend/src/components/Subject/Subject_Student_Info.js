import { Flex, Text, Heading, Box, Table, Thead, Tbody, Tr, Th, Td, TableContainer, Icon } from "@chakra-ui/react";
import { FaCheckCircle, FaTimesCircle, FaClock } from "react-icons/fa"; // Icons for statuses
import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const SubjectStudentInfo = ({ user }) => {
  const location = useLocation();
  const subject = location.state?.subject;

  const [attendances, setAttendances] = useState([]);

  useEffect(() => {
    const fetchAttendances = async () => {
      try {
        const response = await axios.post("/show-attendances", { student_id: user?.id });
        const data = response.data.studentAttendance || [];
        const subjectAttendances = data.filter((sub) => sub.subject_id === subject?.id);
        setAttendances(subjectAttendances);
      } catch (error) {
        console.error("Error fetching attendance:", error);
      }
    };

    if (user?.id && subject?.id) {
      fetchAttendances();
    }
  }, [user, subject]);

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case "present":
        return <Icon as={FaCheckCircle} color="green.500" />;
      case "absent":
        return <Icon as={FaTimesCircle} color="red.500" />;
      case "late":
        return <Icon as={FaClock} color="orange.500" />;
      default:
        return null; // No icon for unknown statuses
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { 
      timeZone: "Asia/Kuala_Lumpur", 
      year: "numeric", 
      month: "long", 
      day: "numeric", 
      hour: "2-digit", 
      minute: "2-digit" 
    };
    return new Intl.DateTimeFormat("en-MY", options).format(date);
  };

  return (
    <Flex direction="column" p={5}>
      <Heading mb={5} color="teal.500">
        Subject: {subject?.name || "Unknown"}
      </Heading>

      <Box bg="white" p={5} rounded="lg" shadow="md">
        <Heading size="md" mb={3} color="blue.600">
          Attendance Records
        </Heading>

        {attendances.length > 0 ? (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Subject Name</Th>
                  <Th>Date</Th>
                  <Th>Status</Th>
                  <Th padding={0}></Th>
                </Tr>
              </Thead>
              <Tbody>
                {attendances.map((attendance, index) => (
                  <Tr key={index}>
                    <Td>{attendance.subject_name || "Unknown"}</Td>
                    <Td>{formatDate(attendance.date)}</Td>
                    <Td>{attendance.status}</Td>
                    <Td>{getStatusIcon(attendance.status)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        ) : (
          <Text>No attendance records found.</Text>
        )}
      </Box>
    </Flex>
  );
};

export default SubjectStudentInfo;
