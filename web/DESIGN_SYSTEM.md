# SecureLearning — Design System

> Read this before adding any new page, component, or style. Goal: fully consistent UI across all modules and personas in light, dark, and accessible modes.

---

## 1. Themes & Accessibility

The application supports five core themes. The theme is changed by adding the corresponding class to the `<html>` element.

| Theme | Class | Purpose | Primary / Accent |
|---|---|---|---|
| **Light** | (default) | Standard bright mode | Purple (`#7C3AED`) |
| **Dark** | `.dark` | Low-light environment | Purple (`#7C3AED`) |
| **Deuteranopia** | `.deuteranopia` | Green-blindness | Cobalt Blue (`#005AB5`) |
| **Protanopia** | `.protanopia` | Red-blindness | Gold/Orange (`#E69F00`) |
| **Tritanopia** | `.tritanopia` | Blue-blindness | Crimson Red (`#D62828`) |

### Theme Transitions
We use the **View Transition API** for fluid switching. The `useThemeTransition` hook performs a **center-out circular expansion** (500ms duration).

```ts
const setTheme = useThemeTransition()
setTheme('tritanopia') // 'light' | 'dark' | 'deuteranopia' | 'protanopia' | 'tritanopia' | 'system'
```

---

## 2. Colour Tokens

All colours live in `src/globals.css` and are exposed to Tailwind via `@theme inline`. **NEVER hardcode hex values in JSX.**

### Core Surfaces & Feedback

| Token | Light Usage | Content |
|---|---|---|
| `--background` | Main page root | Standard app white / dark base |
| `--surface` | Cards, panels, modals | Elevated background |
| `--surface-subtle` | Table headers, secondary panels | Subtle differentiation |
| `--foreground` | Main text color | High contrast text |
| `--muted-foreground` | Secondary / helper text | De-emphasized text |
| `--primary` | Main action color | Follows theme (Purple/Blue/Gold/Red) |
| `--success` | Affirmative states | Safe colors per theme |
| `--warning` | Cautionary states | High visibility alerts |
| `--error` | Destructive / Error states | Critical feedback |
| `--border` | Dividers and outlines | Standard UI separation |

### Navigation Theme (Navbar & Sidebar)

The Top Bar (`Navbar`) and `Sidebar` are synchronized to provide a consistent frame. Always use these specific tokens for navigation elements:

- `bg-sidebar`: Background for both TopBar and Sidebar.
- `border-sidebar-border`: Border color for navigation dividers.
- `text-sidebar-foreground`: Standard text color for nav items.
- `bg-sidebar-accent`: Hover/Active background for nav items.
- `text-sidebar-accent-foreground`: Hover/Active text color for nav items.

---

## 3. Brand Consistency (Untouchables)

While most UI elements adapt to the active theme, the **Brand Identity** must remain consistent to preserve company image.

- **Logo Text ("Learning")**: Always hardcoded to `#7C3AED`.
- **Loading Screens**: Use the standard brand palette.
- **Brand Imagery**: Hat logo and primary marketing assets do not transform.

---

## 4. Typography & Spacing

### Font Sizes
Use standard Tailwind classes with responsive modifiers for auditability.
- **Page Titles**: `text-2xl font-bold`
- **Section Headers**: `text-lg font-semibold`
- **Body Text**: `text-[14px] sm:text-base`
- **Labels**: `text-sm font-medium`

### Built-in Spacing
- **Container Padding**: `px-3 sm:px-4 lg:px-6`
- **Grid Gap**: `gap-4`
- **Card Padding**: `p-4` or `p-5`

---

## 5. Components & Interactive Patterns

### ThemeCard — `src/components/shared/ThemeCard.tsx`
Displays a theme option with a specific icon and accent color.
- **Icon Borders**: Icons should have a `border border-border/50` for structure.
- **Interactive**: Uses `transition-all duration-300` for fluid hover states.

### Buttons & Hovers
- **Primary**: `bg-primary text-primary-foreground hover:bg-primary/90`
- **Destructive**: `text-error hover:bg-error/10`
- **Nav Links**: Use `hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`.

---

## 6. What to Avoid (The "Never" List)

| ❌ NEVER | ✅ ALWAYS DO |
|---|---|
| Hardcode hex values (`#7C3AED`) | Use theme variables (`var(--primary)`) |
| Use Tailwind color literals (`text-purple-600`) | Use functional tokens (`text-primary`) |
| Use `window.confirm` | Use `ConfirmProvider` / custom modals |
| Ignore accessibility modes | Test each change in Deuteranopia/Protanopia/Tritanopia |
| Mix `background` and `sidebar` colors in TopBar | Use `bg-sidebar` for both TopBar and Sidebar |
| Add `border-b` to content if Header has it | Header owns the border; content flows beneath |

---

## 7. New Page Checklist

- [ ] Page shell uses `h-full w-full flex flex-col`.
- [ ] Header uses `bg-sidebar border-sidebar-border`.
- [ ] Content area uses theme variables for all surfaces.
- [ ] All interactive elements (buttons, inputs) have theme-aware hover/focus states.
- [ ] No hardcoded colors (except specific brand assets).
- [ ] Verified in **Light, Dark, and all 3 Accessibility modes**.
