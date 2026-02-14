-- Script para limpiar datos de prueba si es necesario
-- Ejecutar desde psql o modificar según necesidad

-- Ver organizaciones actuales
SELECT 
  o.id, 
  o.name, 
  o.rut, 
  u.email as created_by
FROM organizations o
LEFT JOIN members m ON o.id = m."organizationId" AND m.role = 'OWNER'
LEFT JOIN users u ON m."userId" = u.id;

-- Para eliminar una organización específica (reemplazar 'RUT_AQUI'):
-- DELETE FROM organizations WHERE rut = '77480476-5';

-- Para resetear el currentOrganizationId de un usuario:
-- UPDATE users SET "currentOrganizationId" = NULL WHERE email = 'tu@email.com';
