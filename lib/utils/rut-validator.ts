/**
 * Valida un RUT chileno según el algoritmo del módulo 11
 * @param rut - RUT en formato XX.XXX.XXX-X o XXXXXXXX-X
 * @returns true si el RUT es válido, false en caso contrario
 */
export function validateRUT(rut: string): boolean {
  // Limpiar el RUT de puntos y guiones
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '');
  
  // Verificar que tenga al menos 2 caracteres (1 número + 1 dígito verificador)
  if (cleanRut.length < 2) return false;
  
  // Separar el cuerpo del dígito verificador
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1).toUpperCase();
  
  // Verificar que el cuerpo sean solo números
  if (!/^\d+$/.test(body)) return false;
  
  // Calcular el dígito verificador según el algoritmo de módulo 11
  let sum = 0;
  let multiplier = 2;
  
  // Recorrer el cuerpo de derecha a izquierda
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const calculatedDV = 11 - remainder;
  
  // Determinar el dígito verificador esperado
  let expectedDV: string;
  if (calculatedDV === 11) {
    expectedDV = '0';
  } else if (calculatedDV === 10) {
    expectedDV = 'K';
  } else {
    expectedDV = calculatedDV.toString();
  }
  
  return dv === expectedDV;
}

/**
 * Formatea un RUT chileno al formato estándar XX.XXX.XXX-X
 * @param rut - RUT sin formato o parcialmente formateado
 * @returns RUT formateado o el input original si es inválido
 */
export function formatRUT(rut: string): string {
  // Limpiar el RUT de puntos y guiones
  const cleanRut = rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
  
  if (cleanRut.length < 2) return rut;
  
  // Separar el cuerpo del dígito verificador
  const body = cleanRut.slice(0, -1);
  const dv = cleanRut.slice(-1);
  
  // Formatear el cuerpo con puntos (de derecha a izquierda)
  let formattedBody = '';
  for (let i = body.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formattedBody = '.' + formattedBody;
    }
    formattedBody = body[i] + formattedBody;
  }
  
  return `${formattedBody}-${dv}`;
}

/**
 * Limpia un RUT de puntos y guiones para almacenarlo en la base de datos
 * @param rut - RUT formateado
 * @returns RUT limpio (solo números y dígito verificador)
 */
export function cleanRUT(rut: string): string {
  return rut.replace(/\./g, '').replace(/-/g, '').toUpperCase();
}
