// Fictional businesses for roleplay cases. Names are invented by combining a
// first word with a suffix that fits the business type; sizes and money are
// generated per case so no two cases read alike.

import { pick, type Rng } from "@/lib/roleplay/random";

export type Family =
  | "lodging"
  | "restaurant"
  | "travel"
  | "events"
  | "retail"
  | "auto"
  | "services"
  | "food"
  | "sports"
  | "agency"
  | "finance"
  | "smallbiz"
  | "startup";

type BusinessType = {
  kind: string;
  family: Family;
  suffixes: string[];
  // "a 64-room boutique hotel near the airport": size is filled in from range.
  describe: (size: number, rng: Rng) => string;
  size: [number, number];
  customers: string;
  customer: string;
  // Rough yearly revenue per unit of size, for believable money figures.
  revenuePerUnit: [number, number];
  staffPerUnit: number;
  places: string[];
  owners: string[];
};

export type Business = {
  name: string;
  // "Harbor Inn's", "Riverbend CPAs'"
  nameOwn: string;
  kind: string;
  family: Family;
  description: string;
  size: number;
  customers: string;
  customer: string;
  revenue: number;
  staff: number;
  place: string;
  ownerRole: string;
};

const FIRST_WORDS = [
  "Harbor", "Cedar", "Juniper", "Northgate", "Bluebird", "Ironwood", "Lakeshore", "Copper", "Summit", "Willow",
  "Brightwater", "Fieldstone", "Maple Row", "Riverbend", "Sunrise", "Granite", "Pinecrest", "Silver Birch", "Red Oak",
  "Westfield", "Hollow Creek", "Lantern", "Meadowlark", "Stonebridge", "Tidewater", "Orchard Lane", "Marigold",
  "Kestrel", "Driftwood", "Larkspur", "Foxglove", "Bramble", "High Plains", "Quarry Hill", "Saltmarsh", "Amberline",
  "Wren", "Heron Point", "Trailhead", "Old Mill"
];

