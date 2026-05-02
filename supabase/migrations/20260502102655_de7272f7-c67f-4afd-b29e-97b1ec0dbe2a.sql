UPDATE designer_profiles
SET email = CASE
  WHEN email = 'astha@example.com' THEN 'astha@gmail.com'
  WHEN email = 'posh@example.com' THEN 'posh@gmail.com'
  WHEN email = 'preksha@example.com' THEN 'preksha@gmail.com'
  ELSE email
END
WHERE email LIKE '%@example.com';