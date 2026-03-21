# SecureLearning — Design System

> Read this before adding any new page, component, or style. Goal: fully consistent UI across all modules and personas in light **and** dark mode.

---

## 1. Themes

Supports **Light**, **Dark**, **Deuteranopia**, and **Protanopia**. Toggled by adding the corresponding class (`.dark`, `.deuteranopia`, `.protanopia`) to `<html>`. Uses the **View Transition API** clip-path wipe via `useThemeTransition`.

```ts
const setTheme = useThemeTransition()
setTheme('dark') // 'light' | 'dark' | 'deuteranopia' | 'protanopia' | 'system'
```

---

## 2. Colour Tokens

All colours live in `src/globals.css` and are exposed to Tailwind via `@theme inline`. **Never hardcode hex values in JSX.**

| Token | Light | Dark | Usage |
|---|---|---|---|
| `bg-background` | `#FFF` | `#0C0A0F` | Page root, overlays |
| `bg-surface` | `#FFF` | `#18151C` | Cards, tables, panels, modals |
| `bg-surface-subtle` | `#F9FAFB` | `#131019` | Table header rows, modal footers, sidebar |
| `bg-muted` | `#F3F4F6` | `#18151C` | View-toggle pill, tag backgrounds |
| `text-foreground` | `#111827` | `#EDEDED` | All primary labels |
| `text-muted-foreground` | `#6B7280` | `#A1A1AA` | Secondary labels, `<th>`, placeholders |
| `border-border` | `#E5E7EB` | `rgba(167,139,250,.18)` | All borders and dividers |
| `bg-primary` / `text-primary` | `#7C3AED` | `#7C3AED` | Buttons, active states, avatar tint |
| `bg-primary/20` | tint | tint | Avatar bg, entity icon square bg, role badge |
| `hover:bg-primary/10` | tint | tint | Edit / navigate hover bg |
| `ring-primary/30` | ring | ring | Focus rings |

### Destructive — `rose-500` only

| Token | Usage |
|---|---|
| `text-rose-500` | Delete label / icon at rest |
| `bg-rose-500/10` | Delete button hover bg |
| `border-rose-500/30` | Delete button border (bordered variant) |

> ⚠️ Never use `text-red-*` or `bg-red-*`.

---

## 3. Typography

All sizes use **bracket literals** for auditability.

| Class | Context |
|---|---|
| `text-base sm:text-lg lg:text-xl font-bold` | Header bar page title |
| `text-[15px] font-semibold` | Card primary name |
| `text-[14px] font-medium` | Table row primary text |
| `text-[14px]` | Table row secondary text |
| `text-[13px]` | Card secondary line |
| `text-[11px] font-semibold uppercase tracking-wider` | `<th>` column headers |

---

## 4. Spacing & Radius

| Context | Value |
|---|---|
| Header bar (horizontal) | `px-3 sm:px-4 lg:px-6` |
| Table `<th>` / `<td>` | `px-6 py-4` |
| Card body | `p-5` |
| Modal header / footer | `px-5 py-4` |
| Grid wrapper | `p-6` |

| Class | When |
|---|---|
| `rounded-md` | Inputs, buttons, toggle pill, icon squares, context menus |
| `rounded-lg` | Cards |
| `rounded-xl` | Modals / dialogs |
| `rounded-full` | User avatar (circle) |

---

## 5. Layout

### Page shell
```tsx
<div className="h-full w-full flex flex-col">
  <HeaderComponent />              {/* owns border-b — never add another border-b wrapper */}
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {/* content */}
  </div>
</div>
```

### Header bar
```
h-16 lg:h-20 w-full flex items-center
px-3 sm:px-4 lg:px-6 gap-2 sm:gap-4
border-b border-border flex-shrink-0
```
Left: title (`flex-shrink-0`). Right: `flex-1 flex items-center justify-end gap-2 sm:gap-3` → search → view toggle → primary CTA.

