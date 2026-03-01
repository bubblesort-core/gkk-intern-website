from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_JUSTIFY, TA_LEFT

# --- CONFIGURATION ---
FILENAME = "GKKIntern_Detailed_Roadmap.pdf"
BRAND_GREEN = colors.HexColor("#2da832")  # GKK Brand Green
BRAND_GOLD = colors.HexColor("#c2941b")   # Bubblesort Gold
BRAND_DARK = colors.HexColor("#1a1a1a")   # Modern Dark Grey
BRAND_LIGHT_BG = colors.HexColor("#f4f9f4") # Very light green tint

def create_header_footer(canvas, doc):
    """Draws a professional header and footer on every page."""
    canvas.saveState()
    
    # Header Background Strip
    canvas.setFillColor(BRAND_GREEN)
    canvas.rect(0, A4[1] - 1.2*inch, A4[0], 1.2*inch, fill=1, stroke=0)
    
    # Header Title
    canvas.setFont("Helvetica-Bold", 22)
    canvas.setFillColor(colors.white)
    canvas.drawString(0.5*inch, A4[1] - 0.7*inch, "GKKINTERN INNOVATION SPRINT")
    
    # Header Subtitle
    canvas.setFont("Helvetica", 12)
    canvas.setFillColor(colors.white)
    canvas.drawString(0.5*inch, A4[1] - 0.95*inch, "Powered by Bubblesort | Cycle Duration: 35 Days")
    
    # Footer Line
    canvas.setStrokeColor(BRAND_GOLD)
    canvas.setLineWidth(2)
    canvas.line(0.5*inch, 0.7*inch, A4[0]-0.5*inch, 0.7*inch)
    
    # Footer Text
    canvas.setFont("Helvetica", 9)
    canvas.setFillColor(colors.gray)
    canvas.drawString(0.5*inch, 0.5*inch, "© 2026 Bubblesort Corp | All Rights Reserved")
    canvas.drawRightString(A4[0]-0.5*inch, 0.5*inch, f"Page {doc.page}")
    
    canvas.restoreState()

