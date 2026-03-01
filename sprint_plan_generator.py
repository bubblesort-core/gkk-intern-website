# GKK Interns — 3 Month Sprint Plan PDF Generator
# Generates a professional, beautifully organized PDF sprint plan

from fpdf import FPDF
import os

class SprintPDF(FPDF):
    # Colors
    NAVY = (15, 23, 42)
    DARK = (30, 41, 59)
    ACCENT = (59, 130, 246)
    GREEN = (34, 197, 94)
    ORANGE = (249, 115, 22)
    RED = (239, 68, 68)
    WHITE = (255, 255, 255)
    LIGHT_GRAY = (241, 245, 249)
    MUTED = (148, 163, 184)

    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(*self.MUTED)
            self.cell(0, 8, 'GKK Interns | 3-Month Sprint Plan | Batch 3', 0, 0, 'L')
            self.cell(0, 8, f'Page {self.page_no()}', 0, 1, 'R')
            self.ln(2)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(*self.MUTED)
        self.cell(0, 10, 'Confidential — GKK Interns Management', 0, 0, 'C')

    def colored_section(self, title, color):
        self.set_fill_color(*color)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 14)
        self.cell(0, 12, f'  {title}', 0, 1, 'L', fill=True)
        self.set_text_color(*self.NAVY)
        self.ln(3)

    def sub_heading(self, text):
        self.set_font('Helvetica', 'B', 11)
        self.set_text_color(*self.ACCENT)
        self.cell(0, 8, text, 0, 1, 'L')
        self.set_text_color(*self.NAVY)

    def body_text(self, text):
        self.set_font('Helvetica', '', 9)
        self.set_text_color(*self.DARK)
        self.multi_cell(0, 5, text)
        self.ln(1)

    def table_header(self, cols, widths):
        self.set_fill_color(*self.NAVY)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 8)
        for i, col in enumerate(cols):
            self.cell(widths[i], 7, col, 0, 0, 'C', fill=True)
        self.ln()
        self.set_text_color(*self.NAVY)

    def table_row(self, cols, widths, highlight=False):
        if highlight:
            self.set_fill_color(*self.LIGHT_GRAY)
        self.set_font('Helvetica', '', 8)
        max_h = 6
        for i, col in enumerate(cols):
            self.cell(widths[i], max_h, col, 0, 0, 'L', fill=highlight)
        self.ln()

    def status_badge(self, text, color):
        self.set_fill_color(*color)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 7)
        w = self.get_string_width(text) + 6
        self.cell(w, 5, text, 0, 0, 'C', fill=True)
        self.set_text_color(*self.NAVY)

    def divider(self):
        self.set_draw_color(*self.LIGHT_GRAY)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)