### Table container
```
bg-surface border border-border rounded-lg overflow-hidden
```
The inner `<table>` has **no** extra border, shadow, or rounding.  
Header row: `bg-surface-subtle/80 border-b border-border/60`  
Body row: `hover:bg-surface-subtle/60 transition-colors border-b border-border/60 last:border-0`

### Card container
```
bg-surface border border-border rounded-lg
hover:border-primary/30 hover:shadow-sm transition-all duration-200
```
No gradient bar. No gradient avatar. No per-entity colour prop.

### Card grid
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4
```

---

## 6. Components

### ThemeCard — `src/components/shared/ThemeCard.tsx`
Used in the Appearance settings to display theme options. It accepts an `accentColor` prop to highlight the active state using the theme's own accent color.

```tsx
<ThemeCard
    value="deuteranopia"
    label="Deuteranopia"
    description="Red-green color blindness"
    icon={Eye}
    accentColor="#1D6FE8"
    isActive={currentTheme === 'deuteranopia'}
    onSelect={setTheme}
/>
```

### UserAvatar — `src/components/shared/UserAvatar.tsx`
```tsx
<UserAvatar name="Alice" />                           // circle md (w-10 h-10)
<UserAvatar name="Alice" size="sm" shape="rounded" /> // table row
<UserAvatar name="Alice" size="lg" />                 // card header
```
Always `bg-primary/20 text-primary`. Never a gradient.

### Entity icon square (groups, profiles — non-person entities)
```tsx
// Table row (sm)
<div className="h-9 w-9 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
  <Icon className="h-4 w-4 text-primary" />
</div>
// Card (md)
<div className="h-10 w-10 rounded-md bg-primary/20 flex items-center justify-center flex-shrink-0">
  <Icon className="h-5 w-5 text-primary" />
