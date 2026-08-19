"""
Generates data/skills.json — the controlled vocabulary for REACH.

Each row: (id_suffix, canonicalName, category, prerequisites, learnHours,
           costBand, verifiableBy, aliases)

Aliases must include Hinglish / spoken surface forms, lowercased, no
punctuation. These are what the normalizer matches against.
"""
import json, os

C_RS = "retail_sales"
C_AB = "accounting_billing"
C_DA = "digital_admin"
C_TR = "trades"
C_HF = "hospitality_food"
C_LG = "logistics"
C_CA = "care"
C_MO = "machine_operation"
C_CL = "communication_language"

S = []


def s(sid, name, cat, prereq, hours, cost, verif, aliases):
    S.append({
        "id": "SKILL_" + sid,
        "canonicalName": name,
        "aliases": sorted(set(a.lower().strip() for a in aliases)),
        "category": cat,
        "prerequisites": ["SKILL_" + p for p in prereq],
        "learnHours": hours,
        "learnCostBand": cost,
        "verifiableBy": verif,
    })


# ── retail & sales ────────────────────────────────────────────────────
s("CUSTOMER_HANDLING", "Customer Handling", C_RS, [], 12, "free",
  "Short role-play with a mock customer", [
   "customer handling", "customer service", "customer handle karna",
   "grahak se baat", "customer se baat karna", "dealing with customers",
   "handling customers", "customer support", "grahak sambhalna"])
s("SALES_FLOOR", "Sales (Floor / Counter)", C_RS, ["CUSTOMER_HANDLING"], 20, "free",
  "Mock sales conversation, objection handling", [
   "sales", "selling", "salesman", "saleswoman", "bikri", "bechna",
   "counter sales", "floor sales", "shop sales", "saman bechna"])
s("UPSELLING", "Upselling & Cross-selling", C_RS, ["SALES_FLOOR"], 10, "free",
  "Mock scenario: attach a second product to a sale", [
   "upselling", "cross selling", "upsell", "extra saman bechna",
   "suggestive selling"])
s("PRODUCT_KNOWLEDGE", "Product Knowledge", C_RS, [], 15, "free",
  "Quiz on a given product category", [
   "product knowledge", "product ki jankari", "saman ki jankari",
   "knows products", "item knowledge"])
s("INVENTORY_MGMT", "Inventory Management", C_RS, [], 25, "low",
  "Stock reconciliation exercise", [
   "inventory", "inventory management", "stock", "stock register",
   "stock maintain", "stock rakhna", "stock sambhalna", "godown stock",
   "stock keeping", "stock check", "maal ka hisaab"])
s("STOCK_AUDIT", "Stock Audit & Reconciliation", C_RS, ["INVENTORY_MGMT"], 18, "low",
  "Find discrepancies in a sample stock sheet", [
   "stock audit", "stock reconciliation", "stock milana", "physical stock count",
   "stock verification"])
s("VISUAL_MERCH", "Visual Merchandising", C_RS, [], 20, "low",
  "Before/after photos of a shelf arrangement", [
   "visual merchandising", "display", "shelf display", "saman sajana",
   "product display", "merchandising"])
s("RETAIL_OPS", "Retail Operations", C_RS, [], 30, "low",
  "Describe open-to-close duties for a shop", [
   "retail", "retail operations", "shop operations", "dukan chalana",
   "shop management", "store operations", "dukan ka kaam"])
s("NEGOTIATION", "Negotiation", C_RS, ["CUSTOMER_HANDLING"], 15, "free",
  "Mock price negotiation", [
   "negotiation", "bargaining", "mol bhav", "bhav tay karna", "rate negotiate"])
s("FIELD_SALES", "Field Sales / Door-to-door", C_RS, ["SALES_FLOOR"], 25, "free",
  "Territory plan and cold-approach script", [
   "field sales", "door to door", "outdoor sales", "field work sales",
   "marketing field", "ghar ghar jakar bechna"])