def generate_pdf():
    pdf = SprintPDF()
    pdf.set_auto_page_break(auto=True, margin=20)

    # ==================== COVER PAGE ====================
    pdf.add_page()
    pdf.ln(40)
    pdf.set_font('Helvetica', 'B', 36)
    pdf.set_text_color(*SprintPDF.NAVY)
    pdf.cell(0, 15, 'GKK INTERNS', 0, 1, 'C')
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(*SprintPDF.ACCENT)
    pdf.cell(0, 10, '3-MONTH SPRINT PLAN', 0, 1, 'C')
    pdf.ln(5)
    pdf.set_draw_color(*SprintPDF.ACCENT)
    pdf.set_line_width(0.8)
    pdf.line(60, pdf.get_y(), 150, pdf.get_y())
    pdf.ln(10)
    pdf.set_font('Helvetica', 'B', 18)
    pdf.set_text_color(*SprintPDF.NAVY)
    pdf.cell(0, 10, 'BATCH 3', 0, 1, 'C')
    pdf.set_font('Helvetica', '', 12)
    pdf.set_text_color(*SprintPDF.DARK)
    pdf.cell(0, 8, 'March 2 - May 31, 2026', 0, 1, 'C')
    pdf.ln(10)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(*SprintPDF.MUTED)
    pdf.cell(0, 6, 'Registration: March 2 - 15', 0, 1, 'C')
    pdf.cell(0, 6, 'Interviews: March 10 - 22', 0, 1, 'C')
    pdf.cell(0, 6, 'Internship: April 1 - 30', 0, 1, 'C')
    pdf.cell(0, 6, 'Batch 4 Pipeline: May 1 - 31', 0, 1, 'C')
    pdf.ln(30)
    pdf.set_font('Helvetica', 'I', 9)
    pdf.cell(0, 6, 'Code. Build. Deploy.', 0, 1, 'C')
    pdf.cell(0, 6, 'Prepared: March 1, 2026', 0, 1, 'C')

    # ==================== EXECUTIVE SUMMARY ====================
    pdf.add_page()
    pdf.colored_section('EXECUTIVE SUMMARY', SprintPDF.NAVY)
    pdf.body_text(
        'This document outlines the complete 3-month operational sprint for GKK Interns Batch 3. '
        'It covers three distinct phases: March (Recruitment & Selection), April (Active Internship), '
        'and May (Alumni Transition & Batch 4 Pipeline). Each month is broken into weekly sprints '
        'with specific goals, owners, and deliverables.'
    )
    pdf.ln(3)

    # Overview table
    pdf.sub_heading('Quarter Overview')
    w = [40, 50, 50, 50]
    pdf.table_header(['Month', 'Phase', 'Focus', 'Key Metric'], w)
    pdf.table_row(['March 2026', 'Recruitment', 'Applications + Interviews', '20-25 approved'], w, True)
    pdf.table_row(['April 2026', 'Active Batch 3', 'Sprints + Projects + Mentoring', 'Project completion'], w)
    pdf.table_row(['May 2026', 'Close + Pipeline', 'Certs + Alumni + Batch 4 open', 'Retention rate'], w, True)

    # ==================== MARCH - DETAILED ====================
    pdf.add_page()
    pdf.colored_section('MARCH 2026 — RECRUITMENT & SELECTION', SprintPDF.ACCENT)
    pdf.body_text(
        'March is the most critical month. This is where the quality of Batch 3 is determined. '
        'Every application reviewed, every interview conducted, every decision made this month '
        'directly impacts the success of the April internship.'
    )
    pdf.ln(2)

    # Week 1
    pdf.sub_heading('WEEK 1: March 2 - 8  |  Registration Launch')
    w = [25, 85, 40, 40]
    pdf.table_header(['Date', 'Action Item', 'Owner', 'Status'], w)
    pdf.table_row(['Mar 2 (Mon)', 'Open apply form (unlock form_settings)', 'Admin', 'DAY 1'], w, True)
    pdf.table_row(['Mar 2', 'Post announcement on Instagram + WhatsApp', 'Marketing', 'DAY 1'], w)
    pdf.table_row(['Mar 3 (Tue)', 'Share on college WhatsApp groups', 'Marketing', 'Priority'], w, True)
    pdf.table_row(['Mar 4 (Wed)', 'LinkedIn post about Batch 3 openings', 'CEO', 'Priority'], w)
    pdf.table_row(['Mar 5 (Thu)', 'First review of incoming applications', 'Admin', 'Check-in'], w, True)
    pdf.table_row(['Mar 6 (Fri)', 'Mid-week pulse: count applications received', 'Admin', 'Metric'], w)
    pdf.table_row(['Mar 7-8', 'Weekend push: Story posts, alumni testimonials', 'Marketing', 'Growth'], w, True)
    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*SprintPDF.MUTED)
    pdf.cell(0, 5, 'Target: 30-50 applications by end of Week 1. Do NOT start interviews yet — build the pool.', 0, 1)
    pdf.set_text_color(*SprintPDF.NAVY)
    pdf.ln(3)

    # Week 2
    pdf.sub_heading('WEEK 2: March 9 - 15  |  Interviews Begin + Form Closes')
    w = [25, 85, 40, 40]
    pdf.table_header(['Date', 'Action Item', 'Owner', 'Status'], w)
    pdf.table_row(['Mar 9 (Mon)', 'Shortlist top applicants for interviews', 'Admin', 'Critical'], w, True)
    pdf.table_row(['Mar 10 (Tue)', 'Begin interviews (3-4 per day)', 'CEO', 'INTERVIEWS'], w)
    pdf.table_row(['Mar 11 (Wed)', 'Continue interviews + review new apps', 'CEO', 'INTERVIEWS'], w, True)
    pdf.table_row(['Mar 12 (Thu)', 'Interviews + send "application received" mails', 'Admin', 'INTERVIEWS'], w)
    pdf.table_row(['Mar 13 (Fri)', 'Interview batch 2 of shortlisted candidates', 'CEO', 'INTERVIEWS'], w, True)
    pdf.table_row(['Mar 14 (Sat)', 'Final day push: "Last 24 hours to apply!"', 'Marketing', 'URGENCY'], w)
    pdf.table_row(['Mar 15 (Sun)', 'LOCK THE FORM. No more applications.', 'Admin', 'DEADLINE'], w, True)
    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*SprintPDF.MUTED)
    pdf.cell(0, 5, 'Target: 50-80 total applications. 15-20 interviews completed. Form locked by midnight Mar 15.', 0, 1)
    pdf.set_text_color(*SprintPDF.NAVY)
    pdf.ln(3)

    # Week 3
    pdf.add_page()
    pdf.colored_section('MARCH 2026 — RECRUITMENT & SELECTION (cont.)', SprintPDF.ACCENT)

    pdf.sub_heading('WEEK 3: March 16 - 22  |  Final Interviews + Decisions')
    w = [25, 85, 40, 40]
    pdf.table_header(['Date', 'Action Item', 'Owner', 'Status'], w)
    pdf.table_row(['Mar 16 (Mon)', 'Interview remaining shortlisted candidates', 'CEO', 'INTERVIEWS'], w, True)
    pdf.table_row(['Mar 17 (Tue)', 'Complete all pending interviews', 'CEO', 'INTERVIEWS'], w)
    pdf.table_row(['Mar 18 (Wed)', 'Score all candidates, rank by quality', 'Admin', 'Review'], w, True)
    pdf.table_row(['Mar 19 (Thu)', 'Final selection meeting: pick top 20-25', 'CEO', 'DECISION'], w)
    pdf.table_row(['Mar 20 (Fri)', 'Send approval emails to selected candidates', 'Admin', 'Communication'], w, True)
    pdf.table_row(['Mar 21 (Sat)', 'Send rejection/waitlist emails (kind, encouraging)', 'Admin', 'Communication'], w)
    pdf.table_row(['Mar 22 (Sun)', 'Deadline for selected candidates to confirm', 'Candidates', 'CONFIRM'], w, True)
    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*SprintPDF.MUTED)
    pdf.cell(0, 5, 'Target: 20-25 confirmed interns. Waitlist of 5-10 for any dropouts.', 0, 1)
    pdf.set_text_color(*SprintPDF.NAVY)
    pdf.ln(3)

    # Week 4
    pdf.sub_heading('WEEK 4: March 23 - 31  |  Payment + Pre-Onboarding')
    w = [25, 85, 40, 40]
    pdf.table_header(['Date', 'Action Item', 'Owner', 'Status'], w)
    pdf.table_row(['Mar 23 (Mon)', 'Send Razorpay payment links to all confirmed', 'Admin', 'PAYMENT'], w, True)
    pdf.table_row(['Mar 24 (Tue)', 'Follow up on pending payments (WhatsApp)', 'Admin', 'Follow-up'], w)
    pdf.table_row(['Mar 25 (Wed)', 'Prepare team assignments + project briefs (3-5 projects)', 'CEO', 'Planning'], w, True)
    pdf.table_row(['Mar 26 (Thu)', 'Create Batch 3 in Admin Dashboard', 'Admin', 'System'], w)
    pdf.table_row(['Mar 27 (Fri)', 'Payment deadline. Unpaid seats go to waitlist.', 'Admin', 'DEADLINE'], w, True)
    pdf.table_row(['Mar 28 (Sat)', 'Send welcome pack: schedule, tools list, group links', 'Admin', 'Onboard'], w)
    pdf.table_row(['Mar 29 (Sun)', 'Create WhatsApp/Discord group for Batch 3 interns', 'Admin', 'Community'], w, True)
    pdf.table_row(['Mar 30 (Mon)', 'Final prep: test dashboard, verify all accounts', 'Admin', 'QA'], w)
    pdf.table_row(['Mar 31 (Tue)', 'Pre-onboarding call: "What to expect on Day 1"', 'CEO', 'Hype'], w, True)
    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*SprintPDF.MUTED)
    pdf.cell(0, 5, 'Target: 100% payment collected. All systems ready. Interns excited for April 1.', 0, 1)
    pdf.set_text_color(*SprintPDF.NAVY)

    # ==================== APRIL ====================
    pdf.add_page()
    pdf.colored_section('APRIL 2026 — ACTIVE INTERNSHIP (BATCH 3)', SprintPDF.GREEN)
    pdf.body_text(
        'The core internship month. 4 weeks of intensive project building with weekly sprint cycles. '
        'Each week has a clear goal building toward a final demo-ready product.'
    )
    pdf.ln(2)

    # April Week 1
    pdf.sub_heading('SPRINT 1: April 1 - 5  |  Kickoff & Foundation')
    w = [25, 90, 35, 40]
    pdf.table_header(['Date', 'Activity', 'Type', 'Deliverable'], w)
    pdf.table_row(['Apr 1 (Wed)', 'Day 1: Welcome session + team reveals', 'Event', 'Kick-off complete'], w, True)
    pdf.table_row(['Apr 2 (Thu)', 'Tools setup: GitHub, Figma, dev environments', 'Workshop', 'All set up'], w)
    pdf.table_row(['Apr 3 (Fri)', 'Project brief deep-dive + Q&A with mentors', 'Session', 'Clarity'], w, True)
    pdf.table_row(['Apr 4-5', 'Sprint 0: Research, wireframes, repo setup', 'Work', 'Sprint 0 done'], w)
    pdf.ln(3)

    # April Week 2
    pdf.sub_heading('SPRINT 2: April 7 - 12  |  MVP Build')
    w = [25, 90, 35, 40]
    pdf.table_header(['Date', 'Activity', 'Type', 'Deliverable'], w)
    pdf.table_row(['Apr 7 (Mon)', 'Sprint planning: define MVP features', 'Planning', 'Sprint backlog'], w, True)
    pdf.table_row(['Apr 7-10', 'Daily standups (15 min async/call)', 'Standup', 'Progress tracked'], w)
    pdf.table_row(['Apr 11 (Fri)', 'Sprint review: demo MVP to mentors', 'Demo', 'MVP live'], w, True)
    pdf.table_row(['Apr 12 (Sat)', 'Code review session + feedback', 'Review', 'Quality check'], w)
    pdf.ln(3)

    # April Week 3
    pdf.sub_heading('SPRINT 3: April 14 - 19  |  Core Features')
    w = [25, 90, 35, 40]
    pdf.table_header(['Date', 'Activity', 'Type', 'Deliverable'], w)
    pdf.table_row(['Apr 14 (Mon)', 'Sprint planning: core feature development', 'Planning', 'Sprint backlog'], w, True)
    pdf.table_row(['Apr 14-17', 'Daily standups + 1-on-1 check-ins', 'Standup', 'Blockers cleared'], w)
    pdf.table_row(['Apr 18 (Fri)', 'Sprint review: demo core features', 'Demo', 'Features complete'], w, True)
    pdf.table_row(['Apr 19 (Sat)', 'Mid-program feedback survey from interns', 'Feedback', 'Insights'], w)
    pdf.ln(3)

    # April Week 4
    pdf.sub_heading('SPRINT 4: April 21 - 30  |  Polish + Demo Day')
    w = [25, 90, 35, 40]
    pdf.table_header(['Date', 'Activity', 'Type', 'Deliverable'], w)
    pdf.table_row(['Apr 21 (Mon)', 'Open Batch 4 applications (pipeline!)', 'Admin', 'Form live'], w, True)
    pdf.table_row(['Apr 21-24', 'Polish: bug fixes, UI improvements, testing', 'Work', 'Production-ready'], w)
    pdf.table_row(['Apr 25 (Fri)', 'CODE FREEZE. Final submissions.', 'Deadline', 'Code submitted'], w, True)
    pdf.table_row(['Apr 26 (Sat)', 'DEMO DAY: Project presentations (recorded)', 'Event', 'Demos done'], w)
    pdf.table_row(['Apr 28 (Mon)', 'Performance reviews + certificate generation', 'Admin', 'Certs ready'], w, True)
    pdf.table_row(['Apr 29 (Tue)', 'Top performers: LinkedIn recs + referral letters', 'CEO', 'Recognition'], w)
    pdf.table_row(['Apr 30 (Wed)', 'Batch 3 closing ceremony. Batch deactivated.', 'Event', 'Batch closed'], w, True)

    # ==================== MAY ====================
    pdf.add_page()
    pdf.colored_section('MAY 2026 — ALUMNI TRANSITION + BATCH 4 PIPELINE', SprintPDF.ORANGE)
    pdf.body_text(
        'May is the transition month. Batch 3 wraps up, alumni are onboarded into the network, '
        'and the pipeline for Batch 4 is in full swing. This month determines long-term growth.'
    )
    pdf.ln(2)

    pdf.sub_heading('WEEK 1: May 1 - 7  |  Batch 3 Wrap-Up')
    w = [55, 85, 50]
    pdf.table_header(['Action', 'Details', 'Owner'], w)
    pdf.table_row(['Distribute certificates', 'Email + LinkedIn-shareable PDF certificates', 'Admin'], w, True)
    pdf.table_row(['Collect testimonials', 'Video + text testimonials from top interns', 'Marketing'], w)
    pdf.table_row(['Upload demo recordings', 'Add to dashboard Sessions & Recordings', 'Admin'], w, True)
    pdf.table_row(['Alumni WhatsApp group', 'Add Batch 3 graduates to alumni network', 'Admin'], w)
    pdf.ln(3)

    pdf.sub_heading('WEEK 2: May 8 - 14  |  Batch 4 Recruitment')
    w = [55, 85, 50]
    pdf.table_header(['Action', 'Details', 'Owner'], w)
    pdf.table_row(['Review Batch 4 applications', 'Applications received since Apr 21', 'Admin'], w, True)
    pdf.table_row(['Begin Batch 4 interviews', 'Schedule slots for May 12-22', 'CEO'], w)
    pdf.table_row(['Leverage alumni marketing', 'Ask Batch 3 alumni to share on LinkedIn', 'Marketing'], w, True)
    pdf.table_row(['Analyze Batch 3 metrics', 'Completion rate, project quality, NPS', 'CEO'], w)
    pdf.ln(3)

    pdf.sub_heading('WEEK 3-4: May 15 - 31  |  Batch 4 Preparation')
    w = [55, 85, 50]
    pdf.table_header(['Action', 'Details', 'Owner'], w)
    pdf.table_row(['Complete Batch 4 interviews', 'Final decisions by May 22', 'CEO'], w, True)
    pdf.table_row(['Send approvals + payments', 'Razorpay links by May 23', 'Admin'], w)
    pdf.table_row(['Prepare new project briefs', 'Fresh projects for Batch 4 teams', 'CEO'], w, True)
    pdf.table_row(['Create Batch 4 in dashboard', 'System ready by May 28', 'Admin'], w)
    pdf.table_row(['Pre-onboarding for Batch 4', 'Welcome call May 30-31', 'CEO'], w, True)
    pdf.ln(3)
    pdf.set_font('Helvetica', 'B', 9)
    pdf.set_text_color(*SprintPDF.ORANGE)
    pdf.cell(0, 6, 'Batch 4 Kickoff: June 1, 2026', 0, 1, 'C')
    pdf.set_text_color(*SprintPDF.NAVY)

    # ==================== KEY METRICS ====================
    pdf.add_page()
    pdf.colored_section('KEY PERFORMANCE METRICS', SprintPDF.NAVY)
    pdf.ln(2)

    pdf.sub_heading('Monthly Targets')
    w = [50, 50, 45, 45]
    pdf.table_header(['Metric', 'March Target', 'April Target', 'May Target'], w)
    pdf.table_row(['Applications', '50-80', '-', '40-60 (Batch 4)'], w, True)
    pdf.table_row(['Interviews', '25-35', '-', '20-30 (Batch 4)'], w)
    pdf.table_row(['Approved Interns', '20-25', '-', '20-25 (Batch 4)'], w, True)
    pdf.table_row(['Payment Collection', '100%', '-', '100% (Batch 4)'], w)
    pdf.table_row(['Active Interns', '-', '20-25', '-'], w, True)
    pdf.table_row(['Sprint Completion', '-', '100%', '-'], w)
    pdf.table_row(['Project Demos', '-', '4-5 teams', '-'], w, True)
    pdf.table_row(['Certificates Issued', '-', '-', '20-25'], w)
    pdf.table_row(['Alumni Testimonials', '-', '-', '5-10'], w, True)
    pdf.ln(5)

    pdf.sub_heading('Critical Success Factors')
    critical = [
        '1. Form open for exactly 14 days (Mar 2-15) — creates urgency',
        '2. Interviews start after 1 week buffer — ensures candidate pool quality',
        '3. 100% payment before April 1 — no exceptions, waitlist backfills',
        '4. Weekly sprint demos — keeps teams accountable and projects on track',
        '5. Batch 4 pipeline starts during Batch 3 — zero downtime between batches',
        '6. Alumni network grows each batch — organic marketing engine',
    ]
    for c in critical:
        pdf.set_font('Helvetica', '', 9)
        pdf.cell(0, 6, c, 0, 1)
    pdf.ln(3)

    pdf.divider()
    pdf.ln(5)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*SprintPDF.NAVY)
    pdf.cell(0, 8, 'Code. Build. Deploy.', 0, 1, 'C')
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(*SprintPDF.MUTED)
    pdf.cell(0, 6, 'GKK Interns — The Collapse of Convention', 0, 1, 'C')

    # Save
    output_path = os.path.join(os.path.dirname(__file__), 'GKK_Interns_Batch3_Sprint_Plan.pdf')
    pdf.output(output_path)
    print(f'\n  PDF generated successfully!')
    print(f'  Location: {output_path}')
    print(f'  Pages: {pdf.page_no()}')
    return output_path

if __name__ == '__main__':
    generate_pdf()
