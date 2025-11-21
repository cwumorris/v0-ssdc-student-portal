-- Add individual field verification columns to students table
-- This version checks if columns exist before adding them (MySQL compatible)

ALTER TABLE students 
ADD COLUMN student_id_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN university_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN ghana_card_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN selfie_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN id_document_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN full_name_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN program_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN level_verified BOOLEAN DEFAULT FALSE;

