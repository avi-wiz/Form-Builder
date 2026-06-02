# WizCommerce Forms — Platform Testing Script

Major flows to walk through after the rebuild. Each flow has a quick **what to do** and  **what to verify** . Run `bun run dev` and open the app.

---

## FLOW 1 — Form list & lifecycle (Forms index)

 **Route** : `/forms`

1. Land on the forms list.  **Verify** : all 5 seeded forms render (Trade Show, Contact Us, RFQ, New Account App, Post-Purchase Feedback) with correct status badges (Published / Draft / Archived).
2. Click  **"+ New Form"** .  **Verify** : a new "Untitled Form" appears in Draft status and navigates into the builder.
3. From the kebab menu on any form:  **Clone** .  **Verify** : a "(Copy)" form appears in Draft, submission count = 0.
4. **Archive** a form.  **Verify** : status flips to Archived, badge changes.
5. **Delete** a form.  **Verify** : it disappears from the list.

---

## FLOW 2 — Form Builder: migration of legacy forms

 **Route** : `/forms/builder/f_trade_show`

1. Open the Trade Show form.  **Verify** : every existing field renders as a **full-width row** (one field per row). No data loss — all field labels, types, options, ratings preserved.
2. Repeat for `f_contact`, `f_rfq`, `f_account`, `f_feedback`.  **Verify** : each opens cleanly with rows.

---

## FLOW 3 — Building a form from scratch (the HubSpot-style flow)

 **Route** : `/forms/builder/<new form id>` (create a new form first)

1. **Empty state** : "Drag fields to start" placeholder visible on canvas.
2. **Left panel → Fields tab → Contact Information** : expand the accordion → drag **Email** to canvas.  **Verify** : appears as full-width row.
3. Drag **First Name** to the **left** of Email → vertical blue drop indicator → drop.  **Verify** : row becomes 50/50.
4. Drag **Last Name** into the same row.  **Verify** : row becomes 33/33/33.
5. Drag a 4th field into that row.  **Verify** : drop is rejected (3-field cap).
6. Click **"+ Add Section"** (bottom of left panel) → name it "Company Details".  **Verify** : new section header appears below the first row.
7. Drag **Company Name** into Company Details.  **Verify** : lands in the new section.
8. **Other tab** → drag **Rich Text** above Company Details.  **Verify** : rich-text row appears; select it → right panel shows HTML textarea.
9. **Other tab** → drag **Divider** between two fields.  **Verify** : horizontal line renders.
10. **Other tab** → click **Consent Block** template.  **Verify** : pre-styled "I agree…" block inserted.

---

## FLOW 4 — Properties tab: create a custom CRM property

 **Route** : builder, left panel → **Properties** tab

1. Click **+ Create Property** → label "Booth Number", objectType  **Custom** , group  **Trade Show** , field type  **Text** . Click Create.
2. **Verify** : new property appears under Trade Show in the Available fields list (Fields tab).
3. Drag it to the canvas.  **Verify** : lands as a row; right panel shows Property Link = "Booth Number".
4. Try to drag the same property again from the Available fields list.  **Verify** : shows grayed out with checkmark + "In use" label (no duplicates).

---

## FLOW 5 — Kai AI suggestion banner

 **Setup** : build a form with Email + Company Name but **no** Industry.

1. **Verify** : purple Kai banner shows above Available fields: "Consider adding Industry, Company Size, Annual Revenue."
2. Click a suggestion chip.  **Verify** : property is added to canvas as a new row.
3. Remove Email from the form.  **Verify** : Kai banner disappears (suggestion gated on Email + Company Name presence).

---

## FLOW 6 — Field configuration (right panel)

 **Setup** : any form with at least one field.

1. Click a field on the canvas.  **Verify** : right panel shows Field Settings (open by default).
2. Edit  **Display Label** .  **Verify** : live updates on canvas.
3. Toggle  **Required** .  **Verify** : red `*` appears on field label in canvas.
4. Toggle  **Hidden** .  **Verify** : field gets eye-slash indicator.
5. **Appearance** section → change **Width** to Half.  **Verify** : row siblings re-balance.
6. **Validation** section → set Min/Max length on a text field.
7. **Options** section (on a Select field) → add/reorder/delete options; toggle  **Allow Other** .  **Verify** : "Other: ___" sub-row renders on field card preview.
8. **Logic** section → add a **Visibility Condition** (e.g., "show only if Email contains @").  **Verify** : purple "Conditions" badge appears on the field.
9. **Conditional Validation** → add a "Required when" rule.  **Verify** : "Req Logic" badge appears.

---

## FLOW 7 — Form-level Submission settings (CRM)

 **Setup** : builder, click empty canvas area → right panel shows form-level tabs.

