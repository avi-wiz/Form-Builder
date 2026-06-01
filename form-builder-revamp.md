Completely rebuild the Form Builder screen (`/forms/builder/:formId`) with a new 3-panel layout that works like HubSpot's form editor. The core concept: the LEFT panel is a searchable PROPERTY LIBRARY organized by property groups. You DRAG fields from the left panel onto the CENTER canvas. The RIGHT panel shows configuration for whatever you've selected. Here's the exact spec:

---

### LEFT PANEL — Property Library & Elements (280px width, light gray background `<span class="inline-block w-3 h-3 border-[0.5px] border-border-200 rounded-[4px] flex-shrink-0 shadow-sm mr-1 align-middle"></span>#F9FAFB`, scrollable)

**Top area: Three tabs as segmented control buttons**

Tab 1: **"Fields"** (default active)
Tab 2: **"Properties"**

Tab 3: **"Other"**

**When "Fields" tab is active:**

Show a search bar at the top: "Search existing fields..." with a magnifying glass icon. Below the search bar, show two sub-sections:

**Sub-section 1: "Fields in this form" (collapsible, open by default)**

* Lists every field currently on the canvas, in order
* Each item shows: drag handle (⠿), field icon (based on type), field label, and a small type badge (e.g., "Text", "Email", "Select")
* Clicking a field here scrolls the canvas to that field and selects it (opening the right panel config)
* Dragging a field here reorders it on the canvas

**Sub-section 2: "Available fields" (collapsible, open by default)**

* Lists all CRM properties NOT currently on the canvas, grouped by Property Group
* Property Groups render as collapsible accordions with the group name as header:
  * **Contact Information** — First Name, Last Name, Email, Phone, Job Title, LinkedIn URL
  * **Company Information** — Company Name, Display Name, Industry, Company Size, Website, Annual Revenue
  * **Address** — Street Address, City, State/Province, Zip Code, Country
  * **Deal Information** — Deal Name, Deal Value, Close Date, Pipeline Stage
  * **Trade Show** — Booth Number, Show Name, Interest Area, Follow-Up Preference
  * **Custom Properties** — any user-created properties show here
* Each property shows: drag handle (⠿), field icon, property label, and object type badge ("Contact" in blue, "Company" in purple, "Deal" in orange)
* Properties with a green dot (●) are marked as commonly used
* **Dragging a property from here onto the canvas adds it as a field** — this is the primary way to build the form
* If a property is already on the canvas, it shows grayed out with a checkmark and "In use" label — it cannot be dragged again (no duplicates)

**When "Properties" tab is active:**

Show the same property groups as above, but with an additional action: a **"+ Create Property"** button at the top. Clicking it opens an inline form at the top of the panel (not a modal) with:

* Property label (text input)
* Object type (dropdown: Contact, Company, Deal, Custom)
* Property group (dropdown listing all groups)
* Field type (chip selector matching existing pattern: Text, Number, Select, Multi select, Email, Phone, Date, Checkbox, Currency, File, URL, Long text, Percentage, HTML)
* For Select/Multi select: inline option builder (Label + Value pairs, just like the existing WizCommerce Add Field panel)
* "Create" button — creates the property AND immediately adds it to the "Available fields" list so it can be dragged onto the canvas

This means the admin NEVER leaves the form builder to create new CRM properties. Match HubSpot exactly on this.

**When "Other" tab is active:**

Show draggable non-field elements:

* **Rich Text Block** — drag onto canvas to add a heading, paragraph, or instructions between fields. When placed on the canvas, it renders as an editable text block with a simple rich text toolbar (Bold, Italic, Heading 1/2/3, Link, Unordered List)
* **Divider Line** — drag onto canvas to add a horizontal separator between field groups
* **Image** — drag onto canvas to add an image (URL input for the image source)
* **Heading** — drag onto canvas to add a section heading (simpler than Rich Text — just a styled H2/H3)

These elements create visual sections and structure within the form WITHOUT using the formal "Section" concept. This matches how HubSpot uses Rich Text blocks as section dividers within forms.

**Bottom of left panel (always visible, pinned):**

A "+" button with label **"Add Section"** — creates a named section divider on the canvas (this is the WizCommerce-specific section system with Quick Add / Show toggles, preserving the existing Customer Form pattern)

---

### CENTER PANEL — Form Canvas (flex width, white background, scrollable)

**Top bar (sticky at top):**

* Form name (click to edit inline, shows pencil icon on hover)
* Status badge: "Draft" (yellow) or "Published" (green)
* "Undo" and "Redo" buttons (circular arrows)
* "Preview" button (outlined, with eye icon)
* "Publish" button (green filled) or "Update" if already published
* A "..." kebab menu with: Clone, Export JSON, View Submissions, Delete

**Canvas area:**

The canvas is a visual representation of the form as it will appear to the person filling it out. It supports:

**Row-based layout with side-by-side fields:**

