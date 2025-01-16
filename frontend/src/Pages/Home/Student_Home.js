import React, { useEffect, useState } from "react";
import {
  Box,
  Text,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Icon,
  Button,
  Flex,
  IconButton,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import axios from "axios";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";

const StudentHome = ({ searchQuery, user }) => {
  const [recentAttendances, setRecentAttendances] = useState([]);
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [filteredAttendances, setFilteredAttendances] = useState([]);

  const [attendancePage, setAttendancePage] = useState(1);
  const [classesPage, setClassesPage] = useState(1);
  const recordsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
        try {
            const response = await axios.post("/show-attendances", { student_id: user?.id });
            const attendances = response.data.studentAttendance || [];
            const sortedAttendances = attendances.sort((a, b) => new Date(b.date) - new Date(a.date));

            setRecentAttendances(sortedAttendances);
            setFilteredAttendances(sortedAttendances);
        } catch (error) {
            console.error("Error fetching attendance:", error);
        }
    };

    fetchData();
}, [user]);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await axios.get("/show-all-subjects", {
          params: { student_id: user?.id },
        });

        const subjectsData = response.data;
        const userSubjects = user?.subjectsData || [];

        const flattenedSections = userSubjects.flatMap((userSubject) => {
          const matchingSubject = subjectsData.find(
            (subject) => subject.id === userSubject.subject_id
          );

          return matchingSubject?.sections.filter(
            (section) => section.section_number === userSubject.subject_section
          ) || [];
        });

        setUpcomingClasses(flattenedSections);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    if (user) {
      fetchSubjects();
    }
  }, [user]);

  useEffect(() => {
    const lowerCaseQuery = searchQuery?.toLowerCase() || "";

    const filtered = upcomingClasses.filter((classItem) =>
      classItem.name?.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredClasses(filtered);

    const filteredAttendance = recentAttendances.filter((attendance) =>
      attendance.subject_name?.toLowerCase().includes(lowerCaseQuery) ||
      attendance.status?.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredAttendances(filteredAttendance);
  }, [searchQuery, upcomingClasses, recentAttendances]);

  const convertToMYRTime = (dateString) => {
    const timeZone = "Asia/Kuala_Lumpur";
    const zonedDate = toZonedTime(dateString, timeZone);
    return format(zonedDate, "yyyy-MM-dd hh:mm:ss a");
  };

  const cardBg = useColorModeValue("white", "gray.800");

  const paginate = (data, currentPage) => {
    const start = (currentPage - 1) * recordsPerPage;
    const end = start + recordsPerPage;
    return data.slice(start, end);
  };

  const renderPagination = (currentPage, totalPages, setPage) => {
    const maxPageButtons = 5;
    const startPage = Math.max(currentPage - Math.floor(maxPageButtons / 2), 1);
    const endPage = Math.min(startPage + maxPageButtons - 1, totalPages);

    return (
      <Flex direction="row" align="center" mt={4} justify="center">
        <Tooltip label="Previous Page" fontSize="md">
          <IconButton
            icon={<ChevronLeftIcon />}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            isDisabled={currentPage === 1}
            mr={2}
          />
        </Tooltip>

        {startPage > 1 && (
          <>
            <Button mx={1} onClick={() => setPage(1)} colorScheme="gray">
              1
            </Button>
            {startPage > 2 && <Text mx={1}>...</Text>}
          </>
        )}

        {Array.from(
          { length: endPage - startPage + 1 },
          (_, i) => startPage + i
        ).map((page) => (
          <Button
            key={page}
            mx={1}
            onClick={() => setPage(page)}
            colorScheme={page === currentPage ? "blue" : "gray"}
          >
            {page}
          </Button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && <Text mx={1}>...</Text>}
            <Button mx={1} onClick={() => setPage(totalPages)} colorScheme="gray">
              {totalPages}
            </Button>
          </>
        )}

        <Tooltip label="Next Page" fontSize="md">
          <IconButton
            icon={<ChevronRightIcon />}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            isDisabled={currentPage === totalPages}
            ml={2}
          />
        </Tooltip>
      </Flex>
    );
  };
  return (
    <Box p={5}>
      <Heading mb={5} color="teal.500">
        Welcome, {user?.name || "Student"}!
      </Heading>

      {/* Attendance Section */}
      <Box bg={cardBg} p={5} rounded="lg" shadow="md" mb={6}>
        <Heading size="md" mb={3} color="blue.600">
          Recent Attendance
        </Heading>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>Subject</Th>
              <Th>Date</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              filteredAttendances.length > 0 ?
              paginate(filteredAttendances, attendancePage).map((attendance, index) => (
                <Tr key={index}>
                  <Td>{attendance.subject_name || "Unknown"}</Td>
                  <Td>{convertToMYRTime(attendance.date)}</Td>
                  <Td>
                    <Badge
                      colorScheme={attendance.status === "Present" ? "green" : "red"}
                      display="inline-flex"
                      alignItems="center"
                    >
                      <Icon
                        as={attendance.status === "Present" ? FaCheckCircle : FaTimesCircle}
                        mr={1}
                      />
                      {attendance.status}
                    </Badge>
                  </Td>
                </Tr>
              ))
              :
              <Tr>
                <Td colSpan="3" textAlign='center'>
                  No attendance available
                </Td>
              </Tr>
            }
          </Tbody>
        </Table>
        {renderPagination(
          attendancePage,
          Math.ceil(filteredAttendances.length / recordsPerPage),
          setAttendancePage
        )}
      </Box>

      {/* Upcoming Classes Section */}
      <Box bg={cardBg} p={5} rounded="lg" shadow="md">
        <Heading size="md" mb={3} color="blue.600">
          Upcoming Subjects
        </Heading>
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th>Subject</Th>
              <Th>Day</Th>
              <Th>Section</Th>
              <Th>Time</Th>
              <Th>Venue</Th>
            </Tr>
          </Thead>
          <Tbody>
            {
              filteredClasses.length > 0 ?
              paginate(filteredClasses, classesPage).map((classes, index) => (
                <Tr key={index}>
                  <Td>{classes.name || "Unknown"}</Td>
                  <Td>{classes.day || "Unknown"}</Td>
                  <Td>Section: {classes.section_number}</Td>
                  <Td>
                    {classes.start_time || "00:00:00"} - {classes.end_time || "00:00:00"}
                  </Td>
                  <Td>{classes.venue || "Unknown"}</Td>
                </Tr>
              ))
              :
              <Tr>
                <Td colSpan="4" textAlign='center'>
                  No Subjects available
                </Td>
              </Tr>
            }
          </Tbody>
        </Table>
        {renderPagination(
          classesPage,
          Math.ceil(filteredClasses.length / recordsPerPage),
          setClassesPage
        )}
      </Box>
    </Box>
  );
};

export default StudentHome;
