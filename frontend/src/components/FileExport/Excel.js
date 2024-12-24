import React from 'react';
import * as XLSX from 'xlsx';
import { MenuItem, useToast } from '@chakra-ui/react';

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
};

const MAX_TEXT_LENGTH = 32767;

const truncateText = (text, maxLength) => 
  text && text.length > maxLength ? text.substring(0, maxLength) : text || '';

const calculateStatusStats = (data) => {
  const counts = { Present: 0, Absent: 0, Excused: 0 };
  
  data.forEach(item => {
    if (counts[item.status] !== undefined) {
      counts[item.status] += 1;
    }
  });

  const total = data.length;
  const percentages = {
    Present: ((counts.Present / total) * 100).toFixed(2),
    Absent: ((counts.Absent / total) * 100).toFixed(2),
    Excused: ((counts.Excused / total) * 100).toFixed(2),
  };

  return { counts, percentages, total };
};

const exportToExcel = (data, fileName, lecturerInfo, report) => {
  const studentHeader = ['Student ID', 'Student Name', 'Subject Section', 'Status', 'Date and Time'];
  const lecturerNames = lecturerInfo && lecturerInfo.length > 0
    ? lecturerInfo.map(lecturer => lecturer.name || 'N/A').join(', ')
    : 'N/A';

  const sectionNames = lecturerInfo && lecturerInfo.length > 0
    ? lecturerInfo.map(lecturer => lecturer.subject_section || 'N/A').join(', ')
    : 'N/A';

  const lecturerHeader = ['Lecturer:', lecturerNames];
  const sectionHeader = ['Section:', sectionNames];
  
  const emptyRow = [];

  const transformedData = data.map(item => [
    truncateText(item.student_id?.toString() || '', MAX_TEXT_LENGTH),
    truncateText(item.student_name, MAX_TEXT_LENGTH),
    truncateText(item.subject_section?.toString() || '', MAX_TEXT_LENGTH),
    truncateText(item.status, MAX_TEXT_LENGTH),
    formatDate(item.date)
  ]);

  const stats = calculateStatusStats(data);
  const workbook = XLSX.utils.book_new();
  
  let worksheetData;

  if (report) {
    const subjectHeader = ['Subject Code', 'Subject Name', 'Student ID', 'Student Name', 'Subject Section', 'Status', 'Date and Time'];
    const subjectData = data.map(item => [
      truncateText(item.subject_code, MAX_TEXT_LENGTH),
      truncateText(item.subject_name, MAX_TEXT_LENGTH),
      truncateText(item.student_id?.toString() || '', MAX_TEXT_LENGTH),
      truncateText(item.student_name, MAX_TEXT_LENGTH),
      truncateText(item.section_number?.toString() || 'null', MAX_TEXT_LENGTH),
      truncateText(item.status, MAX_TEXT_LENGTH),
      formatDate(item.date)
    ]);

    worksheetData = [
      subjectHeader,
      ...subjectData,
    ];
  } else {
    worksheetData = [
      lecturerHeader,
      sectionHeader,
      emptyRow,
      studentHeader,
      ...transformedData
    ];
  }

  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  const headerCellStyle = { font: { bold: true } };
  studentHeader.forEach((_, index) => {
    const cellAddress = { c: index, r: 3 }; 
    const cellRef = XLSX.utils.encode_cell(cellAddress);
    worksheet[cellRef] = worksheet[cellRef] || { v: studentHeader[index], s: headerCellStyle };
  });

  const colWidths = studentHeader.map((_, index) => ({
    wch: Math.max(
      ...transformedData.map(row => row[index]?.length || 0),
      studentHeader[index].length
    ) + 12
  }));

  worksheet['!cols'] = colWidths;

  const statsData = [
    ['Total Count', stats.total],
    ['Present Count', stats.counts.Present],
    ['Absent Count', stats.counts.Absent],
    ['Excused Count', stats.counts.Excused],
    ['Present (%)', stats.percentages.Present],
    ['Absent (%)', stats.percentages.Absent],
    ['Excused (%)', stats.percentages.Excused]
  ];

  const lastRow = transformedData.length + 5; 
  statsData.forEach((row, index) => {
    XLSX.utils.sheet_add_aoa(worksheet, [row], { origin: { r: lastRow + index, c: 0 } });
  });

  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

  try {
    XLSX.writeFile(workbook, fileName);
  } catch (error) {
    console.error('Error writing file:', error);
  }
};

const Excel = ({ data, lecturerInfo, subject_name, report }) => {
  const toast = useToast();

  const handleExport = () => {
    try {
      exportToExcel(data, `${subject_name}.xlsx`, lecturerInfo, report);
      toast({
        title: 'Export successful',
        description: `File ${subject_name}.xlsx has been downloaded.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'There was an error exporting the file.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <MenuItem onClick={handleExport}>
      Export to Excel
    </MenuItem>
  );
};

export default Excel;