* Each row can contain 1, 2, or 3 fields side-by-side (matching HubSpot's max of 3 per row)
* When you drag a field onto the canvas, drop zones appear:
  * **Between rows** : a horizontal blue line indicator with "Drop here to add a new row" — the field occupies the full width of that new row
  * **Next to an existing field** : a vertical blue line indicator on the left or right side of an existing field — the field is placed side-by-side, and both fields auto-resize to share the row width equally (50/50 for 2 fields, 33/33/33 for 3 fields)
  * **Inside an empty section** : "Drop fields here" placeholder text in the section body
* Fields on the canvas show:
  * The field label (bold) with required indicator (*) if mandatory
  * A preview of the field type (text input outline, dropdown outline, checkbox, etc.) — rendered as a light gray placeholder, not a real interactive input
  * A small type badge in the top-right corner (e.g., "📧 Email", "📋 Select", "📞 Phone")
  * On hover: a blue border outline, and a floating toolbar appears above the field with: **Drag handle** (⠿), **Width control** (toggle between 100%, 50%, 33%), **Duplicate** (copy icon), **Delete** (trash icon)
  * On click: the field gets a solid blue border (selected state), and the RIGHT panel shows this field's configuration

**Section headers on the canvas:**

* Sections created via "Add Section" render as full-width bars with:
  * Section name (editable on click)
  * Collapse/expand chevron
  * Quick Add toggle (green pill, labeled "Quick Add")
  * Show toggle (green pill, labeled "Show")
  * A drag handle on the far left to reorder the section (moves all fields within it)
  * "..." menu with: Rename, Delete Section (moves fields to previous section), Delete Section and Fields
* Sections visually group the fields below them — they act like chapter headers
* Fields between two section headers belong to the upper section

**Rich Text blocks on the canvas:**

* Rich Text elements render as editable text areas. Click to activate the inline rich text editor (Bold, Italic, H1/H2/H3, Link, List)
* They span the full width of the canvas and visually separate groups of fields

**Drag-and-drop behavior:**

* Use `@dnd-kit/core` with sortable context
* When dragging, the item being dragged shows a semi-transparent ghost preview attached to the cursor
* Drop zones light up with a blue highlight as the cursor hovers over them
* The canvas scrolls automatically when dragging near the top or bottom edge
* Animation: fields slide smoothly into their new position (200ms ease-out) when dropped

**Empty state (new form):**

* Center of the canvas shows: a dashed border rectangle with "Drag fields from the left panel to start building your form" and a downward arrow icon
* Below that: "Or start from a template →" link (opens template selector)

---

### RIGHT PANEL — Configuration (320px width, white background, scrollable, with tabs)

The right panel is context-sensitive — it shows different content based on what's selected on the canvas.

**When a FIELD is selected on the canvas:**

Show the field configuration with these sections (all collapsible):

**Section 1: "Field Settings" (open by default)**

* Display Label: text input (what the submitter sees)
* Internal Name: read-only, gray, shows the CRM property name or UUID
* Property Link: shows which CRM property this field maps to, with a "Change" link
* Field Type: shows current type as a badge; click to change (opens type chip selector — same grid as existing WizCommerce pattern: Text, Percentage, Long text, Select, Multi select, URL, HTML, Email, Number, Phone_e164, Checkbox, Date, File, Currency, Hidden, Radio Button, Rating, Consent Checkbox)
* Required: toggle (when ON, adds * to label on canvas)
* Hidden: toggle (when ON, field disappears from canvas preview but stays in the field list in the left panel with an eye-slash icon)
* Include in Quick Add: toggle (WizCommerce-specific — controls trade show quick mode)

**Section 2: "Appearance" (collapsed by default)**

* Placeholder text: text input
* Help text: text input (renders below the field on the form)
* Width: segmented control — Full (100%), Half (50%), Third (33%)
* Field description: small text shown only in the builder (not visible to submitter) — for admin notes

**Section 3: "Validation" (collapsed by default)**

* For text: Min length, Max length, Regex pattern (with test button)
* For number/currency: Min value, Max value
* For email: auto-validated (no config needed, just a note: "Email format validation is automatic")
* For file: Allowed file types (checkboxes: Image, PDF, Document, Any), Max file size (dropdown: 5MB, 10MB, 25MB)

**Section 4: "Options" (only visible for Select, Multi select, Radio Button)**

* Option list with: drag handle (⠿), Label, Value, Edit (pencil), Delete (X)
* "Add option" input at the bottom (Label + Value)
* "Sort A-Z" button
* Default value: dropdown selecting one option as default
* "Allow 'Other' with text field": toggle — when ON, adds a free-text "Other" option

**Section 5: "Logic" (collapsed by default)**

* Title: "Visibility Conditions"
* "Add condition" button → creates a condition row:
  * [Field dropdown — lists all other fields on the form] [Operator: equals, not equals, contains, is blank, is not blank, greater than, less than] [Value input]
* AND/OR toggle between multiple conditions
* "Conditional Validation" sub-section (Beyond HubSpot):
  * "Make this field required only when:" → same condition builder
  * This allows rules like "Tax ID required only if Country = United States"
* Purple "Conditions" badge appears on the field in the canvas when conditions are set

**When a SECTION HEADER is selected:**

* Section Name: editable text input
* Quick Add: toggle
* Show: toggle
* Description: optional text (shown as subtitle below section name on the form)
* "Delete Section" button (with "Keep fields" / "Delete fields" option)

**When a RICH TEXT BLOCK is selected:**

* Full rich text editor (Bold, Italic, H1/H2/H3, Link, Unordered list, Ordered list)
* Font size: dropdown
* Text color: color picker
* "Delete" button

**When NOTHING is selected (click empty area of canvas):**

Show form-level settings in the right panel with tabs:

**Tab: "Submission"**

* On Submit behavior: dropdown — Do nothing, Create Lead, Create Deal, Create Lead + Deal, Create Support Ticket
* Field mapping UI (when Create Lead/Deal selected): form fields → CRM property dropdowns
* Set Lead Status: dropdown
* Set Deal Stage: dropdown
* Contact Matching: match by Email (default ON), Company Name, Phone Number — with "When match found:" dropdown (Link submission, Link and update, Ignore match)
* Backward-protection note: "Status will not be moved backward if already at a later stage"

**Tab: "Automation"**

* Send follow-up email: toggle → template selector
* Notify team: toggle → user/role multi-picker
* Notify assigned Sales Rep: toggle
* Create task: toggle → Title template, Assign To, Due Date offset, Priority
* "Open in Workflow Manager →" link

**Tab: "Style"**

* Primary Color: color picker
* Button Color: color picker
* Font Family: dropdown (Inter, Roboto, Open Sans, System)
* Field Border Radius: slider (0–16px)
* Button Border Radius: slider (0–16px)
* Submit Button Text: text input
* Form Width: dropdown (Small 480px, Medium 640px, Large 100%)
* Background: transparent / white / light gray
* Live preview updates in real-time on the canvas

**Tab: "Settings"**

* Form Name and Description
* Status: Draft / Published / Archived
* Multi-step toggle: when ON, each Section becomes a step in a wizard
* CAPTCHA: toggle with v3/v2 radio
* Permissions: role checkboxes with CRUD toggles
* Consent & Privacy: GDPR footer toggle

---

### WHAT MAKES THIS BETTER THAN HUBSPOT

Include these 6 features that HubSpot's builder does NOT have:

1. **Quick Add / Trade Show toggle per section and per field** — the green toggles that control which fields appear in the streamlined Quick Add mode. HubSpot has nothing like this. Show these toggles prominently on section headers AND in the field config panel.
2. **Kai AI property suggestion** — In the left panel, above the "Available fields" list, show a subtle purple banner: "✨ Kai suggests: Based on your form type, consider adding [Industry], [Company Size], and [Annual Revenue]." The suggestions are clickable — clicking one auto-adds it to the canvas. This is a smart, contextual recommendation engine that HubSpot doesn't have.
3. **Conditional VALIDATION (not just visibility)** — In the Logic section of the field config, add "Conditional Validation" which lets admins make a field required/optional based on another field's value. HubSpot only supports conditional show/hide, not conditional required.
4. **"Allow Other with text field"** on Select/Radio fields — when toggled ON, the form renders an extra "Other: ________" option at the bottom of the list. HubSpot doesn't have this natively.
5. **Rich Text blocks between fields** — HubSpot has this, but WizCommerce's version should also support: image embedding, and a "Consent block" pre-styled element with privacy policy link and checkbox. Make the Rich Text block a first-class layout citizen, not an afterthought.
6. **Width control per field (100% / 50% / 33%)** — HubSpot supports side-by-side fields but doesn't give explicit width percentage controls. WizCommerce's builder shows a segmented control on each field's hover toolbar AND in the right panel's Appearance section, making layout control more deliberate and precise.

---

### INTERACTION FLOW SUMMARY (for Lovable's AI to understand the full UX)

**Building a form from scratch:**

1. Admin opens new form → sees empty canvas with "Drag fields to start" placeholder
2. Admin clicks the "Fields" tab in the left panel → sees property groups
3. Admin expands "Contact Information" group → sees First Name, Last Name, Email, etc.
4. Admin drags "Email" onto the canvas → field appears as a full-width row with label + type preview
5. Admin drags "First Name" next to "Email" → blue vertical drop indicator appears → drops → now First Name (50%) and Email (50%) share a row
6. Admin drags "Last Name" next to "First Name" → three fields share the row (33% each)
7. Admin clicks "Add Section" at the bottom of the left panel → types "Company Details" → section header appears on canvas below the first row
8. Admin expands "Company Information" in the left panel → drags "Company Name" into the Company Details section
9. Admin clicks the "Other" tab → drags a "Rich Text Block" above the Company Details section → types "Tell us about your company" as a heading
10. Admin clicks "Properties" tab → clicks "+ Create Property" → creates "Trade Show Booth" (Text, Trade Show group) → new property appears in "Available fields" → drags it onto canvas
11. Admin clicks a field on canvas → right panel shows field config → sets it as Required, adds Help text
12. Admin clicks empty canvas area → right panel shows form-level settings → configures On Submit to Create Lead
13. Admin clicks "Preview" → sees the form as a buyer would see it
14. Admin clicks "Publish" → form goes live

**This is the complete interaction model. Build it exactly as described.**