s("TELECALLING", "Telecalling", C_RS, ["CUSTOMER_HANDLING"], 15, "free",
  "Recorded mock call", [
   "telecalling", "tele calling", "phone calls", "calling", "call karna",
   "phone pe baat", "telesales", "cold calling"])
s("COMPLAINT_HANDLING", "Complaint Handling", C_RS, ["CUSTOMER_HANDLING"], 12, "free",
  "Handle an escalated mock complaint", [
   "complaint handling", "grievance", "shikayat sambhalna",
   "customer complaints", "problem solve karna customer ka"])

# ── accounting & billing ──────────────────────────────────────────────
s("CASH_HANDLING", "Cash Handling", C_AB, [], 8, "free",
  "Cash drawer balancing exercise", [
   "cash handling", "cash counter", "cash", "paisa", "paise sambhalna",
   "cash lena dena", "cash counting", "handling money", "galla"])
s("BILLING_MANUAL", "Manual Billing", C_AB, ["ARITHMETIC"], 10, "free",
  "Write a correct bill for a 6-item basket", [
   "billing", "bill banana", "manual billing", "bill making", "invoicing",
   "bill likhna", "bills"])
s("BILLING_SOFTWARE", "Billing Software / POS", C_AB, ["BILLING_MANUAL"], 20, "low",
  "Complete a sale on a POS terminal", [
   "pos", "point of sale", "billing software", "billing machine",
   "swipe machine", "pos machine", "computer billing", "bill software",
   "pos billing", "billing system", "software billing", "billing counter software"])
s("ARITHMETIC", "Practical Arithmetic", C_AB, [], 15, "free",
  "Percentage, discount and change-making test", [
   "arithmetic", "calculation", "hisaab", "hisab kitab", "maths",
   "calculations", "ganit", "basic maths"])
s("BOOKKEEPING", "Basic Bookkeeping", C_AB, ["ARITHMETIC"], 35, "low",
  "Maintain a day-book for a week", [
   "bookkeeping", "book keeping", "accounts", "khata", "khata likhna",
   "ledger", "accounting basics", "bahi khata", "daybook"])
s("TALLY_BASIC", "Tally (Basic)", C_AB, ["BOOKKEEPING"], 40, "medium",
  "Create vouchers and a trial balance in Tally", [
   "tally", "tally erp", "tally prime", "tally chalana", "tally software",
   "tally basic", "tally erp 9"])
s("TALLY_ADVANCED", "Tally (Advanced)", C_AB, ["TALLY_BASIC"], 45, "medium",
  "Generate P&L and balance sheet in Tally", [
   "advanced tally", "tally advanced", "tally reports", "tally full"])
s("GST_FILING", "GST Billing & Filing", C_AB, ["TALLY_BASIC"], 35, "medium",
  "Prepare a GSTR-1 style return from sample invoices", [
   "gst", "gst filing", "gst billing", "gst return", "gst ka kaam",
   "tax filing", "gst invoice"])
s("PAYROLL_BASIC", "Basic Payroll", C_AB, ["BOOKKEEPING"], 25, "low",
  "Compute monthly wages with deductions", [
   "payroll", "salary calculation", "salary banana", "wages",
   "tankha ka hisaab", "attendance salary"])
s("UPI_DIGITAL_PAY", "Digital Payments (UPI/QR)", C_AB, [], 5, "free",
  "Process and verify a UPI transaction", [
   "upi", "upi payments", "gpay", "google pay", "phonepe", "paytm",
   "qr code payment", "online payment", "online payments", "digital payment",
   "digital payments", "scanner payment", "cashless payment"])
s("CREDIT_LEDGER", "Credit / Udhaar Ledger", C_AB, ["BOOKKEEPING"], 12, "free",
  "Maintain and reconcile a customer credit book", [
   "udhaar", "credit ledger", "udhar khata", "credit book", "customer credit"])
s("PURCHASE_ORDERS", "Purchase & Vendor Orders", C_AB, ["INVENTORY_MGMT"], 20, "low",
  "Raise a PO and match it to an invoice", [
   "purchase order", "po", "vendor orders", "ordering", "supplier order",
   "maal mangwana", "purchase"])

