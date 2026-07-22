/**
 * The backend's error messages are in English (it's an API contract, not
 * tied to one language/client) but this frontend is fully in Spanish, so
 * raw messages must never reach the UI untranslated. This is a pragmatic
 * two-tier translator: an exact-match dictionary for our own NestJS
 * exception strings, then pattern matching for class-validator's default
 * validation phrasing. Anything still unmatched falls back to a generic
 * Spanish message rather than leaking English.
 */

const EXACT_MESSAGES: Record<string, string> = {
  'Provide at least a draftUrl or a finalUrl': 'Ingresá al menos una URL de borrador o final.',
  'This deliverable has already been published': 'Este entregable ya fue publicado.',
  'Only a submitted deliverable can be reviewed': 'Solo se puede revisar un entregable ya enviado.',
  'Only an approved deliverable can be published': 'Solo se puede publicar un entregable aprobado.',
  'Admin registration is disabled': 'El registro como administrador está deshabilitado.',
  'Email already registered': 'Ese email ya está registrado.',
  'Invalid credentials': 'Email o contraseña incorrectos.',
  'This account has been suspended': 'Esta cuenta fue suspendida.',
  'trackingCarrier and trackingNumber are required to mark the sample as sent':
    'Se necesita la paquetería y el número de guía para marcar la muestra como enviada.',
  'At least one deliverable needs a finalUrl before submitting the final version':
    'Al menos un entregable necesita una URL final antes de enviar la versión final.',
  'All deliverables must be approved first': 'Todos los entregables deben estar aprobados primero.',
  'All deliverables need a publicationUrl before marking the collaboration as published':
    'Todos los entregables necesitan una URL de publicación antes de marcar la colaboración como publicada.',
  'Collaboration not found': 'Colaboración no encontrada.',
  'You are not a party to this collaboration': 'No sos parte de esta colaboración.',
  'Collaboration is under dispute; resolve the dispute before changing state':
    'La colaboración está en disputa; resolvé la disputa antes de cambiar el estado.',
  'Dispute not found': 'Disputa no encontrada.',
  'You are not a party to this conversation': 'No sos parte de esta conversación.',
  'Conversation not found': 'Conversación no encontrada.',
  'Creator not found': 'Creador no encontrado.',
  'Brand not found': 'Marca no encontrada.',
  'Create your profile first': 'Completá tu perfil primero.',
  'Brand profile not found': 'Perfil de marca no encontrado.',
  'Create your brand profile first': 'Completá tu perfil de marca primero.',
  'Product not found': 'Producto no encontrado.',
  'You do not own this product': 'No sos dueño de este producto.',
  'Creator profile not found': 'Perfil de creador no encontrado.',
  'Category not found': 'Categoría no encontrada.',
  'Create your creator profile first': 'Completá tu perfil de creador primero.',
  'Social account not found': 'Red social no encontrada.',
  'Marketplace entry not found': 'Marketplace no encontrado.',
  'Portfolio item not found': 'Elemento de portafolio no encontrado.',
  'You can only attach your own products to a campaign': 'Solo podés adjuntar tus propios productos a una campaña.',
  'Only draft campaigns can be edited; pause or close a published campaign instead':
    'Solo se pueden editar campañas en borrador; pausá o cerrá una campaña publicada.',
  'Campaign not found': 'Campaña no encontrada.',
  'You do not own this campaign': 'No sos dueño de esta campaña.',
  'Campaign is unavailable': 'La campaña no está disponible.',
  'Application deadline has passed': 'La fecha límite de postulación ya pasó.',
  'Publish the campaign before inviting creators': 'Publicá la campaña antes de invitar creadores.',
  'Invitations are accepted or rejected by the creator, not the brand':
    'Las invitaciones las acepta o rechaza el creador, no la marca.',
  'Only invitations can be accepted or rejected this way': 'Solo las invitaciones se pueden aceptar o rechazar así.',
  'Only pending applications can be withdrawn': 'Solo se pueden retirar postulaciones pendientes.',
  'This campaign already has the required number of creators': 'Esta campaña ya alcanzó el número de creadores requerido.',
  'Missing bearer token': 'Tu sesión no es válida. Iniciá sesión de nuevo.',
  'Invalid or expired token': 'Tu sesión expiró. Iniciá sesión de nuevo.',
  'Insufficient permissions': 'No tenés permisos para hacer esto.',
  'Collaboration must be completed before it can be reviewed': 'La colaboración debe estar completada antes de poder calificarla.',
  'Missing token': 'Tu sesión no es válida. Iniciá sesión de nuevo.',
  'Resource not found': 'Recurso no encontrado.',
  'Referenced resource does not exist': 'El recurso relacionado no existe.',
};

