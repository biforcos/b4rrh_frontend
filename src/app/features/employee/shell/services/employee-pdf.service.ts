import { Injectable } from '@angular/core';

export interface EmployeePrintData {
  fullName: string;
  employeeNumber: string;
  employeeTypeCode: string;
  ruleSystemCode: string;
  statusLabel: string;
  isActive: boolean;
  company: string | null;
  workCenter: string | null;
  hireDate: string | null;
  contractTypeName: string | null;
  contractSubtypeName: string | null;
  contractCode: string | null;
  contractStartDate: string | null;
  contractEndDate: string | null;
  contractIsActive: boolean;
  email: string | null;
  phone: string | null;
}

@Injectable({ providedIn: 'root' })
export class EmployeePdfService {
  print(data: EmployeePrintData): void {
    const html = this.buildHtml(data);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (win) {
      win.addEventListener('load', () => {
        win.print();
        win.addEventListener('afterprint', () => {
          win.close();
          URL.revokeObjectURL(url);
        });
      });
    } else {
      URL.revokeObjectURL(url);
    }
  }

  private buildHtml(d: EmployeePrintData): string {
    const today = new Date().toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const fmtDate = (iso: string | null): string => {
      if (!iso) return '—';
      const parts = iso.split('-');
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const val = (v: string | null | undefined): string =>
      v?.trim() ? v.trim() : '—';

    const statusColor = d.isActive ? '#15803d' : '#64748b';
    const statusBg = d.isActive ? '#dcfce7' : '#f1f5f9';
    const statusBorder = d.isActive ? '#bbf7d0' : '#e2e8f0';
    const initials = this.initials(d.fullName);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Ficha — ${this.esc(d.fullName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 12px;
      color: #1e3a54;
      background: #ffffff;
      padding: 2.4rem 2.8rem;
      line-height: 1.5;
    }
    .doc-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding-bottom: 1rem;
      border-bottom: 2px solid #0e7490;
      margin-bottom: 1.6rem;
    }
    .brand { display: flex; align-items: center; gap: 0.6rem; }
    .brand-mark {
      width: 2rem; height: 2rem; border-radius: 0.4rem;
      background: linear-gradient(140deg, #0e7490, #22d3ee);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.7rem; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .brand-name { font-size: 1.1rem; font-weight: 800; color: #0a2d3e; letter-spacing: -0.02em; }
    .doc-meta { text-align: right; font-size: 0.72rem; color: #5b7489; }
    .doc-meta strong { display: block; font-size: 0.8rem; font-weight: 700; color: #1e3a54; margin-bottom: 0.12rem; }
    .identity-hero {
      display: flex; align-items: center; gap: 1rem;
      padding: 1rem 1.2rem;
      background: linear-gradient(135deg, #f0f9ff 0%, #e8f4fb 100%);
      border: 1px solid rgba(14,116,144,0.18);
      border-left: 4px solid #0e7490;
      border-radius: 0.6rem;
      margin-bottom: 1.4rem;
    }
    .avatar {
      width: 3rem; height: 3rem; border-radius: 50%;
      background: linear-gradient(135deg, #0c6882, #22d3ee);
      display: flex; align-items: center; justify-content: center;
      font-size: 1rem; font-weight: 800; color: #fff; flex-shrink: 0;
    }
    .identity-copy { flex: 1; min-width: 0; }
    .identity-name { font-size: 1.4rem; font-weight: 800; color: #0a2d3e; line-height: 1.2; margin-bottom: 0.22rem; }
    .identity-sub { font-size: 0.78rem; color: #4a6a84; }
    .status-badge {
      display: inline-flex; align-items: center; border-radius: 999px;
      font-size: 0.68rem; font-weight: 700; line-height: 1; padding: 0.22rem 0.6rem;
      background: ${statusBg}; color: ${statusColor}; border: 1px solid ${statusBorder}; flex-shrink: 0;
    }
    .section { margin-bottom: 1.2rem; break-inside: avoid; }
    .section-title {
      font-size: 0.64rem; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.07em; color: #0e7490;
      padding-bottom: 0.3rem; border-bottom: 1px solid rgba(14,116,144,0.18); margin-bottom: 0.7rem;
    }
    .fields-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.7rem 1rem; }
    .fields-grid--2col { grid-template-columns: repeat(2,1fr); }
    .field dt { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #607284; margin-bottom: 0.12rem; }
    .field dd { font-size: 0.88rem; font-weight: 600; color: #162f42; }
    .field dd.empty { color: #94a3b8; font-weight: 400; }
    .doc-footer {
      margin-top: 2rem; padding-top: 0.6rem;
      border-top: 1px solid #e2e8f0;
      font-size: 0.64rem; color: #94a3b8;
      display: flex; justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 1.8cm 2cm; size: A4; }
    }
  </style>
</head>
<body>
  <header class="doc-header">
    <div class="brand">
      <div class="brand-mark">B4</div>
      <span class="brand-name">B4RRHH</span>
    </div>
    <div class="doc-meta">
      <strong>Ficha de empleado</strong>
      Generado el ${this.esc(today)}
    </div>
  </header>

  <div class="identity-hero">
    <div class="avatar">${this.esc(initials)}</div>
    <div class="identity-copy">
      <div class="identity-name">${this.esc(d.fullName)}</div>
      <div class="identity-sub">
        N&ordm; ${this.esc(d.employeeNumber)} &nbsp;&middot;&nbsp;
        ${this.esc(d.employeeTypeCode)} &nbsp;&middot;&nbsp;
        ${this.esc(d.ruleSystemCode)}
      </div>
    </div>
    <div class="status-badge">${this.esc(d.statusLabel)}</div>
  </div>

  <section class="section">
    <div class="section-title">Identidad funcional</div>
    <dl class="fields-grid">
      <div class="field"><dt>N&ordm; de empleado</dt><dd>${this.esc(d.employeeNumber)}</dd></div>
      <div class="field"><dt>Tipo</dt><dd>${this.esc(d.employeeTypeCode)}</dd></div>
      <div class="field"><dt>Sistema de reglas</dt><dd>${this.esc(d.ruleSystemCode)}</dd></div>
      <div class="field"><dt>Centro de trabajo</dt><dd class="${d.workCenter ? '' : 'empty'}">${this.esc(val(d.workCenter))}</dd></div>
      <div class="field"><dt>Empresa</dt><dd class="${d.company ? '' : 'empty'}">${this.esc(val(d.company))}</dd></div>
      <div class="field"><dt>Fecha de alta</dt><dd class="${d.hireDate ? '' : 'empty'}">${this.esc(fmtDate(d.hireDate))}</dd></div>
    </dl>
  </section>

  <section class="section">
    <div class="section-title">Contrato activo</div>
    <dl class="fields-grid fields-grid--2col">
      <div class="field">
        <dt>Tipo de contrato</dt>
        <dd class="${d.contractTypeName || d.contractCode ? '' : 'empty'}">${this.esc(val(d.contractTypeName ?? d.contractCode))}</dd>
      </div>
      ${d.contractSubtypeName ? `<div class="field"><dt>Subtipo</dt><dd>${this.esc(d.contractSubtypeName)}</dd></div>` : ''}
      <div class="field">
        <dt>Inicio</dt>
        <dd class="${d.contractStartDate ? '' : 'empty'}">${this.esc(fmtDate(d.contractStartDate))}</dd>
      </div>
      <div class="field">
        <dt>Fin</dt>
        <dd class="${d.contractEndDate ? '' : 'empty'}">${d.contractEndDate ? this.esc(fmtDate(d.contractEndDate)) : d.contractIsActive ? 'Indefinido / en vigor' : '&mdash;'}</dd>
      </div>
    </dl>
  </section>

  <section class="section">
    <div class="section-title">Contacto</div>
    <dl class="fields-grid fields-grid--2col">
      <div class="field">
        <dt>Correo electr&oacute;nico</dt>
        <dd class="${d.email ? '' : 'empty'}">${this.esc(val(d.email))}</dd>
      </div>
      <div class="field">
        <dt>Tel&eacute;fono</dt>
        <dd class="${d.phone ? '' : 'empty'}">${this.esc(val(d.phone))}</dd>
      </div>
    </dl>
  </section>

  <footer class="doc-footer">
    <span>B4RRHH &mdash; Documento generado autom&aacute;ticamente</span>
    <span>${this.esc(today)}</span>
  </footer>
</body>
</html>`;
  }

  private initials(fullName: string): string {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return '?';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  private esc(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