# ── digital & admin ───────────────────────────────────────────────────
s("SMARTPHONE_LITERACY", "Smartphone Literacy", C_DA, [], 8, "free",
  "Navigate apps, files and settings unaided", [
   "smartphone", "mobile", "phone use", "mobile chalana", "android",
   "phone chalana", "mobile literacy"])
s("COMPUTER_BASICS", "Computer Basics", C_DA, [], 25, "low",
  "File management and typing test", [
   "computer", "computer basics", "computer chalana", "basic computer",
   "pc", "laptop use", "computer knowledge", "ms office basic"])
s("TYPING_ENGLISH", "English Typing", C_DA, ["COMPUTER_BASICS"], 30, "free",
  "30 WPM typing test", [
   "typing", "english typing", "typing speed", "keyboard", "typist"])
s("TYPING_TAMIL", "Tamil Typing", C_DA, ["COMPUTER_BASICS"], 35, "free",
  "Tamil typing test", [
   "tamil typing", "tamil keyboard", "regional typing"])
s("EXCEL_BASIC", "Excel (Basic)", C_DA, ["COMPUTER_BASICS"], 25, "free",
  "Build a formatted sheet with SUM/IF", [
   "excel", "ms excel", "excel basic", "spreadsheet", "excel sheet",
   "excel banana", "excel sheets", "excel chalana", "sheets"])
s("EXCEL_ADVANCED", "Excel (Advanced)", C_DA, ["EXCEL_BASIC"], 40, "low",
  "Pivot table and VLOOKUP exercise", [
   "advanced excel", "excel advanced", "pivot table", "vlookup",
   "excel formulas", "excel pro"])
s("WORD_PROCESSING", "Word Processing", C_DA, ["COMPUTER_BASICS"], 15, "free",
  "Format a two-page letter", [
   "ms word", "word", "word processing", "document banana", "typing letters"])
s("DATA_ENTRY", "Data Entry", C_DA, ["TYPING_ENGLISH"], 20, "free",
  "Enter 100 records with <2% error", [
   "data entry", "data entry operator", "entry work", "data feeding",
   "computer entry", "deo"])
s("EMAIL_COMMS", "Email Communication", C_DA, ["COMPUTER_BASICS"], 12, "free",
  "Draft a professional email", [
   "email", "e mail", "mail karna", "gmail", "email writing", "mailing"])
s("WHATSAPP_BUSINESS", "WhatsApp Business", C_DA, ["SMARTPHONE_LITERACY"], 8, "free",
  "Set up a catalogue and broadcast list", [
   "whatsapp business", "whatsapp", "whatsapp pe order", "wa business",
   "whatsapp marketing"])
s("SOCIAL_MEDIA_BASIC", "Social Media for Business", C_DA, ["SMARTPHONE_LITERACY"], 20, "free",
  "Run a shop page for two weeks", [
   "social media", "instagram", "facebook", "insta", "fb page",
   "social media marketing", "reels"])
s("PHOTO_EDITING_BASIC", "Basic Photo Editing", C_DA, ["SMARTPHONE_LITERACY"], 18, "free",
  "Produce five edited product photos", [
   "photo editing", "photoshop basic", "canva", "image editing",
   "photo edit karna", "poster banana"])
s("ONLINE_FORMS", "Online Forms & Portals", C_DA, ["SMARTPHONE_LITERACY"], 10, "free",
  "Complete a government portal application", [
   "online form", "form filling", "online application", "portal",
   "form bharna", "online form bharna"])
s("ECOM_LISTING", "E-commerce Listing", C_DA, ["PHOTO_EDITING_BASIC"], 25, "low",
  "List 10 products with correct attributes", [
   "ecommerce", "e commerce", "online listing", "amazon listing",
   "flipkart listing", "meesho", "online selling"])