const PATTERN_MESSAGES: Array<[RegExp, string]> = [
  [/^Cannot move collaboration from .+ to .+\./, 'No se puede realizar ese cambio de estado en la colaboración.'],
  [/^Collaboration is already \w+ and cannot change state$/, 'La colaboración ya está en un estado final y no se puede modificar.'],
  [/^Cannot cancel a collaboration from \w+$/, 'No se puede cancelar la colaboración en este estado.'],
  [/^Only the .+ party can move a collaboration/, 'Ese paso lo tiene que hacer la otra parte de la colaboración.'],
  [/^Cannot move campaign from \w+ to \w+$/, 'No se puede realizar ese cambio de estado en la campaña.'],
  [/^Cannot move application from \w+ to \w+$/, 'No se puede realizar ese cambio de estado en la postulación.'],
  [/^Dispute is already \w+$/, 'Esa disputa ya fue resuelta.'],
  [/^Cannot open a dispute on a collaboration in \w+ state$/, 'No se puede abrir una disputa en el estado actual de la colaboración.'],
  [/^Invitation already \w+$/, 'Esa invitación ya fue respondida.'],
  [/^A record with the same .+ already exists$/, 'Ya existe un registro con esos datos.'],
];

const VALIDATION_PATTERNS: Array<[RegExp, string]> = [
  [/^(.+) must be an email$/, '$1 debe ser un email válido'],
  [/^(.+) must be longer than or equal to (\d+) characters$/, '$1 debe tener al menos $2 caracteres'],
  [/^(.+) should not be empty$/, '$1 no puede estar vacío'],
  [/^(.+) must be a string$/, '$1 debe ser texto'],
  [/^(.+) must be a number conforming to the specified constraints$/, '$1 debe ser un número'],
  [/^(.+) must be an integer number$/, '$1 debe ser un número entero'],
  [/^(.+) must not be less than (\d+)$/, '$1 no puede ser menor a $2'],
  [/^(.+) must not be greater than (\d+)$/, '$1 no puede ser mayor a $2'],
  [/^(.+) must be a URL address$/, '$1 debe ser una URL válida'],
  [/^(.+) must be a boolean value$/, '$1 debe ser verdadero o falso'],
  [/^(.+) must be one of the following values: (.+)$/, '$1 debe ser uno de estos valores: $2'],
];

function translatePhrase(phrase: string): string {
  const exact = EXACT_MESSAGES[phrase];
  if (exact) return exact;

  for (const [pattern, replacement] of PATTERN_MESSAGES) {
    if (pattern.test(phrase)) return replacement;
  }
  for (const [pattern, replacement] of VALIDATION_PATTERNS) {
    const match = phrase.match(pattern);
    if (match) return replacement.replace('$1', match[1]).replace('$2', match[2] ?? '');
  }
  return phrase === '' ? phrase : GENERIC_FALLBACK;
}

const GENERIC_FALLBACK = 'No pudimos completar la acción. Intentá de nuevo.';

/** Translates a backend error message (possibly several joined by ", ") to Spanish. */
export function translateApiError(message: string): string {
  if (!message) return GENERIC_FALLBACK;
  const parts = message.split(', ').map(translatePhrase);
  return parts.join(' · ');
}
