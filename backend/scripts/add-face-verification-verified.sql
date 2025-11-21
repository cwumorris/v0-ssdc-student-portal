-- Add face_verification_verified column to students table
ALTER TABLE students
ADD COLUMN face_verification_verified BOOLEAN DEFAULT FALSE;