s("PRINTER_SCANNER", "Printer & Scanner Operation", C_DA, ["COMPUTER_BASICS"], 6, "free",
  "Scan, print and photocopy a document set", [
   "printer", "xerox", "scanning", "photocopy", "print nikalna",
   "xerox machine", "scanner"])
s("CCTV_MONITORING", "CCTV Monitoring", C_DA, [], 10, "free",
  "Review footage and log an incident", [
   "cctv", "cctv monitoring", "camera dekhna", "surveillance",
   "security camera"])
s("FILE_RECORDKEEPING", "Filing & Recordkeeping", C_DA, [], 12, "free",
  "Organise and retrieve from a filing system", [
   "filing", "record keeping", "recordkeeping", "file recordkeeping",
   "records", "records management", "file rakhna", "documentation", "paperwork"])

# ── communication & language ──────────────────────────────────────────
s("SPOKEN_TAMIL", "Spoken Tamil", C_CL, [], 0, "free",
  "Conversational assessment", [
   "tamil", "spoken tamil", "tamil bolna", "tamil speaking", "tamizh"])
s("SPOKEN_HINDI", "Spoken Hindi", C_CL, [], 0, "free",
  "Conversational assessment", [
   "hindi", "spoken hindi", "hindi bolna", "hindi speaking"])
s("SPOKEN_ENGLISH_BASIC", "Spoken English (Basic)", C_CL, [], 120, "medium",
  "A2-level conversational assessment", [
   "english", "spoken english", "english bolna", "english speaking",
   "basic english", "english communication"])
s("SPOKEN_ENGLISH_FLUENT", "Spoken English (Fluent)", C_CL, ["SPOKEN_ENGLISH_BASIC"], 150, "medium",
  "B2-level conversational assessment", [
   "fluent english", "good english", "english fluency", "advanced english"])
s("SPOKEN_TELUGU", "Spoken Telugu", C_CL, [], 0, "free",
  "Conversational assessment", [
   "telugu", "spoken telugu", "telugu bolna"])
s("WRITTEN_ENGLISH", "Written English", C_CL, ["SPOKEN_ENGLISH_BASIC"], 60, "low",
  "Write a one-page report", [
   "written english", "english writing", "writing", "english likhna"])
s("COMMUNICATION", "Interpersonal Communication", C_CL, [], 15, "free",
  "Structured interview assessment", [
   "communication", "communication skills", "baat karna", "talking",
   "interpersonal", "soft skills", "achi baat cheet"])
s("TEAM_COORDINATION", "Team Coordination", C_CL, ["COMMUNICATION"], 20, "free",
  "Coordinate a 3-person mock task", [
   "team work", "teamwork", "coordination", "team coordination",
   "team ke saath kaam", "collaboration"])
s("SUPERVISION", "Team Supervision", C_CL, ["TEAM_COORDINATION"], 40, "low",
  "Roster and delegate for a shift", [
   "supervision", "supervisor", "team lead", "managing people",
   "supervising staff", "staff supervision", "managing staff", "team supervision",
   "staff sambhalna", "leadership", "incharge"])
s("TRAINING_OTHERS", "Training Others", C_CL, ["COMMUNICATION"], 25, "free",
  "Deliver a 15-minute task demonstration", [
   "training", "teaching staff", "training dena", "onboarding",
   "sikhana", "mentoring"])

# ── hospitality & food ────────────────────────────────────────────────
s("FOOD_PREP", "Food Preparation", C_HF, [], 40, "low",
  "Prepare three items to a standard recipe", [
   "cooking", "food preparation", "khana banana", "kitchen work",
   "cook", "food prep", "chef work"])
s("FOOD_HYGIENE", "Food Safety & Hygiene", C_HF, [], 12, "low",
  "FSSAI basic hygiene checklist", [
   "food hygiene", "food safety", "hygiene", "fssai",
   "cleanliness food"])
s("BAKERY_COUNTER", "Bakery Counter Service", C_HF, ["CUSTOMER_HANDLING"], 18, "free",
  "Handle a counter rush, packing and billing", [
   "bakery", "bakery counter", "bakery work", "cake shop",
   "bakery pe kaam", "counter bakery"])