def generate_pdf():
    doc = SimpleDocTemplate(
        FILENAME,
        pagesize=A4,
        rightMargin=0.8*inch, leftMargin=0.8*inch,
        topMargin=1.5*inch, bottomMargin=1*inch
    )

    story = []
    styles = getSampleStyleSheet()

    # --- CUSTOM STYLES ---
    style_philosophy = ParagraphStyle(
        'Philosophy',
        parent=styles['Normal'],
        fontSize=11,
        leading=16,
        textColor=colors.darkslategrey,
        alignment=TA_JUSTIFY,
        leftIndent=10, rightIndent=10,
        spaceAfter=20,
        fontName="Helvetica-Oblique"
    )

    style_phase_header = ParagraphStyle(
        'PhaseHeader',
        parent=styles['Heading2'],
        fontSize=16,
        leading=20,
        textColor=BRAND_GREEN,
        spaceBefore=15, spaceAfter=10,
        fontName="Helvetica-Bold"
    )

    style_subheader = ParagraphStyle(
        'SubHeader',
        parent=styles['Heading3'],
        fontSize=12,
        leading=15,
        textColor=BRAND_DARK,
        spaceBefore=12, spaceAfter=6,
        fontName="Helvetica-Bold"
    )

    style_body = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        spaceAfter=6,
        textColor=colors.black,
        alignment=TA_JUSTIFY
    )

    style_bullet = ParagraphStyle(
        'Bullet',
        parent=style_body,
        leftIndent=15,
        bulletIndent=5,
        spaceAfter=4
    )

    # --- CONTENT ---

    # 1. Philosophy
    story.append(Paragraph("<b>The Philosophy:</b> This isn’t a classroom. It’s a workspace. We don’t grade you on memorizing syntax; we grade you on shipping software. Use AI, use Google, break things, and build them again.", style_philosophy))
    story.append(Spacer(1, 10))

    # 2. PHASE 1
    story.append(Paragraph("PHASE 1: ONBOARDING & PROTOCOLS (Days 1–2)", style_phase_header))
    story.append(Paragraph("<i>The foundation days. Establishing the workflow and toolchain.</i>", style_body))
    
    story.append(Paragraph("Day 1: The Interaction & Setup", style_subheader))
    story.append(Paragraph("• <b>Kickoff Call:</b> Introduction to the Bubblesort ecosystem and internship protocols.", style_bullet))
    story.append(Paragraph("• <b>'Vibe Coding' Workshop:</b> Mandatory session on using AI assistants (ChatGPT/Claude/Cursor) effectively for debugging and boilerplate generation.", style_bullet))
    story.append(Paragraph("• <b>Toolchain Check:</b> VS Code extensions, Node/Python environment setup, and Git configuration.", style_bullet))

    story.append(Paragraph("Day 2: Allocation & Problem Statement", style_subheader))
    story.append(Paragraph("• <b>Squad Formation:</b> Interns are grouped by tech stack (Web/App/AI).", style_bullet))
    story.append(Paragraph("• <b>Project Reveal:</b> Admins will release specific Problem Statements based on current industry requirements.", style_bullet))
    story.append(Paragraph("• <b>Repository Access:</b> GitHub invites sent. Initial 'Hello World' commit required to verify access.", style_bullet))
    
    story.append(Spacer(1, 10))

    # 3. PHASE 2
    story.append(Paragraph("PHASE 2: THE BUILD SPRINT (Days 3–25)", style_phase_header))
    story.append(Paragraph("<i>The Execution Phase. Work is submitted via Git commits. Progress is tracked in 3 mandatory 'Chunks'.</i>", style_body))

    # Chunk 1
    story.append(Paragraph("Chunk 1: The Skeleton (Days 3–10)", style_subheader))
    story.append(Paragraph("<b>Goal:</b> Establish the Architecture. <b>Review Checkpoint:</b> Day 10.", style_body))
    story.append(Paragraph("• <b>Frontend:</b> Complete UI layout (Responsive Design) with dummy data.", style_bullet))
    story.append(Paragraph("• <b>Backend/Logic:</b> Database Schema design and environment variable configuration.", style_bullet))
    story.append(Paragraph("• <b>Deliverable:</b> A non-functional but visually complete prototype hosted locally.", style_bullet))

    # Chunk 2
    story.append(Paragraph("Chunk 2: The Core Logic / MVP (Days 11–18)", style_subheader))
    story.append(Paragraph("<b>Goal:</b> Functionality & Data Flow. <b>Review Checkpoint:</b> Day 18.", style_body))
    story.append(Paragraph("• <b>Integration:</b> Connecting Frontend to Backend via RESTful APIs or Firebase.", style_bullet))
    story.append(Paragraph("• <b>Authentication:</b> Secure Login/Signup systems (JWT/OAuth).", style_bullet))
    story.append(Paragraph("• <b>Deliverable:</b> A 'Minimum Viable Product' where core features work end-to-end.", style_bullet))

    # Chunk 3
    story.append(Paragraph("Chunk 3: Optimization & Polish (Days 19–25)", style_subheader))
    story.append(Paragraph("<b>Goal:</b> UX Refinement & Edge Cases. <b>Review Checkpoint:</b> Day 25.", style_body))
    story.append(Paragraph("• <b>Error Handling:</b> Graceful handling of network errors and input validation.", style_bullet))
    story.append(Paragraph("• <b>UI Polish:</b> Micro-interactions, loading states, and mobile responsiveness adjustments.", style_bullet))
    story.append(Paragraph("• <b>AI Integration:</b> (If applicable to track) Connecting AI APIs for smart features.", style_bullet))

    story.append(Spacer(1, 15))

    # --- ELITE PROTOCOL BOX ---
    elite_title = Paragraph("<b>🔥 THE 'FAST-TRACK' ELITE PROTOCOL</b>", 
                            ParagraphStyle('EliteTitle', parent=style_body, fontSize=12, textColor=BRAND_GOLD))
    
    elite_content = [
        [elite_title],
        [Paragraph("<i>For High Performers targeting future employment.</i>", style_body)],
        [Paragraph("<b>The Rule:</b> Interns who complete all 3 Chunks by <b>Day 20</b> (5 days early) unlock the Elite Tier.", style_body)],
        [Paragraph("<b>The Rewards:</b><br/>• <b>Advanced Module:</b> Admins will assign a complex, production-level feature (e.g., Payment Gateway, Real-time Sockets).<br/>• <b>Distinction Badge:</b> Special mention on the final certificate.<br/>• <b>Hiring Pipeline:</b> Priority consideration for Bubblesort paid projects.", style_body)]
    ]

    t = Table(elite_content, colWidths=[6*inch])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#fffdf5")), 
        ('BOX', (0,0), (-1,-1), 1.5, BRAND_GOLD),
        ('PADDING', (0,0), (-1,-1), 12),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    story.append(t)
    story.append(Spacer(1, 15))

    # 4. PHASE 3
    story.append(Paragraph("PHASE 3: CLOSING & SUBMISSION (Days 26–30)", style_phase_header))
    story.append(Paragraph("Day 26–29: The Final Polish", style_subheader))
    story.append(Paragraph("• <b>Code Freeze:</b> No new features. Focus strictly on bug fixes and performance optimization.", style_bullet))
    story.append(Paragraph("• <b>Documentation:</b> Professional `README.md` required (Setup instructions, Tech Stack, Screenshots).", style_bullet))
    story.append(Paragraph("• <b>Demo Video:</b> 60-second screen-recording walking through the user flow.", style_bullet))

    story.append(Paragraph("Day 30: DEADLINE DAY", style_subheader))
    story.append(Paragraph("<b>Hard Submission Deadline: 11:59 PM.</b>", style_body))
    story.append(Paragraph("• Required: GitHub Repository Link + Live Deployment Link + Video URL.", style_bullet))

    # 5. PHASE 4
    story.append(Paragraph("PHASE 4: EVALUATION & CERTIFICATION (Days 31–35)", style_phase_header))
    story.append(Paragraph("Days 31–34: The Bubblesort Review", style_subheader))
    story.append(Paragraph("• <b>Code Quality Audit:</b> Mentors review code structure, variable naming, and modularity.", style_bullet))
    story.append(Paragraph("• <b>Plagiarism Check:</b> Submissions are cross-referenced to ensure originality.", style_bullet))
    
    story.append(Paragraph("Day 35: CERTIFICATION DAY", style_subheader))
    story.append(Paragraph("• Official release of Internship Certificates via the portal.", style_bullet))
    story.append(Paragraph("• Announcement of Top Performers on Bubblesort social channels.", style_bullet))

    story.append(Spacer(1, 10))
    story.append(Paragraph("_________________________________________________________________", style_body))
    story.append(Spacer(1, 10))

    # 6. RULES
    story.append(Paragraph("⚠️ Sprint Rules:", style_subheader))
    story.append(Paragraph("1. <b>AI Policy:</b> AI is a tool, not a crutch. You must be able to explain the logic behind every line of generated code.", style_bullet))
    story.append(Paragraph("2. <b>Communication:</b> Unexplained absence > 3 days results in immediate disqualification.", style_bullet))
    story.append(Paragraph("3. <b>Professionalism:</b> This is a simulation of a corporate environment. Professional conduct is mandatory.", style_bullet))

    # Build PDF
    doc.build(story, onFirstPage=create_header_footer, onLaterPages=create_header_footer)
    print(f"PDF Generated Successfully: {FILENAME}")

if __name__ == "__main__":
    generate_pdf()