1. **Submission tab** → set CRM action =  **Create Lead** .  **Verify** : field-mapping table renders.
2. Map a form field → CRM property.  **Verify** : persists on switch-away/back.
3. Set duplicate handling =  **Update existing record** .  **Verify** : amber warning note appears.
4. Switch to  **Create Support Ticket** .  **Verify** : Subject/Description/Priority/Type field map renders; blue **Claims module** note shown.
5. Expand **Contact Matching** collapsible → toggle match-by Email/Company/Phone; choose "When match found" = Link and update.  **Verify** : Kai duplicate-detection note visible.
6. Switch CRM action back to None.  **Verify** : field-mapping table disappears.

---

## FLOW 8 — Form-level Automation settings

**Submission settings → Automation tab.**

1. Toggle **Send follow-up email** → pick a template.
2. Toggle **Notify team** → select user(s).
3. Toggle **Notify assigned Sales Rep** (independent).  **Verify** : note about assigned rep email appears when ON.
4. Toggle **Create task** → set title (with `{{field}}` interpolation), assignee, due-date offset, priority.
5. **Verify** : each toggle is independent — turning off "Notify team" does NOT turn off "Notify assigned Sales Rep".

---

## FLOW 9 — Style & Governance settings

 **Style tab** :

1. Change Primary Color, Button Color, Font, Field/Button Radius, Submit Text.  **Verify** : changes reflect in canvas preview (submit button + field outlines) in real time.

 **Settings tab** :
2. Toggle  **Multi-step** .  **Verify** : each section becomes a step at preview time (FLOW 11).
3. Toggle **CAPTCHA** → switch v3/v2.
4. Toggle each role's CRUD permissions (Admin / Sales Manager / Sales Rep).
5. Toggle **GDPR consent** → edit consent text.

---

## FLOW 10 — Drag-and-drop edge cases

1. Reorder rows by dragging a row's drag handle.  **Verify** : rows reorder smoothly.
2. Reorder fields within a row (drag one slot past another).  **Verify** : order swaps.
3. Move a field between sections via drag.  **Verify** : lands in the new section as a new full-width row.
4. Drag a section header to reorder sections.  **Verify** : all rows inside move with it. *(Agent flagged this may feel rough — confirm.)*
5. Auto-scroll: drag a field near the top/bottom edge of the canvas.  **Verify** : canvas auto-scrolls.

---

## FLOW 11 — Form Preview (submitter's view)

 **Route** : `/forms/preview/<formId>`

1. Open preview of a form with multi-field rows.  **Verify** : side-by-side rendering matches builder canvas layout (50/50 or 33/33/33).
2. Rich Text rows render as formatted HTML; Dividers as `<hr>`; Headings as h2/h3; Images render.
3. Required fields show `*` and block submit when empty.
4. Visibility Conditions: change a triggering field's value.  **Verify** : dependent fields show/hide live.
5. Allow Other on a Select: pick "Other".  **Verify** : free-text input appears.
6. With Multi-step ON:  **Verify** : Next/Back buttons traverse sections as steps.
7. Submit the form.  **Verify** : After-Submit message shows.

---

## FLOW 12 — Submissions inbox

 **Route** : `/forms/submissions` (or per-form view)

1. **Verify** : 5 seeded submissions (S_1001 → S_1005) render with correct form names, statuses, and associated customer codes.
2. Click a submission → detail view shows all submitted values + associated record.
3. Change status (new → reviewed → actioned).  **Verify** : badge updates.
4. After submitting a form via FLOW 11, **verify** the new submission appears at the top with status "new" and the form's submission count increments by 1.

---

## FLOW 13 — Workflow Manager

 **Route** : `/settings/workflow-manager/w_1`

1. Open the seeded "Trade Show Lead Routing" workflow.  **Verify** : all 7 nodes render with correct positions and edges (entry → condition → true branch / false branch).
2. Click the  **entry node** .  **Verify** : shows Forms/`f_trade_show` config in right panel.
3. Click the **condition node** (n2).  **Verify** : shows real Field/Operator/Value config panel (W-08) with pre-seeded "Lead Source equals Trade Show".
4. Click the **Assign Rep** node (n3).  **Verify** : shows Assignment Mode dropdown (round-robin / territory / fixed) with sub-dropdowns (W-07).
5. Edit a config value.  **Verify** : persists when clicking away and back.

---

## FLOW 14 — Customer Form (existing prototype flow)

 **Route** : `/customers/<id>/form` or wherever the existing Customer Form lives

1. Open a customer form.  **Verify** : Quick Add green pills still control which fields appear in Quick Add mode.
2. Toggle a section's **Quick Add** green pill OFF.  **Verify** : in Quick Add mode, that section's fields are hidden.
3. Toggle a section's **Show** green pill OFF.  **Verify** : section disappears entirely.

---

## FLOW 15 — Build & deployment health (sanity)

1. `bun run build` — completes cleanly.
2. `bun run preview` — local production build serves without 500s.
3. `vercel --prod --scope avi-wizs-projects` — deploy succeeds; live URL returns SSR-rendered HTML (curl test). *(Stable since last session's fix.)*
