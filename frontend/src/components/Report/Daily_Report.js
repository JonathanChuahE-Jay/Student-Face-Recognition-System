import React, { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  useColorModeValue,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Input,
  FormControl,
  FormLabel,
  Menu,
  MenuButton,
  MenuList,
  Button,
  IconButton,
} from "@chakra-ui/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@chakra-ui/icons";
import axios from "axios";
import Pie_Chart from "../PieChart/Pie_Chart";
import Excel from "../FileExport/Excel";

const DailyReport = ({searchQuery}) => {
  const [date, setDate] = useState("");
  const [data, setData] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [counts, setCounts] = useState({ Present: 0, Absent: 0, Excused: 0 });
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [subjectsPerPage] = useState(10); 

  const bgColor = useColorModeValue("gray.100", "gray.800");
  const cardBgColor = useColorModeValue("white", "gray.700");
  const textColor = useColorModeValue("gray.800", "gray.300");

  const handleDateChange = (e) => {
    setDate(e.target.value);
  };
  
  const fetchDailyReport = async () => {
    const formattedDate = date ? new Date(date).toISOString().split("T")[0] : null;
  
    if (!formattedDate) {
      setError("Invalid date selected.");
      return;
    }
  
    try {
      const response = await axios.post("http://localhost:5000/display-daily-report", { date: formattedDate });
      const reportData = response.data.result;
      const subjectsWithSections = response.data.subjectsWithSectionsAndLecturers;
  
      setSubjects(subjectsWithSections);
      setData(reportData || []); 
  
      const presentCount = reportData?.filter((d) => d.status === "Present").length || 0;
      const absentCount = reportData?.filter((d) => d.status === "Absent").length || 0;
      const excusedCount = reportData?.filter((d) => d.status === "Excused").length || 0;
  
      setCounts({ Present: presentCount, Absent: absentCount, Excused: excusedCount });
      setError(null); 
    } catch (error) {
      console.error("Error fetching report:", error);
      setSubjects([]); 
      setData([]);
      setCounts({ Present: 0, Absent: 0, Excused: 0 });
      setError(
        error.response
          ? `${error.response.data.error || "An unknown error occurred"}`
          : "Failed to fetch report: Network error"
      );
    }
  };
  
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
    fetchDailyReport();

    const updateCurrentTime = () => {
      const options = { timeZone: "Asia/Kuala_Lumpur", hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
      const timeInMalaysia = new Date().toLocaleString("en-MY", options);
      setCurrentTime(timeInMalaysia);
    };

    updateCurrentTime();

    const intervalId = setInterval(updateCurrentTime, 1000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    fetchDailyReport();
  }, [date]);

  const formatTime = (isoDate) => {
    const dateObj = new Date(isoDate);
    return dateObj.toLocaleTimeString();
  };

  const filteredSubjects = searchQuery 
  ? subjects.filter(subject =>
      subject.name && subject.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  : subjects;

  const filteredData = searchQuery
  ? data.filter(item => 
      (item.subject_name && item.subject_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.subject_code && item.subject_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.student_name && item.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.section_number && `Section: ${item.section_number}`.toString().toLowerCase().includes(searchQuery.toLowerCase()))||
      (item.status.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  : data;

  // Pagination logic
  const paginatedData = filteredSubjects.slice(
    (currentPage - 1) * subjectsPerPage,
    currentPage * subjectsPerPage
  );

  const totalPages = Math.ceil(filteredSubjects.length / subjectsPerPage);

  // Determine page range to display
  const maxPageButtons = 6;
  let startPage, endPage;

  if (totalPages <= maxPageButtons) {
    startPage = 1;
    endPage = totalPages;
  } else {
    const halfRange = Math.floor(maxPageButtons / 2);
    if (currentPage <= halfRange) {
      startPage = 1;
      endPage = maxPageButtons;
    } else if (currentPage + halfRange >= totalPages) {
      startPage = totalPages - maxPageButtons + 1;
      endPage = totalPages;
    } else {
      startPage = currentPage - halfRange;
      endPage = currentPage + halfRange;
    }
  }
  return (
    <Flex direction="column" align="center" justify="center" minH="100vh" p={4} bg={bgColor}>
      <Box width="full" maxW="1200px" p={6} bg={cardBgColor} borderRadius="md" shadow="md">
        <Flex justify="space-between" align="center" mb={4}>
          <Heading as="h1" size="lg" color={textColor}>
            Daily Report
          </Heading>
          <Flex align="center">
            <Text fontSize="lg" mr={4} color={textColor}>
              Current Time: {currentTime}
            </Text>
            <Tooltip label="Download Report" fontSize="md">
              <Menu>
                <MenuButton as={Button}>Download</MenuButton>
                <MenuList>
                  <Excel data={data} subject_name="Daily Report" report={true} />
                </MenuList>
              </Menu>
            </Tooltip>
          </Flex>
        </Flex>
        <Flex mb={4}>
          <FormControl>
            <FormLabel>Date: </FormLabel>
            <Input type="date" value={date} onChange={handleDateChange} />
          </FormControl>
        </Flex>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>No</Th>
              <Th>Subjects</Th>
              <Th>Total Sections</Th>
              <Th>Total Lecturers</Th>
              <Th>Total Students</Th>
              <Th>Total Attended Today</Th>
              <Th>Total Attended Percentage %</Th>
            </Tr>
          </Thead>
          <Tbody>
            {subjects? (
              paginatedData.map((subject, index) => {
                const attendedSections = subject.sections
                  ? subject.sections.map((section) => Number(section.totalAttendance) || 0)
                  : [];
                const totalStudents = subject.sections
                  ? subject.sections.reduce(
                      (total, section) => total + Number(section.totalStudents || 0),
                      0
                    )
                  : 0;
                const totalLecturer = subject.sections
                  ? subject.sections.reduce(
                      (total, section) => total + (section.lecturer ? 1 : 0),
                      0
                    )
                  : 0;

                const attended = attendedSections.length > 0
                  ? attendedSections.reduce((total, attendance) => total + attendance, 0)
                  : 0;
                const attendedPercentage = totalStudents > 0
                  ? ((attended / totalStudents) * 100).toFixed(2)
                  : "0.00";

                return (
                  <Tr key={index}>
                    <Td>{index + 1}</Td>
                    <Td>{subject.name}</Td>
                    <Td>{subject.number_of_sections || 0}</Td>
                    <Td>{totalLecturer}</Td>
                    <Td>{totalStudents}</Td>
                    <Td>{attended}</Td>
                    <Td>{attendedPercentage}%</Td>
                  </Tr>
                );
              })
            ) : (
              <Tr>
                <Td colSpan="7">
                  <Text color="red.500">{error ? error : "No data available for the selected date."}</Text>
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
        {/* Pagination Controls */}
        <Flex direction="column" align="center" marginTop="20px">
          <Flex direction="row" align="center" mb={4}>
            {/* Previous Page Button */}
            <Tooltip label="Previous Page" fontSize="md">
              <IconButton
                icon={<ChevronLeftIcon />}
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                isDisabled={currentPage === 1}
                marginRight="10px"
              />
            </Tooltip>

            {/* Page Number Buttons */}
            {startPage > 1 && (
              <>
                <Button
                  mx={1}
                  onClick={() => setCurrentPage(1)}
                  colorScheme={currentPage === 1 ? "blue" : "gray"}
                >
                  1
                </Button>
                {startPage > 2 && <Text mx={1}>...</Text>}
              </>
            )}

            {Array.from({ length: Math.min(maxPageButtons, endPage - startPage + 1) }, (_, i) => startPage + i).map((number) => (
              <Button
                key={number}
                mx={1}
                onClick={() => setCurrentPage(number)}
                colorScheme={number === currentPage ? "blue" : "gray"}
              >
                {number}
              </Button>
            ))}

            {endPage < totalPages && (
              <>
                {endPage < totalPages - 1 && <Text mx={1}>...</Text>}
                <Button
                  mx={1}
                  onClick={() => setCurrentPage(totalPages)}
                  colorScheme={totalPages === currentPage ? "blue" : "gray"}
                >
                  {totalPages}
                </Button>
              </>
            )}

            {/* Next Page Button */}
            <Tooltip label="Next page" fontSize="md">
              <IconButton
                icon={<ChevronRightIcon />}
                marginLeft="10px"
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                isDisabled={currentPage === totalPages}
              />
            </Tooltip>
          </Flex>
        </Flex>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box bg={cardBgColor} p={4} borderRadius="md" shadow="md">
            <Heading textAlign='center' as="h3" size="md" mb={4} color={textColor}>
              Attendance Summary
            </Heading>
            {data.length > 0 ? <Pie_Chart data={{ counts }} /> : <Text>No data available for the selected date.</Text>}
          </Box>
          <Box bg={cardBgColor} p={4} borderRadius="md" shadow="md" overflow="auto" height="80vh">
            <Heading textAlign='center' as="h3" size="md" mb={4} color={textColor}>
              Attendance Details
            </Heading>
            <Table variant="simple" size="sm">
              <Thead>
                <Tr>
                  <Th padding="5px"></Th>
                  <Th padding="5px">Code</Th>
                  <Th padding="5px">Subject Name</Th>
                  <Th padding="5px">Name</Th>
                  <Th padding="5px">Status</Th>
                  <Th padding="5px">Section</Th>
                  <Th padding="5px">Time</Th>
                </Tr>
              </Thead>
              <Tbody>
                {error ? (
                  <Tr>
                    <Td colSpan="6">
                      <Text color="red.500">{error}</Text>
                    </Td>
                  </Tr>
                ) : (
                  filteredData.length > 0 ? (
                    filteredData.map((row, index) => (
                      <Tr key={index}>
                        <Td padding="5px">{index + 1}.</Td>
                        <Td padding="5px">{row.subject_code}</Td>
                        <Td padding="5px">{row.subject_name}</Td>
                        <Td padding="5px">{row.student_name}</Td>
                        <Td padding="5px">{row.status}</Td>
                        <Td padding="5px" style={{ whiteSpace: "nowrap" }}>
                          Section: {row.section_number?row.section_number:'Null'}
                        </Td>
                        <Td padding="5px">{formatTime(row.date)}</Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan="7">
                        <Text color="red.500">{error ? error : "No data available for the selected date."}</Text>
                      </Td>
                    </Tr>
                  )
                )}
              </Tbody>

            </Table>
          </Box>
        </SimpleGrid>
      </Box>
    </Flex>
  );
};

export default DailyReport;
