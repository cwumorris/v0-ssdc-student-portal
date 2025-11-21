-- Add reupload_required columns to students table
ALTER TABLE students 
ADD COLUMN email_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN phone_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN selfie_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN id_document_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN student_id_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN university_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN ghana_card_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN full_name_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN program_reupload_required BOOLEAN DEFAULT FALSE,
ADD COLUMN level_reupload_required BOOLEAN DEFAULT FALSE;

