import type { BarrioConfig, CiudadConfig, UnitDef } from './types.ts';

export type ConfigIssue = {
  readonly path: string;
  readonly message: string;
};

export type ConfigValidation = {
  readonly ok: boolean;
  readonly issues: readonly ConfigIssue[];
};

function issue(path: string, message: string): ConfigIssue {
  return { path, message };
}

function idsUnicos(unidades: readonly UnitDef[]): ConfigIssue[] {
  const vistos = new Set<string>();
  const out: ConfigIssue[] = [];
  for (let i = 0; i < unidades.length; i++) {
    const id = unidades[i]?.id;
    if (!id || !id.trim()) {
      out.push(issue(`unidades[${i}].id`, 'id vacío'));
      continue;
    }
    if (vistos.has(id)) {
      out.push(issue(`unidades[${i}].id`, `id duplicado: ${id}`));
    }
    vistos.add(id);
  }
  return out;
}

/** Valida roster de barrio: ids únicos + FK de leases. */
export function validarBarrioConfig(cfg: BarrioConfig): ConfigValidation {
  const issues: ConfigIssue[] = [];
  if (!cfg.unidades || cfg.unidades.length === 0) {
    issues.push(issue('unidades', 'se requiere al menos una unidad'));
  } else {
    issues.push(...idsUnicos(cfg.unidades));
  }

  const ids = new Set((cfg.unidades ?? []).map((u) => u.id).filter(Boolean));
  for (const leaseId of cfg.unidadesConLease ?? []) {
    if (!ids.has(leaseId)) {
      issues.push(
        issue('unidadesConLease', `FK rota: "${leaseId}" no está en unidades`),
      );
    }
  }

  return { ok: issues.length === 0, issues };
}

/** Valida ciudad: destacado no vacío. */
export function validarCiudadConfig(cfg: CiudadConfig): ConfigValidation {
  const issues: ConfigIssue[] = [];
  if (!cfg.destacadoBarrioId || !cfg.destacadoBarrioId.trim()) {
    issues.push(issue('destacadoBarrioId', 'destacadoBarrioId vacío'));
  }
  if (cfg.radio !== undefined && !(cfg.radio > 0)) {
    issues.push(issue('radio', 'radio debe ser > 0'));
  }
  if (cfg.densidadNiebla !== undefined && !(cfg.densidadNiebla >= 0)) {
    issues.push(issue('densidadNiebla', 'densidadNiebla debe ser ≥ 0'));
  }
  return { ok: issues.length === 0, issues };
}

/**
 * Valida el par ciudad+barrio del fixture: el destacado de ciudad
 * es un id de barrio de mapa (string libre aquí); el roster se valida solo.
 */
export function validarConfigs(input: {
  ciudad: CiudadConfig;
  barrio: BarrioConfig;
}): ConfigValidation {
  const issues = [
    ...validarCiudadConfig(input.ciudad).issues,
    ...validarBarrioConfig(input.barrio).issues,
  ];
  return { ok: issues.length === 0, issues };
}
