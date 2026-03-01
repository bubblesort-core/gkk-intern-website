# GKK Interns - March 2026 Session Plan PDF
# Detailed day-by-day schedule for Batch 1 & Batch 2

from fpdf import FPDF
import os

class MarchPlanPDF(FPDF):
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
            self.cell(95, 8, 'GKK Interns | March 2026 Session Plan', 0, 0, 'L')
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

    def day_row(self, date, day_num, b2_time, b2_topic, b2_type, b1_time, b1_note, highlight_color=None):
        y = self.get_y()
        if y > 260:
            self.add_page()
            y = self.get_y()

        row_h = 12
        if highlight_color:
            self.set_fill_color(*highlight_color)
            self.rect(10, y, 190, row_h, 'F')

        # Date col
        self.set_xy(11, y + 1)
        self.set_font('Helvetica', 'B', 7)
        self.set_text_color(*self.NAVY)
        self.cell(22, 5, date, 0, 0)

        # Day number
        self.set_xy(33, y + 1)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*self.MUTED)
        self.cell(12, 5, day_num, 0, 0, 'C')

        # Batch 2 time
        self.set_xy(46, y + 1)
        self.set_font('Helvetica', 'B', 7)
        self.set_text_color(*self.BLUE)
        self.cell(24, 5, b2_time, 0, 0, 'C')

        # Batch 2 topic
        self.set_xy(71, y + 1)
        self.set_font('Helvetica', '', 7)
        self.set_text_color(*self.DARK)
        self.cell(64, 5, b2_topic, 0, 0)

        # Batch 2 type badge
        if b2_type:
            type_colors = {
                'LIVE': self.GREEN,
                'DEMO': self.PURPLE,
                'REPORT': self.ORANGE,
                'SESSION': self.BLUE,
                'PRESENT': self.CYAN,
                'REVIEW': self.ORANGE,
                'END': self.RED,
                'CERTS': self.GREEN,
                'OFF': self.MUTED,
            }
            c = type_colors.get(b2_type, self.MUTED)
            self.set_xy(136, y + 2)
            self.set_fill_color(*c)
            self.set_text_color(*self.WHITE)
            self.set_font('Helvetica', 'B', 5)
            tw = self.get_string_width(b2_type) + 4
            self.cell(tw, 4, b2_type, 0, 0, 'C', fill=True)

        # Batch 1 time
        self.set_xy(155, y + 1)
        self.set_font('Helvetica', 'B', 7)
        self.set_text_color(*self.GREEN)
        self.cell(22, 5, b1_time, 0, 0, 'C')

        # Batch 1 note
        self.set_xy(178, y + 1)
        self.set_font('Helvetica', '', 6)
        self.set_text_color(*self.MUTED)
        self.cell(22, 5, b1_note, 0, 0)

        self.set_y(y + row_h)

    def table_header_row(self):
        self.set_fill_color(*self.NAVY)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 6)
        self.cell(22, 7, 'DATE', 0, 0, 'C', fill=True)
        self.cell(12, 7, 'DAY', 0, 0, 'C', fill=True)
        self.cell(24, 7, 'B2 TIME', 0, 0, 'C', fill=True)
        self.cell(64, 7, 'BATCH 2 SESSION TOPIC', 0, 0, 'C', fill=True)
        self.cell(14, 7, 'TYPE', 0, 0, 'C', fill=True)
        self.cell(22, 7, 'B1 TIME', 0, 0, 'C', fill=True)
        self.cell(32, 7, 'BATCH 1 NOTE', 0, 0, 'C', fill=True)
        self.ln()
        self.set_text_color(*self.NAVY)


