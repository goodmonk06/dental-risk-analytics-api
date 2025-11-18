/**
 * Domain Event Types
 *
 * Typed events for domain actions that can be subscribed to by external systems
 */

export enum EventType {
  // Patient events
  PATIENT_CREATED = 'patient.created',
  PATIENT_UPDATED = 'patient.updated',
  PATIENT_DELETED = 'patient.deleted',

  // Analysis events
  ANALYSIS_COMPLETED = 'analysis.completed',
  ANALYSIS_REVIEWED = 'analysis.reviewed',

  // Appointment events
  APPOINTMENT_SCHEDULED = 'appointment.scheduled',
  APPOINTMENT_CONFIRMED = 'appointment.confirmed',
  APPOINTMENT_STARTED = 'appointment.started',
  APPOINTMENT_COMPLETED = 'appointment.completed',
  APPOINTMENT_CANCELLED = 'appointment.cancelled',
  APPOINTMENT_NO_SHOW = 'appointment.no_show',

  // Treatment plan events
  TREATMENT_PLAN_CREATED = 'treatment_plan.created',
  TREATMENT_PLAN_PROPOSED = 'treatment_plan.proposed',
  TREATMENT_PLAN_ACCEPTED = 'treatment_plan.accepted',
  TREATMENT_PLAN_STARTED = 'treatment_plan.started',
  TREATMENT_PLAN_COMPLETED = 'treatment_plan.completed',
  TREATMENT_PLAN_CANCELLED = 'treatment_plan.cancelled',

  // Clinic events
  CLINIC_CREATED = 'clinic.created',
  CLINIC_UPDATED = 'clinic.updated',

  // Dentist events
  DENTIST_ADDED = 'dentist.added',
  DENTIST_UPDATED = 'dentist.updated',
  DENTIST_REMOVED = 'dentist.removed',
}

export interface BaseEvent {
  id: string;
  type: EventType;
  timestamp: Date;
  metadata?: {
    userId?: number;
    clinicId?: number;
    requestId?: string;
    [key: string]: any;
  };
}

// Patient Events
export interface PatientCreatedEvent extends BaseEvent {
  type: EventType.PATIENT_CREATED;
  data: {
    patientId: number;
    code: string;
    clinicId?: number;
  };
}

export interface PatientUpdatedEvent extends BaseEvent {
  type: EventType.PATIENT_UPDATED;
  data: {
    patientId: number;
    changes: Record<string, any>;
  };
}

export interface PatientDeletedEvent extends BaseEvent {
  type: EventType.PATIENT_DELETED;
  data: {
    patientId: number;
  };
}

// Analysis Events
export interface AnalysisCompletedEvent extends BaseEvent {
  type: EventType.ANALYSIS_COMPLETED;
  data: {
    analysisId: number;
    patientId: number;
    type: string;
    score: number;
    confidence?: number;
  };
}

export interface AnalysisReviewedEvent extends BaseEvent {
  type: EventType.ANALYSIS_REVIEWED;
  data: {
    analysisId: number;
    patientId: number;
    reviewedBy: number;
    notes?: string;
  };
}

// Appointment Events
export interface AppointmentScheduledEvent extends BaseEvent {
  type: EventType.APPOINTMENT_SCHEDULED;
  data: {
    appointmentId: number;
    patientId: number;
    dentistId: number;
    clinicId: number;
    scheduledAt: Date;
    type: string;
  };
}

export interface AppointmentCompletedEvent extends BaseEvent {
  type: EventType.APPOINTMENT_COMPLETED;
  data: {
    appointmentId: number;
    patientId: number;
    dentistId: number;
    clinicId: number;
    completedAt: Date;
  };
}

export interface AppointmentCancelledEvent extends BaseEvent {
  type: EventType.APPOINTMENT_CANCELLED;
  data: {
    appointmentId: number;
    patientId: number;
    reason?: string;
  };
}

// Treatment Plan Events
export interface TreatmentPlanCreatedEvent extends BaseEvent {
  type: EventType.TREATMENT_PLAN_CREATED;
  data: {
    planId: number;
    patientId: number;
    dentistId: number;
    title: string;
  };
}

export interface TreatmentPlanAcceptedEvent extends BaseEvent {
  type: EventType.TREATMENT_PLAN_ACCEPTED;
  data: {
    planId: number;
    patientId: number;
    acceptedAt: Date;
  };
}

export interface TreatmentPlanCompletedEvent extends BaseEvent {
  type: EventType.TREATMENT_PLAN_COMPLETED;
  data: {
    planId: number;
    patientId: number;
    completedAt: Date;
  };
}

// Clinic Events
export interface ClinicCreatedEvent extends BaseEvent {
  type: EventType.CLINIC_CREATED;
  data: {
    clinicId: number;
    name: string;
    code: string;
  };
}

// Dentist Events
export interface DentistAddedEvent extends BaseEvent {
  type: EventType.DENTIST_ADDED;
  data: {
    dentistId: number;
    clinicId: number;
    name: string;
    email: string;
  };
}

// Union type of all events
export type DomainEvent =
  | PatientCreatedEvent
  | PatientUpdatedEvent
  | PatientDeletedEvent
  | AnalysisCompletedEvent
  | AnalysisReviewedEvent
  | AppointmentScheduledEvent
  | AppointmentCompletedEvent
  | AppointmentCancelledEvent
  | TreatmentPlanCreatedEvent
  | TreatmentPlanAcceptedEvent
  | TreatmentPlanCompletedEvent
  | ClinicCreatedEvent
  | DentistAddedEvent;