s("BARISTA", "Beverage / Barista Skills", C_HF, ["FOOD_HYGIENE"], 30, "low",
  "Prepare six standard beverages", [
   "barista", "coffee", "tea making", "chai banana", "juice",
   "beverages", "coffee banana"])
s("TABLE_SERVICE", "Table Service", C_HF, ["CUSTOMER_HANDLING"], 20, "free",
  "Serve a four-cover table", [
   "waiter", "table service", "serving", "steward", "server",
   "waiter ka kaam", "table pe serve"])
s("ORDER_MANAGEMENT", "Order Management", C_HF, [], 15, "free",
  "Take, sequence and track 10 orders", [
   "order management", "order taking", "order lena", "orders",
   "order handle karna", "kot"])
s("KITCHEN_ASSIST", "Kitchen Assistance", C_HF, ["FOOD_HYGIENE"], 20, "free",
  "Prep, plate and clean-down cycle", [
   "kitchen helper", "kitchen assistant", "helper kitchen",
   "kitchen ka kaam", "commis"])
s("HOUSEKEEPING", "Housekeeping", C_HF, [], 20, "free",
  "Clean and reset a room to checklist", [
   "housekeeping", "cleaning", "safai", "room cleaning", "maid",
   "cleaner", "saaf safai"])
s("FRONT_DESK", "Front Desk / Reception", C_HF, ["COMMUNICATION"], 25, "low",
  "Handle check-in, calls and a walk-in enquiry", [
   "reception", "front desk", "receptionist", "front office",
   "reception ka kaam"])
s("FOOD_PACKAGING", "Food Packaging", C_HF, ["FOOD_HYGIENE"], 10, "free",
  "Pack and label 20 orders correctly", [
   "packing", "food packing", "packaging", "packing karna", "parcel"])
s("CATERING_OPS", "Catering Operations", C_HF, ["FOOD_PREP"], 30, "low",
  "Plan service for a 50-person event", [
   "catering", "catering work", "event food", "function catering",
   "mess work"])

# ── trades ────────────────────────────────────────────────────────────
s("ELECTRICAL_BASIC", "Basic Electrical Work", C_TR, [], 80, "medium",
  "Wire a switchboard to code", [
   "electrician", "electrical", "wiring", "bijli ka kaam", "electric work",
   "electrical repair"])
s("PLUMBING_BASIC", "Basic Plumbing", C_TR, [], 70, "medium",
  "Fix a leak and install a tap", [
   "plumber", "plumbing", "pipe", "nal ka kaam", "pipe fitting",
   "plumbing work"])
s("CARPENTRY_BASIC", "Basic Carpentry", C_TR, [], 90, "medium",
  "Build a simple joined frame", [
   "carpenter", "carpentry", "wood work", "badhai", "furniture work",
   "lakdi ka kaam"])
s("PAINTING_WALL", "Wall Painting", C_TR, [], 40, "low",
  "Prep and paint a room to finish", [
   "painter", "painting", "wall painting", "putty", "rang karna",
   "paint karna"])
s("AC_REFRIGERATION", "AC & Refrigeration Repair", C_TR, ["ELECTRICAL_BASIC"], 120, "high",
  "Diagnose and service a split AC", [
   "ac repair", "ac technician", "refrigeration", "fridge repair",
   "ac mechanic", "cooling repair"])
s("TWO_WHEELER_REPAIR", "Two-wheeler Repair", C_TR, [], 100, "medium",
  "Service and diagnose a scooter", [
   "bike mechanic", "two wheeler repair", "scooter repair",
   "bike repair", "mechanic", "gaadi theek karna"])
s("FOUR_WHEELER_REPAIR", "Four-wheeler Repair", C_TR, ["TWO_WHEELER_REPAIR"], 140, "high",
  "Diagnose and service a car", [
   "car mechanic", "four wheeler repair", "car repair", "auto mechanic",
   "garage work"])
