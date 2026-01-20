# StokLink Design System

## Product Context
**Type:** Inventory Management & Receiving System  
**Users:** Warehouse staff, managers, purchasing team (power users)  
**Core Tasks:** Receive shipments, verify volumes, inspect items, manage inventory  
**Usage Pattern:** All-day tool, high-frequency interactions, information-dense

## Design Direction

**Personality:** Precision & Density  
Information-forward interface for users who live in the tool. Tight spacing, clear hierarchy, functional over decorative.

**Foundation:** Cool (Slate)  
Professional, trustworthy, serious. Slate tones convey operational reliability.

**Depth Strategy:** Subtle Single Shadows  
Light elevation without visual weight. Cards feel lifted but don't dominate.

**Typography:** System Fonts  
Fast, native, invisible. Let content be the focus.

---

## Color Palette

### Neutrals (Slate Foundation)
```css
--gray-50: #f8fafc;   /* Page background */
--gray-100: #f1f5f9;  /* Card background */
--gray-200: #e2e8f0;  /* Borders, dividers */
--gray-300: #cbd5e1;  /* Disabled states */
--gray-400: #94a3b8;  /* Muted text */
--gray-500: #64748b;  /* Secondary text */
--gray-600: #475569;  /* Body text */
--gray-700: #334155;  /* Headings */
--gray-800: #1e293b;  /* Strong emphasis */
--gray-900: #0f172a;  /* Maximum contrast */
```

### Primary (Blue - Trust & Action)
```css
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-500: #3b82f6;  /* Main actions */
--primary-600: #2563eb;  /* Hover states */
--primary-700: #1d4ed8;  /* Active states */
```

### Semantic Colors
```css
/* Success - Green */
--success-50: #f0fdf4;
--success-100: #dcfce7;
--success-500: #22c55e;
--success-600: #16a34a;
--success-700: #15803d;

/* Warning - Orange */
--warning-50: #fff7ed;
--warning-100: #ffedd5;
--warning-500: #f97316;
--warning-600: #ea580c;
--warning-700: #c2410c;

/* Error - Red */
--error-50: #fef2f2;
--error-100: #fee2e2;
--error-500: #ef4444;
--error-600: #dc2626;
--error-700: #b91c1c;

/* Info - Cyan */
--info-50: #ecfeff;
--info-100: #cffafe;
--info-500: #06b6d4;
--info-600: #0891b2;
--info-700: #0e7490;
```

---

## Spacing System (4px Grid)

```css
--space-1: 4px;   /* Micro spacing (icon gaps) */
--space-2: 8px;   /* Tight spacing (within components) */
--space-3: 12px;  /* Standard spacing (between related elements) */
--space-4: 16px;  /* Comfortable spacing (section padding) */
--space-6: 24px;  /* Generous spacing (between sections) */
--space-8: 32px;  /* Major separation */
--space-12: 48px; /* Page-level spacing */
```

**Rule:** All spacing must be multiples of 4px. No 14px, 17px, or arbitrary values.

---

## Typography

### Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
```

### Scale
```css
--text-xs: 11px;   /* Micro labels, timestamps */
--text-sm: 12px;   /* Table cells, secondary info */
--text-base: 14px; /* Body text, forms */
--text-lg: 16px;   /* Section headings */
--text-xl: 18px;   /* Page titles */
--text-2xl: 24px;  /* Dashboard metrics */
```

### Weights
```css
--font-normal: 400;  /* Body text */
--font-medium: 500;  /* Labels, emphasis */
--font-semibold: 600; /* Headings */
--font-bold: 700;    /* Strong emphasis (rare) */
```

### Hierarchy
- **Page Title:** 18px, 600 weight, gray-800
- **Section Heading:** 16px, 600 weight, gray-700
- **Body Text:** 14px, 400 weight, gray-600
- **Secondary Text:** 12px, 400 weight, gray-500
- **Micro Text:** 11px, 400 weight, gray-400

---

## Border Radius

```css
--radius-sm: 4px;   /* Small elements (badges, chips) */
--radius-md: 6px;   /* Buttons, inputs */
--radius-lg: 8px;   /* Cards, modals */
--radius-xl: 12px;  /* Large containers */
```

**Consistency:** Use 6px for most interactive elements, 8px for containers.

---

## Shadows & Elevation

**Strategy:** Subtle single shadows for light elevation.

```css
/* Subtle elevation */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);

