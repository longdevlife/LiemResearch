const STUDENT_ID_PATTERN = /^[A-Z]{2,5}\d{5,8}$/;

export function validateStudentId(value) {
  const studentId = String(value || '').trim().toUpperCase();

  if (!studentId) {
    return 'Student ID is required';
  }

  if (!STUDENT_ID_PATTERN.test(studentId)) {
    return 'Student ID must start with 2-5 uppercase letters followed by 5-8 digits';
  }

  return '';
}
