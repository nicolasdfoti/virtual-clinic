/** Tipos para los archivos del paciente. */

export type PatientFile = {
  id: number;
  patient_id: number;
  uploaded_by_user_id: number;
  uploaded_by_name: string | null;
  original_filename: string;
  mime_type: string;
  size: number;
  created_at: string;
};

export type PatientFileListResponse = {
  items: PatientFile[];
  total: number;
  limit: number;
  offset: number;
};