/* Standard elevation (cards, dropdowns) */
--shadow-md: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06);

/* Elevated elements (modals, popovers) */
--shadow-lg: 0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.05);

/* Focus rings */
--ring: 0 0 0 3px rgba(59, 130, 246, 0.1);
```

---

## Component Patterns

### Button Primary
```tsx
className="h-9 px-4 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md transition-colors"
```
- Height: 36px (h-9)
- Padding: 16px horizontal (px-4)
- Radius: 6px (rounded-md)
- Font: 14px, 500 weight
- Transition: 150ms colors

### Button Secondary
```tsx
className="h-9 px-4 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-md transition-colors"
```

### Button Danger
```tsx
className="h-9 px-4 bg-error-600 hover:bg-error-700 text-white text-sm font-medium rounded-md transition-colors"
```

### Input Field
```tsx
className="h-9 px-3 border border-gray-300 rounded-md text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
```
- Height: 36px (h-9)
- Padding: 12px horizontal (px-3)
- Border: 1px gray-300
- Focus: 2px ring primary-500

### Card
```tsx
className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
```
- Background: white
- Radius: 8px (rounded-lg)
- Shadow: shadow-md
- Border: 1px gray-200
- Padding: 16px (p-4)

### Badge (Status)
```tsx
className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
```
- Padding: 10px horizontal, 2px vertical
- Radius: 9999px (rounded-full)
- Font: 11px, 500 weight
- Colors: Based on status (success-100/600, warning-100/600, etc)

### Table
```tsx
// Table container
className="border border-gray-200 rounded-lg overflow-hidden"

// Table header
className="bg-gray-50 border-b border-gray-200"

// Table header cell
className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"

// Table row
className="border-b border-gray-200 hover:bg-gray-50 transition-colors"

// Table cell
className="px-3 py-2 text-sm text-gray-900"
```

### Modal
```tsx
// Overlay
className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"

// Modal container
className="bg-white rounded-xl shadow-lg w-full max-w-md mx-4"

// Modal header
className="p-4 border-b border-gray-200"

// Modal body
className="p-4"

// Modal footer
className="p-4 border-t border-gray-200 flex justify-end gap-2"
```

---

## Layout Patterns

### Page Container
```tsx
className="h-screen flex flex-col overflow-hidden p-6"
```
- Full height viewport
- Flex column
- Padding: 24px

### Content Section
```tsx
className="bg-white rounded-lg shadow-md border border-gray-200 p-4"
```
- Card treatment
- Padding: 16px

### List Container
```tsx
className="space-y-2"
```
- Vertical spacing: 8px between items

### Grid Layout (Dashboard)
```tsx
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
```
- Responsive grid
- Gap: 16px

---

## Animation

```css
/* Micro-interactions */
transition: all 150ms cubic-bezier(0.25, 1, 0.5, 1);

/* Larger transitions */
transition: all 250ms cubic-bezier(0.25, 1, 0.5, 1);
```

**Rule:** No spring/bouncy effects. Smooth, professional transitions only.

---

## Accessibility

- Minimum contrast ratio: 4.5:1 for text
- Focus states: Always visible with 2px ring
- Interactive elements: Minimum 36px height
- Labels: Always present (visible or sr-only)

---

## Usage Guidelines

### When to Use Color
- Status indicators (success, warning, error)
- Primary actions (buttons, links)
- Data visualization (charts, graphs)

### When NOT to Use Color
- Decorative purposes
- Arbitrary differentiation
- Background variety without meaning

### Spacing Consistency
- Card padding: Always 16px (p-4)
- Section gaps: Always 16px (gap-4)
- Button padding: Always 16px horizontal (px-4)

### Border Usage
- Cards: 1px gray-200
- Inputs: 1px gray-300
- Dividers: 1px gray-200
- Never use thick borders (2px+) for decoration

---

## Component Inventory

**Existing Components:**
- StatusBadge
- Toast
- Tooltip
- Layout (Sidebar, Header)
- PrivateRoute

**Pages:**
- Login
- Dashboard
- NotasFiscais (List, Details, New)
- Conferencias
- Divergencias
- Fornecedores
- Filiais
- Transportadoras
- Usuarios
- Relatorios
- Historico

**Next Steps:**
1. Update Tailwind config with design tokens
2. Create base component library
3. Apply system to existing pages
4. Validate consistency across all screens
