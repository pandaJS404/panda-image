# Project Agent Rules

## Required Ant Design Practices

- Prefer official Ant Design APIs and current recommended props over deprecated props.
- Prefer `ConfigProvider`, theme algorithms, global tokens, and component tokens for customization.
- Prefer Ant Design's built-in interaction, focus behavior, and motion. Do not manually take over internal geometry or animation unless absolutely necessary.
- Scope Ant Design overrides to local host classes in this project. Avoid broad global `.ant-*` overrides whenever possible.
- Prefer context-safe feedback APIs through `App` and hook-based usage patterns.

## Known Current Conventions

- Use `variant` instead of deprecated `bordered` on `Card`.
- Use `classNames.popup.root` instead of deprecated `popupClassName` on `Select`.
- For components like `Switch`, `Select`, `Dropdown`, `Popover`, and similar controls, keep official structure and motion intact and only apply minimal shell styling.

## Accessibility Conventions

- Do not add `aria-*` attributes in this project.
- When editing existing source files, remove `aria-*` attributes and any helper code that exists only to support them.

## Project Intent

- Ant Design is the interaction foundation.
- Project-specific styling should adapt the outer shell without breaking component semantics, motion, focus visibility, or layout stability.