s("MOBILE_REPAIR", "Mobile Phone Repair", C_TR, [], 90, "medium",
  "Replace a screen and diagnose a fault", [
   "mobile repair", "phone repair", "mobile technician",
   "mobile theek karna", "cell phone repair"])
s("WELDING", "Welding", C_TR, [], 110, "medium",
  "Produce a sound butt weld", [
   "welding", "welder", "welding work", "gas cutting", "arc welding"])
s("TAILORING", "Tailoring", C_TR, [], 100, "medium",
  "Stitch a garment to measurement", [
   "tailoring", "tailor", "stitching", "silai", "darzi",
   "kapda silna", "sewing"])
s("EMBROIDERY", "Embroidery", C_TR, ["TAILORING"], 60, "low",
  "Complete a set embroidery pattern", [
   "embroidery", "kadhai", "zari work", "hand embroidery"])
s("BEAUTY_SERVICES", "Beauty & Grooming Services", C_TR, [], 90, "medium",
  "Perform three standard salon services", [
   "beautician", "beauty parlour", "salon work", "makeup",
   "parlour ka kaam", "grooming"])
s("HAIRCUTTING", "Hair Cutting & Styling", C_TR, [], 100, "medium",
  "Execute three standard cuts", [
   "hair cutting", "barber", "hair stylist", "salon", "baal katna",
   "haircut"])
s("MEHENDI", "Mehendi Application", C_TR, [], 40, "low",
  "Complete two bridal-style designs", [
   "mehendi", "henna", "mehandi", "mehndi lagana"])
s("APPLIANCE_REPAIR", "Home Appliance Repair", C_TR, ["ELECTRICAL_BASIC"], 80, "medium",
  "Diagnose a washing machine fault", [
   "appliance repair", "washing machine repair", "mixer repair",
   "home appliance", "electronics repair"])
s("MASONRY", "Masonry", C_TR, [], 100, "medium",
  "Lay a course of brickwork true", [
   "mason", "masonry", "rajmistri", "construction work", "brick work",
   "mistri"])

# ── logistics ─────────────────────────────────────────────────────────
s("TWO_WHEELER_LICENCE", "Two-wheeler Licence", C_LG, [], 20, "low",
  "Valid driving licence", [
   "two wheeler licence", "bike licence", "scooter licence",
   "driving licence bike", "dl bike"])
s("LMV_LICENCE", "Light Motor Vehicle Licence", C_LG, [], 40, "medium",
  "Valid LMV driving licence", [
   "lmv", "car licence", "four wheeler licence", "driving licence",
   "dl", "car chalana licence"])
s("DELIVERY_OPS", "Delivery Operations", C_LG, ["SMARTPHONE_LITERACY"], 12, "free",
  "Complete a 10-drop route on an app", [
   "delivery", "delivery boy", "courier", "delivery karna",
   "food delivery", "parcel delivery", "rider"])
s("ROUTE_PLANNING", "Route Planning", C_LG, ["DELIVERY_OPS"], 15, "free",
  "Sequence 15 drops efficiently", [
   "route planning", "route", "delivery route", "trip planning"])
s("WAREHOUSE_OPS", "Warehouse Operations", C_LG, ["INVENTORY_MGMT"], 25, "low",
  "Pick, pack and dispatch to a pick list", [
   "warehouse", "godown", "godown work", "warehouse work",
   "store keeping", "warehouse operations"])
s("LOADING_UNLOADING", "Loading & Unloading", C_LG, [], 6, "free",
  "Safe manual handling demonstration", [
   "loading", "unloading", "loading unloading", "maal chadhana",
   "labour work", "hamali"])
s("DISPATCH_DOCS", "Dispatch Documentation", C_LG, ["FILE_RECORDKEEPING"], 18, "low",
  "Prepare a delivery challan and e-way entry", [
   "dispatch", "challan", "delivery challan", "e way bill",
   "dispatch papers", "gate pass"])
s("BARCODE_SCANNING", "Barcode / Scanner Operation", C_LG, [], 5, "free",
  "Scan and reconcile a 50-item batch", [
   "barcode", "barcode scanning", "barcode scan karna", "handheld scanner"])
