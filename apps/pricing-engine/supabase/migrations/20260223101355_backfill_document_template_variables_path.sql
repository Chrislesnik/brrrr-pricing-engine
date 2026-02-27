
UPDATE document_template_variables
SET path = name
WHERE path IS NULL;
