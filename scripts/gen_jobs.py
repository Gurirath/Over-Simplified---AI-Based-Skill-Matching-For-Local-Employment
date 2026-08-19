"""
Generates data/jobs.json — 250 synthetic local job listings for the
Vellore / Katpadi area.

SEEDED. Same input -> same corpus, every time. Do not remove the seed;
demo determinism depends on it.

Design notes:
 - Salary bands are informal-sector realistic: roughly Rs 8,000-24,000/month.
 - Shifts reflect real patterns: morning kirana, evening bakery counter,
   split-shift hotel, night security.
 - Some roles deliberately require SKILL COMBINATIONS (e.g. Tally + GST).
   This is what makes f(T) non-submodular and is the reason the optimizer
   enumerates instead of running greedy. See CLAUDE.md §4.
"""
import json, os, random, statistics

random.seed(20260819)

# Real localities in and around Vellore / Katpadi, with approximate centres.
AREAS = [
    ("Katpadi",        12.9698, 79.1325),
    ("VIT Main Gate",  12.9692, 79.1559),
    ("Gandhi Nagar",   12.9260, 79.1330),
    ("Sathuvachari",   12.9430, 79.1600),
    ("Vellore Town",   12.9165, 79.1325),
    ("Thorapadi",      12.9020, 79.1470),
    ("Bagayam",        12.8900, 79.1300),
    ("Kosapet",        12.9210, 79.1250),
    ("Arcot Road",     12.9250, 79.1150),
    ("Chittoor Bus Stand", 12.9310, 79.1360),
    ("Konavattam",     12.9560, 79.1290),
    ("Viruthampet",    12.9390, 79.1180),
]

MORNING = {"startMin": 8 * 60, "endMin": 14 * 60}
DAY     = {"startMin": 9 * 60 + 30, "endMin": 18 * 60}
AFTNOON = {"startMin": 13 * 60, "endMin": 20 * 60}
EVENING = {"startMin": 16 * 60, "endMin": 22 * 60}
LATE_EVE= {"startMin": 17 * 60, "endMin": 23 * 60}
FULLDAY = {"startMin": 9 * 60, "endMin": 20 * 60}
NIGHT   = {"startMin": 20 * 60, "endMin": 28 * 60}   # 8pm - 4am, wraps
EARLY   = {"startMin": 6 * 60, "endMin": 12 * 60}

ALLDAYS   = [0, 1, 2, 3, 4, 5, 6]
MON_SAT   = [1, 2, 3, 4, 5, 6]
WEEKENDS  = [0, 6]

def S(x):
    return "SKILL_" + x