</div>
```

### View toggle
```tsx
<div className="hidden sm:flex items-center bg-muted rounded-md p-1">
  {[{ id: "table", Icon: List }, { id: "grid", Icon: LayoutGrid }].map(({ id, Icon }) => (
    <button key={id} onClick={() => setView(id)}
      className={`p-2 rounded-md transition-colors cursor-pointer ${
        view === id ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}>
      <Icon className="h-4 w-4" />
    </button>
  ))}
</div>
```
Icons: **`List`** (table) then **`LayoutGrid`** (grid) — always this order. Both from `lucide-react`.

### Buttons
```tsx
// Primary
<button className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors font-medium text-sm whitespace-nowrap cursor-pointer">

// Destructive bordered (page-level)
<button className="flex items-center gap-2 px-3 py-2 text-rose-500 border border-rose-500/30 rounded-md hover:bg-rose-500/10 transition-colors text-sm font-medium cursor-pointer">

// Icon action — navigate/edit
<button className="p-2 text-muted-foreground/70 hover:text-primary hover:bg-primary/10 rounded-md transition-all">

// Icon action — delete
<button className="p-2 text-muted-foreground/70 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
```

### Search input
```tsx
<div className="relative flex-1 max-w-xs lg:max-w-md">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70" />
  <input placeholder="Search…"
    className="w-full pl-10 pr-4 py-2 text-sm border border-border/60 rounded-md
               focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary
               bg-background text-foreground placeholder:text-muted-foreground/60" />
</div>
```

### Context menu
```
Trigger:  p-1.5 rounded-md hover:bg-muted text-muted-foreground/70 hover:text-foreground cursor-pointer
Panel:    absolute right-0 mt-1 w-36 bg-background rounded-md shadow-lg border border-border py-1 z-20
Item:     w-full px-3 py-2 text-sm text-foreground/90 hover:bg-surface-subtle flex items-center gap-2
Destruct: w-full px-3 py-2 text-sm text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer
```
Always pair with a `fixed inset-0 z-10` backdrop to close on outside click.

### ConfirmDeleteModal — `src/components/usergroups/ConfirmDeleteModal.tsx`
**Never use `window.confirm` / `window.alert`.** Pattern:
```tsx
const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
const [isDeleting, setIsDeleting] = useState(false);

{pendingDeleteId !== null && (
  <ConfirmDeleteModal
    groupName={items.find(i => i.id === pendingDeleteId)?.name ?? "this item"}
    isLoading={isDeleting}
    onConfirm={handleDeleteConfirm}
    onCancel={() => setPendingDeleteId(null)}
  />
)}
```
`groupName` accepts any entity name.

### Empty states — grids and tables use the same pattern
```tsx
if (items.length === 0) {
  return (
    <div className="py-12 text-center">
      <EntityIcon className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
      <p className="text-[14px] font-medium text-muted-foreground">No {entities} found</p>
      <p className="text-[13px] text-muted-foreground/70 mt-1">Create your first {entity} to get started</p>
    </div>
  );
}
```
No `bg-*` wrapper around the icon · `<p>` not `<h3>` · no trailing period · early-return guard (not nested ternary).

### Role / status badges
```tsx
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-primary/20 text-primary">
  <Shield size={12} /> Org Manager
</span>
<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-muted text-muted-foreground">
  User
</span>
```

---

## 7. What to Avoid

| ❌ Don't | ✅ Do |
|---|---|
| `window.confirm` / `window.alert` | `ConfirmDeleteModal` + `pendingDeleteId` state |
| Gradient top bar on cards | No decoration bar |
| Gradient avatar (`from-purple-400 to-purple-600`) | `UserAvatar` with `bg-primary/20` |
| Per-entity colour prop on cards | No colour system |
| `text-red-*` / `bg-red-*` | `text-rose-500` / `bg-rose-500/10` |
| `rounded-lg` on inputs / buttons | `rounded-md` |
| `rounded-2xl` on cards | `rounded-lg` |
| `border-2` on inner `<table>` | Outer container only |
| `bg-surface-subtle min-h-screen` on grid wrapper | Transparent, no bg |
| Extra `border-b` div wrapping the header | Header owns its own `border-b` |
| Nested ternaries in JSX render | Early-return guards |
| `Grid3x3` / `TableProperties` for view toggle | `List` / `LayoutGrid` |
| `min-h-screen` on components | `h-full` / `flex-1` |
| Hardcoded hex in JSX | CSS token via Tailwind class |
| Portuguese comments | English or no comments |

---

## 8. Adding a New Page

Steps: create route in `src/routes/` → register in `src/routeTree.gen.ts` (4 places) → add sidebar link in `src/components/sidebar.tsx` → follow page shell (§ 5).

### New component checklist
- [ ] `bg-background` / `bg-surface` on outer wrapper
- [ ] `text-foreground` / `text-muted-foreground` for text
- [ ] `border-border` on all borders
- [ ] `bg-primary` + `hover:bg-primary/90` for primary actions
- [ ] `rose-500` tokens for destructive only
- [ ] `focus:ring-primary/30` on all inputs
- [ ] No `window.confirm` — use `ConfirmDeleteModal`
- [ ] Empty states follow early-return pattern (§ 6)
- [ ] View toggle: `List` → `LayoutGrid`, table first
- [ ] No raw `purple-*` `gray-*` `slate-*` `red-*` classes
- [ ] Tested in light **and** dark mode

---

## 9. Key Files

| File | Purpose |
|---|---|
| `src/globals.css` | CSS custom properties, Tailwind `@theme` mapping, scrollbar, view-transition rules |
| `src/components/shared/UserAvatar.tsx` | Shared person avatar — use everywhere |
| `src/components/usergroups/ConfirmDeleteModal.tsx` | Generic delete confirmation — reuse for any entity |
| `src/lib/useThemeTransition.ts` | Animated theme switching (View Transition API) |
| `src/components/SettingsPanel.tsx` | Shared settings UI for all 3 persona settings routes |
| `src/components/sidebar.tsx` | Sidebar with per-persona nav groups |
| `src/routeTree.gen.ts` | Auto-generated route tree (manually maintained when dev server is off) |
