/**
 * Synthetic Test Documents & Fixtures for ClauseShield Core Intelligence Tests
 * Contains synthetic, non-real test data with simulated PII for privacy boundary tests.
 */

export const SYNTHETIC_RENTAL_CONTRACT = {
  fileName: 'synthetic_rental_agreement.txt',
  text: `RESIDENTIAL LEASE AGREEMENT
This agreement made on 1st March 2026 at Bengaluru by and between:
Landlord: Ramesh Kumar, Aadhaar 4521 8832 9912, PAN ABCDE1234F, Phone: +91 98765 43210.
Tenant: Sneha Sharma, Aadhaar 9912 3344 5566, Email: sneha.test@example.com.

1. RENT AND DURATION: The tenancy shall be for 11 months commencing March 2026 at Rs. 30,000 monthly.
2. UNILATERAL FORFEITURE: If tenant vacates before 11 months, landlord shall forfeit the entire deposit of Rs. 1,50,000 unconditionally.
3. INSPECTION: The landlord reserves right to enter premises at any time without notice.
4. NOTICE TO VACATE: Either party may terminate agreement by giving one month written notice.
5. REFUND: Security deposit refunded within 15 days of key handover.`,
};

export const SYNTHETIC_STUDENT_BOND = {
  fileName: 'synthetic_coaching_bond.txt',
  text: `APEX COACHING INSTITUTE UNDERTAKING
Student: Rahul Verma, Phone 9811223344, Email: rahul.student@example.org.
1. TUITION FEE: Course fee of Rs. 2,00,000 payable upfront.
2. FORFEITURE: All fees are non-refundable and cannot be claimed even if student leaves or discontinues batch.
3. CERTIFICATES: Original certificates and marksheets shall be retained until full fee is paid.
4. REASSIGNMENT: Institute reserves unilateral right to reassign batch without consent.`,
};

export const SYNTHETIC_EMPLOYMENT_CONTRACT = {
  fileName: 'synthetic_service_bond.txt',
  text: `SOFTWARE DEVELOPER SERVICE AGREEMENT
Employee: Priya Nair, PAN BCDPA9876K, Phone: 9765432109.
1. TERM: Software Engineer effective 1st July 2026.
2. SERVICE BOND: Employee agrees to serve for minimum 3 years failing which employee shall pay Rs. 5,00,000 liquidated damages.
3. NON-COMPETE: Employee shall not join or be employed by any competitor after termination for 2 years.
4. NOTICE: Either party may terminate employment by giving one month written notice or salary in lieu thereof.`,
};

export const SYNTHETIC_MULTI_PAGE_DOCUMENT = {
  pages: [
    {
      pageNumber: 1,
      text: `Page 1 of Rental Agreement.
1. RENT: The tenant shall pay Rs. 25,000 monthly.
2. LOCK-IN: Minimum lock-in period of 6 months.`,
    },
    {
      pageNumber: 2,
      text: `Page 2 of Rental Agreement.
3. FORFEITURE: Deposit shall be forfeited in full if lock-in breached.
4. NOTICE: Notice period of 30 days prior written notice.`,
    },
  ],
};

/**
 * Creates a minimal synthetic valid PDF ArrayBuffer for test mocks
 */
export function createSyntheticPdfBuffer(text = 'Hello ClauseShield PDF') {
  // Minimal valid PDF structure with %PDF-1.4 header
  const pdfString = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >> endobj
4 0 obj << /Length ${text.length + 30} >>
stream
BT
/F1 12 Tf
72 712 Td
(${text}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000214 00000 n 
trailer << /Size 5 /Root 1 0 R >>
startxref
300
%%EOF`;

  const buffer = new ArrayBuffer(pdfString.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < pdfString.length; i++) {
    view[i] = pdfString.charCodeAt(i);
  }
  return buffer;
}
