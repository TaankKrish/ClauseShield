export const CONTRACT_TYPES = Object.freeze({
  RENTAL: 'rental',
  STUDENT_BOND: 'student_bond',
  EMPLOYMENT: 'employment',
  GENERAL: 'general',
});

export const CONTRACT_TYPE_METADATA = Object.freeze({
  [CONTRACT_TYPES.RENTAL]: {
    name: 'Residential / Commercial Rental Lease',
    icon: 'Home',
    description: 'Inspect security deposits, lock-ins, eviction notice, and maintenance terms.',
  },
  [CONTRACT_TYPES.STUDENT_BOND]: {
    name: 'Student Coaching / Educational Bond',
    icon: 'GraduationCap',
    description: 'Inspect non-refundable fee traps, document confiscation, and batch transfer limits.',
  },
  [CONTRACT_TYPES.EMPLOYMENT]: {
    name: 'Employment Agreement / Service Bond',
    icon: 'Briefcase',
    description: 'Inspect non-compete clauses, notice periods, and training fee bond indemnities.',
  },
  [CONTRACT_TYPES.GENERAL]: {
    name: 'General Contract / Terms of Service',
    icon: 'FileText',
    description: 'Inspect unilateral termination, arbitration jurisdiction, and liability waivers.',
  },
});