s("AUTO_DRIVING", "Auto-rickshaw Driving", C_LG, ["LMV_LICENCE"], 30, "medium",
  "Valid badge and road test", [
   "auto driving", "auto driver", "rickshaw", "auto chalana", "three wheeler"])

# ── care ──────────────────────────────────────────────────────────────
s("CHILDCARE", "Childcare", C_CA, [], 40, "low",
  "Supervised session with age-group protocol", [
   "childcare", "child care", "creche", "baby sitting", "bacchon ki dekhbhal",
   "nanny", "ayah"])
s("ELDER_CARE", "Elder Care", C_CA, [], 60, "medium",
  "Mobility assistance and routine care demo", [
   "elder care", "old age care", "caretaker", "budhon ki dekhbhal",
   "attendant", "home nurse"])
s("FIRST_AID", "First Aid", C_CA, [], 16, "low",
  "Certified first-aid assessment", [
   "first aid", "prathmik chikitsa", "cpr", "emergency care",
   "medical help basic"])
s("PATIENT_ASSIST", "Patient Assistance", C_CA, ["FIRST_AID"], 50, "medium",
  "Ward assistance protocol demonstration", [
   "patient care", "ward boy", "nursing assistant", "hospital helper",
   "patient assist", "marij ki dekhbhal"])
s("PHARMACY_ASSIST", "Pharmacy Assistance", C_CA, ["PRODUCT_KNOWLEDGE"], 45, "medium",
  "Read prescriptions and locate stock accurately", [
   "pharmacy", "medical shop", "pharmacist assistant", "chemist",
   "dawai ki dukan", "medical store"])
s("TUTORING_PRIMARY", "Primary Tutoring", C_CA, ["COMMUNICATION"], 30, "free",
  "Teach a sample primary lesson", [
   "tuition", "tutoring", "teaching", "padhana", "tuition padhana",
   "home tuition", "teacher"])
s("TUTORING_SECONDARY", "Secondary Tutoring", C_CA, ["TUTORING_PRIMARY"], 45, "low",
  "Teach a sample class 9-10 lesson", [
   "secondary tuition", "high school tuition", "10th tuition",
   "maths tuition", "science tuition"])
s("SPECIAL_NEEDS_SUPPORT", "Special Needs Support", C_CA, ["CHILDCARE"], 70, "medium",
  "Supervised support session", [
   "special needs", "special education", "disability support",
   "special child care"])

# ── machine operation ─────────────────────────────────────────────────
s("SEWING_MACHINE_OP", "Sewing Machine Operation", C_MO, [], 50, "low",
  "Operate an industrial machine to output rate", [
   "sewing machine", "silai machine", "machine operator garment",
   "stitching machine", "power machine"])
s("PACKAGING_MACHINE_OP", "Packaging Machine Operation", C_MO, [], 30, "low",
  "Run and changeover a packing line", [
   "packaging machine", "packing machine", "sealing machine",
   "machine operator packing"])
s("CNC_BASIC", "CNC Machine Operation (Basic)", C_MO, ["COMPUTER_BASICS"], 120, "high",
  "Run a program and verify tolerance", [
   "cnc", "cnc operator", "cnc machine", "lathe cnc", "machine operator cnc"])
s("LATHE_OP", "Lathe Operation", C_MO, [], 90, "medium",
  "Turn a component to drawing", [
   "lathe", "lathe machine", "turner", "lathe operator", "kharad"])
s("FORKLIFT_OP", "Forklift Operation", C_MO, [], 40, "medium",
  "Certified forklift handling test", [
   "forklift", "forklift operator", "stacker", "material handling equipment"])
s("PRINTING_MACHINE_OP", "Printing Machine Operation", C_MO, [], 60, "medium",
  "Set up and run a print job", [
   "printing machine", "offset printing", "press operator",
   "printing press", "flex printing"])
