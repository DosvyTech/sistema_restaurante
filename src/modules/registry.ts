export type ModuleDescriptor = {
  id: string;
  name: string;
  summary: string;
  status: "planned";
};

export const plannedModules = [
  {
    id: "MOD-01",
    name: "Configuración",
    summary: "Parámetros de negocio e identidad de la instalación.",
    status: "planned",
  },
  {
    id: "MOD-02",
    name: "Usuarios, roles y permisos",
    summary: "Identidades, sesiones, permisos y auditoría de seguridad.",
    status: "planned",
  },
  {
    id: "MOD-03",
    name: "Empleados",
    summary: "Expedientes laborales, horarios, asistencia y permisos.",
    status: "planned",
  },
  {
    id: "MOD-04",
    name: "Productos y precios",
    summary: "Catálogo, variantes, precios e impuestos comerciales.",
    status: "planned",
  },
  {
    id: "MOD-05",
    name: "Inventario y recetas",
    summary: "Insumos, recetas versionadas, movimientos y valoración.",
    status: "planned",
  },
  {
    id: "MOD-08",
    name: "Clientes",
    summary: "Expedientes de clientes, identidad fiscal e historial.",
    status: "planned",
  },
  {
    id: "MOD-09",
    name: "Facturación de contado",
    summary: "Ventas de contado, cobros, flujo e-CF, E34 y reembolsos.",
    status: "planned",
  },
] as const satisfies readonly ModuleDescriptor[];
