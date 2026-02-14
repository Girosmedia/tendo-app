/**
 * Valida un RUT chileno
 * @param rut - RUT en formato "12345678-9" o "12.345.678-9"
 * @returns true si el RUT es válido
 */
export function validateRUT(rut: string): boolean {
  // Limpiar el RUT (quitar puntos y guiones)
  const cleanRUT = rut.replace(/[.-]/g, '');

  // Verificar que tenga el formato correcto
  if (cleanRUT.length < 2) {
    return false;
  }

  // Separar número y dígito verificador
  const rutNumber = cleanRUT.slice(0, -1);
  const verifier = cleanRUT.slice(-1).toUpperCase();

  // Verificar que el número sea válido
  if (!/^\d+$/.test(rutNumber)) {
    return false;
  }

  // Calcular dígito verificador
  let sum = 0;
  let multiplier = 2;

  // Recorrer de derecha a izquierda
  for (let i = rutNumber.length - 1; i >= 0; i--) {
    sum += parseInt(rutNumber[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const calculatedVerifier = 11 - (sum % 11);
  let expectedVerifier: string;

  if (calculatedVerifier === 11) {
    expectedVerifier = '0';
  } else if (calculatedVerifier === 10) {
    expectedVerifier = 'K';
  } else {
    expectedVerifier = calculatedVerifier.toString();
  }

  return verifier === expectedVerifier;
}

/**
 * Formatea un RUT chileno
 * @param rut - RUT sin formato "123456789"
 * @returns RUT formateado "12.345.678-9"
 */
export function formatRUT(rut: string): string {
  // Limpiar el RUT
  const cleanRUT = rut.replace(/[.-]/g, '');

  if (cleanRUT.length < 2) {
    return rut;
  }

  // Separar número y dígito verificador
  const rutNumber = cleanRUT.slice(0, -1);
  const verifier = cleanRUT.slice(-1);

  // Formatear con puntos
  const formattedNumber = rutNumber.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return `${formattedNumber}-${verifier}`;
}

/**
 * Limpia un RUT (quita puntos y guiones)
 * @param rut - RUT formateado "12.345.678-9"
 * @returns RUT limpio "123456789"
 */
export function cleanRUT(rut: string): string {
  return rut.replace(/[.-]/g, '');
}
