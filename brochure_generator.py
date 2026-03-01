# GKK Interns - Company Brochure PDF Generator
# Generates a professional, beautifully designed company brochure

from fpdf import FPDF
import os

class BrochurePDF(FPDF):
    # Brand Colors
    NAVY = (15, 23, 42)
    DARK_BLUE = (30, 58, 138)
    BRAND_BLUE = (59, 130, 246)
    LIGHT_BLUE = (219, 234, 254)
    ACCENT_CYAN = (6, 182, 212)
    WHITE = (255, 255, 255)
    LIGHT = (241, 245, 249)
    DARK = (30, 41, 59)
    MUTED = (100, 116, 139)
    GREEN = (34, 197, 94)
    ORANGE = (249, 115, 22)
    PURPLE = (139, 92, 246)
    PINK = (236, 72, 153)

    def header(self):
        pass

    def footer(self):
        if self.page_no() > 1:
            self.set_y(-12)
            self.set_font('Helvetica', '', 7)
            self.set_text_color(*self.MUTED)
            self.cell(90, 10, 'gkkintern.in', 0, 0, 'L')
            self.cell(0, 10, f'{self.page_no()}', 0, 0, 'R')

    def section_bar(self, title, color):
        self.set_fill_color(*color)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 16)
        self.cell(0, 14, f'   {title}', 0, 1, 'L', fill=True)
        self.set_text_color(*self.NAVY)
        self.ln(5)

    def accent_line(self, width=60):
        x = self.get_x()
        self.set_draw_color(*self.BRAND_BLUE)
        self.set_line_width(1)
        self.line(x, self.get_y(), x + width, self.get_y())
        self.ln(4)

    def icon_bullet(self, icon, title, desc, color):
        y_start = self.get_y()
        # Icon circle
        self.set_fill_color(*color)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 10)
        cx = self.get_x() + 5
        cy = y_start + 5
        self.ellipse(cx - 5, cy - 5, 10, 10, style='F')
        self.set_xy(cx - 3, cy - 3)
        self.cell(6, 6, icon, 0, 0, 'C')
        # Title + desc
        self.set_xy(20, y_start)
        self.set_text_color(*self.NAVY)
        self.set_font('Helvetica', 'B', 10)
        self.cell(0, 6, title, 0, 1)
        self.set_x(20)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*self.DARK)
        self.multi_cell(170, 4.5, desc)
        self.ln(3)

    def spec_card(self, number, title, desc, tech, color):
        y = self.get_y()
        # Number badge
        self.set_fill_color(*color)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 14)
        self.set_xy(12, y)
        self.cell(10, 10, str(number), 0, 0, 'C', fill=True)
        # Title
        self.set_xy(26, y)
        self.set_text_color(*self.NAVY)
        self.set_font('Helvetica', 'B', 11)
        self.cell(0, 6, title, 0, 1)
        # Desc
        self.set_x(26)
        self.set_font('Helvetica', '', 8)
        self.set_text_color(*self.DARK)
        self.multi_cell(160, 4.5, desc)
        # Tech stack
        self.set_x(26)
        self.set_font('Helvetica', 'B', 7)
        self.set_text_color(*color)
        self.cell(0, 5, f'Tech: {tech}', 0, 1)
        self.ln(4)

    def stat_box(self, x, label, value, color):
        self.set_xy(x, self.get_y())
        self.set_fill_color(*color)
        self.set_text_color(*self.WHITE)
        self.set_font('Helvetica', 'B', 20)
        self.cell(42, 18, value, 0, 0, 'C', fill=True)
        self.set_xy(x, self.get_y() + 18)
        self.set_text_color(*self.NAVY)
        self.set_font('Helvetica', '', 7)
        self.cell(42, 5, label, 0, 0, 'C')


