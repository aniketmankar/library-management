// ISBN Validation (ISBN-10 or ISBN-13)
function validateISBN(isbn) {
  if (!isbn) return true;
  const cleanISBN = isbn.replace(/[-\s]/g, '');
  if (cleanISBN.length === 10) {
    return /^[0-9]{9}[0-9X]$/.test(cleanISBN);
  }
  if (cleanISBN.length === 13) {
    return /^[0-9]{13}$/.test(cleanISBN);
  }
  return false;
}

// Email Validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone Validation
function validatePhone(phone) {
  if (!phone) return true;
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return /^[\+]?[0-9]{10,15}$/.test(cleanPhone);
}

// Book Validation
function validateBook(bookData) {
  const errors = [];

  if (!bookData.title || bookData.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!bookData.author || bookData.author.trim().length === 0) {
    errors.push('Author is required');
  }

  if (bookData.total_copies !== undefined) {
    const copies = parseInt(bookData.total_copies);
    if (isNaN(copies) || copies < 1) {
      errors.push('Total copies must be at least 1');
    }
  }

  if (bookData.publication_year !== undefined) {
    const year = parseInt(bookData.publication_year);
    const currentYear = new Date().getFullYear();
    if (isNaN(year) || year < 1000 || year > currentYear + 1) {
      errors.push('Invalid publication year');
    }
  }

  if (bookData.isbn && !validateISBN(bookData.isbn)) {
    errors.push('Invalid ISBN format');
  }

  if (bookData.title && bookData.title.length > 255) {
    errors.push('Title too long (max 255 characters)');
  }

  if (bookData.author && bookData.author.length > 255) {
    errors.push('Author name too long (max 255 characters)');
  }

  return {
    valid: errors.length === 0,
    error: errors.join(', ')
  };
}

// Member Validation
function validateMember(memberData) {
  const errors = [];

  if (!memberData.name || memberData.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!memberData.email || memberData.email.trim().length === 0) {
    errors.push('Email is required');
  }

  if (memberData.email && !validateEmail(memberData.email)) {
    errors.push('Invalid email format');
  }

  if (memberData.phone && !validatePhone(memberData.phone)) {
    errors.push('Invalid phone format');
  }

  if (memberData.membership_type) {
    const validTypes = ['standard', 'premium', 'student'];
    if (!validTypes.includes(memberData.membership_type)) {
      errors.push('Invalid membership type');
    }
  }

  if (memberData.name && memberData.name.length > 200) {
    errors.push('Name too long (max 200 characters)');
  }

  if (memberData.email && memberData.email.length > 100) {
    errors.push('Email too long (max 100 characters)');
  }

  return {
    valid: errors.length === 0,
    error: errors.join(', ')
  };
}

module.exports = {
  validateISBN,
  validateEmail,
  validatePhone,
  validateBook,
  validateMember
};