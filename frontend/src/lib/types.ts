// ─── Auth / Users ────────────────────────────────────────────────────────────

export type UserRole = 'SUPER_ADMIN' | 'DOCTOR' | 'NURSE' | 'TECHNICIAN' | 'HR_ADMIN' | 'VIEWER'

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  phone?: string
  department?: string
  specialization?: string
  is_active: boolean
}

// ─── Workers ─────────────────────────────────────────────────────────────────

export interface Department {
  id: number
  name: string
  code: string
  manager_name: string
  site_location: string
  created_at: string
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH'

export interface JobPosition {
  id: number
  title: string
  code: string
  department: Department | null
  description: string
  risk_level: RiskLevel
  created_at: string
}

export type ContractType = 'CDI' | 'CDD' | 'INTERN' | 'CONTRACTOR'
export type Gender = 'M' | 'F'
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'UNKNOWN'

export interface Worker {
  id: number
  matricule: string
  first_name: string
  last_name: string
  full_name: string
  date_of_birth: string | null
  gender: Gender
  hire_date: string | null
  contract_type: ContractType
  department: Department | null
  job_position: JobPosition | null
  phone: string
  emergency_contact: string
  emergency_phone: string
  blood_type: BloodType
  known_allergies: string
  is_active: boolean
  photo: string | null
  created_at: string
}

export interface CurriculumLaboris {
  id: number
  worker: number
  employer_name: string
  job_title: string
  start_date: string
  end_date: string | null
  exposures: string
  notes: string
}

// ─── Appointments ─────────────────────────────────────────────────────────────

export interface AppointmentType {
  id: number
  name: string
  duration_minutes: number
  color_hex: string
  requires_preparation: boolean
}

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export interface Appointment {
  id: number
  worker: Worker
  doctor: User
  appointment_type: AppointmentType | null
  scheduled_at: string
  status: AppointmentStatus
  reason: string
  notes: string
  created_by: User
  created_at: string
}

// ─── Medical Acts ─────────────────────────────────────────────────────────────

export type EncounterType = 'CONSULTATION' | 'MEDICAL_VISIT' | 'OBSERVATION' | 'EMERGENCY' | 'ACT'
export type EncounterStatus = 'DRAFT' | 'COMPLETED' | 'VALIDATED' | 'CANCELLED'

export interface ClinicalEncounter {
  id: number
  worker: Worker
  doctor: User
  nurse: User | null
  encounter_date: string
  encounter_time: string
  encounter_type: EncounterType
  status: EncounterStatus
  created_at: string
}

export interface VitalSigns {
  id: number
  encounter: number
  weight_kg: number | null
  height_cm: number | null
  bmi: number | null
  bp_systolic: number | null
  bp_diastolic: number | null
  heart_rate: number | null
  respiratory_rate: number | null
  temperature: number | null
  oxygen_saturation: number | null
  notes: string
}

export type RDTTestType = 'MALARIA' | 'HIV' | 'HEP_B' | 'HEP_C' | 'SYPHILIS' | 'GLYCEMIA' | 'OTHER'
export type RDTResult = 'POSITIVE' | 'NEGATIVE' | 'INVALID' | 'PENDING'

export interface RapidDiagnosticTest {
  id: number
  encounter: number
  test_type: RDTTestType
  test_name: string
  result: RDTResult
  performed_at: string
  notes: string
}

// ─── Consultations ────────────────────────────────────────────────────────────

export interface Consultation {
  id: number
  encounter: ClinicalEncounter
  chief_complaint: string
  working_diagnosis: string
  final_diagnosis: string
  icd10_code: string
  referral_needed: boolean
  referral_note: string
  sick_leave_days: number
  work_restriction: string
  follow_up_date: string | null
  created_at: string
}

export type AccidentSeverity = 'MINOR' | 'MODERATE' | 'SEVERE' | 'FATAL'

export interface WorkAccident {
  id: number
  worker: Worker
  accident_date: string
  declaration_date: string | null
  location: string
  circumstance: string
  body_part_injured: string
  injury_type: string
  severity: AccidentSeverity
  lost_work_days: number
  return_to_work_date: string | null
  is_recognized: boolean
  notes: string
  created_at: string
}

// ─── Medical Visits ───────────────────────────────────────────────────────────

export type VisitType = 'EMBAUCHE' | 'PERIODIQUE' | 'REPRISE' | 'SPONTANEE' | 'DEPART'
export type AptitudeValue = 'APT' | 'APT_R' | 'TEMP_INAPT' | 'INAPT'

export interface AptitudeCertificate {
  id: number
  aptitude: AptitudeValue
  restrictions: string
  next_visit_date: string | null
  valid_until: string | null
  certificate_number: string
  signed_by: User | null
  pdf_file: string | null
}

export interface MedicalVisit {
  id: number
  encounter: ClinicalEncounter
  visit_type: VisitType
  aptitude_certificate: AptitudeCertificate | null
  created_at: string
}

// ─── Explorations ─────────────────────────────────────────────────────────────

export type ExplorationStatus = 'PENDING' | 'COMPLETED' | 'VALIDATED' | 'ABNORMAL'

export interface ExplorationResult {
  id: number
  worker: Worker
  performed_by: User
  validated_by: User | null
  performed_date: string
  status: ExplorationStatus
  notes: string
  file_upload: string | null
}

// ─── Occupational ─────────────────────────────────────────────────────────────

export type RiskType = 'NOISE' | 'CHEMICAL' | 'RADIATION' | 'BIOLOGICAL' | 'DUST' | 'ERGONOMIC' | 'PHYSICAL' | 'PSYCHOSOCIAL' | 'OTHER'
export type SMSStatus = 'ACTIVE' | 'SUSPENDED' | 'ENDED'

export interface SpecialMedicalSurveillance {
  id: number
  worker: Worker
  assigned_doctor: User
  risk_type: RiskType
  risk_agent: string
  started_date: string
  review_date: string
  frequency_months: number
  status: SMSStatus
  notes: string
}

export interface WorkRisk {
  id: number
  job_position: JobPosition
  risk_type: RiskType
  risk_agent: string
  risk_level: 1 | 2 | 3 | 4
  preventive_measures: string
  ppe_required: string
}

// ─── Reports / Dashboard ──────────────────────────────────────────────────────

export interface DashboardData {
  today: {
    total_encounters: number
    consultations: number
    medical_visits: number
    emergencies: number
    rdts: number
    rdt_positive: number
  }
  this_week: {
    total_encounters: number
  }
  this_month: {
    total_encounters: number
    work_accidents: number
    lost_work_days: number
    accidents_with_stop: number
    accidents_without_stop: number
    active_workers: number
  }
}

// ─── Pagination ───────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
