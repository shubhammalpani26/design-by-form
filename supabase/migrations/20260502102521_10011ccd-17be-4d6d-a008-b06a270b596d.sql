UPDATE designer_profiles
SET email = CASE
  WHEN email = 'astha@nyzora.ai' THEN 'astha@example.com'
  WHEN email = 'posh@nyzora.ai' THEN 'posh@example.com'
  WHEN email = 'preksha@nyzora.ai' THEN 'preksha@example.com'
  ELSE email
END
WHERE email LIKE '%@nyzora.ai%';