const TYPES: BusinessType[] = [
  // Lodging
  { kind: "boutique hotel", family: "lodging", suffixes: ["Hotel", "Inn"], size: [38, 140], customers: "guests", customer: "guest", revenuePerUnit: [38000, 62000], staffPerUnit: 0.6,
    describe: (n, r) => `a ${n}-room boutique hotel ${pick(r, ["near the airport", "downtown", "beside the convention center", "in the historic district"])}`, places: ["the front office", "the hotel's conference room", "the general manager's office"], owners: ["general manager", "owner", "director of operations"] },
  { kind: "lakeside resort", family: "lodging", suffixes: ["Resort", "Lodge"], size: [60, 220], customers: "guests", customer: "guest", revenuePerUnit: [45000, 80000], staffPerUnit: 0.8,
    describe: (n) => `a ${n}-room lakeside resort that is busiest from May to September`, places: ["the resort's boardroom", "the general manager's office"], owners: ["general manager", "resort director"] },
  { kind: "extended-stay hotel", family: "lodging", suffixes: ["Suites", "Residences"], size: [70, 160], customers: "guests", customer: "guest", revenuePerUnit: [30000, 45000], staffPerUnit: 0.35,
    describe: (n) => `a ${n}-suite extended-stay hotel that serves traveling nurses and project crews`, places: ["the front office", "the general manager's office"], owners: ["general manager", "owner"] },
  // Restaurants
  { kind: "fast-casual restaurant group", family: "restaurant", suffixes: ["Kitchen", "Grill", "Bowl Co."], size: [3, 9], customers: "guests", customer: "guest", revenuePerUnit: [900000, 1600000], staffPerUnit: 22,
    describe: (n) => `a fast-casual restaurant group with ${n} locations`, places: ["the test kitchen", "the company's office above the flagship location"], owners: ["owner", "director of operations"] },
  { kind: "neighborhood café", family: "restaurant", suffixes: ["Café", "Coffee House"], size: [1, 3], customers: "customers", customer: "customer", revenuePerUnit: [420000, 700000], staffPerUnit: 14,
    describe: (n) => (n === 1 ? "a neighborhood café that opens at six in the morning" : `a café brand with ${n} neighborhood locations`), places: ["the back office", "a corner table before the lunch rush"], owners: ["owner", "general manager"] },
  { kind: "full-service restaurant", family: "restaurant", suffixes: ["Table", "Tavern", "Bistro"], size: [90, 220], customers: "diners", customer: "diner", revenuePerUnit: [9000, 14000], staffPerUnit: 0.3,
    describe: (n) => `a ${n}-seat full-service restaurant`, places: ["the restaurant's private dining room", "the general manager's office"], owners: ["general manager", "owner", "executive chef and owner"] },
  // Travel
  { kind: "tour company", family: "travel", suffixes: ["Tours", "Expeditions"], size: [8, 30], customers: "travelers", customer: "traveler", revenuePerUnit: [70000, 140000], staffPerUnit: 1.2,
    describe: (n) => `a tour company that runs ${n} guided trips a year`, places: ["the company's office", "the conference room"], owners: ["owner", "director of tours"] },
  { kind: "travel agency", family: "travel", suffixes: ["Travel", "Journeys"], size: [6, 20], customers: "clients", customer: "client", revenuePerUnit: [120000, 200000], staffPerUnit: 1,
    describe: (n) => `a travel agency with ${n} advisors`, places: ["the agency's office", "the conference room"], owners: ["owner", "agency manager"] },
  // Events
  { kind: "event company", family: "events", suffixes: ["Events", "Festivals"], size: [4, 12], customers: "attendees", customer: "attendee", revenuePerUnit: [40000, 90000], staffPerUnit: 3,
    describe: (n) => `a company that runs ${n} outdoor festivals each summer`, places: ["the company's office", "the production trailer"], owners: ["owner", "executive producer"] },
  { kind: "wedding and event venue", family: "events", suffixes: ["Barn", "Hall", "Estate"], size: [60, 140], customers: "clients", customer: "client", revenuePerUnit: [6000, 11000], staffPerUnit: 0.1,
    describe: (n) => `a wedding and event venue that hosts about ${n} events a year`, places: ["the venue's office", "the bridal suite, which doubles as a meeting room"], owners: ["owner", "venue director"] },
  // Retail
  { kind: "clothing boutique", family: "retail", suffixes: ["Outfitters", "Clothing Co.", "Boutique"], size: [1, 4], customers: "shoppers", customer: "shopper", revenuePerUnit: [550000, 950000], staffPerUnit: 9,
    describe: (n) => (n === 1 ? "an independent clothing boutique" : `a clothing boutique with ${n} stores`), places: ["the stockroom office", "the store manager's office"], owners: ["owner", "store manager", "merchandise manager"] },
  { kind: "sporting goods store", family: "retail", suffixes: ["Sports", "Outdoor Supply"], size: [2, 6], customers: "shoppers", customer: "shopper", revenuePerUnit: [1200000, 2100000], staffPerUnit: 16,
    describe: (n) => `a sporting goods retailer with ${n} stores`, places: ["the regional office", "the store manager's office"], owners: ["owner", "store manager", "buyer"] },
  { kind: "home goods store", family: "retail", suffixes: ["Home", "Goods"], size: [1, 3], customers: "shoppers", customer: "shopper", revenuePerUnit: [800000, 1300000], staffPerUnit: 11,
    describe: (n) => (n === 1 ? "a home goods store on a busy shopping street" : `a home goods retailer with ${n} stores`), places: ["the stockroom office", "the owner's office"], owners: ["owner", "store manager"] },
  // Auto
  { kind: "auto repair shop", family: "auto", suffixes: ["Auto Care", "Garage"], size: [6, 14], customers: "drivers", customer: "driver", revenuePerUnit: [180000, 260000], staffPerUnit: 1.3,
    describe: (n) => `an independent auto repair shop with ${n} service bays`, places: ["the service office", "the owner's office"], owners: ["owner", "service manager"] },
  { kind: "car wash chain", family: "auto", suffixes: ["Car Wash", "Auto Spa"], size: [3, 8], customers: "drivers", customer: "driver", revenuePerUnit: [500000, 900000], staffPerUnit: 8,
    describe: (n) => `a car wash chain with ${n} locations and a monthly membership plan`, places: ["the company office", "the general manager's office"], owners: ["general manager", "owner"] },
  // Business services
  { kind: "IT support firm", family: "services", suffixes: ["Tech", "IT Partners"], size: [40, 160], customers: "clients", customer: "client", revenuePerUnit: [12000, 22000], staffPerUnit: 0.18,
    describe: (n) => `an IT support firm that looks after ${n} small-business clients`, places: ["the company's conference room", "the founder's office"], owners: ["founder", "operations director"] },
  { kind: "commercial cleaning company", family: "services", suffixes: ["Cleaning", "Facility Services"], size: [30, 120], customers: "clients", customer: "client", revenuePerUnit: [18000, 30000], staffPerUnit: 0.9,
    describe: (n) => `a commercial cleaning company with ${n} office-building contracts`, places: ["the company office", "the owner's office"], owners: ["owner", "operations manager"] },
  // Food marketing
  { kind: "grocery co-op", family: "food", suffixes: ["Market", "Food Co-op"], size: [2600, 6500], customers: "members", customer: "member", revenuePerUnit: [900, 1500], staffPerUnit: 0.012,
    describe: (n) => `a grocery co-op with ${n.toLocaleString("en-US")} member households`, places: ["the co-op's office", "the conference room"], owners: ["general manager", "marketing director"] },
  { kind: "specialty food brand", family: "food", suffixes: ["Foods", "Pantry"], size: [80, 340], customers: "shoppers", customer: "shopper", revenuePerUnit: [6000, 12000], staffPerUnit: 0.12,
    describe: (n) => `a specialty food brand sold in ${n} grocery stores`, places: ["the company's office", "the founder's office"], owners: ["founder", "brand manager"] },
  // Sports and entertainment
  { kind: "minor league baseball team", family: "sports", suffixes: ["Baseball Club", "Ballpark"], size: [3200, 7500], customers: "fans", customer: "fan", revenuePerUnit: [900, 1500], staffPerUnit: 0.009,
    describe: (n) => `a minor league baseball team that plays in a ${n.toLocaleString("en-US")}-seat stadium`, places: ["the front office", "the press box"], owners: ["general manager", "director of marketing"] },
  { kind: "climbing gym", family: "sports", suffixes: ["Climbing", "Boulders"], size: [600, 2200], customers: "members", customer: "member", revenuePerUnit: [700, 1000], staffPerUnit: 0.02,
    describe: (n) => `a climbing gym with ${n.toLocaleString("en-US")} members`, places: ["the gym's office", "the mezzanine meeting room"], owners: ["owner", "general manager"] },
  { kind: "concert venue", family: "sports", suffixes: ["Music Hall", "Theater"], size: [800, 2400], customers: "fans", customer: "fan", revenuePerUnit: [1500, 2600], staffPerUnit: 0.03,
    describe: (n) => `a ${n.toLocaleString("en-US")}-capacity concert venue`, places: ["the venue office", "the green room before doors open"], owners: ["general manager", "talent buyer and owner"] },
  // Marketing communications
  { kind: "marketing agency", family: "agency", suffixes: ["Creative", "Studio", "Agency"], size: [12, 40], customers: "clients", customer: "client", revenuePerUnit: [110000, 160000], staffPerUnit: 1,
    describe: (n) => `a marketing agency with ${n} employees`, places: ["the agency's conference room", "the creative director's office"], owners: ["agency owner", "account director", "creative director"] },
  // Finance
  { kind: "credit union", family: "finance", suffixes: ["Credit Union", "Community Credit Union"], size: [9000, 28000], customers: "members", customer: "member", revenuePerUnit: [300, 450], staffPerUnit: 0.004,
    describe: (n) => `a credit union with ${n.toLocaleString("en-US")} members and four branches`, places: ["the branch manager's office", "the credit union's boardroom"], owners: ["branch manager", "chief financial officer", "member services director"] },
  { kind: "accounting firm", family: "finance", suffixes: ["Accounting", "CPAs"], size: [120, 420], customers: "clients", customer: "client", revenuePerUnit: [3500, 6000], staffPerUnit: 0.05,
    describe: (n) => `an accounting firm that serves ${n} small businesses`, places: ["the firm's conference room", "the managing partner's office"], owners: ["managing partner", "senior accountant"] },
  { kind: "financial planning practice", family: "finance", suffixes: ["Wealth Partners", "Financial Planning"], size: [180, 600], customers: "clients", customer: "client", revenuePerUnit: [2500, 4500], staffPerUnit: 0.02,
    describe: (n) => `a financial planning practice with ${n} client households`, places: ["the practice's conference room", "the lead planner's office"], owners: ["lead planner", "practice owner"] },
  // Small businesses (any cluster)
  { kind: "bakery", family: "smallbiz", suffixes: ["Bakery", "Bread Co."], size: [1, 3], customers: "customers", customer: "customer", revenuePerUnit: [380000, 620000], staffPerUnit: 10,
    describe: (n) => (n === 1 ? "a family-owned bakery that also supplies four local cafés" : `a bakery with ${n} storefronts`), places: ["the bakery's back office", "the owner's office"], owners: ["owner", "general manager"] },
  { kind: "landscaping company", family: "smallbiz", suffixes: ["Landscaping", "Grounds"], size: [8, 25], customers: "clients", customer: "client", revenuePerUnit: [60000, 95000], staffPerUnit: 1,
    describe: (n) => `a landscaping company with ${n} crew members`, places: ["the company office", "the owner's truck-yard office"], owners: ["owner", "operations manager"] },
  { kind: "fitness studio", family: "smallbiz", suffixes: ["Fitness", "Studio"], size: [350, 1200], customers: "members", customer: "member", revenuePerUnit: [600, 900], staffPerUnit: 0.03,
    describe: (n) => `a fitness studio with ${n.toLocaleString("en-US")} members`, places: ["the studio office", "the owner's office"], owners: ["owner", "studio manager"] },
  { kind: "furniture workshop", family: "smallbiz", suffixes: ["Furniture", "Woodworks"], size: [6, 20], customers: "customers", customer: "customer", revenuePerUnit: [70000, 120000], staffPerUnit: 1,
    describe: (n) => `a furniture workshop with ${n} craftspeople that sells online and through two showrooms`, places: ["the workshop office", "the showroom's back office"], owners: ["owner", "general manager"] },
  // Start-ups (entrepreneurship)
  { kind: "meal-prep start-up", family: "startup", suffixes: ["Meals", "Prep Co."], size: [300, 1400], customers: "subscribers", customer: "subscriber", revenuePerUnit: [400, 700], staffPerUnit: 0.015,
    describe: (n) => `an 18-month-old meal-prep start-up with ${n.toLocaleString("en-US")} weekly subscribers`, places: ["the shared commercial kitchen's office", "a co-working space meeting room"], owners: ["founder", "co-founder"] },
  { kind: "bike repair start-up", family: "startup", suffixes: ["Cycles", "Bike Works"], size: [400, 1500], customers: "riders", customer: "rider", revenuePerUnit: [150, 260], staffPerUnit: 0.006,
    describe: (n) => `a two-year-old mobile bike repair start-up with ${n.toLocaleString("en-US")} customers`, places: ["the founder's workshop", "a co-working space meeting room"], owners: ["founder", "co-founder"] },
  { kind: "pet care start-up", family: "startup", suffixes: ["Pet Co.", "Paws"], size: [250, 900], customers: "pet owners", customer: "pet owner", revenuePerUnit: [500, 900], staffPerUnit: 0.03,
    describe: (n) => `a pet-sitting and dog-walking start-up with ${n} regular clients`, places: ["the founder's home office", "a co-working space meeting room"], owners: ["founder", "co-founder"] }
];