# (title, employerType, required[], preferred[], salaryLo, salaryHi, shift,
#  days, hoursPerWeek, minExpMonths, hardEligibility[], weight)
TEMPLATES = [
    # ── kirana / general store ──
    ("Store Assistant", "kirana",
     ["CUSTOMER_HANDLING", "CASH_HANDLING", "ARITHMETIC"],
     ["SPOKEN_TAMIL", "INVENTORY_MGMT"], 9000, 12000, MORNING, MON_SAT, 36, 0, [], 8),
    ("Counter Salesperson", "kirana",
     ["CUSTOMER_HANDLING", "BILLING_MANUAL", "CASH_HANDLING"],
     ["UPI_DIGITAL_PAY", "SPOKEN_TAMIL"], 10000, 13000, DAY, MON_SAT, 48, 0, [], 8),
    ("Stock Assistant", "kirana",
     ["INVENTORY_MGMT", "ARITHMETIC"],
     ["STOCK_AUDIT", "LOADING_UNLOADING"], 10000, 13500, MORNING, MON_SAT, 36, 3, [], 6),
    ("Billing Operator", "kirana",
     ["BILLING_SOFTWARE", "CASH_HANDLING", "UPI_DIGITAL_PAY"],
     ["CUSTOMER_HANDLING"], 12000, 15000, AFTNOON, ALLDAYS, 42, 6, [], 6),
    ("Shop Supervisor", "kirana",
     ["RETAIL_OPS", "SUPERVISION", "INVENTORY_MGMT", "CASH_HANDLING"],
     ["OPENING_CLOSING"], 16000, 21000, FULLDAY, MON_SAT, 54, 24, [], 3),
    ("Evening Counter Staff", "kirana",
     ["CUSTOMER_HANDLING", "CASH_HANDLING"],
     ["UPI_DIGITAL_PAY"], 8000, 10500, EVENING, ALLDAYS, 36, 0, [], 6),

    # ── bakery ──
    ("Bakery Counter Assistant", "bakery",
     ["BAKERY_COUNTER", "CASH_HANDLING", "FOOD_PACKAGING"],
     ["UPI_DIGITAL_PAY", "SPOKEN_TAMIL"], 9500, 13000, EVENING, ALLDAYS, 36, 0, [], 7),
    ("Bakery Sales Staff", "bakery",
     ["CUSTOMER_HANDLING", "BILLING_MANUAL", "FOOD_HYGIENE"],
     ["UPSELLING"], 10000, 13500, AFTNOON, ALLDAYS, 42, 0, [], 5),
    ("Baker's Assistant", "bakery",
     ["FOOD_PREP", "FOOD_HYGIENE"],
     ["FOOD_PACKAGING"], 12000, 16000, EARLY, MON_SAT, 42, 6, [], 4),
    ("Cake Decorator", "bakery",
     ["FOOD_PREP", "FOOD_HYGIENE", "PHOTO_EDITING_BASIC"],
     ["SOCIAL_MEDIA_BASIC"], 13000, 18000, DAY, MON_SAT, 45, 12, [], 2),

    # ── medical shop / pharmacy ──
    ("Pharmacy Assistant", "pharmacy",
     ["PHARMACY_ASSIST", "CUSTOMER_HANDLING", "CASH_HANDLING"],
     ["SPOKEN_TAMIL", "INVENTORY_MGMT"], 11000, 15000, DAY, ALLDAYS, 48, 0, [], 6),
    ("Medical Shop Counter Staff", "medical_shop",
     ["CUSTOMER_HANDLING", "BILLING_SOFTWARE", "PRODUCT_KNOWLEDGE"],
     ["PHARMACY_ASSIST"], 11000, 14500, EVENING, ALLDAYS, 42, 3, [], 6),
    ("Medical Store Billing Staff", "medical_shop",
     ["BILLING_SOFTWARE", "GST_FILING", "CASH_HANDLING"],
     ["TALLY_BASIC"], 14000, 18000, DAY, MON_SAT, 48, 12, [], 4),
    ("Pharmacy Stock Assistant", "pharmacy",
     ["INVENTORY_MGMT", "BARCODE_SCANNING", "ARITHMETIC"],
     ["STOCK_AUDIT"], 11000, 14000, MORNING, MON_SAT, 36, 6, [], 4),

    # ── auto workshop ──
    ("Two-wheeler Mechanic", "auto_workshop",
     ["TWO_WHEELER_REPAIR", "SAFETY_COMPLIANCE"],
     ["CUSTOMER_HANDLING"], 12000, 18000, DAY, MON_SAT, 54, 12, [], 5),
    ("Workshop Helper", "auto_workshop",
     ["SAFETY_COMPLIANCE", "LOADING_UNLOADING"],
     ["TWO_WHEELER_REPAIR"], 9000, 12000, DAY, MON_SAT, 48, 0, [], 5),
    ("Service Advisor", "auto_workshop",
     ["CUSTOMER_HANDLING", "COMPLAINT_HANDLING", "BILLING_SOFTWARE", "SPOKEN_TAMIL"],
     ["TWO_WHEELER_REPAIR"], 14000, 19000, DAY, MON_SAT, 48, 12, [], 3),
    ("Car Mechanic", "auto_workshop",
     ["FOUR_WHEELER_REPAIR", "SAFETY_COMPLIANCE"],
     ["LMV_LICENCE"], 15000, 22000, DAY, MON_SAT, 54, 24, [], 3),
    ("Spare Parts Counter Staff", "auto_workshop",
     ["INVENTORY_MGMT", "PRODUCT_KNOWLEDGE", "BILLING_MANUAL"],
     ["CUSTOMER_HANDLING"], 11000, 14500, DAY, MON_SAT, 48, 6, [], 4),

    # ── tuition centre / school office ──
    ("Primary Tuition Teacher", "tuition_centre",
     ["TUTORING_PRIMARY", "COMMUNICATION"],
     ["SPOKEN_TAMIL", "SPOKEN_ENGLISH_BASIC"], 8000, 12000, EVENING, MON_SAT, 24, 0, [], 7),
    ("Maths & Science Tutor", "tuition_centre",
     ["TUTORING_SECONDARY", "COMMUNICATION"],
     ["SPOKEN_ENGLISH_BASIC"], 12000, 18000, EVENING, MON_SAT, 30, 6, [], 5),
    ("Spoken English Trainer", "tuition_centre",
     ["SPOKEN_ENGLISH_FLUENT", "TRAINING_OTHERS", "COMMUNICATION"],
     ["WRITTEN_ENGLISH"], 14000, 20000, EVENING, MON_SAT, 30, 12, [], 3),
    ("Centre Coordinator", "tuition_centre",
     ["COMMUNICATION", "EXCEL_BASIC", "CUSTOMER_DATA_MGMT"],
     ["TELECALLING"], 12000, 16000, AFTNOON, MON_SAT, 42, 6, [], 4),
    ("School Office Assistant", "school_office",
     ["DATA_ENTRY", "FILE_RECORDKEEPING", "COMPUTER_BASICS"],
     ["WORD_PROCESSING", "SPOKEN_TAMIL"], 11000, 15000, MORNING, MON_SAT, 40, 6, [], 5),
    ("School Accounts Clerk", "school_office",
     ["TALLY_BASIC", "EXCEL_BASIC", "BOOKKEEPING"],
     ["GST_FILING"], 14000, 19000, MORNING, MON_SAT, 40, 12, [], 4),
    ("School Front Desk", "school_office",
     ["FRONT_DESK", "COMMUNICATION", "COMPUTER_BASICS"],
     ["SPOKEN_ENGLISH_BASIC", "SPOKEN_TAMIL"], 11000, 15000, MORNING, MON_SAT, 40, 6, [], 4),

    # ── warehouse / logistics ──
    ("Warehouse Assistant", "warehouse",
     ["WAREHOUSE_OPS", "LOADING_UNLOADING", "SAFETY_COMPLIANCE"],
     ["BARCODE_SCANNING"], 11000, 15000, DAY, MON_SAT, 48, 0, [], 6),
    ("Picker / Packer", "warehouse",
     ["BARCODE_SCANNING", "INVENTORY_MGMT", "QUALITY_CHECK"],
     ["SAFETY_COMPLIANCE"], 10500, 14000, MORNING, MON_SAT, 42, 0, [], 6),
    ("Dispatch Clerk", "warehouse",
     ["DISPATCH_DOCS", "EXCEL_BASIC", "FILE_RECORDKEEPING"],
     ["BARCODE_SCANNING"], 13000, 17000, DAY, MON_SAT, 48, 6, [], 4),
    ("Delivery Executive", "warehouse",
     ["DELIVERY_OPS", "TWO_WHEELER_LICENCE", "SMARTPHONE_LITERACY"],
     ["ROUTE_PLANNING", "SPOKEN_TAMIL"], 12000, 18000, DAY, ALLDAYS, 48, 0,
     ["two_wheeler_licence"], 7),
    ("Evening Delivery Rider", "warehouse",
     ["DELIVERY_OPS", "TWO_WHEELER_LICENCE", "SMARTPHONE_LITERACY"],
     ["ROUTE_PLANNING"], 10000, 15000, EVENING, ALLDAYS, 36, 0,
     ["two_wheeler_licence"], 5),
    ("Stores Supervisor", "warehouse",
     ["WAREHOUSE_OPS", "SUPERVISION", "EXCEL_BASIC", "STOCK_AUDIT"],
     ["DISPATCH_DOCS"], 17000, 23000, DAY, MON_SAT, 54, 24, [], 3),
    ("Forklift Operator", "warehouse",
     ["FORKLIFT_OP", "SAFETY_COMPLIANCE", "WAREHOUSE_OPS"],
     [], 15000, 20000, DAY, MON_SAT, 48, 12, [], 2),

    # ── salon / beauty ──
    ("Salon Assistant", "salon",
     ["BEAUTY_SERVICES", "CUSTOMER_HANDLING", "HOUSEKEEPING"],
     ["SPOKEN_TAMIL"], 9000, 13000, AFTNOON, ALLDAYS, 42, 0, [], 6),
    ("Beautician", "salon",
     ["BEAUTY_SERVICES", "CUSTOMER_HANDLING"],
     ["MEHENDI", "SOCIAL_MEDIA_BASIC"], 12000, 18000, DAY, ALLDAYS, 48, 12, [], 5),
    ("Hair Stylist", "salon",
     ["HAIRCUTTING", "CUSTOMER_HANDLING"],
     ["UPSELLING"], 13000, 20000, DAY, ALLDAYS, 48, 12, [], 4),
    ("Salon Front Desk", "salon",
     ["FRONT_DESK", "CASH_HANDLING", "CUSTOMER_DATA_MGMT"],
     ["UPI_DIGITAL_PAY", "SOCIAL_MEDIA_BASIC"], 10000, 14000, AFTNOON, ALLDAYS, 42, 3, [], 4),

    # ── hotel / restaurant ──
    ("Restaurant Server", "hotel",
     ["TABLE_SERVICE", "ORDER_MANAGEMENT", "CUSTOMER_HANDLING"],
     ["SPOKEN_TAMIL"], 9000, 13000, LATE_EVE, ALLDAYS, 42, 0, [], 8),
    ("Kitchen Helper", "hotel",
     ["KITCHEN_ASSIST", "FOOD_HYGIENE"],
     ["FOOD_PREP"], 9000, 12500, FULLDAY, ALLDAYS, 54, 0, [], 7),
    ("Cook", "hotel",
     ["FOOD_PREP", "FOOD_HYGIENE", "QUALITY_CHECK"],
     ["CATERING_OPS"], 14000, 22000, FULLDAY, ALLDAYS, 54, 24, [], 4),
    ("Hotel Housekeeping Staff", "hotel",
     ["HOUSEKEEPING", "SAFETY_COMPLIANCE"],
     [], 8500, 12000, MORNING, ALLDAYS, 42, 0, [], 6),
    ("Hotel Receptionist", "hotel",
     ["FRONT_DESK", "SPOKEN_ENGLISH_BASIC", "COMPUTER_BASICS", "COMMUNICATION"],
     ["SPOKEN_TAMIL", "BILLING_SOFTWARE"], 12000, 17000, DAY, ALLDAYS, 48, 6, [], 5),
    ("Night Receptionist", "hotel",
     ["FRONT_DESK", "COMPUTER_BASICS", "SPOKEN_ENGLISH_BASIC"],
     ["CCTV_MONITORING"], 13000, 17500, NIGHT, ALLDAYS, 48, 6, [], 3),
    ("Tea / Coffee Counter Staff", "hotel",
     ["BARISTA", "CASH_HANDLING", "FOOD_HYGIENE"],
     ["CUSTOMER_HANDLING"], 9000, 12500, EARLY, ALLDAYS, 42, 0, [], 5),
    ("Catering Assistant", "hotel",
     ["CATERING_OPS", "FOOD_HYGIENE", "TEAM_COORDINATION"],
     ["FOOD_PACKAGING"], 10000, 15000, EVENING, WEEKENDS, 20, 3, [], 4),
    ("Restaurant Cashier", "hotel",
     ["CASH_HANDLING", "BILLING_SOFTWARE", "CASHLESS_RECON"],
     ["CUSTOMER_HANDLING"], 11000, 15000, LATE_EVE, ALLDAYS, 42, 6, [], 5),
    ("Parcel & Packing Staff", "hotel",
     ["FOOD_PACKAGING", "FOOD_HYGIENE", "ORDER_MANAGEMENT"],
     [], 9000, 12000, EVENING, ALLDAYS, 36, 0, [], 5),

    # ── office / accounts (small business) ──
    ("Accounts Assistant", "other",
     ["TALLY_BASIC", "GST_FILING", "EXCEL_BASIC"],
     ["BOOKKEEPING"], 14000, 19000, DAY, MON_SAT, 48, 12, [], 6),
    ("Junior Accountant", "other",
     ["TALLY_ADVANCED", "GST_FILING", "BOOKKEEPING", "EXCEL_ADVANCED"],
     ["PAYROLL_BASIC"], 18000, 24000, DAY, MON_SAT, 48, 24, [], 3),
    ("Data Entry Operator", "other",
     ["DATA_ENTRY", "EXCEL_BASIC", "TYPING_ENGLISH"],
     ["WORD_PROCESSING"], 11000, 15000, DAY, MON_SAT, 45, 0, [], 7),
    ("Office Assistant", "other",
     ["FILE_RECORDKEEPING", "COMPUTER_BASICS", "COMMUNICATION"],
     ["EMAIL_COMMS", "PRINTER_SCANNER"], 10000, 14000, DAY, MON_SAT, 48, 0, [], 6),
    ("Telecaller", "other",
     ["TELECALLING", "COMMUNICATION", "SPOKEN_TAMIL"],
     ["CUSTOMER_DATA_MGMT"], 10000, 15000, DAY, MON_SAT, 42, 0, [], 7),
    ("Customer Support Executive", "other",
     ["COMPLAINT_HANDLING", "SPOKEN_ENGLISH_BASIC", "COMPUTER_BASICS", "SPOKEN_TAMIL"],
     ["EMAIL_COMMS"], 13000, 18000, AFTNOON, MON_SAT, 45, 6, [], 5),
    ("Billing & GST Executive", "other",
     ["GST_FILING", "TALLY_BASIC", "BILLING_SOFTWARE"],
     ["CASHLESS_RECON"], 15000, 20000, DAY, MON_SAT, 48, 12, [], 4),
    ("Front Office Executive", "other",
     ["FRONT_DESK", "COMMUNICATION", "EMAIL_COMMS", "SPOKEN_ENGLISH_BASIC"],
     ["WORD_PROCESSING"], 12000, 16000, DAY, MON_SAT, 45, 6, [], 4),
    ("Social Media Assistant", "other",
     ["SOCIAL_MEDIA_BASIC", "PHOTO_EDITING_BASIC", "SMARTPHONE_LITERACY"],
     ["BASIC_MARKETING"], 10000, 16000, DAY, MON_SAT, 40, 0, [], 4),
    ("Online Store Operations", "other",
     ["ECOM_LISTING", "PHOTO_EDITING_BASIC", "EXCEL_BASIC", "INVENTORY_MGMT"],
     ["ONLINE_FORMS"], 13000, 18000, DAY, MON_SAT, 45, 6, [], 3),
    ("Xerox & DTP Operator", "other",
     ["PRINTER_SCANNER", "WORD_PROCESSING", "COMPUTER_BASICS"],
     ["TYPING_TAMIL", "ONLINE_FORMS"], 9000, 13000, DAY, ALLDAYS, 48, 0, [], 5),
    ("CSC / Online Services Operator", "other",
     ["ONLINE_FORMS", "COMPUTER_BASICS", "CUSTOMER_HANDLING", "SPOKEN_TAMIL"],
     ["PRINTER_SCANNER", "UPI_DIGITAL_PAY"], 10000, 14000, DAY, ALLDAYS, 48, 0, [], 5),

    # ── trades (self-employed / shop-attached) ──
    ("Tailor", "other",
     ["TAILORING", "SEWING_MACHINE_OP"],
     ["EMBROIDERY", "CUSTOMER_HANDLING"], 11000, 17000, DAY, MON_SAT, 48, 12, [], 5),
    ("Garment Machine Operator", "other",
     ["SEWING_MACHINE_OP", "QUALITY_CHECK", "SAFETY_COMPLIANCE"],
     [], 11000, 16000, MORNING, MON_SAT, 48, 6, [], 5),
    ("Electrician", "other",
     ["ELECTRICAL_BASIC", "SAFETY_COMPLIANCE"],
     ["APPLIANCE_REPAIR"], 13000, 20000, DAY, MON_SAT, 48, 12, [], 4),
    ("AC Service Technician", "other",
     ["AC_REFRIGERATION", "SAFETY_COMPLIANCE", "CUSTOMER_HANDLING"],
     ["TWO_WHEELER_LICENCE"], 15000, 22000, DAY, MON_SAT, 48, 12, [], 3),
    ("Mobile Repair Technician", "other",
     ["MOBILE_REPAIR", "CUSTOMER_HANDLING"],
     ["BILLING_MANUAL"], 12000, 18000, DAY, ALLDAYS, 48, 6, [], 4),
    ("Plumber", "other",
     ["PLUMBING_BASIC", "SAFETY_COMPLIANCE"],
     [], 12000, 18000, DAY, MON_SAT, 48, 12, [], 3),
    ("Painter", "other",
     ["PAINTING_WALL", "SAFETY_COMPLIANCE"],
     [], 11000, 16000, DAY, MON_SAT, 48, 6, [], 3),
    ("Printing Press Operator", "other",
     ["PRINTING_MACHINE_OP", "QUALITY_CHECK", "SAFETY_COMPLIANCE"],
     [], 13000, 18000, DAY, MON_SAT, 48, 12, [], 2),

    # ── care ──
    ("Creche Assistant", "other",
     ["CHILDCARE", "FIRST_AID", "COMMUNICATION"],
     ["SPOKEN_TAMIL"], 9000, 13000, MORNING, MON_SAT, 40, 0, [], 5),
    ("Home Elder Care Attendant", "other",
     ["ELDER_CARE", "FIRST_AID"],
     ["PATIENT_ASSIST"], 12000, 18000, DAY, ALLDAYS, 48, 12, [], 4),
    ("Hospital Ward Assistant", "other",
     ["PATIENT_ASSIST", "FIRST_AID", "SAFETY_COMPLIANCE"],
     ["SPOKEN_TAMIL"], 11000, 15000, NIGHT, ALLDAYS, 48, 6, [], 4),
    ("Clinic Front Desk", "other",
     ["FRONT_DESK", "COMPUTER_BASICS", "CUSTOMER_DATA_MGMT", "SPOKEN_TAMIL"],
     ["BILLING_SOFTWARE"], 11000, 15000, EVENING, MON_SAT, 36, 3, [], 4),

    # ── security / facility ──
    ("Security Guard (Night)", "other",
     ["CCTV_MONITORING", "SAFETY_COMPLIANCE", "PUNCTUALITY_SHIFT"],
     [], 11000, 15000, NIGHT, ALLDAYS, 48, 0, [], 5),
    ("Housekeeping Staff", "other",
     ["HOUSEKEEPING", "SAFETY_COMPLIANCE"],
     [], 8500, 11500, MORNING, ALLDAYS, 42, 0, [], 6),
    ("Facility Supervisor", "other",
     ["SUPERVISION", "HOUSEKEEPING", "TEAM_COORDINATION", "EXCEL_BASIC"],
     ["SAFETY_COMPLIANCE"], 15000, 20000, DAY, MON_SAT, 48, 24, [], 2),

    # ── field / marketing ──
    ("Field Sales Executive", "other",
     ["FIELD_SALES", "COMMUNICATION", "TWO_WHEELER_LICENCE", "SPOKEN_TAMIL"],
     ["NEGOTIATION", "SMARTPHONE_LITERACY"], 12000, 20000, DAY, MON_SAT, 48, 6,
     ["two_wheeler_licence"], 5),
    ("Promoter / Brand Ambassador", "other",
     ["BASIC_MARKETING", "COMMUNICATION", "PRODUCT_KNOWLEDGE"],
     ["SPOKEN_TAMIL"], 10000, 15000, AFTNOON, WEEKENDS, 20, 0, [], 4),
    ("Distribution Sales Assistant", "other",
     ["FIELD_SALES", "VENDOR_COORDINATION", "ARITHMETIC"],
     ["ROUTE_PLANNING"], 12000, 17000, MORNING, MON_SAT, 48, 6, [], 4),
]

