-- Add individual field verification columns to students table
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS student_id_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS university_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS ghana_card_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS selfie_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS id_document_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS full_name_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS program_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS level_verified BOOLEAN DEFAULT FALSE;

-- Update existing records to set default values
UPDATE students 
SET student_id_verified = COALESCE(student_id_verified, FALSE),
    university_verified = COALESCE(university_verified, FALSE),
    ghana_card_verified = COALESCE(ghana_card_verified, FALSE),
    selfie_verified = COALESCE(selfie_verified, FALSE),
    id_document_verified = COALESCE(id_document_verified, FALSE),
    full_name_verified = COALESCE(full_name_verified, FALSE),
    program_verified = COALESCE(program_verified, FALSE),
    level_verified = COALESCE(level_verified, FALSE)
WHERE student_id_verified IS NULL 
   OR university_verified IS NULL 
   OR ghana_card_verified IS NULL 
   OR selfie_verified IS NULL 
   OR id_document_verified IS NULL
   OR full_name_verified IS NULL
   OR program_verified IS NULL
   OR level_verified IS NULL;

