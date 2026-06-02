# Add Portfolio Template Prompt

Use this prompt in a future Codex session when you want to add a new portfolio template to this project.

---

## Prompt

I need you to add **one new structural portfolio template** to this project.

Important requirements:

1. Do **not** add a template that is only a CSS variation of an existing layout.
2. The new template must feel like a **different portfolio product**, with its own page structure and section flow.
3. Follow the current architecture already used for:
   - `atlas`
   - `cinema`
   - `ledger`
   - `exhibit`
   - `mosaic`
   - `panorama`
4. The template must work on both desktop and mobile.
5. Keep the current rule that **hero controls only apply to `editorial`**. Structural templates should use their own built-in layout logic.
6. Update the **Theme Factory presets** if needed so there is at least one good preset that matches the new template.
7. If old saved template values need normalization, update the parser safely.

### Files you will likely need to touch

- `client/src/pages/PortfolioHome.jsx`
- `client/src/styles/index.css`
- `client/src/pages/admin/SettingsPage.jsx`
- `client/src/lib/portfolioTheme.js`

### Current architecture notes

- `PortfolioHome.jsx` contains the main branching logic for structural templates.
- `editorial` uses the shared default hero/section system.
- Structural templates have their own dedicated render functions, for example:
  - `AtlasPortfolio(...)`
  - `CinemaPortfolio(...)`
  - `LedgerPortfolio(...)`
  - `ExhibitPortfolio(...)`
  - `MosaicPortfolio(...)`
  - `PanoramaPortfolio(...)`
- `SettingsPage.jsx` contains:
  - `portfolioTemplates`
  - `themePresets`
  - the UI logic that disables hero controls when the selected template is not `editorial`
- `portfolioTheme.js` contains the supported template list and alias normalization for old template values.

### Implementation rules

1. Add the new template to the admin selector in `SettingsPage.jsx`.
2. Add a new structural branch in `PortfolioHome.jsx`:
   - `if (settings.portfolioTemplate === 'your-template-key') { ... }`
   - create a dedicated render function for it
3. Add dedicated CSS in `index.css` for the new template:
   - use a unique layout system
   - avoid making it feel like a minor variant of another template
4. Add mobile responsive rules for that template.
5. If needed, add one or more theme presets mapped to the new template.
6. If needed, update `supportedPortfolioTemplates` in `portfolioTheme.js`.
7. If needed, update alias normalization so removed legacy template values map safely.
8. Run `npm run build` after implementation.

### Design bar

The new template must be **visibly and structurally different** from the others.

Good examples of “different”:

- wall / gallery / collage composition
- dossier / report / archive composition
- cinematic / showreel composition
- panoramic storytelling composition
- exhibit / installation composition
- modular board / asymmetric canvas composition

Bad examples of “different”:

- same section flow with only different borders
- same hero layout with new shadows
- same cards with different radius
- same grid with different typography only

### Deliverables

When done:

1. Briefly explain what kind of template was added.
2. Mention which files were updated.
3. Confirm `npm run build` passed.
4. Mention any bundle-size warning if it still appears.

### Optional next step

If the bundle keeps growing, consider splitting structural templates with lazy loading before adding many more.

---

## Short Version

Add **one new structural portfolio template** to this project. It must be a genuinely different portfolio layout, not just CSS changes. Update:

- `PortfolioHome.jsx`
- `index.css`
- `SettingsPage.jsx`
- `portfolioTheme.js` if needed

Keep hero controls exclusive to `editorial`. Add responsive behavior. Update presets if useful. Run `npm run build` at the end.