EMPLOYER_NAMES = {
    "kirana": ["Sri Balaji Stores", "Amman Provisions", "New Ganesh Stores",
               "Lakshmi Super Market", "Muthu Traders", "Vasan Provisions",
               "Kumaran Stores", "Anbu Mini Mart"],
    "bakery": ["Hot Breads Corner", "Sri Krishna Bakery", "Daily Fresh Bakes",
               "Iyengar Bakery", "Cake Studio Vellore", "Golden Crust"],
    "pharmacy": ["Apollo Pharmacy Franchise", "Sri Sai Medicals",
                 "Vellore Medicals", "Care Pharma"],
    "medical_shop": ["Annai Medicals", "Sree Medicals", "Nithya Medicals",
                     "Balaji Medicals"],
    "auto_workshop": ["Sakthi Auto Works", "RK Motors", "Vellore Bike Point",
                      "Speed Garage", "Ganesh Auto Care"],
    "tuition_centre": ["Vidya Tuition Centre", "Bright Minds Academy",
                       "Sri Sai Coaching", "Excel Learning Point",
                       "Katpadi Study Circle"],
    "school_office": ["St. Joseph Matric School", "Green Valley School",
                      "Vellore Public School", "Little Flower School"],
    "warehouse": ["Vellore Logistics Hub", "Sree Distributors",
                  "Katpadi Warehousing", "QuickShip Depot", "Annai Distributors"],
    "salon": ["Style Point Salon", "Glow Beauty Parlour", "Trends Unisex Salon",
              "Beauty Bliss", "Cut Above Salon"],
    "hotel": ["Hotel Aryaas", "Saravana Mess", "Anjappar Branch",
              "Hotel Grand Vellore", "Darling Residency", "Sangeetha Restaurant",
              "Adyar Ananda Bhavan Branch", "Chennai Cafe"],
    "other": ["Sri Traders", "Vellore Enterprises", "Katpadi Services",
              "Anbu Agencies", "Murugan & Co", "Vel Solutions",
              "Krishna Associates", "Sakthi Enterprises", "Amman Agencies",
              "Sri Venkateswara Traders"],
}