def generate_brochure():
    pdf = BrochurePDF()
    pdf.set_auto_page_break(auto=True, margin=18)

    # ==================== PAGE 1: COVER ====================
    pdf.add_page()

    # Navy background block
    pdf.set_fill_color(*BrochurePDF.NAVY)
    pdf.rect(0, 0, 210, 160, 'F')

    # Brand name
    pdf.set_xy(0, 35)
    pdf.set_text_color(*BrochurePDF.WHITE)
    pdf.set_font('Helvetica', 'B', 42)
    pdf.cell(0, 18, 'GKK INTERNS', 0, 1, 'C')

    # Tagline
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(*BrochurePDF.BRAND_BLUE)
    pdf.cell(0, 8, 'CODE.  BUILD.  DEPLOY.', 0, 1, 'C')

    # Accent line
    pdf.ln(4)
    pdf.set_draw_color(*BrochurePDF.BRAND_BLUE)
    pdf.set_line_width(1.2)
    pdf.line(70, pdf.get_y(), 140, pdf.get_y())
    pdf.ln(8)

    # Subtitle
    pdf.set_text_color(*BrochurePDF.LIGHT)
    pdf.set_font('Helvetica', '', 11)
    pdf.cell(0, 7, 'The Internship Program That Bridges', 0, 1, 'C')
    pdf.cell(0, 7, 'Academic Learning & Industry Demands', 0, 1, 'C')
    pdf.ln(10)

    # Website
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*BrochurePDF.ACCENT_CYAN)
    pdf.cell(0, 8, 'gkkintern.in', 0, 1, 'C')

    # Bottom section
    pdf.set_xy(0, 170)
    pdf.set_text_color(*BrochurePDF.NAVY)
    pdf.set_font('Helvetica', 'B', 13)
    pdf.cell(0, 8, 'COMPANY BROCHURE 2026', 0, 1, 'C')
    pdf.ln(4)
    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(*BrochurePDF.MUTED)
    pdf.cell(0, 5, 'Empowering the next generation of developers', 0, 1, 'C')
    pdf.cell(0, 5, 'through real-world project experience', 0, 1, 'C')

    # Stats bar at bottom
    pdf.ln(15)
    y_stat = pdf.get_y()
    stats = [
        (20, 'Batches Completed', '3+', BrochurePDF.BRAND_BLUE),
        (68, 'Interns Trained', '50+', BrochurePDF.GREEN),
        (116, 'Specializations', '5', BrochurePDF.PURPLE),
        (164, 'Projects Shipped', '15+', BrochurePDF.ORANGE),
    ]
    for x, label, value, color in stats:
        pdf.set_xy(x, y_stat)
        pdf.set_fill_color(*color)
        pdf.set_text_color(*BrochurePDF.WHITE)
        pdf.set_font('Helvetica', 'B', 18)
        pdf.cell(38, 16, value, 0, 0, 'C', fill=True)
        pdf.set_xy(x, y_stat + 17)
        pdf.set_text_color(*BrochurePDF.NAVY)
        pdf.set_font('Helvetica', '', 7)
        pdf.cell(38, 5, label, 0, 0, 'C')

    # ==================== PAGE 2: ABOUT US ====================
    pdf.add_page()
    pdf.section_bar('WHO WE ARE', BrochurePDF.NAVY)

    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(*BrochurePDF.DARK)
    pdf.multi_cell(0, 5.5,
        'GKK Interns is a structured, intensive internship program designed to transform '
        'aspiring developers into industry-ready professionals. We believe the best way to '
        'learn software development is to build real software -- not follow tutorials.'
    )
    pdf.ln(3)
    pdf.multi_cell(0, 5.5,
        'Each batch runs for one month, during which interns work in teams on production-grade '
        'projects under the guidance of experienced mentors. Our program covers the complete '
        'software development lifecycle: from planning and architecture to coding, testing, '
        'and deployment.'
    )
    pdf.ln(5)

    # What makes us different
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*BrochurePDF.BRAND_BLUE)
    pdf.cell(0, 8, 'What Makes Us Different', 0, 1)
    pdf.accent_line(50)
    pdf.ln(2)

    items = [
        ('P', 'Production Code, Not Toy Projects',
         'Interns contribute to real codebases that serve actual users. No "calculator apps" or "to-do lists". Our projects include full-stack web apps, mobile apps, dashboards, and AI-powered tools.',
         BrochurePDF.BRAND_BLUE),
        ('M', 'Mentorship-Driven Learning',
         'Every team is paired with a senior developer who conducts weekly code reviews, conducts 1-on-1 sessions, and ensures interns are learning industry best practices from Day 1.',
         BrochurePDF.GREEN),
        ('S', 'Sprint-Based Workflow',
         'We follow agile methodology with weekly sprints, daily standups, sprint reviews, and retrospectives. Interns learn how real engineering teams operate at startups and tech companies.',
         BrochurePDF.PURPLE),
        ('C', 'Career Outcomes That Matter',
         'Top performers receive LinkedIn recommendations, referral letters, and direct introductions to hiring partners. Your GitHub profile becomes your best resume.',
         BrochurePDF.ORANGE),
    ]
    for icon, title, desc, color in items:
        pdf.icon_bullet(icon, title, desc, color)

    # ==================== PAGE 3: SPECIALIZATIONS ====================
    pdf.add_page()
    pdf.section_bar('PROGRAM SPECIALIZATIONS', BrochurePDF.DARK_BLUE)

    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(*BrochurePDF.DARK)
    pdf.multi_cell(0, 5,
        'Choose your track based on your interests and career goals. Each specialization '
        'is designed to give you deep, practical expertise in the most in-demand areas of tech.'
    )
    pdf.ln(5)

    specs = [
        (1, 'Full-Stack Web Development',
         'Build complete web applications from frontend to backend. Master modern frameworks, '
         'database design, authentication systems, and cloud deployment pipelines. Ship features '
         'that real users interact with every day.',
         'React, Node.js, MongoDB, Next.js, Supabase', BrochurePDF.BRAND_BLUE),
        (2, 'Mobile App Development',
         'Create cross-platform mobile applications that work beautifully on both iOS and Android. '
         'Learn mobile-specific architecture patterns, native APIs, and app store deployment.',
         'React Native, Flutter, Firebase, Android, iOS', BrochurePDF.GREEN),
        (3, 'UI/UX Engineering',
         'Design beautiful, accessible, and user-centric interfaces. Learn design systems, '
         'prototyping workflows, component architecture, and how to translate Figma designs into pixel-perfect code.',
         'Figma, Tailwind CSS, Design Systems, Framer Motion', BrochurePDF.PURPLE),
        (4, 'Backend & API Development',
         'Architect scalable APIs and microservices that handle thousands of requests. Deep dive '
         'into database optimization, caching strategies, authentication, and cloud infrastructure.',
         'GraphQL, Docker, AWS, PostgreSQL, Redis', BrochurePDF.ORANGE),
        (5, 'AI & Machine Learning',
         'Integrate AI into real products that solve real problems. Build intelligent chatbots, '
         'recommendation engines, and automation tools using cutting-edge ML frameworks.',
         'Python, TensorFlow, OpenAI API, LangChain', BrochurePDF.PINK),
    ]
    for num, title, desc, tech, color in specs:
        pdf.spec_card(num, title, desc, tech, color)

    # ==================== PAGE 4: HOW IT WORKS ====================
    pdf.add_page()
    pdf.section_bar('HOW IT WORKS', BrochurePDF.BRAND_BLUE)

    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(*BrochurePDF.DARK)
    pdf.multi_cell(0, 5,
        'Our structured 4-step process ensures every intern gets the support, direction, and '
        'real-world experience needed to accelerate their career.'
    )
    pdf.ln(6)

    steps = [
        ('1', 'APPLY', 'Submit Your Application',
         'Visit gkkintern.in and complete the application form. Upload your resume/CV -- our AI-powered '
         'system (Cloudy) automatically extracts your details. Choose your preferred interview slot. '
         'Applications are reviewed on a rolling basis.',
         'Duration: 7-14 days | Format: Online application',
         BrochurePDF.BRAND_BLUE),
        ('2', 'INTERVIEW', 'Show Us Your Potential',
         'Selected applicants are invited for a brief interview (15-20 min). We evaluate your passion '
         'for coding, problem-solving mindset, and willingness to learn. No algorithms tests -- we care '
         'about your enthusiasm and growth potential, not just your current skill level.',
         'Duration: 15-20 min | Format: Video call',
         BrochurePDF.GREEN),
        ('3', 'JOIN', 'Start Building on Day 1',
         'Approved candidates receive their onboarding pack: tools setup guide, team assignment, project '
         'brief, and access to the intern dashboard and mobile app. You hit the ground running from Day 1 '
         'with a real project and a real team.',
         'Duration: 1 day | Format: Virtual kickoff',
         BrochurePDF.PURPLE),
        ('4', 'SHIP', 'Demo Day & Certification',
         'After 4 weeks of sprinting, every team presents their completed project at Demo Day. Top '
         'performers earn certificates of excellence, LinkedIn recommendations, and referral letters. '
         'All graduates join the GKK Alumni Network for ongoing opportunities.',
         'Duration: 1 month total | Format: Agile sprints',
         BrochurePDF.ORANGE),
    ]

    for num, label, title, desc, meta, color in steps:
        y = pdf.get_y()

        # Step number circle
        pdf.set_fill_color(*color)
        pdf.set_text_color(*BrochurePDF.WHITE)
        pdf.set_font('Helvetica', 'B', 16)
        pdf.set_xy(12, y)
        pdf.cell(14, 14, num, 0, 0, 'C', fill=True)

        # Label + Title
        pdf.set_xy(30, y)
        pdf.set_text_color(*color)
        pdf.set_font('Helvetica', 'B', 8)
        pdf.cell(0, 4, label, 0, 1)
        pdf.set_x(30)
        pdf.set_text_color(*BrochurePDF.NAVY)
        pdf.set_font('Helvetica', 'B', 12)
        pdf.cell(0, 7, title, 0, 1)

        # Description
        pdf.set_x(30)
        pdf.set_font('Helvetica', '', 8)
        pdf.set_text_color(*BrochurePDF.DARK)
        pdf.multi_cell(160, 4.5, desc)

        # Meta info
        pdf.set_x(30)
        pdf.set_font('Helvetica', 'I', 7)
        pdf.set_text_color(*BrochurePDF.MUTED)
        pdf.cell(0, 5, meta, 0, 1)
        pdf.ln(5)

    # ==================== PAGE 5: WHAT YOU GET ====================
    pdf.add_page()
    pdf.section_bar('WHAT INTERNS RECEIVE', BrochurePDF.GREEN)
    pdf.ln(2)

    benefits = [
        ('Real Project Experience',
         'Work on production software used by real people. Build features that ship to thousands of users.',
         BrochurePDF.BRAND_BLUE),
        ('Expert Code Reviews',
         'Senior developers review your code weekly. Learn clean architecture, best practices, and efficient coding patterns.',
         BrochurePDF.GREEN),
        ('Professional Certificate',
         'Receive a verified internship completion certificate recognized by industry partners.',
         BrochurePDF.PURPLE),
        ('LinkedIn Recommendation',
         'Top performers get personalized LinkedIn recommendations from program leads and mentors.',
         BrochurePDF.ORANGE),
        ('Partner Company Referrals',
         'Outstanding interns get direct referrals to our hiring partners for full-time roles and advanced internships.',
         BrochurePDF.PINK),
        ('Alumni Network Access',
         'Join a growing community of developers. Access hackathons, job boards, and networking events.',
         BrochurePDF.ACCENT_CYAN),
        ('Portfolio-Ready Projects',
         'Walk away with a deployed, production-quality project on your GitHub. The strongest asset for job interviews.',
         BrochurePDF.DARK_BLUE),
        ('Recorded Sessions Library',
         'Access recorded mentorship sessions, workshops, and project reviews through the intern dashboard.',
         BrochurePDF.BRAND_BLUE),
    ]

    col1_x = 12
    col2_x = 105
    col_w = 82

    for i, (title, desc, color) in enumerate(benefits):
        x = col1_x if i % 2 == 0 else col2_x
        if i % 2 == 0:
            y_row = pdf.get_y()

        pdf.set_xy(x, y_row)

        # Color bar
        pdf.set_fill_color(*color)
        pdf.rect(x, y_row, 2, 22, 'F')

        # Title
        pdf.set_xy(x + 5, y_row + 1)
        pdf.set_text_color(*BrochurePDF.NAVY)
        pdf.set_font('Helvetica', 'B', 9)
        pdf.cell(col_w, 5, title, 0, 1)

        # Desc
        pdf.set_x(x + 5)
        pdf.set_font('Helvetica', '', 7)
        pdf.set_text_color(*BrochurePDF.DARK)
        pdf.multi_cell(col_w - 5, 3.8, desc)

        if i % 2 == 1:
            pdf.set_y(y_row + 28)

    if len(benefits) % 2 == 1:
        pdf.set_y(y_row + 28)

    # ==================== PAGE 5 continued: TECH ECOSYSTEM ====================
    pdf.ln(10)
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(*BrochurePDF.BRAND_BLUE)
    pdf.cell(0, 8, 'Our Technology Ecosystem', 0, 1)
    pdf.accent_line(50)
    pdf.ln(3)

    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(*BrochurePDF.DARK)
    pdf.multi_cell(0, 5,
        'Interns work with the same tools and technologies used by leading tech companies:'
    )
    pdf.ln(3)

    tech_cats = [
        ('Frontend', 'React, Next.js, Tailwind CSS, Framer Motion, TypeScript'),
        ('Backend', 'Node.js, Supabase, PostgreSQL, GraphQL, REST APIs'),
        ('Mobile', 'React Native, Flutter, Firebase, Dart'),
        ('DevOps', 'Git/GitHub, Netlify, Docker, CI/CD, Vercel'),
        ('AI/ML', 'Python, TensorFlow, OpenAI API, LangChain, Gemini'),
        ('Design', 'Figma, Adobe XD, Design Systems, Prototyping'),
    ]

    w = [30, 160]
    pdf.set_fill_color(*BrochurePDF.NAVY)
    pdf.set_text_color(*BrochurePDF.WHITE)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.cell(w[0], 7, 'Category', 0, 0, 'C', fill=True)
    pdf.cell(w[1], 7, 'Technologies', 0, 1, 'C', fill=True)
    pdf.set_text_color(*BrochurePDF.NAVY)

    for i, (cat, techs) in enumerate(tech_cats):
        bg = i % 2 == 0
        if bg:
            pdf.set_fill_color(*BrochurePDF.LIGHT)
        pdf.set_font('Helvetica', 'B', 8)
        pdf.cell(w[0], 6, cat, 0, 0, 'C', fill=bg)
        pdf.set_font('Helvetica', '', 8)
        pdf.cell(w[1], 6, techs, 0, 1, 'L', fill=bg)

    # ==================== PAGE 6: PRICING + TRUST ====================
    pdf.add_page()
    pdf.section_bar('PROGRAM INVESTMENT', BrochurePDF.NAVY)
    pdf.ln(2)

    # Price hero
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(*BrochurePDF.DARK)
    pdf.multi_cell(0, 5,
        'We believe world-class tech education should be accessible to everyone. '
        'Our program fee is designed to be affordable while ensuring commitment and quality.'
    )
    pdf.ln(8)

    # Price box - centered
    box_w = 120
    box_x = (210 - box_w) / 2
    y_price = pdf.get_y()

    # Outer box
    pdf.set_fill_color(*BrochurePDF.LIGHT)
    pdf.rect(box_x, y_price, box_w, 55, 'F')

    # Accent top bar
    pdf.set_fill_color(*BrochurePDF.BRAND_BLUE)
    pdf.rect(box_x, y_price, box_w, 4, 'F')

    # Price amount
    pdf.set_xy(box_x, y_price + 8)
    pdf.set_text_color(*BrochurePDF.NAVY)
    pdf.set_font('Helvetica', 'B', 32)
    pdf.cell(box_w, 14, 'Rs. 499', 0, 1, 'C')

    # One-time label
    pdf.set_x(box_x)
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(*BrochurePDF.MUTED)
    pdf.cell(box_w, 6, 'One-Time Payment + Platform Fee', 0, 1, 'C')

    # Platform fee note
    pdf.set_x(box_x)
    pdf.set_font('Helvetica', 'I', 7)
    pdf.set_text_color(*BrochurePDF.MUTED)
    pdf.cell(box_w, 4, '(A small Razorpay processing fee may apply at checkout)', 0, 1, 'C')

    # Divider inside box
    pdf.set_draw_color(*BrochurePDF.BRAND_BLUE)
    pdf.set_line_width(0.3)
    pdf.line(box_x + 15, pdf.get_y() + 3, box_x + box_w - 15, pdf.get_y() + 3)
    pdf.ln(7)

    # What's included label
    pdf.set_x(box_x)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(*BrochurePDF.BRAND_BLUE)
    pdf.cell(box_w, 5, 'EVERYTHING INCLUDED', 0, 1, 'C')

    pdf.set_y(y_price + 60)
    pdf.ln(5)

    # Included items in 2 columns
    included = [
        'Full 1-month internship program',
        'Team project assignment',
        'Weekly mentor code reviews',
        'Intern dashboard + mobile app access',
        'Community chat access',
        'Recorded sessions library',
        'Internship completion certificate',
        'LinkedIn recommendation (top performers)',
        'Partner company referrals',
        'Alumni network lifetime access',
    ]

    col1_x = 30
    col2_x = 110

    for i, item in enumerate(included):
        x = col1_x if i % 2 == 0 else col2_x
        if i % 2 == 0:
            y_item = pdf.get_y()
        pdf.set_xy(x, y_item)
        pdf.set_font('Helvetica', 'B', 8)
        pdf.set_text_color(*BrochurePDF.GREEN)
        pdf.cell(5, 5, '+', 0, 0)
        pdf.set_font('Helvetica', '', 8)
        pdf.set_text_color(*BrochurePDF.DARK)
        pdf.cell(70, 5, item, 0, 0)
        if i % 2 == 1:
            pdf.ln(6)

    if len(included) % 2 == 1:
        pdf.ln(6)

    pdf.ln(8)

    # ==================== TRUST & COMPLIANCE BADGES ====================
    pdf.add_page()
    pdf.section_bar('TRUST & COMPLIANCE', BrochurePDF.DARK_BLUE)
    pdf.ln(2)

    pdf.set_font('Helvetica', '', 9)
    pdf.set_text_color(*BrochurePDF.DARK)
    pdf.multi_cell(0, 5,
        'Your data, payments, and personal information are protected by '
        'industry-standard security measures and trusted payment partners.'
    )
    pdf.ln(6)

    # Badge grid - 3 columns
    badges = [
        ('SSL', 'SSL ENCRYPTED', 'All data transmitted over',
         'HTTPS/TLS encryption', BrochurePDF.GREEN),
        ('RZP', 'RAZORPAY VERIFIED', 'Payments processed via',
         'RBI-compliant Razorpay', BrochurePDF.BRAND_BLUE),
        ('PCI', 'PCI DSS COMPLIANT', 'Payment card data handled',
         'per PCI DSS standards', BrochurePDF.NAVY),
        ('GDP', 'DATA PRIVACY', 'Personal data handled with',
         'strict privacy policies', BrochurePDF.PURPLE),
        ('VER', 'VERIFIED PROGRAM', 'Structured curriculum with',
         'proven track record', BrochurePDF.ORANGE),
        ('NR', 'NO REFUND POLICY', 'All payments are final.',
         'No refunds once enrolled', BrochurePDF.ACCENT_CYAN),
        ('MS', 'REGISTERED MSME', 'Government verified',
         'MSME registered entity', BrochurePDF.GREEN),
        ('DM', 'DMCA PROTECTED', 'All content and IP is',
         'DMCA protected', BrochurePDF.BRAND_BLUE),
        ('IN', 'BUILT IN INDIA', 'Proudly made in',
         'West Bengal, India', BrochurePDF.ORANGE),
    ]

    # Additional row for venture branding
    venture_badges = [
        ('BS', 'A VENTURE BY', 'BubbleSort Group',
         'Parent organization', BrochurePDF.NAVY),
    ]
    badges.extend(venture_badges)

    badge_w = 58
    for i, (icon, title, line1, line2, color) in enumerate(badges):
        col = i % 3
        if col == 0:
            y_badge = pdf.get_y()
        x = 12 + col * 64

        # Badge circle
        pdf.set_fill_color(*color)
        pdf.set_text_color(*BrochurePDF.WHITE)
        pdf.set_font('Helvetica', 'B', 9)
        cx = x + badge_w / 2
        pdf.set_xy(cx - 8, y_badge)
        pdf.cell(16, 10, icon, 0, 0, 'C', fill=True)

        # Badge title
        pdf.set_xy(x, y_badge + 12)
        pdf.set_text_color(*BrochurePDF.NAVY)
        pdf.set_font('Helvetica', 'B', 7)
        pdf.cell(badge_w, 4, title, 0, 1, 'C')

        # Badge desc
        pdf.set_xy(x, y_badge + 16)
        pdf.set_font('Helvetica', '', 6)
        pdf.set_text_color(*BrochurePDF.MUTED)
        pdf.cell(badge_w, 3.5, line1, 0, 1, 'C')
        pdf.set_x(x)
        pdf.cell(badge_w, 3.5, line2, 0, 1, 'C')

        if col == 2:
            pdf.set_y(y_badge + 28)

    if len(badges) % 3 != 0:
        pdf.set_y(y_badge + 28)

    # ==================== PAGE 7: APPLY NOW ====================
    pdf.add_page()

    # Full page CTA
    pdf.set_fill_color(*BrochurePDF.NAVY)
    pdf.rect(0, 0, 210, 297, 'F')

    pdf.set_xy(0, 60)
    pdf.set_text_color(*BrochurePDF.WHITE)
    pdf.set_font('Helvetica', '', 12)
    pdf.cell(0, 8, 'READY TO', 0, 1, 'C')
    pdf.set_font('Helvetica', 'B', 36)
    pdf.cell(0, 18, 'START BUILDING?', 0, 1, 'C')
    pdf.ln(8)

    pdf.set_draw_color(*BrochurePDF.BRAND_BLUE)
    pdf.set_line_width(1.5)
    pdf.line(60, pdf.get_y(), 150, pdf.get_y())
    pdf.ln(10)

    pdf.set_font('Helvetica', '', 11)
    pdf.set_text_color(*BrochurePDF.LIGHT)
    lines = [
        'The best way to learn to code is to code.',
        'Stop watching tutorials. Start shipping software.',
        '',
        'Join a team. Build real products.',
        'Get mentored by senior developers.',
        'Launch your career in tech.',
    ]
    for line in lines:
        pdf.cell(0, 7, line, 0, 1, 'C')

    pdf.ln(15)

    # CTA Button
    pdf.set_fill_color(*BrochurePDF.BRAND_BLUE)
    pdf.set_text_color(*BrochurePDF.WHITE)
    pdf.set_font('Helvetica', 'B', 16)
    btn_w = 80
    btn_x = (210 - btn_w) / 2
    pdf.set_x(btn_x)
    pdf.cell(btn_w, 16, 'APPLY NOW', 0, 1, 'C', fill=True)

    pdf.ln(6)
    pdf.set_font('Helvetica', '', 12)
    pdf.set_text_color(*BrochurePDF.ACCENT_CYAN)
    pdf.cell(0, 8, 'gkkintern.in', 0, 1, 'C')

    pdf.ln(20)
    pdf.set_text_color(*BrochurePDF.MUTED)
    pdf.set_font('Helvetica', '', 8)
    pdf.cell(0, 5, 'Batch 3 Applications Open: March 2, 2026', 0, 1, 'C')
    pdf.cell(0, 5, 'Limited seats available. Apply early.', 0, 1, 'C')

    pdf.ln(20)
    pdf.set_text_color(60, 70, 90)
    pdf.set_font('Helvetica', 'I', 8)
    pdf.cell(0, 5, 'GKK Interns - The Collapse of Convention', 0, 1, 'C')
    pdf.cell(0, 5, 'Convention collapses here, innovation begins.', 0, 1, 'C')

    # Save
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'GKK_Interns_Company_Brochure.pdf')
    pdf.output(output_path)
    print(f'\n  Brochure PDF generated successfully!')
    print(f'  Location: {output_path}')
    print(f'  Pages: {pdf.page_no()}')
    return output_path


if __name__ == '__main__':
    generate_brochure()
