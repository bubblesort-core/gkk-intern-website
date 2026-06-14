# Branding & Contact Information Updates Plan

## Objective
Standardize the branding hierarchy and contact information across all Gkk-hire front-end applications to accurately reflect the Bubblesort group structure and correctly route study vs. business inquiries.

## Background & Motivation
The platform needs to clearly reflect its organizational structure to end-users and ensure that inquiries reach the correct mailboxes.
- **Parent Company**: Bubblesort
- **Sub Main Company**: GKK (Global Kompass Krew)
- **Sub Company**: GKK Intern
- **Study Enquiries**: `noreplay.gkk26@gmail.com`
- **Business/Project Enquiries**: `hello@bubblesort.in`

As agreed, the branding will be explicitly stated as: **"GKK Interns - A GKK (Global Kompass Krew) venture, under Bubblesort."** and contact emails will be displayed **side-by-side with clear labels**.

## Scope & Key Files
- **GKK-HIRE-MAIN**:
  - `src/components/Footer.tsx`
  - `src/components/ContactSection.tsx`
  - `src/components/ClientsPage.tsx`
  - `index.html` & `clients.html` (Titles & Meta)
- **Dashboard**:
  - `src/components/Footer.jsx`
  - `index.html` & `index.html.bak` (Titles)
- **community-chat**:
  - `index.html` (Titles)
- **gkk-bento-form**:
  - `index.html` (Titles)

## Implementation Steps

### 1. Footer Updates
**Affected Files:** `GKK-HIRE-MAIN/src/components/Footer.tsx`, `Dashboard/src/components/Footer.jsx`
- Replace existing venture text (e.g., "A venture of Bubblesort") with the explicit hierarchy: `"GKK Interns - A GKK (Global Kompass Krew) venture, under Bubblesort."`
- In the "Contact" column of the footers, update the display to show both emails.
  - Study Enquiry: `noreplay.gkk26@gmail.com`
  - Business Enquiry: `hello@bubblesort.in`

### 2. Contact & Clients Pages Updates
**Affected Files:** `GKK-HIRE-MAIN/src/components/ContactSection.tsx`, `GKK-HIRE-MAIN/src/components/ClientsPage.tsx`
- Refactor the "Direct Inquiry" and "Contact Us" sections.
- Display the two email addresses side-by-side using Flexbox/CSS Grid to ensure clarity.
- Ensure the `mailto:` links are updated to their respective addresses.

### 3. HTML Titles & Subtitles
**Affected Files:** All `index.html` files across the 4 frontend apps, plus `clients.html`.
- Standardize the document titles to reflect the brand, e.g., `<title>GKK Interns - Code. Build. Deploy. | A GKK & Bubblesort Venture</title>` or append the hierarchy text where appropriate.

## Verification & Testing
1. Execute a local build for the affected React applications to ensure no syntax errors.
2. Visually inspect the footers and contact sections to verify the side-by-side layout is responsive on both desktop and mobile views.
3. Hover and click the `mailto:` links to confirm correct routing.
4. Verify the browser tab titles have updated successfully.