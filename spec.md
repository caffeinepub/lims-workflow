# LIMS Workflow

## Current State
Section In-Charge Review (`SICReview.tsx`) and QA Review (`QAReview.tsx`) pages exist but use a minimal card-based layout: plain results table, signature input, return reason textarea, and action buttons. They do not match the reference design from coa_page.PNG.

## Requested Changes (Diff)

### Add
- Full-page two-column layout for both SICReview and QAReview:
  - Left column (main): White "Document Preview" panel containing a rendered COA certificate exactly matching coa_page.PNG — Certificate of Analysis header with blue title, ISO 9001:2015 CERTIFIED badge, document ID (COA-2024-8842-V1.2), Global Pharma Labs Inc. address block, product metadata grid (Product Name, Sample Type, Batch Number, Manufacturing Date, Expiry Date, Sample Date), Analytical Test Results table (Test Parameter / Specification / Result / Method / Status columns with PASS badges), Reviewer Remarks block (italic text), dual signature area (cursive left = Section InCharge signed + dotted-underline right = "Waiting for QA Approval" placeholder on SICReview / both signed on QAReview), compliance footer line and "Page 1 of 1"
  - Right column (sidebar): Pending Review badge + Due in X hrs, QA/SIC Approval Block (card with comments textarea + Reject COA / Approve buttons), COA Document Lineage accordion (v1.2 active with bullet changes + v1.1 superseded), Stakeholder Log (3 users: Rajesh Malhotra Analyst Verified, Amit Singh Section Head Verified, Sarah Chen QA Head Awaiting/Verified), Related Batch Documents link, Raw Test Data Log link
- Compliance Verification banner at page bottom (blue shield icon, text about automated cross-validation, "View Complete Chain of Custody" link)
- Page header: breadcrumb (Dashboard / COA Review), "Final COA Management" title, Print Draft + Share Securely + Download PDF (v1.2) buttons, document ID pill, status/due badge

### Modify
- SICReview.tsx — replace current layout with the new two-column COA preview + sidebar layout; Section InCharge approves or rejects COA via sidebar block; approval advances to QAReview, rejection returns to Analysis
- QAReview.tsx — same layout but Sarah Chen is the active reviewer; on approve, Sarah Chen signature fills in the right signature slot and her Stakeholder Log entry flips from "Awaiting" to "Verified"; on reject, returns to SICReview
- Approval comments field is required before rejecting; approval requires comments to be recorded in audit log

### Remove
- Old plain card layout, standalone signature input card, separate return-reason card in both pages

## Implementation Plan
1. Rewrite SICReview.tsx with full two-column layout: left COA certificate preview (static/read-only data from mockData), right sidebar with approval block + lineage + stakeholder log + links + compliance banner
2. Rewrite QAReview.tsx with same layout; QA Head active reviewer; signature slot updates on approve
3. Keep all existing workflow logic (status transitions, AUDIT_LOG push, toast, navigate) intact
4. Apply deterministic data-ocid markers to all interactive surfaces
