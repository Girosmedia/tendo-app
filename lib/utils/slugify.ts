/**
 * Convierte un texto a formato slug (URL-safe)
 * Normaliza caracteres especiales chilenos (ñ, acentos)
 * @param text - Texto a convertir
 * @returns Slug en lowercase, sin espacios ni caracteres especiales
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    // Normalizar caracteres especiales (ñ, acentos, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar diacríticos
    // Reemplazar ñ específicamente (no se elimina con diacríticos)
    .replace(/ñ/g, 'n')
    // Reemplazar espacios y guiones bajos con guión
    .replace(/\s+/g, '-')
    .replace(/_/g, '-')
    // Eliminar caracteres no alfanuméricos (excepto guiones)
    .replace(/[^\w\-]+/g, '')
    // Reemplazar múltiples guiones con uno solo
    .replace(/\-\-+/g, '-')
    // Eliminar guiones al inicio y al final
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Genera un slug único agregando un timestamp si es necesario
 * @param text - Texto base para el slug
 * @param existingSlugs - Array de slugs existentes para verificar colisiones
 * @returns Slug único
 */
export function generateUniqueSlug(
  text: string,
  existingSlugs: string[] = []
): string {
  let slug = slugify(text);
  
  // Si el slug ya existe, agregar timestamp
  if (existingSlugs.includes(slug)) {
    const timestamp = Date.now().toString(36); // Base 36 para slug más corto
    slug = `${slug}-${timestamp}`;
  }
  
  return slug;
}