TITLE_VARIANTS = ["", " (Part-time)", " - Trainee", " (Immediate Joining)", ""]

jobs = []
weights = [t[-1] for t in TEMPLATES]

TARGET = 250
i = 0
while len(jobs) < TARGET:
    t = random.choices(TEMPLATES, weights=weights, k=1)[0]
    (title, etype, req, pref, lo, hi, shift, days, hpw, minexp, elig, _w) = t

    area, alat, alng = random.choice(AREAS)
    # jitter the position within the locality (~ +/- 1.2 km)
    lat = round(alat + random.uniform(-0.011, 0.011), 6)
    lng = round(alng + random.uniform(-0.011, 0.011), 6)

    # salary jitter in Rs 500 steps, band preserved
    bump = random.choice([-1000, -500, 0, 0, 500, 1000, 1500])
    smin = max(8000, lo + bump)
    smax = max(smin + 1000, hi + bump)

    # occasional shift/hours variation
    sh = dict(shift)
    if random.random() < 0.18:
        delta = random.choice([-60, -30, 30, 60])
        sh = {"startMin": sh["startMin"] + delta, "endMin": sh["endMin"] + delta}
    d = list(days)
    if random.random() < 0.12 and d == ALLDAYS:
        d = MON_SAT
    hours = hpw + random.choice([-6, -3, 0, 0, 3, 6])
    hours = max(16, hours)

    variant = random.choice(TITLE_VARIANTS)
    is_part_time = variant == " (Part-time)"
    if is_part_time:
        hours = max(16, int(hours * 0.6))
        smin = int(smin * 0.65 / 500) * 500
        smax = int(smax * 0.7 / 500) * 500

    i += 1
    jobs.append({
        "id": f"JOB_{i:04d}",
        "title": title + variant,
        "employerName": random.choice(EMPLOYER_NAMES[etype]),
        "employerType": etype,
        "location": {"lat": lat, "lng": lng},
        "areaName": area,
        "requiredSkills": [S(x) for x in req],
        "preferredSkills": [S(x) for x in pref],
        "salaryMin": smin,
        "salaryMax": smax,
        "shift": {"startMin": sh["startMin"], "endMin": sh["endMin"], "days": d},
        "hoursPerWeek": hours,
        "hardEligibility": list(elig),
        "minExperienceMonths": minexp,
        "isSynthetic": True,
    })

