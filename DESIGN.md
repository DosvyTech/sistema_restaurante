---
version: alpha
colors:
  primary: "#285b4a"
  accent: "#a04f37"
  background: "#f4f2ec"
  surface: "#fffefa"
  text: "#18352d"
  muted: "#65736c"
  border: "#d8ded7"
  onPrimary: "#fffefa"
  primaryHover: "#204b3c"
  panelText: "#d0dbd4"
  panelDivider: "#49675b"
  accentSoft: "#e6aa8e"
  navActive: "#e5ebe5"
  statusBackground: "#edf3ed"
  noticeBackground: "#ede9df"
typography:
  sans:
    fontFamily: "Arial, Helvetica, sans-serif"
  display:
    fontFamily: "Georgia, 'Times New Roman', serif"
rounded:
  surface: "18px"
  control: "999px"
components:
  shell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    width: "1180px"
  primaryLink:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.onPrimary}"
    rounded: "{rounded.control}"
  annotation:
    textColor: "{colors.accent}"
  secondaryCopy:
    textColor: "{colors.muted}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.surface}"
  separator:
    backgroundColor: "{colors.border}"
  primaryLinkHover:
    backgroundColor: "{colors.primaryHover}"
    textColor: "{colors.onPrimary}"
  darkPanel:
    backgroundColor: "{colors.text}"
    textColor: "{colors.panelText}"
  panelDivider:
    backgroundColor: "{colors.panelDivider}"
  darkPanelAccent:
    textColor: "{colors.accentSoft}"
  activeNavigation:
    backgroundColor: "{colors.navActive}"
    textColor: "{colors.text}"
  plannedStatus:
    backgroundColor: "{colors.statusBackground}"
    textColor: "{colors.primary}"
  notice:
    backgroundColor: "{colors.noticeBackground}"
    textColor: "{colors.text}"
omitted:
  - section: spacing
    reason: "F1-02 is a small foundation shell; a full spacing system is deferred to F1-08."
---

# Dosvy interface direction

## Overview

This is a **product** surface for restaurant operators and the technical team preparing their system. The F1-02 shell has one job: orient a visitor and explain which business domains are planned. It must not look like a running restaurant dashboard. The direction is a working ledger: warm paper, deep green ink, restrained clay annotations, and editorial serif headings. The signature is the narrow clay-colored “F1-02” register beside the page title, marking this as a foundation in progress.

This is a provisional visual seed for the bootstrap. F1-08 owns the final visual system. Do not expand these values into a full component library in F1-02.

## Colors

Use ink and paper for the main reading surface, brand green for navigation and the primary route link, clay for small status annotations and focus, and muted green-gray for supporting copy. Status always includes readable text; color is never its only signal. The app background is paper and cards use the near-white surface so content remains distinct without shadows.

The border-only CSS treatments are `--color-panel-border: #375d4e` and `--color-status-border: #cbd9ce`. They remain documented here because the DESIGN.md component token schema has no `borderColor` property; the runtime uses them only for their corresponding borders.

## Typography

Use the system sans stack for navigation, body, and module descriptions. Use Georgia or the platform serif fallback only for large page headings, to give the shell a quiet editorial register without loading remote fonts. Keep labels compact but readable and preserve comfortable Spanish line wrapping on narrow screens.

## Layout

Center content in a fluid column capped at 1180px. Keep navigation visible at the top of document flow, then use a generous page introduction and a simple responsive card grid. At narrow widths, collapse the hero and catalog to one column and allow navigation links to wrap. Preserve natural document scrolling and do not fix the shell to viewport height.

## Shapes

Use softly rounded content surfaces and pill-shaped status labels. Use borders rather than layered shadows. Keep the mark and small section labels as restrained structural details, not decoration.

## Components

The shared application shell owns the skip link, brand link, primary navigation, active-route indication, main landmark, and footer. Module cards are informational articles with a visible “Planificado · no implementado” status; they are not buttons or links until a module has a real route.

## Do's and Don'ts

- Do state when a capability is only planned.
- Do keep links as native anchors and preserve visible keyboard focus.
- Do keep the palette and type roles mapped to CSS custom properties in `src/app/globals.css`.
- Don't show invented restaurant data, login states, counts of active users, or operational actions.
- Don't add CRUD screens, authentication, tables, a final design system, decorative food imagery, or remote font dependencies in F1-02.
