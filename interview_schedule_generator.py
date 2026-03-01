# GKK Interns - Batch 3 Interview Schedule PDF
# Standalone interview planning document for March 9-22

from fpdf import FPDF
import os

class InterviewPDF(FPDF):
    NAVY = (15, 23, 42)
    DARK = (30, 41, 59)
    BLUE = (59, 130, 246)
    GREEN = (34, 197, 94)
    ORANGE = (249, 115, 22)
    PURPLE = (139, 92, 246)
    RED = (239, 68, 68)
    CYAN = (6, 182, 212)
    WHITE = (255, 255, 255)
    LIGHT = (241, 245, 249)
    MUTED = (100, 116, 139)

    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 7)
            self.set_text_color(*self.MUTED)
            self.cell(95, 8, 'GKK Interns | Batch 3 Interview Plan', 0, 0, 'L')
            self.cell(95, 8, f'Page {self.page_no()}', 0, 0, 'R')
            self.ln(10)

    def footer(self):
        self.set_y(-12)
        self.set_font('Helvetica', 'I', 7)
        self.set_text_color(*self.MUTED)
        self.cell(0, 10, 'Confidential - GKK Interns Management', 0, 0, 'C')

    def section(self, title, color):
        self.set_fill_color(*color)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 13)
        self.cell(0, 11, f'  {title}', 0, 1, 'L', fill=True)
        self.set_text_color(*self.NAVY)
        self.ln(4)

    def accent_line(self, w=50):
        x = self.get_x()
        self.set_draw_color(*self.BLUE)
        self.set_line_width(0.8)
        self.line(x, self.get_y(), x + w, self.get_y())
        self.ln(4)


