module.exports = {
  forbidden: [
    {
      name: "no-circular",
      comment: "Source modules must not form dependency cycles.",
      severity: "error",
      from: { path: "^src/" },
      to: { circular: true },
    },
    {
      name: "shared-does-not-import-upper-layers",
      comment: "Shared code must not depend on routes or business modules.",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/(app|modules)/" },
    },
    {
      name: "modules-do-not-import-app",
      comment: "Business modules must not depend on route composition.",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: "^src/app/" },
    },
    {
      name: "modules-do-not-import-peer-modules",
      comment: "Modules coordinate through authorized future application contracts, not direct imports.",
      severity: "error",
      from: { path: "^src/modules/" },
      to: { path: "^src/modules/" },
    },
  ],
  options: {
    includeOnly: "^src/",
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
  },
};