out = os.path.join(os.path.dirname(__file__), "..", "data", "jobs.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump(jobs, f, indent=2, ensure_ascii=False)

# ── sanity checks ─────────────────────────────────────────────────────
skills = {s["id"] for s in json.load(
    open(os.path.join(os.path.dirname(__file__), "..", "data", "skills.json"),
         encoding="utf-8"))}
for j in jobs:
    for sk in j["requiredSkills"] + j["preferredSkills"]:
        assert sk in skills, f"{j['id']} references unknown skill {sk}"
    assert j["salaryMin"] < j["salaryMax"], j["id"]
    assert j["shift"]["startMin"] < j["shift"]["endMin"], j["id"]

sal = [j["salaryMin"] for j in jobs]
reqcounts = [len(j["requiredSkills"]) for j in jobs]
print(f"jobs: {len(jobs)}")
print(f"distinct titles: {len(set(j['title'] for j in jobs))}")
print(f"salaryMin range: {min(sal)} - {max(sal)}  median {int(statistics.median(sal))}")
print(f"required-skill count: min {min(reqcounts)} max {max(reqcounts)} "
      f"mean {sum(reqcounts)/len(reqcounts):.2f}")
print(f"jobs requiring >=3 skills: {sum(1 for c in reqcounts if c >= 3)}")
print(f"jobs requiring both Tally+GST: "
      f"{sum(1 for j in jobs if S('TALLY_BASIC') in j['requiredSkills'] and S('GST_FILING') in j['requiredSkills'])}")
from collections import Counter
print(Counter(j["areaName"] for j in jobs).most_common())
