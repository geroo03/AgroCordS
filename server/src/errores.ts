/**
 * Errores tipados por dominio, traducidos a status HTTP en
 * middleware/manejoErrores.ts — mismo criterio que WeatherUnavailableError o
 * GroqNoDisponibleError en la app Next.js: el detalle completo queda en el
 * log del servidor, el cliente nunca ve un stack trace.
 */

export class ErrorNoAutorizado extends Error {
  constructor(message = "No autorizado.") {
    super(message);
    this.name = "ErrorNoAutorizado";
  }
}

export class ErrorSolicitudInvalida extends Error {
  constructor(message: string, readonly detalle?: unknown) {
    super(message);
    this.name = "ErrorSolicitudInvalida";
  }
}

export class ErrorNoEncontrado extends Error {
  constructor(message = "No encontrado.") {
    super(message);
    this.name = "ErrorNoEncontrado";
  }
}

/** El mismo hash de pago ya activó Premium antes — no es un fallo real. */
export class ErrorPagoDuplicado extends Error {
  constructor(message = "Este comprobante ya fue usado para activar Premium.") {
    super(message);
    this.name = "ErrorPagoDuplicado";
  }
}

/** Cualquier fallo no esperado del SDK de Supabase (red, timeout, etc.). */
export class ErrorSupabase extends Error {
  constructor(message: string, readonly causa?: unknown) {
    super(message);
    this.name = "ErrorSupabase";
  }
}