def generate_interview_plan():
    pdf = InterviewPDF()
    pdf.set_auto_page_break(auto=True, margin=18)

    # ==================== COVER ====================
    pdf.add_page()
    pdf.set_fill_color(*InterviewPDF.NAVY)
    pdf.rect(0, 0, 210, 120, 'F')

    pdf.set_xy(0, 30)
    pdf.set_text_color(*InterviewPDF.WHITE)
    pdf.set_font('Helvetica', 'B', 30)
    pdf.cell(0, 14, 'BATCH 3', 0, 1, 'C')
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(*InterviewPDF.BLUE)
    pdf.cell(0, 8, 'INTERVIEW SCHEDULE & PLAN', 0, 1, 'C')
    pdf.ln(4)
    pdf.set_draw_color(*InterviewPDF.BLUE)
    pdf.set_line_width(1)
    pdf.line(65, pdf.get_y(), 145, pdf.get_y())
    pdf.ln(8)
    pdf.set_text_color(*InterviewPDF.LIGHT)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 7, 'Interview Window: March 9 - March 22, 2026', 0, 1, 'C')
    pdf.cell(0, 7, 'Batch 3 Start: April 1, 2026', 0, 1, 'C')

    # Overview section below cover
    pdf.set_xy(15, 130)
    pdf.set_text_color(*InterviewPDF.NAVY)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(0, 8, 'Interview Plan Overview', 0, 1)
    pdf.accent_line()
    pdf.ln(2)

    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(*InterviewPDF.DARK)
    pdf.multi_cell(0, 5,
        'This document outlines the complete Batch 3 interview schedule. '
        'Interviews run from March 9 to March 22, fitting around the existing '
        'Batch 2 (8:00-8:15 PM) and Batch 1 (9:30-9:45 PM) session timings. '
        'The primary interview slot is 6:30-7:30 PM (before batch sessions).'
    )
    pdf.ln(5)

    # Key info boxes
    y_box = pdf.get_y()
    boxes = [
        ('INTERVIEW WINDOW', 'March 9 - 22', '14 days', InterviewPDF.BLUE),
        ('PRIMARY SLOT', '6:30 - 7:30 PM', '3 interviews/day', InterviewPDF.GREEN),
        ('OVERFLOW SLOT', '8:30 - 9:15 PM', '2 interviews/day', InterviewPDF.ORANGE),
        ('DURATION', '15-20 min each', 'Video call', InterviewPDF.PURPLE),
    ]
    for i, (title, line1, line2, color) in enumerate(boxes):
        x = 12 + i * 48
        pdf.set_fill_color(*color)
        pdf.rect(x, y_box, 44, 28, 'F')
        pdf.set_xy(x, y_box + 3)
        pdf.set_text_color(*InterviewPDF.WHITE)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.cell(44, 4, title, 0, 1, 'C')
        pdf.set_x(x)
        pdf.set_font('Helvetica', 'B', 10)
        pdf.cell(44, 6, line1, 0, 1, 'C')
        pdf.set_x(x)
        pdf.set_font('Helvetica', '', 7)
        pdf.cell(44, 4, line2, 0, 1, 'C')

    pdf.set_y(y_box + 33)
    pdf.ln(5)

    # Your daily schedule context
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(*InterviewPDF.BLUE)
    pdf.cell(0, 7, 'Your Evening Schedule (During Interview Period)', 0, 1)
    pdf.ln(2)

    slots = [
        ('6:00 - 6:30 PM', 'Prep / Review applications', InterviewPDF.LIGHT, False),
        ('6:30 - 7:30 PM', 'BATCH 3 INTERVIEWS (Primary)', InterviewPDF.BLUE, True),
        ('7:30 - 8:00 PM', 'Break / Interview notes', InterviewPDF.LIGHT, False),
        ('8:00 - 8:15 PM', 'Batch 2 Session', InterviewPDF.CYAN, True),
        ('8:15 - 9:30 PM', 'Overflow interviews (if needed)', InterviewPDF.ORANGE, True),
        ('9:30 - 9:45 PM', 'Batch 1 Session', InterviewPDF.GREEN, True),
    ]
    for time_s, act, color, bold in slots:
        pdf.set_font('Helvetica', 'B' if bold else '', 8)
        pdf.set_text_color(*InterviewPDF.NAVY)
        pdf.cell(35, 7, time_s, 0, 0)
        pdf.set_fill_color(*color)
        pdf.set_text_color(*InterviewPDF.WHITE if bold else InterviewPDF.DARK)
        pdf.cell(120, 7, f'  {act}', 0, 1, 'L', fill=True)

    # ==================== PAGE 2: DAY-BY-DAY SCHEDULE ====================
    pdf.add_page()
    pdf.section('WEEK 1: MARCH 9 - 15 (Interviews + Form Open)', InterviewPDF.BLUE)

    # Table header
    w = [25, 30, 45, 30, 60]
    pdf.set_fill_color(*InterviewPDF.NAVY)
    pdf.set_text_color(*InterviewPDF.WHITE)
    pdf.set_font('Helvetica', 'B', 7)
    pdf.cell(w[0], 7, 'DATE', 0, 0, 'C', fill=True)
    pdf.cell(w[1], 7, 'INTERVIEW TIME', 0, 0, 'C', fill=True)
    pdf.cell(w[2], 7, 'INTERVIEW ACTIVITY', 0, 0, 'C', fill=True)
    pdf.cell(w[3], 7, 'SLOTS', 0, 0, 'C', fill=True)
    pdf.cell(w[4], 7, 'NOTES', 0, 1, 'C', fill=True)
    pdf.set_text_color(*InterviewPDF.NAVY)

    week1 = [
        ('Sun, Mar 9', '6:30-7:30', 'Begin interviews (shortlisted)', '3 slots', 'First batch of shortlisted candidates'),
        ('Mon, Mar 10', '6:30-7:30', 'Continue interviews', '3 slots', 'Review Day 1 notes, adjust criteria'),
        ('Tue, Mar 11', '6:30-7:30', 'Continue interviews', '3 slots', 'Mid-week check on application count'),
        ('Wed, Mar 12', '6:30-7:30', 'Continue interviews', '3 slots', 'Send "app received" emails to new applicants'),
        ('Thu, Mar 13', '6:30-7:30', 'Continue interviews', '3 slots', 'Second wave of shortlisted candidates'),
        ('Fri, Mar 14', '6:30-7:30', 'Continue interviews', '3 slots', 'Post "Last 24 hrs to apply!" on socials'),
        ('Sat, Mar 15', '6:30-7:30', 'Interviews + LOCK FORM', '3 slots', 'FORM CLOSES TONIGHT. No more applications.'),
    ]

    for i, (date, time, act, slots_c, note) in enumerate(week1):
        hl = i % 2 == 0
        if hl:
            pdf.set_fill_color(*InterviewPDF.LIGHT)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.set_text_color(*InterviewPDF.NAVY)
        pdf.cell(w[0], 9, date, 0, 0, 'L', fill=hl)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.set_text_color(*InterviewPDF.BLUE)
        pdf.cell(w[1], 9, time, 0, 0, 'C', fill=hl)
        pdf.set_font('Helvetica', '', 7)
        pdf.set_text_color(*InterviewPDF.DARK)
        pdf.cell(w[2], 9, act, 0, 0, 'L', fill=hl)
        pdf.set_text_color(*InterviewPDF.GREEN)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.cell(w[3], 9, slots_c, 0, 0, 'C', fill=hl)
        pdf.set_font('Helvetica', '', 6)
        pdf.set_text_color(*InterviewPDF.MUTED)
        pdf.cell(w[4], 9, note, 0, 1, 'L', fill=hl)

    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 7)
    pdf.set_text_color(*InterviewPDF.MUTED)
    pdf.cell(0, 5, 'Week 1 target: ~21 interviews completed. Form locked on March 15.', 0, 1, 'C')

    # ==================== WEEK 2 ====================
    pdf.ln(5)
    pdf.section('WEEK 2: MARCH 16 - 22 (Final Interviews + Decisions)', InterviewPDF.PURPLE)

    pdf.set_fill_color(*InterviewPDF.NAVY)
    pdf.set_text_color(*InterviewPDF.WHITE)
    pdf.set_font('Helvetica', 'B', 7)
    pdf.cell(w[0], 7, 'DATE', 0, 0, 'C', fill=True)
    pdf.cell(w[1], 7, 'INTERVIEW TIME', 0, 0, 'C', fill=True)
    pdf.cell(w[2], 7, 'INTERVIEW ACTIVITY', 0, 0, 'C', fill=True)
    pdf.cell(w[3], 7, 'SLOTS', 0, 0, 'C', fill=True)
    pdf.cell(w[4], 7, 'NOTES', 0, 1, 'C', fill=True)
    pdf.set_text_color(*InterviewPDF.NAVY)

    week2 = [
        ('Sun, Mar 16', '6:30-7:30', 'Interview remaining candidates', '3 slots', 'Form is closed. Final pool only.'),
        ('Mon, Mar 17', '6:30-7:30', 'Complete pending interviews', '3 slots', 'Use overflow slot if backlog'),
        ('Tue, Mar 18', '6:30-7:30', 'Last interview day (if needed)', '2-3 slots', 'Start scoring candidates'),
        ('Wed, Mar 19', '--', 'NO INTERVIEWS - Scoring day', '--', 'Rank all candidates. Pick top 20-25.'),
        ('Thu, Mar 20', '--', 'DECISION DAY', '--', 'Send approval emails to selected'),
        ('Fri, Mar 21', '--', 'Send rejections + waitlist', '--', 'Kind, encouraging rejection emails'),
        ('Sat, Mar 22', '--', 'Confirmation deadline', '--', 'Selected candidates must confirm by tonight'),
    ]

    for i, (date, time, act, slots_c, note) in enumerate(week2):
        hl = i % 2 == 0
        if hl:
            pdf.set_fill_color(*InterviewPDF.LIGHT)
        is_decision = i >= 3
        pdf.set_font('Helvetica', 'B', 7)
        pdf.set_text_color(*InterviewPDF.NAVY)
        pdf.cell(w[0], 9, date, 0, 0, 'L', fill=hl)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.set_text_color(*InterviewPDF.RED if is_decision else InterviewPDF.BLUE)
        pdf.cell(w[1], 9, time, 0, 0, 'C', fill=hl)
        pdf.set_font('Helvetica', 'B' if is_decision else '', 7)
        pdf.set_text_color(*InterviewPDF.RED if is_decision else InterviewPDF.DARK)
        pdf.cell(w[2], 9, act, 0, 0, 'L', fill=hl)
        pdf.set_text_color(*InterviewPDF.GREEN)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.cell(w[3], 9, slots_c, 0, 0, 'C', fill=hl)
        pdf.set_font('Helvetica', '', 6)
        pdf.set_text_color(*InterviewPDF.MUTED)
        pdf.cell(w[4], 9, note, 0, 1, 'L', fill=hl)

    pdf.ln(3)
    pdf.set_font('Helvetica', 'I', 7)
    pdf.set_text_color(*InterviewPDF.MUTED)
    pdf.cell(0, 5, 'Week 2 target: All interviews done by Mar 18. Decisions sent by Mar 20. Confirmations by Mar 22.', 0, 1, 'C')

    # ==================== PAGE 3: POST-INTERVIEW TIMELINE ====================
    pdf.add_page()
    pdf.section('POST-INTERVIEW: MARCH 23 - 31 (Onboarding Prep)', InterviewPDF.ORANGE)

    pdf.set_fill_color(*InterviewPDF.NAVY)
    pdf.set_text_color(*InterviewPDF.WHITE)
    pdf.set_font('Helvetica', 'B', 7)
    w2 = [25, 55, 55, 55]
    pdf.cell(w2[0], 7, 'DATE', 0, 0, 'C', fill=True)
    pdf.cell(w2[1], 7, 'BATCH 3 PREP ACTION', 0, 0, 'C', fill=True)
    pdf.cell(w2[2], 7, 'ADMIN TASK', 0, 0, 'C', fill=True)
    pdf.cell(w2[3], 7, 'STATUS TARGET', 0, 1, 'C', fill=True)
    pdf.set_text_color(*InterviewPDF.NAVY)

    post_interview = [
        ('Mar 23', 'Send Razorpay payment links', 'Prepare team structures', '100% links sent'),
        ('Mar 24', 'Payment follow-up (WhatsApp)', 'Batch 2 ends today!', 'Track payments'),
        ('Mar 25', 'Continue payment collection', 'Prepare project briefs (3-5)', 'Draft projects'),
        ('Mar 26', 'Batch 2 certs + payment check', 'Create Batch 3 in dashboard', 'System ready'),
        ('Mar 27', 'PAYMENT DEADLINE', 'Waitlist fills unpaid seats', '100% paid'),
        ('Mar 28', 'Send welcome pack to all', 'Tools list, schedule, group links', 'Packs sent'),
        ('Mar 29', 'Create Batch 3 WhatsApp group', 'Add all confirmed interns', 'Group live'),
        ('Mar 30', 'Test dashboard + verify accounts', 'Final QA on all systems', 'Systems OK'),
        ('Mar 31', 'Pre-onboarding call: Day 1 prep', 'Build hype for April 1!', 'Ready to go!'),
    ]

    for i, (date, b3_action, admin, target) in enumerate(post_interview):
        hl = i % 2 == 0
        if hl:
            pdf.set_fill_color(*InterviewPDF.LIGHT)
        is_deadline = 'DEADLINE' in b3_action or 'PAYMENT' in target
        pdf.set_font('Helvetica', 'B', 7)
        pdf.set_text_color(*InterviewPDF.NAVY)
        pdf.cell(w2[0], 9, date, 0, 0, 'C', fill=hl)
        pdf.set_font('Helvetica', 'B' if is_deadline else '', 7)
        pdf.set_text_color(*InterviewPDF.RED if is_deadline else InterviewPDF.DARK)
        pdf.cell(w2[1], 9, b3_action, 0, 0, 'L', fill=hl)
        pdf.set_font('Helvetica', '', 7)
        pdf.set_text_color(*InterviewPDF.DARK)
        pdf.cell(w2[2], 9, admin, 0, 0, 'L', fill=hl)
        pdf.set_font('Helvetica', 'B', 6)
        pdf.set_text_color(*InterviewPDF.GREEN)
        pdf.cell(w2[3], 9, target, 0, 1, 'C', fill=hl)

    pdf.ln(5)

    # ==================== FULL TIMELINE SUMMARY ====================
    pdf.section('COMPLETE BATCH 3 RECRUITMENT TIMELINE', InterviewPDF.NAVY)
    pdf.ln(2)

    timeline = [
        ('Mar 2', 'Form opens at gkkintern.in', 'FORM', InterviewPDF.BLUE),
        ('Mar 2-8', 'Application collection week (no interviews)', 'COLLECT', InterviewPDF.CYAN),
        ('Mar 9', 'Interviews begin (6:30-7:30 PM daily)', 'INTERVIEW', InterviewPDF.PURPLE),
        ('Mar 9-15', 'Interviews + form still open', 'INTERVIEW', InterviewPDF.PURPLE),
        ('Mar 15', 'FORM LOCKED - No more applications', 'DEADLINE', InterviewPDF.RED),
        ('Mar 16-18', 'Final interviews (remaining candidates)', 'INTERVIEW', InterviewPDF.PURPLE),
        ('Mar 19', 'Candidate scoring & ranking', 'REVIEW', InterviewPDF.ORANGE),
        ('Mar 20', 'Approval emails sent (top 20-25)', 'DECISION', InterviewPDF.GREEN),
        ('Mar 21', 'Rejection + waitlist emails sent', 'DECISION', InterviewPDF.ORANGE),
        ('Mar 22', 'Confirmation deadline for selected', 'DEADLINE', InterviewPDF.RED),
        ('Mar 23-27', 'Payment collection via Razorpay', 'PAYMENT', InterviewPDF.BLUE),
        ('Mar 27', 'Payment deadline - waitlist backfills', 'DEADLINE', InterviewPDF.RED),
        ('Mar 28-31', 'Pre-onboarding + system setup', 'PREP', InterviewPDF.CYAN),
        ('Apr 1', 'BATCH 3 KICKOFF!', 'LAUNCH', InterviewPDF.GREEN),
    ]

    for i, (date, desc, badge, color) in enumerate(timeline):
        y = pdf.get_y()
        if y > 260:
            pdf.add_page()

        # Date
        pdf.set_fill_color(*color)
        pdf.set_text_color(*InterviewPDF.WHITE)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.cell(22, 7, date, 0, 0, 'C', fill=True)

        # Badge
        pdf.cell(2, 7, '', 0, 0)
        tw = pdf.get_string_width(badge) + 6
        pdf.set_fill_color(*InterviewPDF.LIGHT)
        pdf.set_text_color(*color)
        pdf.set_font('Helvetica', 'B', 6)
        pdf.cell(tw, 7, badge, 0, 0, 'C', fill=True)

        # Description
        pdf.cell(4, 7, '', 0, 0)
        pdf.set_text_color(*InterviewPDF.DARK)
        pdf.set_font('Helvetica', '', 8)
        pdf.cell(0, 7, desc, 0, 1)
        pdf.ln(1)

    pdf.ln(5)

    # Stats bar
    y_s = pdf.get_y()
    final_stats = [
        ('42+', 'Max Interviews\nCapacity', InterviewPDF.BLUE),
        ('20-25', 'Target\nApprovals', InterviewPDF.GREEN),
        ('14', 'Interview\nDays', InterviewPDF.PURPLE),
        ('5', 'Slots\nPer Day', InterviewPDF.ORANGE),
        ('Rs.499', 'Program\nFee', InterviewPDF.NAVY),
    ]
    for i, (val, label, color) in enumerate(final_stats):
        x = 12 + i * 38
        pdf.set_xy(x, y_s)
        pdf.set_fill_color(*color)
        pdf.set_text_color(*InterviewPDF.WHITE)
        pdf.set_font('Helvetica', 'B', 14)
        pdf.cell(35, 14, val, 0, 0, 'C', fill=True)
        pdf.set_xy(x, y_s + 16)
        pdf.set_text_color(*InterviewPDF.NAVY)
        pdf.set_font('Helvetica', '', 6)
        for line in label.split('\n'):
            pdf.set_x(x)
            pdf.cell(35, 4, line, 0, 1, 'C')

    pdf.set_y(y_s + 30)
    pdf.ln(5)
    pdf.set_text_color(*InterviewPDF.MUTED)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.cell(0, 5, 'GKK Interns - Code. Build. Deploy.', 0, 1, 'C')

    # Save
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'GKK_Batch3_Interview_Schedule.pdf')
    pdf.output(output_path)
    print(f'\n  Interview Schedule PDF generated successfully!')
    print(f'  Location: {output_path}')
    print(f'  Pages: {pdf.page_no()}')
    return output_path


if __name__ == '__main__':
    generate_interview_plan()