s("GENERATOR_OP", "Generator / DG Operation", C_MO, ["ELECTRICAL_BASIC"], 35, "low",
  "Start, load and log a DG set", [
   "generator", "dg set", "genset", "generator operator"])
s("WATER_PLANT_OP", "Water Plant Operation", C_MO, [], 40, "low",
  "Run a filtration and filling cycle", [
   "water plant", "ro plant", "water purification", "can water plant"])

# ── cross-cutting workplace ───────────────────────────────────────────
s("PUNCTUALITY_SHIFT", "Shift Discipline", C_DA, [], 4, "free",
  "Attendance record over a trial period", [
   "punctuality", "shift discipline", "time pe aana", "regular attendance",
   "discipline"])
s("SAFETY_COMPLIANCE", "Workplace Safety Compliance", C_MO, [], 12, "low",
  "Safety induction assessment", [
   "safety", "workplace safety", "ppe", "suraksha", "safety rules",
   "industrial safety"])
s("QUALITY_CHECK", "Quality Checking", C_MO, [], 25, "low",
  "Inspect a batch against a defect list", [
   "quality check", "qc", "quality control", "checking", "inspection",
   "maal check karna"])
s("VENDOR_COORDINATION", "Vendor Coordination", C_RS, ["COMMUNICATION"], 20, "low",
  "Run a supplier follow-up cycle", [
   "vendor coordination", "supplier management", "vendor handling",
   "supplier se baat"])
s("CASHLESS_RECON", "Payment Reconciliation", C_AB, ["UPI_DIGITAL_PAY", "ARITHMETIC"], 18, "low",
  "Reconcile a day of UPI and card settlements", [
   "payment reconciliation", "settlement", "reconciliation",
   "payment milana", "settlement check"])
s("BASIC_MARKETING", "Local Marketing & Promotion", C_RS, ["COMMUNICATION"], 25, "low",
  "Plan a local promotion campaign", [
   "marketing", "promotion", "publicity", "pamphlet distribution",
   "local marketing", "advertising"])
s("CUSTOMER_DATA_MGMT", "Customer Records Management", C_DA, ["EXCEL_BASIC"], 15, "low",
  "Maintain and query a customer database", [
   "customer database", "crm", "customer records", "customer data",
   "customer list"])
s("QUEUE_MANAGEMENT", "Queue & Crowd Management", C_HF, ["COMMUNICATION"], 10, "free",
  "Manage a peak-hour queue", [
   "queue management", "crowd management", "line sambhalna",
   "rush handle karna"])
s("OPENING_CLOSING", "Shop Opening & Closing", C_RS, ["CASH_HANDLING"], 8, "free",
  "Complete an open and close checklist", [
   "opening closing", "shop open close", "dukan kholna band karna",
   "shutter duty", "key holder"])
s("BASIC_ACCOUNTS_SOFTWARE", "Accounting Software (non-Tally)", C_AB, ["BOOKKEEPING"], 30, "medium",
  "Complete a month-end close in the software", [
   "vyapar app", "marg software", "busy software", "accounting software",
   "zoho books", "khatabook"])

with open(os.path.join(os.path.dirname(__file__), "..", "data", "skills.json"), "w",
          encoding="utf-8") as f:
    json.dump(S, f, indent=2, ensure_ascii=False)

# ── sanity checks ─────────────────────────────────────────────────────
ids = [x["id"] for x in S]
assert len(ids) == len(set(ids)), "duplicate skill ids"
allset = set(ids)
for x in S:
    for p in x["prerequisites"]:
        assert p in allset, f"{x['id']} has unknown prerequisite {p}"

alias_owner = {}
dupes = []
for x in S:
    for a in x["aliases"]:
        if a in alias_owner:
            dupes.append((a, alias_owner[a], x["id"]))
        alias_owner[a] = x["id"]

print(f"skills: {len(S)}")
print(f"aliases: {len(alias_owner)}")
print(f"duplicate aliases: {len(dupes)}")
for d in dupes:
    print("   ", d)
from collections import Counter
print(Counter(x["category"] for x in S))