// Which kinds of business fit each event.
const EVENT_FAMILIES: Record<string, Family[]> = {
  "principles-bma": ["smallbiz", "services", "retail"],
  "bltdm-team": ["services", "smallbiz", "retail", "restaurant"],
  "hrm-series": ["services", "restaurant", "retail", "smallbiz"],
  "principles-finance": ["finance", "smallbiz"],
  "act-series": ["finance", "smallbiz", "services"],
  "bfs-series": ["smallbiz", "services", "restaurant", "finance"],
  "ftdm-team": ["finance"],
  "principles-marketing": ["retail", "smallbiz", "food"],
  "aam-series": ["retail"],
  "asm-series": ["auto"],
  "bsm-series": ["services", "agency"],
  "btdm-team": ["retail", "food"],
  "food-series": ["food", "restaurant"],
  "mcs-series": ["agency", "food", "sports"],
  "mtdm-team": ["food", "retail", "services"],
  "rms-series": ["retail"],
  "sem-series": ["sports"],
  "stdm-team": ["sports"],
  "principles-hospitality": ["lodging", "restaurant", "travel"],
  "htps-series": ["lodging", "events", "travel"],
  "htdm-team": ["lodging", "restaurant", "events"],
  "hlm-series": ["lodging"],
  "qsrm-series": ["restaurant"],
  "rfsm-series": ["restaurant"],
  "ttdm-team": ["travel", "events"],
  "ent-series": ["startup", "smallbiz"],
  "etdm-team": ["startup", "smallbiz"]
};