def generate_march_plan():
    pdf = MarchPlanPDF()
    pdf.set_auto_page_break(auto=True, margin=18)

    # ==================== COVER ====================
    pdf.add_page()
    pdf.set_fill_color(*MarchPlanPDF.NAVY)
    pdf.rect(0, 0, 210, 130, 'F')

    pdf.set_xy(0, 30)
    pdf.set_text_color(*MarchPlanPDF.WHITE)
    pdf.set_font('Helvetica', 'B', 32)
    pdf.cell(0, 14, 'MARCH 2026', 0, 1, 'C')
    pdf.set_font('Helvetica', '', 13)
    pdf.set_text_color(*MarchPlanPDF.BLUE)
    pdf.cell(0, 8, 'SESSION PLAN & DAILY SCHEDULE', 0, 1, 'C')

    pdf.ln(4)
    pdf.set_draw_color(*MarchPlanPDF.BLUE)
    pdf.set_line_width(1)
    pdf.line(65, pdf.get_y(), 145, pdf.get_y())
    pdf.ln(8)

    pdf.set_text_color(*MarchPlanPDF.LIGHT)
    pdf.set_font('Helvetica', '', 10)
    pdf.cell(0, 7, 'GKK Interns - Batch 1 & Batch 2', 0, 1, 'C')
    pdf.cell(0, 7, 'Daily Session Schedule | 31 Days', 0, 1, 'C')

    # Legend below the cover area
    pdf.set_xy(20, 140)
    pdf.set_text_color(*MarchPlanPDF.NAVY)
    pdf.set_font('Helvetica', 'B', 11)
    pdf.cell(0, 8, 'Schedule Overview', 0, 1)
    pdf.ln(2)

    # Batch boxes
    y_box = pdf.get_y()
    # Batch 2 box
    pdf.set_fill_color(*MarchPlanPDF.BLUE)
    pdf.rect(15, y_box, 85, 45, 'F')
    pdf.set_xy(18, y_box + 3)
    pdf.set_text_color(*MarchPlanPDF.WHITE)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(80, 7, 'BATCH 2 (New)', 0, 1)
    pdf.set_x(18)
    pdf.set_font('Helvetica', '', 8)
    pdf.cell(80, 4, 'Starts: March 2 | Ends: March 24', 0, 1)
    pdf.set_x(18)
    pdf.cell(80, 4, 'Day 1: 8:00 - 9:00 PM (1 hour)', 0, 1)
    pdf.set_x(18)
    pdf.cell(80, 4, 'Day 2-5: 8:00 - 8:30 PM (30 min)', 0, 1)
    pdf.set_x(18)
    pdf.cell(80, 4, 'Day 6+: 8:00 - 8:15 PM (15 min)', 0, 1)
    pdf.set_x(18)
    pdf.cell(80, 4, 'Certificates: March 26 (Day 25)', 0, 1)

    # Batch 1 box
    pdf.set_fill_color(*MarchPlanPDF.GREEN)
    pdf.rect(110, y_box, 85, 45, 'F')
    pdf.set_xy(113, y_box + 3)
    pdf.set_text_color(*MarchPlanPDF.WHITE)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.cell(80, 7, 'BATCH 1 (Existing)', 0, 1)
    pdf.set_x(113)
    pdf.set_font('Helvetica', '', 8)
    pdf.cell(80, 4, 'Ongoing throughout March', 0, 1)
    pdf.set_x(113)
    pdf.cell(80, 4, 'Time: 9:30 - 9:45 PM (15 min)', 0, 1)
    pdf.set_x(113)
    pdf.cell(80, 4, 'Daily standups & progress checks', 0, 1)
    pdf.set_x(113)
    pdf.cell(80, 4, '', 0, 1)
    pdf.set_x(113)
    pdf.cell(80, 4, 'Free after 6 PM (College/Work day)', 0, 1)

    pdf.set_y(y_box + 50)
    pdf.ln(5)
    pdf.set_text_color(*MarchPlanPDF.MUTED)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.cell(0, 5, 'All sessions are conducted online. Timings are in IST.', 0, 1, 'C')

    # ==================== WEEK 1: MAR 1-8 ====================
    pdf.add_page()
    pdf.section('WEEK 1: MARCH 1 - 8 (Batch 2 Launch)', MarchPlanPDF.BLUE)
    pdf.table_header_row()

    # March 1 (Sat) - Before batch 2 starts
    pdf.day_row('Sat, Mar 1', '--', '--', 'Pre-launch prep & announcements', 'OFF', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)

    # March 2 (Sun) - DAY 1
    pdf.day_row('Sun, Mar 2', 'Day 1', '8:00-9:00', 'Platform intro + Live project walkthrough', 'LIVE', '9:30-9:45', 'Standup')

    # March 3 (Mon) - DAY 2
    pdf.day_row('Mon, Mar 3', 'Day 2', '8:00-8:30', 'Demo project assignment + Q&A', 'DEMO', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)

    # March 4 (Tue) - DAY 3
    pdf.day_row('Tue, Mar 4', 'Day 3', '8:00-8:30', 'Demo project report + Q&A', 'REPORT', '9:30-9:45', 'Standup')

    # March 5 (Wed) - DAY 4
    pdf.day_row('Wed, Mar 5', 'Day 4', '8:00-8:30', 'Demo project report + Q&A', 'REPORT', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)

    # March 6 (Thu) - DAY 5
    pdf.day_row('Thu, Mar 6', 'Day 5', '8:00-8:30', 'Demo presentation + Real project assignment', 'PRESENT', '9:30-9:45', 'Standup')

    # March 7 (Fri) - DAY 6 (15 min sessions start)
    pdf.day_row('Fri, Mar 7', 'Day 6', '8:00-8:15', 'Sprint session (15 min format starts)', 'SESSION', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)

    # March 8 (Sat)
    pdf.day_row('Sat, Mar 8', 'Day 7', '8:00-8:15', 'Sprint standup + progress check', 'SESSION', '9:30-9:45', 'Standup')

    pdf.ln(5)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*MarchPlanPDF.MUTED)
    pdf.cell(0, 5, 'Key: Day 1 = 1 hour intro | Days 2-5 = 30 min demos | Day 6+ = 15 min sprints', 0, 1, 'C')

    # ==================== WEEK 2: MAR 9-15 ====================
    pdf.ln(5)
    pdf.section('WEEK 2: MARCH 9 - 15 (Production Sprint)', MarchPlanPDF.PURPLE)
    pdf.table_header_row()

    for i, (day_num, date_str, dow) in enumerate([
        (8, '9', 'Sun'), (9, '10', 'Mon'), (10, '11', 'Tue'),
        (11, '12', 'Wed'), (12, '13', 'Thu'), (13, '14', 'Fri'), (14, '15', 'Sat')
    ]):
        topics = [
            'Sprint standup + code progress review',
            'Sprint session + blocker resolution',
            'Sprint standup + mentor feedback',
            'Sprint session + feature reviews',
            'Sprint standup + integration check',
            'Weekly sprint review + demo prep',
            'Sprint standup + weekend goals',
        ]
        hl = MarchPlanPDF.LIGHT if i % 2 == 0 else None
        pdf.day_row(f'{dow}, Mar {date_str}', f'Day {day_num}', '8:00-8:15',
                    topics[i], 'SESSION', '9:30-9:45', 'Standup', hl)

    pdf.ln(5)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(*MarchPlanPDF.MUTED)
    pdf.cell(0, 5, 'All Batch 2 sessions are 15 minutes (8:00 - 8:15 PM). Batch 1 continues at 9:30 - 9:45 PM.', 0, 1, 'C')

    # ==================== WEEK 3: MAR 16-22 ====================
    pdf.add_page()
    pdf.section('WEEK 3: MARCH 16 - 22 (Deep Build Phase)', MarchPlanPDF.ORANGE)
    pdf.table_header_row()

    for i, (day_num, date_str, dow) in enumerate([
        (15, '16', 'Sun'), (16, '17', 'Mon'), (17, '18', 'Tue'),
        (18, '19', 'Wed'), (19, '20', 'Thu'), (20, '21', 'Fri'), (21, '22', 'Sat')
    ]):
        topics = [
            'Sprint standup + mid-project review',
            'Sprint session + API integration check',
            'Sprint standup + UI review',
            'Sprint session + testing discussion',
            'Sprint standup + deployment prep',
            'Weekly sprint review + progress eval',
            'Sprint standup + final stretch planning',
        ]
        hl = MarchPlanPDF.LIGHT if i % 2 == 0 else None
        pdf.day_row(f'{dow}, Mar {date_str}', f'Day {day_num}', '8:00-8:15',
                    topics[i], 'SESSION', '9:30-9:45', 'Standup', hl)

    # ==================== WEEK 4: MAR 23-31 ====================
    pdf.ln(5)
    pdf.section('WEEK 4: MARCH 23 - 31 (Batch 2 Closing)', MarchPlanPDF.RED)
    pdf.table_header_row()

    # Day 22 - Mar 23
    pdf.day_row('Sun, Mar 23', 'Day 22', '8:00-8:15', 'Final sprint + code freeze prep', 'SESSION', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)

    # Day 23 - Mar 24 - BATCH 2 ENDS
    pdf.day_row('Mon, Mar 24', 'Day 23', '8:00-8:30', 'BATCH 2 FINAL SESSION - Project submission', 'END', '9:30-9:45', 'Standup')

    # Day 24 - Mar 25
    pdf.day_row('Tue, Mar 25', 'Day 24', '--', 'Evaluation day (no session)', 'REVIEW', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)

    # Day 25 - Mar 26 - CERTIFICATES
    pdf.day_row('Wed, Mar 26', 'Day 25', '8:00-8:30', 'CERTIFICATE CEREMONY (Batch 1 & 2)', 'CERTS', '9:30-9:45', 'B1 Certs too')

    # Mar 27-31 - Post Batch 2
    pdf.day_row('Thu, Mar 27', '--', '--', 'Batch 2 complete. Alumni transition.', 'OFF', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)
    pdf.day_row('Fri, Mar 28', '--', '--', 'Batch 3 registration review', 'OFF', '9:30-9:45', 'Standup')
    pdf.day_row('Sat, Mar 29', '--', '--', 'Batch 3 interview prep', 'OFF', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)
    pdf.day_row('Sun, Mar 30', '--', '--', 'Batch 3 pre-onboarding', 'OFF', '9:30-9:45', 'Standup')
    pdf.day_row('Mon, Mar 31', '--', '--', 'Batch 3 ready. Final prep.', 'OFF', '9:30-9:45', 'Standup', MarchPlanPDF.LIGHT)

    # ==================== SUMMARY PAGE ====================
    pdf.add_page()
    pdf.section('MARCH AT A GLANCE', MarchPlanPDF.NAVY)
    pdf.ln(2)

    # Key milestones
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(*MarchPlanPDF.BLUE)
    pdf.cell(0, 7, 'Key Milestones', 0, 1)
    pdf.ln(2)

    milestones = [
        ('Mar 1', 'Pre-launch day. Announcements go live.', MarchPlanPDF.MUTED),
        ('Mar 2', 'BATCH 2 DAY 1 - Platform intro (1 hour session)', MarchPlanPDF.BLUE),
        ('Mar 2-6', 'Onboarding week - Demo project assignment & reports', MarchPlanPDF.PURPLE),
        ('Mar 7', 'Sprint format begins - 15 min daily sessions', MarchPlanPDF.BLUE),
        ('Mar 7-23', 'Production project sprint cycle (17 days)', MarchPlanPDF.GREEN),
        ('Mar 24', 'BATCH 2 FINAL SESSION - Project submission (Day 23)', MarchPlanPDF.RED),
        ('Mar 26', 'CERTIFICATE CEREMONY - Batch 1 & Batch 2 (Day 25)', MarchPlanPDF.GREEN),
        ('Mar 27-31', 'Alumni transition + Batch 3 preparation', MarchPlanPDF.ORANGE),
    ]

    for date, desc, color in milestones:
        y = pdf.get_y()
        # Date badge
        pdf.set_fill_color(*color)
        pdf.set_text_color(*MarchPlanPDF.WHITE)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.cell(22, 6, date, 0, 0, 'C', fill=True)
        # Description
        pdf.set_text_color(*MarchPlanPDF.DARK)
        pdf.set_font('Helvetica', '', 8)
        pdf.cell(5, 6, '', 0, 0)
        pdf.cell(0, 6, desc, 0, 1)
        pdf.ln(2)

    pdf.ln(5)

    # Stats summary
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(*MarchPlanPDF.BLUE)
    pdf.cell(0, 7, 'Monthly Session Stats', 0, 1)
    pdf.ln(2)

    y_stats = pdf.get_y()
    stat_items = [
        ('25', 'Total Batch 2\nSessions', MarchPlanPDF.BLUE),
        ('31', 'Total Batch 1\nSessions', MarchPlanPDF.GREEN),
        ('1 hr', 'Day 1\nSession', MarchPlanPDF.PURPLE),
        ('30m', 'Days 2-5\nSessions', MarchPlanPDF.ORANGE),
        ('15m', 'Day 6+\nSessions', MarchPlanPDF.CYAN),
    ]

    for i, (val, label, color) in enumerate(stat_items):
        x = 15 + i * 38
        pdf.set_xy(x, y_stats)
        pdf.set_fill_color(*color)
        pdf.set_text_color(*MarchPlanPDF.WHITE)
        pdf.set_font('Helvetica', 'B', 18)
        pdf.cell(34, 16, val, 0, 0, 'C', fill=True)
        pdf.set_xy(x, y_stats + 18)
        pdf.set_text_color(*MarchPlanPDF.NAVY)
        pdf.set_font('Helvetica', '', 6)
        for line in label.split('\n'):
            pdf.set_x(x)
            pdf.cell(34, 4, line, 0, 1, 'C')

    pdf.set_y(y_stats + 35)
    pdf.ln(8)

    # Daily schedule visual
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(*MarchPlanPDF.BLUE)
    pdf.cell(0, 7, 'Your Daily Schedule (Post Day 6)', 0, 1)
    pdf.ln(3)

    timeline = [
        ('6:00 AM - 6:00 PM', 'College / Work', MarchPlanPDF.MUTED, False),
        ('6:00 PM - 8:00 PM', 'Free / Prep Time', MarchPlanPDF.LIGHT, False),
        ('8:00 PM - 8:15 PM', 'BATCH 2 SESSION', MarchPlanPDF.BLUE, True),
        ('8:15 PM - 9:30 PM', 'Break', MarchPlanPDF.LIGHT, False),
        ('9:30 PM - 9:45 PM', 'BATCH 1 SESSION', MarchPlanPDF.GREEN, True),
        ('9:45 PM onwards', 'Rest', MarchPlanPDF.LIGHT, False),
    ]

    for time_str, activity, color, is_session in timeline:
        y = pdf.get_y()
        # Time
        pdf.set_font('Helvetica', 'B' if is_session else '', 8)
        pdf.set_text_color(*MarchPlanPDF.NAVY)
        pdf.cell(42, 8, time_str, 0, 0)
        # Activity bar
        bar_w = 100 if is_session else 70
        pdf.set_fill_color(*color)
        pdf.set_text_color(*MarchPlanPDF.WHITE if is_session else MarchPlanPDF.DARK)
        pdf.set_font('Helvetica', 'B' if is_session else '', 8)
        pdf.cell(bar_w, 8, f'  {activity}', 0, 1, 'L', fill=True)

    pdf.ln(8)
    pdf.set_text_color(*MarchPlanPDF.MUTED)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.cell(0, 5, 'GKK Interns - Code. Build. Deploy.', 0, 1, 'C')

    # Save
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'GKK_March_2026_Session_Plan.pdf')
    pdf.output(output_path)
    print(f'\n  March Plan PDF generated successfully!')
    print(f'  Location: {output_path}')
    print(f'  Pages: {pdf.page_no()}')
    return output_path


if __name__ == '__main__':
    generate_march_plan()
