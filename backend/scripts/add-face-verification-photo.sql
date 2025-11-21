-- Add face_verification_photo_url column to students table
ALTER TABLE students
ADD COLUMN face_verification_photo_url TEXT NULL;

