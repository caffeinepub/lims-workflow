# DKR LIMS

## Current State
The ApiDocs.tsx page exists with 7 tabs but the Pages & Routes tab and Backend API tab lack comprehensive field-level documentation. Fields descriptions, data types, validation rules, and functionality are missing for all pages.

## Requested Changes (Diff)

### Add
- Pages & Routes tab: complete field-by-field reference for all 12 pages (SampleIntake, EligibilityCheck, SampleRegistration, TestSpecification, Analysis, SICReview, QAReview, COA, Dashboard, AdminPanel, TestMasters, Calculator) — each field with: Field Name, Data Type, Required, Description, Validation, Functionality
- Backend API tab: full documentation for all 29 endpoints grouped by category — each with: method badge, Motoko signature, parameters table (name/type/required/description/example), response schema + JSON example, TypeScript snippet with copy button
- Data Models tab: all 13 interfaces with field-level descriptions and TypeScript definitions
- Workflow tab: state machine diagram with all transitions and conditions
- Overview tab: system summary, architecture, and quick stats

### Modify
- ApiDocs.tsx: full rebuild with richer content, better search, and collapsible sections per endpoint/page

### Remove
- Nothing removed

## Implementation Plan
1. Rebuild ApiDocs.tsx with all 7 tabs fully populated
2. Backend API tab: document all 29 endpoints with full parameter/response tables
3. Pages & Routes tab: document all 12 pages with every field (name, data type, required, description, validation, functionality)
4. Data Models tab: all 13 TypeScript interfaces with field descriptions
5. Workflow, UI Components, Integration Guide tabs: complete content
6. Search bar filters across all tabs
7. Copy-to-clipboard on all code blocks
