/** Tipos para la historia clinica (notas y adendas). */

export type ClinicalNote = {
  id: number;
  patient_id: number;
  doctor_id: number;
  doctor_name: string | null;
  appointment_id: number | null;
  content: string;
  amends_note_id: number | null;
  created_at: string;
};

export type ClinicalNoteCreate = {
  content: string;
  appointment_id?: number | null;
};

export type ClinicalNoteAmend = {
  content: string;
};

export type ClinicalNoteListResponse = {
  items: ClinicalNote[];
  total: number;
  limit: number;
  offset: number;
};