export function familiesForEvent(eventId: string): Family[] {
  return EVENT_FAMILIES[eventId] ?? ["smallbiz", "services"];
}

function roundTo(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step);
}

// A business for this event, optionally limited to some families (a theme
// about hotel reservations only fits lodging). `industry` is the user's
// optional free text, used as the business type when given.
export function makeBusiness(rng: Rng, families: Family[], industry = ""): Business {
  const pool = TYPES.filter((type) => families.includes(type.family));
  const type = pick(rng, pool.length ? pool : TYPES);
  const size = Math.round(type.size[0] + rng() * (type.size[1] - type.size[0]));
  const revenue = roundTo(size * (type.revenuePerUnit[0] + rng() * (type.revenuePerUnit[1] - type.revenuePerUnit[0])), 1000);
  const staff = Math.max(4, Math.round(size * type.staffPerUnit));
  const name = `${pick(rng, FIRST_WORDS)} ${pick(rng, type.suffixes)}`;
  const custom = industry.trim().replace(/[{}.]+/g, "").slice(0, 60);

  return {
    name,
    nameOwn: name.endsWith("s") ? `${name}'` : `${name}'s`,
    kind: custom || type.kind,
    family: type.family,
    description: custom ? `a ${custom} with ${staff} employees` : type.describe(size, rng),
    size,
    customers: type.customers,
    customer: type.customer,
    revenue,
    staff,
    place: pick(rng, type.places),
    ownerRole: pick(rng, type.owners)
  };
}

const JUDGE_FIRST = [
  "Dana", "Marcus", "Priya", "Elena", "Tomás", "Grace", "Andre", "Keiko", "Rafael", "Nadia", "Owen", "Leah", "Samuel",
  "Imani", "Victor", "Hannah", "Luis", "Mei", "Jordan", "Farah", "Caleb", "Rosa", "Desmond", "Anya", "Theo", "Lena"
];
const JUDGE_LAST = [
  "Whitlock", "Okafor", "Brennan", "Castillo", "Nguyen", "Hartley", "Mendez", "Sorensen", "Patel", "Abernathy",
  "Kowalski", "Delgado", "Fitzgerald", "Osei", "Lindqvist", "Moreau", "Carver", "Takahashi", "Ruiz", "Holloway",
  "Vance", "Achebe", "Marsh", "Quintero"
];

export function makeJudgeName(rng: Rng) {
  return { first: pick(rng, JUDGE_FIRST), last: pick(rng, JUDGE_LAST) };
}
