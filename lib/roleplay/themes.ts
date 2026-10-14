// Case themes: one business problem each, with the PI codes (all from one
// instructional area) that can all be addressed in that problem. The case
// writer picks PIs only from a theme's list, so a case never mixes PIs that
// don't belong together.

import type { Business, Family } from "@/lib/roleplay/businesses";
import { count, int, money, month, pick, tidy, weekday, type Rng } from "@/lib/roleplay/random";

export type ThemeInput = { biz: Business; rng: Rng; j: string };

export type ThemeText = {
  // 1–2 sentences of background with concrete numbers.
  facts: string;
  // The one problem, stated plainly.
  problem: string;
  // Medium and hard: a tradeoff with a number that matters.
  tradeoff: string;
  // Hard: a second goal that competes with the first.
  conflict: string;
  // What the judge will ask about, phrased to follow "will also ask".
  concern: string;
  // Hard: the judge's built-in objection, spoken.
  objection: string;
  tasks: [string, string, string];
};

export type Theme = {
  id: string;
  area: string;
  // Short problem label for the case title: "Harbor Hotel: profitable but short of cash".
  title: string;
  codes: string[];
  // Only for these kinds of business (default: any that fits the event).
  families?: Family[];
  roles: string[];
  judgeRoles?: string[];
  write: (input: ThemeInput) => ThemeText;
};

const pct = (rng: Rng, min: number, max: number) => int(rng, min, max);

// Businesses that sell to customers (not banks and planners advising them).
const OPERATING: Family[] = ["lodging", "restaurant", "travel", "events", "retail", "auto", "services", "food", "sports", "agency", "smallbiz", "startup"];

export const THEMES: Theme[] = [
  /* ---------------------------------------------------------------- */
  /* Financial Analysis                                                */
  /* ---------------------------------------------------------------- */
  {
    id: "fi-cash-vs-profit",
    area: "Financial Analysis",
    title: "profitable but short of cash",
    families: OPERATING,
    codes: ["FI:091", "FI:058", "FI:354", "FI:355", "FI:359", "FI:505", "FI:507", "FI:508", "FI:513", "FI:541", "FI:633", "FI:637", "FI:739", "FI:733", "FI:734", "FI:741", "FI:094", "FI:093", "FI:106", "FI:579", "FI:092", "FI:542", "FI:085", "FI:409", "FI:424"],
    roles: ["a finance intern", "an assistant to the controller", "a bookkeeping assistant"],
    write: ({ biz, rng, j }) => {
      const late = int(rng, 3, 7);
      const payout = pick(rng, ["every two weeks", "every 30 days", "twice a month"]);
      const terms = pick(rng, ["five days", "seven days", "ten days"]);
      return {
        facts: `Last year ${biz.name} earned ${money(biz.revenue)} in revenue and showed a profit, yet it paid ${late} suppliers more than 30 days late. Most sales arrive through a payment platform that pays out ${payout}, while suppliers and staff expect payment within ${terms}.`,
        problem: `${j} doesn't understand how a profitable year could leave the business short of cash.`,
        tradeoff: `A short-term credit line would cover the gap but costs ${int(rng, 9, 14)}% a year, and asking ${biz.customers} to pay deposits up front could cost some sales.`,
        conflict: `${j} also wants to set aside ${money(tidy(biz.revenue * 0.05))} this year for new equipment, which would make the cash gap worse.`,
        concern: `whether it would be acceptable to tell suppliers that payments are "processing" while waiting for the next payout`,
        objection: `We made money last year. I don't see why I should change anything about how we pay people.`,
        tasks: [
          "Explain why profit and cash are different, using the business's own numbers.",
          "Recommend how the business should time money coming in and going out this season.",
          `Advise ${j} on how to handle suppliers honestly while the gap is fixed.`
        ]
      };
    }
  },
  {
    id: "fi-budget-overrun",
    area: "Financial Analysis",
    title: "over budget halfway through the year",
    families: OPERATING,
    codes: ["FI:106", "FI:099", "FI:460", "FI:662", "FI:722", "FI:723", "FI:728", "FI:768", "FI:769", "FI:658", "FI:661", "FI:394", "FI:096", "FI:417", "FI:357", "FI:542", "FI:660", "FI:503", "FI:502"],
    roles: ["a budget analyst", "an assistant manager", "a finance intern"],
    write: ({ biz, rng, j }) => {
      const budget = tidy(biz.revenue * 0.35);
      const over = pct(rng, 8, 18);
      return {
        facts: `Six months into the year, ${biz.nameOwn} operating budget of ${money(budget)} is ${over}% over plan. Labor and supplies make up most of the overspending, while sales are only ${pct(rng, 1, 4)}% above last year.`,
        problem: `${j} needs to know where the budget went wrong and how to finish the year without running out of money.`,
        tradeoff: `Cutting ${int(rng, 6, 12)} hours of staff time a week would close most of the gap, but ${biz.customers} have already noticed slower service.`,
        conflict: `At the same time, ${j} has promised the team a ${pct(rng, 2, 4)}% raise in ${month(rng)}, which isn't in the current budget.`,
        concern: "whether the budget was unrealistic from the start or the team just stopped following it",
        objection: "Budgets are guesses anyway. Why should I trust a new one more than the old one?",
        tasks: [
          "Explain what a budget is for and what the variance is telling the business.",
          "Recommend specific changes for the second half of the year, with numbers.",
          "Propose how the business should build and track next year's budget."
        ]
      };
    }
  },
  {
    id: "fi-capital-investment",
    area: "Financial Analysis",
    title: "deciding whether a big purchase pays off",
    families: OPERATING,
    codes: ["FI:078", "FI:062", "FI:238", "FI:646", "FI:745", "FI:746", "FI:747", "FI:748", "FI:750", "FI:740", "FI:357", "FI:340", "FI:043", "FI:492", "FI:354", "FI:345", "FI:642"],
    roles: ["a financial analyst", "a finance intern", "an assistant controller"],
    write: ({ biz, rng, j }) => {
      const cost = tidy(biz.revenue * (0.08 + rng() * 0.08));
      const saving = tidy(cost * (0.18 + rng() * 0.12));
      return {
        facts: `${biz.name} is considering a ${money(cost)} purchase of new equipment that the supplier says will save about ${money(saving)} a year in labor and repairs. The equipment should last ${int(rng, 6, 10)} years.`,
        problem: `${j} has to decide this month whether to buy it, lease it, or wait.`,
        tradeoff: `Leasing costs ${money(tidy(cost * 0.22))} a year with no money down, while buying would use most of the business's cash reserve.`,
        conflict: `${j} also wants to keep enough cash on hand to survive a slow season, which has happened in two of the last five years.`,
        concern: "how anyone can be sure the promised savings will actually show up",
        objection: "The salesperson already showed me a payback chart. Why do I need more analysis than that?",
        tasks: [
          "Explain how the business should judge whether an investment is worth it, including the time value of money.",
          "Compare buying, leasing and waiting using the numbers in the case.",
          "Recommend one option and say what you would track after the decision."
        ]
      };
    }
  },
  {
    id: "fi-business-credit",
    area: "Financial Analysis",
    title: "borrowing to grow",
    families: OPERATING,
    codes: ["FI:002", "FI:023", "FI:031", "FI:033", "FI:034", "FI:039", "FI:041", "FI:043", "FI:339", "FI:340", "FI:782", "FI:756", "FI:544", "FI:543", "FI:071", "FI:568", "FI:354"],
    roles: ["a finance intern", "a small-business banking associate", "an assistant to the owner"],
    write: ({ biz, rng, j }) => {
      const need = tidy(biz.revenue * (0.1 + rng() * 0.1));
      return {
        facts: `${biz.name} wants ${money(need)} to open a second location by ${month(rng)}. A bank has offered a five-year loan at ${int(rng, 7, 11)}% interest, and a family friend has offered the same amount in exchange for ${pct(rng, 15, 30)}% ownership.`,
        problem: `${j} has never borrowed money for the business and isn't sure which offer to take, or whether to grow at all.`,
        tradeoff: `The loan keeps full ownership but adds a monthly payment of about ${money(tidy(need / 48))}, even in slow months.`,
        conflict: `${j} also wants to keep the business debt-free in case the economy slows, and two competitors have just closed.`,
        concern: "what the bank will look at before approving the loan",
        objection: "Debt is how small businesses go under. I'd rather grow slowly with my own money.",
        tasks: [
          "Explain the purpose of business credit and the risks that come with it.",
          "Compare debt and equity using the two offers in the case.",
          "Recommend a financing plan and what the business should prepare before applying."
        ]
      };
    }
  },
  {
    id: "fi-internal-controls",
    area: "Financial Analysis",
    title: "cash that doesn't add up",
    families: OPERATING,
    codes: ["FI:113", "FI:343", "FI:479", "FI:480", "FI:351", "FI:353", "FI:355", "FI:706", "FI:713", "FI:714", "FI:344", "FI:396", "FI:310", "FI:676", "FI:675", "FI:653", "FI:802", "FI:069", "FI:085"],
    roles: ["a bookkeeping assistant", "an internal audit intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      const short = int(rng, 900, 4200, 50);
      return {
        facts: `Over the last ${int(rng, 6, 10)} weeks, ${biz.nameOwn} daily deposits have come up ${money(short)} short of what the register reports show. ${int(rng, 3, 6)} employees can open the cash drawer, and the same person counts the cash and makes the deposit.`,
        problem: `${j} wants the shortages to stop without accusing anyone unfairly.`,
        tradeoff: `A new point-of-sale system with individual logins costs ${money(int(rng, 3000, 9000, 500))}, while changing procedures costs nothing but adds about ${int(rng, 15, 30)} minutes to closing each night.`,
        conflict: `${j} also trusts the team and doesn't want new rules to make loyal employees feel like suspects.`,
        concern: "whether the business should report this to anyone outside the company",
        objection: "Everyone here has worked for me for years. This is probably just counting mistakes.",
        tasks: [
          "Explain what internal controls are and why separating duties matters.",
          "Recommend specific cash-handling procedures the business should start this week.",
          "Advise on the ethical and legal steps if the shortages continue."
        ]
      };
    }
  },
  {
    id: "fi-reading-statements",
    area: "Financial Analysis",
    title: "making sense of the financial statements",
    families: OPERATING,
    codes: ["FI:085", "FI:093", "FI:094", "FI:091", "FI:102", "FI:276", "FI:277", "FI:334", "FI:335", "FI:546", "FI:097", "FI:281", "FI:655", "FI:388", "FI:630", "FI:579", "FI:354", "FI:541"],
    roles: ["a finance intern", "an accounting assistant", "a junior analyst"],
    write: ({ biz, rng, j }) => {
      const margin = pct(rng, 2, 6);
      return {
        facts: `${biz.nameOwn} income statement shows ${money(biz.revenue)} in sales and a net profit margin of ${margin}%, down from ${margin + pct(rng, 3, 6)}% two years ago. The balance sheet shows ${money(tidy(biz.revenue * 0.12))} in debt, and inventory has grown by ${pct(rng, 20, 40)}%.`,
        problem: `${j} has a meeting with a possible investor in ${int(rng, 2, 3)} weeks and doesn't understand what the statements say about the business.`,
        tradeoff: `Hiring an outside accountant to prepare a full analysis would cost ${money(int(rng, 2500, 6000, 500))} and take a month, which is after the meeting.`,
        conflict: `${j} wants the business to look as strong as possible to the investor but also wants an honest picture of what is going wrong.`,
        concern: "which single number the investor will care about most",
        objection: "Sales are up. Isn't that the only thing that really matters?",
        tasks: [
          "Explain what the income statement and balance sheet each show.",
          "Point out what the numbers suggest about the business's health, including the limits of the statements.",
          `Recommend how ${j} should present the finances to the investor honestly.`
        ]
      };
    }
  },
  {
    id: "fi-personal-finance-client",
    area: "Financial Analysis",
    title: "a client with too much debt",
    families: ["finance"],
    codes: ["FI:065", "FI:066", "FI:070", "FI:071", "FI:072", "FI:073", "FI:077", "FI:081", "FI:270", "FI:562", "FI:568", "FI:569", "FI:571", "FI:783", "FI:831", "FI:062", "FI:075", "FI:076", "FI:002", "FI:782", "FI:061"],
    roles: ["a member services representative", "a financial planning assistant", "a junior advisor"],
    judgeRoles: ["client"],
    write: ({ biz, rng, j }) => {
      const debt = int(rng, 8000, 22000, 500);
      return {
        facts: `${j}, a ${int(rng, 24, 38)}-year-old ${biz.customer}, earns ${money(int(rng, 42000, 68000, 1000))} a year and carries ${money(debt)} on two credit cards at ${int(rng, 21, 27)}% interest. ${j} has no emergency savings and has just been offered a new car loan.`,
        problem: `${j} wants to get control of money for the first time and has asked ${biz.name} for help.`,
        tradeoff: `Paying the cards down aggressively would take about ${money(int(rng, 600, 900, 50))} a month, which leaves almost nothing for savings or the car.`,
        conflict: `${j} also wants to start saving for a home within ${int(rng, 3, 5)} years.`,
        concern: "whether a debt consolidation loan advertised online is a good idea",
        objection: "Everyone my age has credit card debt. I don't see why I should give up the car.",
        tasks: [
          "Explain how the interest on the cards is affecting the client.",
          "Build a simple budget and goal plan using the numbers in the case.",
          "Recommend how to handle the car offer and protect against future money problems."
        ]
      };
    }
  },
  {
    id: "fi-food-cost",
    area: "Financial Analysis",
    title: "food costs eating the margin",
    families: ["restaurant"],
    codes: ["FI:819", "FI:820", "FI:821", "FI:822", "FI:823", "FI:824", "FI:825", "FI:417", "FI:658", "FI:106", "FI:542", "FI:357"],
    roles: ["a kitchen manager in training", "an assistant general manager", "a cost-control intern"],
    write: ({ biz, rng, j }) => {
      const now = pct(rng, 36, 42);
      return {
        facts: `${biz.nameOwn} food cost has climbed to ${now}% of sales, up from a target of ${pct(rng, 28, 31)}%. Its best-selling dish sells for ${money(int(rng, 14, 24))}, and suppliers have raised prices on three key ingredients.`,
        problem: `${j} wants to know which menu items are losing money and what to do about them.`,
        tradeoff: `Making sauces and dough in-house would save about ${money(int(rng, 1500, 4000, 100))} a month but adds ${int(rng, 10, 20)} hours of kitchen labor a week.`,
        conflict: `${j} also refuses to shrink portions, because ${biz.customers} mention them in reviews.`,
        concern: "whether raising prices would drive regulars away",
        objection: "Every restaurant's costs went up. I don't see how a spreadsheet fixes inflation.",
        tasks: [
          "Explain how to calculate per-plate cost and what it shows.",
          "Recommend which items to re-cost, re-price, make in-house or buy ready-made.",
          "Propose how the kitchen should track food cost every week."
        ]
      };
    }
  },
  {
    id: "fi-event-budget",
    area: "Financial Analysis",
    title: "an event budget that keeps growing",
    families: ["events", "travel", "lodging"],
    codes: ["FI:793", "FI:794", "FI:795", "FI:826", "FI:827", "FI:106", "FI:789", "FI:790", "FI:808", "FI:807"],
    roles: ["an event coordinator", "an assistant event manager", "a sales and events intern"],
    write: ({ biz, rng, j }) => {
      const budget = int(rng, 40000, 140000, 5000);
      return {
        facts: `${biz.name} is planning a ${pick(rng, ["three-day food festival", "regional conference", "charity gala", "summer concert series"])} with a budget of ${money(budget)} and ${count(int(rng, 600, 3000, 100))} expected attendees. Vendor quotes already add up to ${pct(rng, 8, 15)}% more than planned.`,
        problem: `${j} needs a budget that will hold and wants to know what the event is exposed to if something goes wrong.`,
        tradeoff: `Event insurance would cost ${money(int(rng, 1200, 3500, 100))}, and raising ticket prices by ${money(int(rng, 5, 12))} might cut attendance.`,
        conflict: `${j} also promised a sponsor a premium experience that adds cost without adding ticket revenue.`,
        concern: "what happens to deposits and refunds if the event has to be cancelled",
        objection: "We've never needed insurance before. The weather has always worked out.",
        tasks: [
          "Explain how an event budget is built and where costs usually run over.",
          "Recommend changes that bring the budget back in line, with numbers.",
          "Advise on insurance, payment terms and refunds for the event."
        ]
      };
    }
  },
  {
    id: "fi-payroll-benefits",
    area: "Financial Analysis",
    title: "payroll costs higher than expected",
    families: OPERATING,
    codes: ["FI:134", "FI:438", "FI:439", "FI:442", "FI:638", "FI:639", "FI:686", "FI:687", "FI:443", "FI:068", "FI:061"],
    roles: ["a payroll assistant", "an accounting intern", "a bookkeeping assistant"],
    write: ({ biz, rng, j }) => {
      const staff = Math.max(8, biz.staff);
      return {
        facts: `${biz.name} has ${staff} employees, and total payroll costs came in ${pct(rng, 12, 20)}% higher than the wages ${j} budgeted. ${int(rng, 2, 5)} employees have also questioned the deductions on their pay stubs.`,
        problem: `${j} doesn't understand where the extra cost comes from and wants payroll handled correctly.`,
        tradeoff: `An outside payroll service would cost about ${money(int(rng, 120, 300, 10))} a month, while doing it in-house takes the office manager ${int(rng, 6, 10)} hours every pay period.`,
        conflict: `${j} also wants to add a health benefit to keep good employees, which would raise costs again.`,
        concern: "what the business owes the government besides wages",
        objection: "I pay people what we agreed. I don't see why taxes are my problem.",
        tasks: [
          "Explain the costs that make up payroll beyond hourly wages.",
          "Recommend how payroll should be calculated, recorded and checked.",
          "Advise on whether the business can afford the new benefit."
        ]
      };
    }
  },
  {
    id: "fi-inventory-value",
    area: "Financial Analysis",
    title: "inventory that's worth less than the books say",
    families: ["retail", "food", "smallbiz", "auto"],
    codes: ["FI:432", "FI:435", "FI:436", "FI:451", "FI:586", "FI:641", "FI:449", "FI:085", "FI:094", "FI:675"],
    roles: ["an accounting assistant", "an inventory analyst", "a finance intern"],
    write: ({ biz, rng, j }) => {
      const books = tidy(biz.revenue * 0.18);
      return {
        facts: `${biz.nameOwn} books list ${money(books)} of inventory, but a physical count found about ${pct(rng, 7, 14)}% of it damaged, out of date or missing. Some items have been on the shelf for more than ${int(rng, 9, 18)} months.`,
        problem: `${j} needs to know what the inventory is really worth before year-end.`,
        tradeoff: `Writing it down now lowers this year's profit, but holding the old stock ties up shelf space and cash.`,
        conflict: `${j} also wants to show strong profits to a lender reviewing a loan request next month.`,
        concern: "which inventory valuation method the business should use and why",
        objection: "If I mark it down now, the bank will think we're failing.",
        tasks: [
          "Explain how inventory value affects the cost of goods sold and profit.",
          "Recommend how to adjust the records for shrinkage and obsolete stock.",
          "Advise on how to explain the change honestly to the lender."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Operations                                                        */
  /* ---------------------------------------------------------------- */
  {
    id: "op-vendor-problems",
    area: "Operations",
    title: "a supplier who keeps letting them down",
    families: OPERATING,
    codes: ["OP:015", "OP:016", "OP:160", "OP:161", "OP:162", "OP:241", "OP:244", "OP:245", "OP:246", "OP:247", "OP:248", "OP:249", "OP:250", "OP:251", "OP:252", "OP:337", "OP:039", "OP:040", "OP:109", "OP:652", "OP:501", "OP:486", "OP:487", "OP:027"],
    roles: ["a purchasing assistant", "an operations intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      const late = pct(rng, 18, 35);
      return {
        facts: `${biz.name} buys about ${money(tidy(biz.revenue * 0.2))} a year of supplies from one main vendor. Over the last quarter, ${late}% of deliveries were late and ${int(rng, 3, 8)} shipments had damaged items.`,
        problem: `${j} wants reliable deliveries and is ready to change how the business buys.`,
        tradeoff: `A second vendor offers on-time delivery but charges ${pct(rng, 6, 12)}% more, and the current vendor gives a volume discount only if the business stays exclusive.`,
        conflict: `${j} also values the current vendor's owner, who extended credit when the business was struggling.`,
        concern: "how to choose a vendor fairly without just picking the cheapest bid",
        objection: "Switching vendors is a hassle. Every supplier has bad months.",
        tasks: [
          "Explain how the business should evaluate vendor performance.",
          "Recommend a purchasing approach, including whether to use more than one vendor.",
          "Propose how to negotiate with the current vendor professionally and ethically."
        ]
      };
    }
  },
  {
    id: "op-safety-incident",
    area: "Operations",
    title: "a near miss that could have been serious",
    codes: ["OP:004", "OP:005", "OP:007", "OP:008", "OP:009", "OP:010", "OP:012", "OP:151", "OP:212", "OP:213", "OP:317", "OP:318", "OP:481", "OP:490", "OP:593", "OP:594", "OP:596", "OP:592", "OP:595", "OP:586", "OP:657", "OP:006", "OP:119", "OP:537"],
    roles: ["a safety coordinator", "an operations intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `Last ${weekday(rng)}, an employee at ${biz.name} slipped carrying supplies through a crowded back area and was out of work for ${int(rng, 2, 6)} days, which cost ${money(int(rng, 600, 1800, 50))} in overtime to cover the shifts. It was the ${pick(rng, ["third", "fourth", "fifth"])} reported incident this year, and the business has no written safety procedures.`,
        problem: `${j} wants a workplace where accidents like this don't keep happening.`,
        tradeoff: `Fixing the layout and buying safety equipment would cost about ${money(int(rng, 2500, 9000, 500))}, and a monthly safety inspection takes ${int(rng, 2, 4)} hours of a manager's time.`,
        conflict: `${j} also needs the space to stay fast and efficient during the busiest hours, when most incidents happen.`,
        concern: "what the business is legally required to do after an injury",
        objection: "People just need to be more careful. I can't babysit everyone.",
        tasks: [
          "Explain the business's responsibilities for health and safety.",
          "Recommend how to investigate this incident and prevent the next one.",
          "Propose a simple emergency and incident response plan for staff."
        ]
      };
    }
  },
  {
    id: "op-data-security",
    area: "Operations",
    title: "a data scare",
    codes: ["OP:013", "OP:064", "OP:152", "OP:153", "OP:155", "OP:157", "OP:154", "OP:206", "OP:210", "OP:320", "OP:441", "OP:473", "OP:517", "OP:518", "OP:653", "OP:654", "OP:208", "OP:209", "OP:211"],
    roles: ["an IT and operations intern", "an office manager", "an operations assistant"],
    write: ({ biz, rng, j }) => {
      const records = int(rng, 1200, 9000, 100);
      return {
        facts: `Last month an employee at ${biz.name} clicked a fake invoice email, and a stranger briefly got into the shared drive that holds ${count(records)} ${biz.customer} records. All ${Math.max(6, biz.staff)} employees use the same password for the office computers.`,
        problem: `${j} wants to protect ${biz.customer} information and the business's own accounts.`,
        tradeoff: `A managed security service costs ${money(int(rng, 150, 450, 10))} a month, while training staff and changing policies takes time away from ${biz.customers}.`,
        conflict: `${j} also wants employees to keep working from their own phones, which is convenient but harder to secure.`,
        concern: `whether the business has to tell ${biz.customers} about what happened`,
        objection: "We're too small for hackers to care about us.",
        tasks: [
          "Explain the risks to customer data and company information.",
          "Recommend a security plan with specific policies and procedures.",
          "Advise on what to communicate after an incident and why."
        ]
      };
    }
  },
  {
    id: "op-process-improvement",
    area: "Operations",
    title: "a process that's slowing everyone down",
    families: OPERATING,
    codes: ["OP:189", "OP:191", "OP:196", "OP:327", "OP:328", "OP:355", "OP:362", "OP:457", "OP:458", "OP:461", "OP:462", "OP:463", "OP:474", "OP:475", "OP:476", "OP:022", "OP:228", "OP:352", "OP:353", "OP:556", "OP:617", "OP:618", "OP:230"],
    roles: ["an operations analyst", "an operations intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      const minutes = int(rng, 12, 35);
      return {
        facts: `At ${biz.name}, it takes an average of ${minutes} minutes to handle each ${biz.customer} request from start to finish, compared with about ${Math.round(minutes / 2)} minutes at similar businesses. Requests pass through ${int(rng, 3, 5)} people, and nobody has written the steps down.`,
        problem: `${j} wants the process to be faster without making mistakes more common.`,
        tradeoff: `New scheduling software costs ${money(int(rng, 80, 250, 10))} a month, and redesigning the process would take the team about ${int(rng, 3, 6)} weeks of extra work.`,
        conflict: `${j} also doesn't want to change the personal touch that ${biz.customers} say they like.`,
        concern: "how the business will know whether the new process is actually better",
        objection: "We've always done it this way and it works. Faster isn't always better.",
        tasks: [
          "Explain how to document and analyze the current process.",
          "Recommend specific improvements and who should own each step.",
          "Propose the measures the business should use to check the results."
        ]
      };
    }
  },
  {
    id: "op-inventory-stockouts",
    area: "Operations",
    title: "running out of the things customers want",
    families: ["retail", "food", "restaurant", "auto", "smallbiz", "sports"],
    codes: ["OP:031", "OP:299", "OP:303", "OP:304", "OP:305", "OP:306", "OP:313", "OP:314", "OP:336", "OP:413", "OP:414", "OP:415", "OP:416", "OP:443", "OP:444", "OP:477", "OP:489", "OP:498", "OP:500", "OP:407", "OP:408", "OP:409", "OP:384", "OP:386", "OP:387", "OP:397", "OP:411", "OP:412", "OP:016"],
    roles: ["an inventory coordinator", "an operations intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} ran out of its ${int(rng, 5, 12)} best-selling items ${int(rng, 10, 24)} times last quarter, while slow sellers filled ${pct(rng, 25, 40)}% of the storage space. Inventory is tracked on a spreadsheet that is updated once a week.`,
        problem: `${j} wants the right products on hand without tying up more cash in stock.`,
        tradeoff: `Ordering more often cuts stockouts but raises shipping costs by about ${money(int(rng, 400, 1500, 50))} a month.`,
        conflict: `${j} also wants to reduce how much money is sitting on shelves by ${pct(rng, 10, 20)}% before the busy season.`,
        concern: "how much inventory is too much",
        objection: "If we run out, customers can just come back next week.",
        tasks: [
          "Explain how the business's inventory control system is causing the problem.",
          "Recommend a reorder approach for best sellers and slow sellers.",
          "Propose how to work with suppliers to make deliveries more dependable."
        ]
      };
    }
  },
  {
    id: "op-expense-control",
    area: "Operations",
    title: "overhead creeping up",
    families: OPERATING,
    codes: ["OP:024", "OP:025", "OP:029", "OP:030", "OP:192", "OP:247", "OP:489", "OP:507", "OP:032", "OP:466", "OP:028", "OP:027"],
    roles: ["an operations assistant", "an assistant manager", "an operations intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.nameOwn} overhead, including rent, utilities, repairs and supplies, has risen ${pct(rng, 14, 24)}% in two years to ${money(tidy(biz.revenue * 0.22))}. Sales grew only ${pct(rng, 3, 7)}% over the same period.`,
        problem: `${j} wants to bring operating costs back under control.`,
        tradeoff: `Renegotiating the maintenance contract could save ${money(int(rng, 3000, 9000, 500))} a year but might slow repairs.`,
        conflict: `${j} also wants to keep the space looking good for ${biz.customers}, which is what sets the business apart.`,
        concern: "how employees can help control expenses without feeling blamed",
        objection: "Costs go up everywhere. I'd rather focus on selling more.",
        tasks: [
          "Explain what overhead is and how it affects the break-even point.",
          "Recommend specific expense-control steps with estimated savings.",
          "Propose how to involve employees in keeping costs down."
        ]
      };
    }
  },
  {
    id: "op-sustainability",
    area: "Operations",
    title: "going greener without losing money",
    families: OPERATING,
    codes: ["OP:483", "OP:494", "OP:495", "OP:571", "OP:572", "OP:644", "OP:658", "OP:659", "OP:670", "OP:671", "OP:134", "OP:629", "OP:622", "OP:623"],
    roles: ["a sustainability intern", "an operations assistant", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} sends about ${int(rng, 3, 9)} tons of waste to the landfill each month, and its energy bill rose ${pct(rng, 12, 25)}% last year. In a recent survey, ${pct(rng, 55, 75)}% of ${biz.customers} said they prefer businesses that reduce waste.`,
        problem: `${j} wants to cut waste and energy use in ways that ${biz.customers} will notice.`,
        tradeoff: `Composting and recycling services would cost ${money(int(rng, 250, 700, 10))} a month, and energy upgrades pay back in about ${int(rng, 3, 6)} years.`,
        conflict: `${j} also needs to keep prices steady, because a competitor nearby just lowered theirs.`,
        concern: "how to talk about green efforts without overstating them",
        objection: "Customers say they care about this, but they still buy whatever is cheapest.",
        tasks: [
          "Identify the biggest waste and sustainability opportunities in the operation.",
          "Recommend a plan that balances cost, impact and timing.",
          "Propose how to share the effort honestly with customers."
        ]
      };
    }
  },
  {
    id: "op-food-safety",
    area: "Operations",
    title: "a failed health inspection",
    families: ["restaurant"],
    codes: ["OP:582", "OP:583", "OP:584", "OP:588", "OP:599", "OP:600", "OP:601", "OP:602", "OP:603", "OP:604", "OP:605", "OP:606", "OP:607", "OP:608", "OP:609", "OP:610", "OP:620", "OP:621", "OP:630", "OP:632", "OP:585", "OP:634"],
    roles: ["a kitchen supervisor", "an assistant manager", "a food safety intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `During its last health inspection, ${biz.name} was cited for ${int(rng, 3, 6)} violations, including food held at unsafe temperatures and unlabeled containers in the walk-in cooler. The inspector will return in ${int(rng, 10, 21)} days.`,
        problem: `${j} needs every employee to follow food safety practices every shift, not just on inspection day.`,
        tradeoff: `Digital temperature monitors cost ${money(int(rng, 1200, 3500, 100))}, while paper logs are free but are often skipped during rushes.`,
        conflict: `${j} also can't slow service, because the kitchen already struggles to keep up on weekends.`,
        concern: "how to make food safety part of the culture instead of a checklist",
        objection: "Our food has never made anyone sick. The inspector was being picky.",
        tasks: [
          "Explain the food safety risks behind the violations.",
          "Recommend specific controls for temperature, labeling and storage.",
          "Propose how to train and check staff so the changes stick."
        ]
      };
    }
  },
  {
    id: "op-front-desk",
    area: "Operations",
    title: "reservation mix-ups at the front desk",
    families: ["lodging"],
    codes: ["OP:548", "OP:549", "OP:550", "OP:551", "OP:552", "OP:553", "OP:554", "OP:555", "OP:556", "OP:558", "OP:559", "OP:560", "OP:563", "OP:545", "OP:546"],
    roles: ["a front desk supervisor", "a rooms division intern", "an assistant front office manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `Last month ${biz.name} had ${int(rng, 6, 15)} reservation errors, including ${int(rng, 2, 5)} nights when it overbooked and had to send guests to another hotel. Check-in lines reach ${int(rng, 15, 30)} minutes on Friday afternoons.`,
        problem: `${j} wants reservations and check-in to run smoothly so guests start their stay happy.`,
        tradeoff: `Overbooking by ${pct(rng, 2, 5)}% protects revenue from no-shows but risks walking guests on full nights.`,
        conflict: `${j} also wants housekeeping to have rooms ready earlier, which competes with late checkouts that guests ask for.`,
        concern: "how the front desk should treat a guest who has been walked to another hotel",
        objection: "Every hotel overbooks. Guests understand.",
        tasks: [
          "Explain what is going wrong in the reservation and check-in process.",
          "Recommend procedures for booking, check-in and room assignment.",
          "Propose how front desk and housekeeping should coordinate on busy days."
        ]
      };
    }
  },
  {
    id: "op-shrinkage",
    area: "Operations",
    title: "merchandise disappearing",
    families: ["retail", "sports"],
    codes: ["OP:122", "OP:172", "OP:389", "OP:415", "OP:113", "OP:194", "OP:195", "OP:390", "OP:391", "OP:394", "OP:395", "OP:409", "OP:013", "OP:152"],
    roles: ["an assistant store manager", "a loss prevention intern", "an operations assistant"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.nameOwn} inventory shrinkage reached ${(1.8 + rng() * 2).toFixed(1)}% of sales last year, about ${money(tidy(biz.revenue * 0.025))}. Most losses are in small, high-value items near the entrance.`,
        problem: `${j} wants to cut losses from theft and errors without making the store feel unwelcoming.`,
        tradeoff: `Security tags and a camera upgrade cost ${money(int(rng, 4000, 12000, 500))}, while locking items in cases slows sales.`,
        conflict: `${j} also wants to keep the open, browse-friendly layout that ${biz.customers} like.`,
        concern: "how employees should respond if they suspect someone is shoplifting",
        objection: "Most of this is probably miscounting, not theft.",
        tasks: [
          "Explain the main causes of shrinkage in the store.",
          "Recommend security measures and stock-handling changes.",
          "Propose clear, safe procedures for employees."
        ]
      };
    }
  },
  {
    id: "op-tour-operations",
    area: "Operations",
    title: "a group trip coming apart",
    families: ["travel", "events"],
    codes: ["OP:661", "OP:662", "OP:663", "OP:664", "OP:665", "OP:666", "OP:667", "OP:668", "OP:669", "OP:660", "OP:527", "OP:119"],
    roles: ["a tour coordinator", "a travel operations intern", "an assistant tour manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} has a ${int(rng, 24, 60)}-person group trip leaving in ${int(rng, 3, 6)} weeks, and ${int(rng, 2, 4)} suppliers have changed their terms. The hotel can now hold only ${pct(rng, 70, 85)}% of the rooms, and the bus company raised its price by ${money(int(rng, 800, 2400, 100))}.`,
        problem: `${j} needs a plan to deliver the trip as promised.`,
        tradeoff: `Moving part of the group to a second hotel solves the room problem but means a second bus run every day.`,
        conflict: `${j} also wants to protect the profit margin, which is already down to ${pct(rng, 6, 11)}%.`,
        concern: `what to tell ${biz.customers} who have already paid`,
        objection: "Let's just wait. Suppliers usually come around closer to the date.",
        tasks: [
          "Explain the booking and supplier risks in the trip as it stands.",
          "Recommend how to rearrange transportation, rooms and activities.",
          "Propose how to keep the group informed and safe during the trip."
        ]
      };
    }
  },
  {
    id: "op-bank-cash",
    area: "Operations",
    title: "cash handling problems at a branch",
    families: ["finance"],
    codes: ["OP:217", "OP:218", "OP:219", "OP:220", "OP:221", "OP:272", "OP:273", "OP:274", "OP:275", "OP:446", "OP:450", "OP:653", "OP:654", "OP:271"],
    roles: ["a teller supervisor", "a branch operations intern", "an assistant branch manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `One of ${biz.nameOwn} branches has had ${int(rng, 4, 9)} cash drawer differences in ${int(rng, 4, 8)} weeks, and a teller accepted a counterfeit ${pick(rng, ["$50", "$100"])} bill last month. Two members also reported phone calls from someone pretending to be the branch.`,
        problem: `${j} wants the branch to handle cash and checks securely and to protect members from fraud.`,
        tradeoff: `New counterfeit-detection machines cost ${money(int(rng, 1500, 4000, 100))} per branch, and stricter drawer checks lengthen the wait for members at busy times.`,
        conflict: `${j} also needs to keep member wait times under ${int(rng, 5, 8)} minutes, a goal the board tracks.`,
        concern: "what tellers should do when they suspect a fraudulent transaction",
        objection: "Our tellers are experienced. More rules will just slow them down.",
        tasks: [
          "Explain the main cash handling and fraud risks at the branch.",
          "Recommend procedures for drawers, deposits and suspicious transactions.",
          "Propose how to warn members about phone scams."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Customer Relations                                                */
  /* ---------------------------------------------------------------- */
  {
    id: "cr-complaints",
    area: "Customer Relations",
    title: "complaints piling up",
    codes: ["CR:003", "CR:004", "CR:005", "CR:006", "CR:007", "CR:009", "CR:010", "CR:015", "CR:022", "CR:045", "CR:046", "CR:044", "CR:071", "CR:067", "CR:008", "CR:002", "CR:001"],
    roles: ["a customer service supervisor", "an assistant manager", "a guest relations associate"],
    write: ({ biz, rng, j }) => {
      const rating = (3.1 + rng() * 0.6).toFixed(1);
      return {
        facts: `${biz.nameOwn} online rating has fallen to ${rating} stars, and ${int(rng, 12, 30)} complaints came in last month, mostly about long waits and staff who seemed unwilling to help. Only ${pct(rng, 20, 40)}% of complaints got a reply.`,
        problem: `${j} wants employees to handle unhappy ${biz.customers} in a way that keeps them coming back.`,
        tradeoff: `Letting front-line staff offer refunds or credits up to ${money(int(rng, 20, 75, 5))} would fix problems faster but could cost about ${money(int(rng, 800, 2500, 100))} a month.`,
        conflict: `${j} also wants to enforce company policies consistently, and some ${biz.customers} ask for exceptions every time.`,
        concern: `how employees should handle a ${biz.customer} who is rude to them`,
        objection: "Some people are never happy. I don't want to give away the store.",
        tasks: [
          "Explain why positive customer relations matter to this business.",
          "Recommend a step-by-step approach for handling complaints and difficult customers.",
          "Propose how managers should support staff and follow up on feedback."
        ]
      };
    }
  },
  {
    id: "cr-peak-demand",
    area: "Customer Relations",
    title: "service slipping at the busiest times",
    families: ["lodging", "restaurant", "travel", "events", "sports"],
    codes: ["CR:038", "CR:039", "CR:043", "CR:049", "CR:051", "CR:052", "CR:053", "CR:054", "CR:055", "CR:065", "CR:066", "CR:070", "CR:072", "CR:056", "CR:015"],
    roles: ["a guest services supervisor", "an assistant manager", "a guest experience intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `On peak days ${biz.name} serves about ${pct(rng, 40, 80)}% more ${biz.customers} than on an average day, and satisfaction scores drop from ${pct(rng, 86, 92)}% to ${pct(rng, 62, 72)}%. Most complaints mention waiting and staff who seemed rushed.`,
        problem: `${j} wants ${biz.customers} to have a great experience even on the busiest days.`,
        tradeoff: `Adding ${int(rng, 2, 5)} staff on peak days would cost about ${money(int(rng, 600, 1800, 50))} a week.`,
        conflict: `${j} also wants to reward regulars and ${biz.customers} with special needs, which takes extra time when it's busiest.`,
        concern: `how to make a ${biz.customer} feel looked after when there is a wait`,
        objection: "Busy means business is good. People expect to wait.",
        tasks: [
          `Identify what shapes the ${biz.customer} experience during peaks.`,
          "Recommend staffing, process and communication changes for busy days.",
          `Propose how to handle special requests and turn a bad moment into a good one.`
        ]
      };
    }
  },
  {
    id: "cr-loyalty",
    area: "Customer Relations",
    title: "customers who don't come back",
    codes: ["CR:016", "CR:017", "CR:018", "CR:024", "CR:027", "CR:028", "CR:029", "CR:030", "CR:001", "CR:002", "CR:015", "CR:012", "CR:031", "CR:019"],
    roles: ["a customer relationship coordinator", "a marketing and service intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `Only ${pct(rng, 22, 38)}% of ${biz.nameOwn} first-time ${biz.customers} return within six months, and the business has contact details for fewer than half of them. Repeat ${biz.customers} spend about ${pct(rng, 30, 60)}% more per visit.`,
        problem: `${j} wants to build lasting relationships with ${biz.customers}.`,
        tradeoff: `A customer relationship management tool costs ${money(int(rng, 60, 200, 10))} a month and needs staff to enter details for every ${biz.customer}.`,
        conflict: `${j} also wants to respect privacy, and several ${biz.customers} have complained about too many emails from other businesses.`,
        concern: `how to use ${biz.customer} information ethically`,
        objection: "If our service is good, people will come back on their own.",
        tasks: [
          "Explain what customer relationship management is and why it matters here.",
          "Recommend how to collect and use customer information responsibly.",
          "Propose specific ways to build rapport and follow up after a visit."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Promotion                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: "pr-digital-campaign",
    area: "Promotion",
    title: "a social media presence that isn't working",
    codes: ["PR:164", "PR:165", "PR:166", "PR:299", "PR:333", "PR:364", "PR:365", "PR:366", "PR:367", "PR:371", "PR:373", "PR:379", "PR:381", "PR:389", "PR:390", "PR:393", "PR:395", "PR:335", "PR:276", "PR:458", "PR:417", "PR:418", "PR:416", "PR:362"],
    roles: ["a digital marketing coordinator", "a marketing intern", "a social media assistant"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} posts on social media about ${int(rng, 1, 3)} times a month and has ${count(int(rng, 400, 2500, 50))} followers, but fewer than ${pct(rng, 1, 3)}% of them engage with any post. Its website gets ${count(int(rng, 600, 3000, 100))} visits a month and doesn't show up on the first page of search results.`,
        problem: `${j} wants online marketing that actually brings in ${biz.customers}.`,
        tradeoff: `A part-time content creator would cost about ${money(int(rng, 800, 2000, 50))} a month, while paid ads could reach more people faster for a similar amount.`,
        conflict: `${j} also wants every post to sound like the business's personality, and doesn't want to hand the voice to an outsider.`,
        concern: "how the business will know which posts and ads are working",
        objection: "I tried posting more last year and nothing changed.",
        tasks: [
          "Explain how social media, email and the website work together in digital marketing.",
          "Recommend a digital campaign with channels, content and a schedule.",
          "Propose how to measure results and respond to comments."
        ]
      };
    }
  },
  {
    id: "pr-promo-plan",
    area: "Promotion",
    title: "a launch with no promotional plan",
    families: OPERATING,
    codes: ["PR:001", "PR:002", "PR:003", "PR:007", "PR:009", "PR:073", "PR:076", "PR:209", "PR:225", "PR:249", "PR:421", "PR:131", "PR:132", "PR:104", "PR:451", "PR:452", "PR:082", "PR:121", "PR:014", "PR:081"],
    roles: ["a marketing coordinator", "a marketing intern", "an assistant marketing manager"],
    write: ({ biz, rng, j }) => {
      const budget = int(rng, 6000, 25000, 500);
      return {
        facts: `${biz.name} is launching ${pick(rng, ["a new service line", "a second location", "a seasonal menu", "a membership program"])} in ${int(rng, 6, 10)} weeks and has a promotional budget of ${money(budget)}. Last year's launch relied on one radio ad and brought in fewer ${biz.customers} than expected.`,
        problem: `${j} wants a promotional plan that makes the launch a success.`,
        tradeoff: `A local TV spot would take ${pct(rng, 40, 60)}% of the budget, while digital and in-store promotion could be spread over more weeks.`,
        conflict: `${j} also wants to protect the business's upscale image, which rules out heavy discounting.`,
        concern: "how to decide which media are worth the money",
        objection: "Last time advertising didn't work. Why would this time be different?",
        tasks: [
          "Explain the promotional mix and how its parts support each other.",
          "Recommend a promotional plan with media, timing and budget split.",
          "Propose how to track whether each part of the plan worked."
        ]
      };
    }
  },
  {
    id: "pr-public-relations",
    area: "Promotion",
    title: "bad press and a community to win back",
    codes: ["PR:056", "PR:057", "PR:185", "PR:226", "PR:250", "PR:252", "PR:253", "PR:282", "PR:313", "PR:315", "PR:341", "PR:347", "PR:376", "PR:440", "PR:099", "PR:268"],
    roles: ["a public relations assistant", "a communications intern", "a marketing coordinator"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `A local news story about ${biz.nameOwn} ${pick(rng, ["noise complaints from neighbors", "a parking dispute with nearby residents", "a delayed refund to a customer"])} has been shared about ${count(int(rng, 2000, 9000, 100))} times, and weekend sales are down ${pct(rng, 6, 15)}% since it ran. The business has never issued a press release or worked with reporters.`,
        problem: `${j} wants to repair the business's reputation in the community.`,
        tradeoff: `Sponsoring a community event would cost ${money(int(rng, 2000, 7000, 500))} and could look like an attempt to buy goodwill.`,
        conflict: `${j} also wants to defend the business's side of the story without picking a public fight.`,
        concern: "whether the business should respond to the story publicly at all",
        objection: "If we ignore it, people will forget about it in a week.",
        tasks: [
          "Explain the role of public relations and the audiences involved.",
          "Recommend a response to the story and a plan for working with the media.",
          "Propose community activities that fit the business honestly."
        ]
      };
    }
  },
  {
    id: "pr-visual-merchandising",
    area: "Promotion",
    title: "a store that doesn't pull people in",
    families: ["retail", "food", "sports"],
    codes: ["PR:023", "PR:026", "PR:031", "PR:047", "PR:052", "PR:068", "PR:077", "PR:109", "PR:114", "PR:284", "PR:302", "PR:342", "PR:349", "PR:358", "PR:359", "PR:391"],
    roles: ["a visual merchandising assistant", "an assistant store manager", "a merchandising intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `About ${count(int(rng, 2000, 6000, 100))} people walk past ${biz.name} each day, but only ${pct(rng, 3, 7)}% come in. Displays haven't changed in ${int(rng, 4, 9)} months, and new arrivals sit in the back of the store.`,
        problem: `${j} wants displays that bring shoppers in and help them buy more.`,
        tradeoff: `New fixtures and lighting would cost ${money(int(rng, 3000, 10000, 500))}, while rearranging current fixtures costs only staff time.`,
        conflict: `${j} also wants to clear old stock this season, which competes with featuring new arrivals up front.`,
        concern: "how often displays should change",
        objection: "Shoppers come in for what they need. Displays don't change that.",
        tasks: [
          "Explain how visual merchandising and displays influence shoppers.",
          "Recommend specific window, entrance and floor display changes.",
          "Propose a display calendar and how to measure its effect."
        ]
      };
    }
  },
  {
    id: "pr-word-of-mouth",
    area: "Promotion",
    title: "turning fans into a referral engine",
    families: OPERATING,
    codes: ["PR:247", "PR:273", "PR:277", "PR:312", "PR:317", "PR:319", "PR:321", "PR:363", "PR:233", "PR:235", "PR:388", "PR:393", "PR:379"],
    roles: ["a marketing coordinator", "a marketing intern", "a community manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `In a recent survey, ${pct(rng, 45, 65)}% of ${biz.nameOwn} new ${biz.customers} said they heard about it from a friend, yet the business has no referral program. About ${int(rng, 150, 600, 10)} of its most loyal ${biz.customers} post about it often but get nothing in return.`,
        problem: `${j} wants to grow through word of mouth on purpose instead of by luck.`,
        tradeoff: `A referral reward of ${money(int(rng, 10, 30, 5))} per new ${biz.customer} could bring in hundreds of people but cut into margins.`,
        conflict: `${j} also worries that paying for referrals or using influencers will make recommendations feel less genuine.`,
        concern: "how to work with influencers ethically",
        objection: "Word of mouth can't be planned. It either happens or it doesn't.",
        tasks: [
          "Explain how word-of-mouth marketing works and why it is valuable.",
          "Recommend a referral and loyalty program with specific rewards.",
          "Propose how to involve fans and influencers honestly."
        ]
      };
    }
  },
  {
    id: "pr-tourism-promotion",
    area: "Promotion",
    title: "promoting a destination nobody has heard of",
    families: ["travel", "events", "lodging"],
    codes: ["PR:431", "PR:432", "PR:433", "PR:434", "PR:436", "PR:437", "PR:439", "PR:440", "PR:441", "PR:443", "PR:445", "PR:446", "PR:447", "PR:401", "PR:409", "PR:082", "PR:121"],
    roles: ["a tourism marketing coordinator", "a marketing intern", "a sales and marketing assistant"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} wants to bring more visitors to its small region, which drew ${count(int(rng, 18000, 60000, 1000))} visitors last year, ${pct(rng, 10, 25)}% fewer than a neighboring area with similar attractions. The local tourism office has offered ${money(int(rng, 5000, 15000, 500))} toward joint promotion.`,
        problem: `${j} wants to tell the region's story in a way that gets travelers to visit and stay longer.`,
        tradeoff: `A familiarization tour for travel writers would use most of the shared budget but reach far fewer people than online ads.`,
        conflict: `${j} also needs to keep the tourism office's partners happy, and each one wants its own attraction featured first.`,
        concern: "how to measure whether promotion actually brought visitors",
        objection: "People only travel to famous places. We can't compete with that.",
        tasks: [
          "Describe what the region should want promotion to achieve, and which channels reach the travelers it wants.",
          "Recommend a promotion plan built around the region's story.",
          "Propose how to work with community partners and measure results."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Selling                                                           */
  /* ---------------------------------------------------------------- */
  {
    id: "se-big-client",
    area: "Selling",
    title: "a big prospect on the fence",
    codes: ["SE:001", "SE:048", "SE:057", "SE:062", "SE:067", "SE:109", "SE:110", "SE:111", "SE:113", "SE:114", "SE:115", "SE:483", "SE:484", "SE:486", "SE:487", "SE:874", "SE:883", "SE:893", "SE:895", "SE:811", "SE:392", "SE:517", "SE:046"],
    roles: ["a sales representative", "an account executive", "a sales associate"],
    judgeRoles: ["purchasing director", "operations manager", "owner"],
    write: ({ biz, rng, j }) => {
      const deal = tidy(biz.revenue * (0.05 + rng() * 0.05));
      return {
        facts: `${j}'s company is deciding whether to sign a ${money(deal)} yearly contract and has received a competing offer that is ${pct(rng, 8, 15)}% cheaper. ${j}'s team has complained that past suppliers overpromised.`,
        problem: `You need to understand what ${j}'s company really needs and show why your offer is the better fit.`,
        tradeoff: `Matching the competitor's price would make the contract barely profitable, but losing it would leave a ${pct(rng, 5, 10)}% gap in this year's sales goal.`,
        conflict: `Your manager also wants a two-year commitment, while ${j} only wants to sign for one year.`,
        concern: "what happens if your company doesn't deliver what it promises",
        objection: "Honestly, your product looks about the same as everyone else's, and theirs is cheaper.",
        tasks: [
          "Ask questions to identify the prospect's needs and buying motives.",
          "Present the features and benefits that fit those needs, and answer objections.",
          "Propose terms and close the sale, with a clear follow-up plan."
        ]
      };
    }
  },
  {
    id: "se-sales-floor",
    area: "Selling",
    title: "a sales team missing its goals",
    families: ["retail", "auto", "sports", "food"],
    codes: ["SE:017", "SE:046", "SE:076", "SE:106", "SE:107", "SE:389", "SE:864", "SE:875", "SE:932", "SE:372", "SE:377", "SE:476", "SE:489", "SE:398", "SE:397", "SE:048"],
    roles: ["an assistant sales manager", "a sales team lead", "a sales intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.nameOwn} sales team has missed its monthly goal for ${int(rng, 3, 5)} months in a row, finishing about ${pct(rng, 8, 16)}% short. The average sale has dropped to ${money(int(rng, 38, 120))}, and employees rarely suggest add-on items.`,
        problem: `${j} wants the team to sell more by helping ${biz.customers} better, not by pressuring them.`,
        tradeoff: `A commission on add-on sales would cost about ${money(int(rng, 800, 2500, 100))} a month and could tempt employees to push products people don't need.`,
        conflict: `${j} also wants to keep the store's reputation for friendly, no-pressure service.`,
        concern: "where helpful suggestion selling ends and pushy selling begins",
        objection: "Good salespeople are born, not trained.",
        tasks: [
          "Walk through how a great sale should go in this store, from greeting to follow-up.",
          "Recommend sales strategies, including suggestion selling, that fit the store.",
          "Propose how to set goals, coach employees and keep selling ethical."
        ]
      };
    }
  },
  {
    id: "se-group-sales",
    area: "Selling",
    title: "winning a group booking",
    families: ["lodging", "events"],
    codes: ["SE:491", "SE:492", "SE:493", "SE:494", "SE:495", "SE:496", "SE:497", "SE:498", "SE:499", "SE:500", "SE:476", "SE:221"],
    roles: ["a sales manager", "a group sales coordinator", "a sales and catering assistant"],
    judgeRoles: ["meeting planner", "events director"],
    write: ({ biz, rng, j }) => {
      const rooms = int(rng, 40, 120, 5);
      return {
        facts: `${j} is planning a ${int(rng, 2, 4)}-day conference for ${rooms * 2} people and needs ${rooms} rooms a night, two meeting rooms and catering. A competitor has offered a lower room rate.`,
        problem: `You need to win the booking while protecting the property's revenue.`,
        tradeoff: `Matching the competitor's rate would cost about ${money(int(rng, 4000, 12000, 500))} in room revenue, but the group would also spend on food and meeting space.`,
        conflict: `The general manager also needs the dates to leave room for regular ${biz.customers}, because two of the nights usually sell out.`,
        concern: "what happens if fewer attendees show up than planned",
        objection: "Your rate is higher and your meeting space is smaller. Why should we choose you?",
        tasks: [
          "Identify what the group needs and what will influence the decision.",
          "Present a package of rooms, space and food that fits those needs.",
          "Negotiate the key terms of the agreement, including the room block."
        ]
      };
    }
  },
  {
    id: "se-travel-sale",
    area: "Selling",
    title: "a traveler who can't decide",
    families: ["travel"],
    codes: ["SE:501", "SE:505", "SE:508", "SE:509", "SE:510", "SE:511", "SE:512", "SE:513", "SE:514", "SE:515", "SE:516", "SE:220", "SE:221", "SE:500", "SE:499"],
    roles: ["a travel advisor", "a travel sales associate", "a tour sales intern"],
    judgeRoles: ["client"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${j} has come to ${biz.name} to plan a ${int(rng, 7, 12)}-day trip for a family of ${int(rng, 3, 5)} with a budget of ${money(int(rng, 6000, 14000, 500))}. ${j} has looked at ${int(rng, 3, 6)} destinations online and feels overwhelmed.`,
        problem: `You need to find out what the family really wants from the trip and recommend a plan they will love.`,
        tradeoff: `The destination ${j} likes most would use about ${pct(rng, 85, 100)}% of the budget on flights and hotels alone.`,
        conflict: `The family also wants both relaxation and adventure, and the two teenagers want very different things.`,
        concern: "why booking through an advisor is better than booking online",
        objection: "I can find all of this online myself for less.",
        tasks: [
          "Ask questions to learn the family's travel motives and needs.",
          "Recommend a destination and itinerary that fits the budget.",
          "Explain the value of the package and close the sale."
        ]
      };
    }
  },
  {
    id: "se-key-accounts",
    area: "Selling",
    title: "losing long-time accounts",
    families: ["services", "agency", "finance", "food"],
    codes: ["SE:379", "SE:381", "SE:384", "SE:488", "SE:397", "SE:398", "SE:828", "SE:380", "SE:057", "SE:110", "SE:111", "SE:360"],
    roles: ["an account manager", "a client services associate", "a sales intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} lost ${int(rng, 3, 7)} long-time clients this year, worth about ${money(tidy(biz.revenue * 0.12))} in yearly sales. Exit conversations suggest the clients felt ignored between renewals.`,
        problem: `${j} wants to keep key accounts and win back the ones that left.`,
        tradeoff: `Assigning a dedicated account manager to the top ${int(rng, 10, 20)} clients would add a salary of about ${money(int(rng, 48000, 62000, 1000))}.`,
        conflict: `${j} also needs the sales team to keep finding new clients, which leaves less time for current ones.`,
        concern: "how to approach a former client without sounding desperate",
        objection: "Clients leave. We should spend our energy on new ones.",
        tasks: [
          "Explain the value of key account management and post-sale service.",
          "Recommend how to stay in touch with clients and gather feedback.",
          "Propose a strategy to win back former clients."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Product/Service Management                                        */
  /* ---------------------------------------------------------------- */
  {
    id: "pm-merchandise-buying",
    area: "Product/Service Management",
    title: "buying the wrong amount of the wrong things",
    families: ["retail", "food", "sports"],
    codes: ["PM:058", "PM:061", "PM:062", "PM:063", "PM:064", "PM:224", "PM:232", "PM:254", "PM:258", "PM:260", "PM:261", "PM:262", "PM:263", "PM:264", "PM:223", "PM:239", "PM:006", "PM:003", "PM:259"],
    roles: ["an assistant buyer", "a merchandising intern", "a buyer"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} marked down ${pct(rng, 25, 40)}% of last season's stock to clear it, while its ${int(rng, 3, 6)} best sellers sold out in the first month. The buying budget for next season is ${money(tidy(biz.revenue * 0.3))}.`,
        problem: `${j} wants to buy the right products in the right amounts for next season.`,
        tradeoff: `Ordering early gets a ${pct(rng, 5, 10)}% discount from suppliers but locks in quantities before trends are clear.`,
        conflict: `${j} also wants to try new brands, which takes budget away from proven sellers.`,
        concern: "how the business should decide how much to reorder",
        objection: "Buying is about instinct. I know what our shoppers like.",
        tasks: [
          "Explain how a merchandise plan and open-to-buy guide buying decisions.",
          "Recommend what, how much and when to buy for next season.",
          "Propose how to choose and negotiate with suppliers."
        ]
      };
    }
  },
  {
    id: "pm-branding",
    area: "Product/Service Management",
    title: "a brand that doesn't stand out",
    families: OPERATING,
    codes: ["PM:021", "PM:042", "PM:206", "PM:207", "PM:209", "PM:126", "PM:214", "PM:243", "PM:246", "PM:272", "PM:276", "PM:277", "PM:013", "PM:290", "PM:317", "PM:313", "PM:288", "PM:289", "PM:321"],
    roles: ["a brand coordinator", "a marketing intern", "an assistant brand manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `In a survey of ${int(rng, 200, 600, 10)} local ${biz.customers}, only ${pct(rng, 12, 25)}% could name ${biz.name} without help, and most described it as "about the same" as competitors. Its logo, website and signs use ${int(rng, 3, 5)} different color schemes.`,
        problem: `${j} wants a clear brand that ${biz.customers} remember and choose.`,
        tradeoff: `A full rebrand would cost about ${money(int(rng, 8000, 25000, 500))}, while tightening the current brand costs less but changes less.`,
        conflict: `${j} also doesn't want to lose the long-time ${biz.customers} who are attached to the old look.`,
        concern: "what makes this business different in a way customers care about",
        objection: "A brand is just a logo. Our service speaks for itself.",
        tasks: [
          "Explain what branding and positioning are and why they matter here.",
          "Identify the business's competitive advantage and a positioning statement.",
          "Recommend how to bring the brand to life at every customer touch point."
        ]
      };
    }
  },
  {
    id: "pm-new-product",
    area: "Product/Service Management",
    title: "choosing the next new product",
    families: OPERATING,
    codes: ["PM:001", "PM:024", "PM:041", "PM:082", "PM:127", "PM:128", "PM:129", "PM:134", "PM:204", "PM:228", "PM:241", "PM:257", "PM:136", "PM:003", "PM:099", "PM:006"],
    roles: ["a product development assistant", "a marketing intern", "an assistant product manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `Sales of ${biz.nameOwn} longest-running offering have fallen ${pct(rng, 10, 20)}% in two years, and ${j} has ${money(int(rng, 15000, 50000, 1000))} to develop something new. Staff have suggested ${int(rng, 5, 9)} ideas, but none have been tested.`,
        problem: `${j} wants a process for choosing and launching the right new product.`,
        tradeoff: `Testing ideas with ${biz.customers} first would delay the launch by ${int(rng, 2, 4)} months, during a season when competitors are launching too.`,
        conflict: `${j} also wants to keep the original offering alive, because loyal ${biz.customers} still buy it.`,
        concern: "how to tell a good idea from a popular one",
        objection: "I already know which idea I like. Testing is a waste of time.",
        tasks: [
          "Explain where the current product is in its life cycle and what that means.",
          "Recommend how to generate, screen and test new product ideas.",
          "Propose how to position the new product and fit it into the product mix."
        ]
      };
    }
  },
  {
    id: "pm-guest-services",
    area: "Product/Service Management",
    title: "deciding which guest services to offer",
    families: ["lodging", "restaurant", "travel", "events"],
    codes: ["PM:095", "PM:297", "PM:298", "PM:299", "PM:036", "PM:138", "PM:273", "PM:081", "PM:099", "PM:308", "PM:314", "PM:306", "PM:295"],
    roles: ["a guest services coordinator", "an assistant manager", "a guest experience intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} offers ${int(rng, 8, 14)} extra services to ${biz.customers}, but ${int(rng, 3, 5)} of them are used by fewer than ${pct(rng, 3, 6)}% of ${biz.customers}. Meanwhile, reviews keep asking for ${pick(rng, ["late check-out", "online ordering", "airport shuttles", "local tour booking"])}.`,
        problem: `${j} wants a set of services that ${biz.customers} value and the business can deliver well.`,
        tradeoff: `Adding the requested service would cost about ${money(int(rng, 1500, 5000, 100))} a month, which could come from dropping unpopular ones.`,
        conflict: `${j} also promised to keep a guarantee on service quality, which gets harder as offerings grow.`,
        concern: "how to drop a service without upsetting the few who use it",
        objection: "More services means more value. Why would we cut anything?",
        tasks: [
          "Explain how services shape the business's product and image.",
          "Recommend which services to keep, add or drop, and why.",
          "Propose service standards and how to measure the experience."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Marketing-Information Management                                  */
  /* ---------------------------------------------------------------- */
  {
    id: "im-research-plan",
    area: "Marketing-Information Management",
    title: "a big decision with no research behind it",
    codes: ["IM:010", "IM:012", "IM:281", "IM:282", "IM:284", "IM:285", "IM:286", "IM:289", "IM:292", "IM:293", "IM:297", "IM:418", "IM:428", "IM:436", "IM:437", "IM:439", "IM:450", "IM:312", "IM:359", "IM:001"],
    roles: ["a marketing research assistant", "a marketing intern", "an insights analyst"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} is deciding whether to ${pick(rng, ["extend its hours", "add delivery", "open a second location", "launch a lower-priced line"])}, a change that would cost about ${money(int(rng, 20000, 80000, 1000))}. Its only data is ${int(rng, 30, 80)} comment cards from the last year.`,
        problem: `${j} wants research that shows whether ${biz.customers} actually want the change.`,
        tradeoff: `A professional research firm would charge ${money(int(rng, 5000, 15000, 500))}, while an in-house survey is cheaper but easier to get wrong.`,
        conflict: `${j} also wants an answer within ${int(rng, 4, 6)} weeks, before a lease option expires.`,
        concern: "how to make sure the survey results can be trusted",
        objection: "I'll just ask our regulars. They'll tell me what they think.",
        tasks: [
          "Explain the research problem and why marketing data is needed.",
          "Recommend a research design, sample and data-collection method.",
          "Point out sources of error and how to avoid them."
        ]
      };
    }
  },
  {
    id: "im-sales-data",
    area: "Marketing-Information Management",
    title: "lots of data, no answers",
    codes: ["IM:184", "IM:191", "IM:301", "IM:347", "IM:379", "IM:394", "IM:416", "IM:381", "IM:299", "IM:370", "IM:403", "IM:404", "IM:405", "IM:412", "IM:472", "IM:473", "IM:333", "IM:468", "IM:410", "IM:062"],
    roles: ["a marketing analyst", "a data intern", "a marketing coordinator"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} collects data from its point-of-sale system, website and email list on about ${count(int(rng, 4000, 20000, 500))} ${biz.customers}, but no one looks at it. Sales fell ${pct(rng, 6, 14)}% last quarter, and ${j} doesn't know which ${biz.customers} stopped buying.`,
        problem: `${j} wants to use the data the business already has to make better marketing decisions.`,
        tradeoff: `An analytics dashboard costs ${money(int(rng, 100, 400, 10))} a month, but someone still has to spend about ${int(rng, 4, 8)} hours a week reviewing it.`,
        conflict: `${j} also wants personalized offers for ${biz.customers} without making them feel watched.`,
        concern: "how to tell a real pattern from a coincidence",
        objection: "Data is just numbers. I know my customers personally.",
        tasks: [
          "Identify the data the business should monitor and why.",
          "Explain how to analyze and present the data so it leads to decisions.",
          "Recommend one data-driven campaign and how to measure it."
        ]
      };
    }
  },
  {
    id: "im-competitor-watch",
    area: "Marketing-Information Management",
    title: "a new competitor next door",
    codes: ["IM:298", "IM:361", "IM:409", "IM:411", "IM:429", "IM:430", "IM:433", "IM:435", "IM:469", "IM:475", "IM:488", "IM:382", "IM:434", "IM:025"],
    roles: ["a marketing research assistant", "a marketing intern", "a brand coordinator"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `A well-funded competitor opened ${int(rng, 1, 4)} blocks from ${biz.name} ${int(rng, 2, 4)} months ago, and ${biz.nameOwn} sales are down ${pct(rng, 7, 15)}% since. Online mentions of ${biz.name} have dropped by about a third.`,
        problem: `${j} wants to understand what the competitor is doing and how ${biz.customers} see both businesses.`,
        tradeoff: `Social listening software costs ${money(int(rng, 80, 300, 10))} a month, while manual tracking is free but slow.`,
        conflict: `${j} also wants to respond quickly, but doesn't want to copy the competitor or start a price war.`,
        concern: "where gathering competitor information crosses an ethical line",
        objection: "I don't care what they do. We just need to be better.",
        tasks: [
          "Explain what information to gather about the competitor and the market.",
          "Recommend how to monitor brand reputation and customer sentiment.",
          "Propose how to turn the findings into a response."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Human Resources Management                                        */
  /* ---------------------------------------------------------------- */
  {
    id: "hr-turnover-hiring",
    area: "Human Resources Management",
    title: "a revolving door of new hires",
    codes: ["HR:353", "HR:354", "HR:355", "HR:356", "HR:416", "HR:522", "HR:523", "HR:423", "HR:426", "HR:431", "HR:360", "HR:557", "HR:415", "HR:413", "HR:410"],
    roles: ["a human resources assistant", "an HR intern", "an assistant manager"],
    judgeRoles: ["owner", "operations director", "general manager"],
    write: ({ biz, rng, j }) => {
      const staff = Math.max(12, biz.staff);
      return {
        facts: `${biz.name} has ${staff} employees, and ${pct(rng, 45, 70)}% of new hires leave within ${int(rng, 60, 120, 30)} days. Replacing each one costs about ${money(int(rng, 1500, 4000, 100))} in recruiting and training, and managers hire whoever applies first.`,
        problem: `${j} wants to hire people who fit the job and stay.`,
        tradeoff: `A structured interview and skills test would take managers ${int(rng, 2, 4)} more hours per hire while several positions are already open.`,
        conflict: `${j} also needs ${int(rng, 3, 8)} new employees before the busy season starts in ${int(rng, 4, 8)} weeks.`,
        concern: "how to make hiring fair to every applicant",
        objection: "Nobody wants to work anymore. Better hiring won't change that.",
        tasks: [
          "Explain why turnover is costly and how planning helps hiring.",
          "Recommend a hiring process from job posting to job offer.",
          "Propose an onboarding approach that helps new hires stay."
        ]
      };
    }
  },
  {
    id: "hr-training",
    area: "Human Resources Management",
    title: "employees who were never really trained",
    codes: ["HR:392", "HR:438", "HR:439", "HR:440", "HR:441", "HR:442", "HR:443", "HR:444", "HR:445", "HR:446", "HR:527", "HR:528", "HR:529", "HR:530", "HR:531", "HR:532", "HR:360"],
    roles: ["a training coordinator", "a human resources assistant", "an HR intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `At ${biz.name}, new employees learn by shadowing whoever is working, and ${pct(rng, 30, 50)}% of mistakes reported last quarter came from employees in their first three months. ${j} has budgeted ${money(int(rng, 4000, 12000, 500))} for training this year.`,
        problem: `${j} wants a training program that makes every employee confident in the job.`,
        tradeoff: `Online modules cost ${money(int(rng, 25, 60, 5))} per employee but feel generic, while in-person training takes experienced staff off the floor.`,
        conflict: `${j} also wants experienced employees to keep growing, not just new hires.`,
        concern: "how the business will know the training worked",
        objection: "I learned on the job and turned out fine.",
        tasks: [
          "Assess what the business's employees need to learn.",
          "Design a training plan with objectives and learning methods.",
          "Propose how to evaluate the training and improve it."
        ]
      };
    }
  },
  {
    id: "hr-total-rewards",
    area: "Human Resources Management",
    title: "losing good people to better benefits",
    codes: ["HR:465", "HR:467", "HR:469", "HR:472", "HR:475", "HR:476", "HR:477", "HR:480", "HR:482", "HR:483", "HR:549", "HR:550", "HR:552", "HR:547", "HR:548"],
    roles: ["a compensation and benefits assistant", "a human resources assistant", "an HR intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} lost ${int(rng, 3, 6)} of its best employees this year to competitors offering ${pick(rng, ["health insurance", "a retirement match", "flexible schedules"])}. It pays about ${pct(rng, 3, 8)}% above the local average but offers no benefits beyond paid time off.`,
        problem: `${j} wants a rewards package that keeps strong employees.`,
        tradeoff: `A basic health plan would cost about ${money(int(rng, 300, 550, 10))} per employee a month, the same as a raise of roughly ${money(int(rng, 2, 3))} an hour.`,
        conflict: `${j} also wants to stay competitive on prices, which limits how much labor costs can rise.`,
        concern: "which benefits employees actually value most",
        objection: "People care about their paycheck. Benefits are a nice extra.",
        tasks: [
          "Explain the parts of a total rewards system.",
          "Recommend a rewards package the business can afford, with costs.",
          "Propose how to find out what employees want and measure the results."
        ]
      };
    }
  },
  {
    id: "hr-employee-relations",
    area: "Human Resources Management",
    title: "tension on the team",
    codes: ["HR:366", "HR:368", "HR:369", "HR:358", "HR:393", "HR:403", "HR:450", "HR:452", "HR:454", "HR:460", "HR:515", "HR:411", "HR:359"],
    roles: ["a human resources assistant", "an assistant manager", "an HR intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${int(rng, 3, 6)} employees at ${biz.name} filed complaints in the last two months about a supervisor who changes schedules at the last minute and criticizes people in front of ${biz.customers}. The supervisor has the best sales record on the team, and ${int(rng, 2, 3)} employees have said they may quit.`,
        problem: `${j} wants to resolve the complaints fairly and rebuild trust on the team.`,
        tradeoff: `Moving the supervisor to another shift would ease tension but leave the busiest shift without its strongest performer.`,
        conflict: `${j} also needs to protect the business legally, and the complaints haven't been documented consistently.`,
        concern: "how to handle complaints without taking sides before the facts are in",
        objection: "Results are what matter. Maybe the team needs to toughen up.",
        tasks: [
          "Explain how the business should handle and document employee complaints.",
          "Recommend actions for the supervisor, including any remedial steps.",
          "Propose work rules and practices that create a fair environment."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Emotional Intelligence                                            */
  /* ---------------------------------------------------------------- */
  {
    id: "ei-leading-change",
    area: "Emotional Intelligence",
    title: "a team resisting a big change",
    codes: ["EI:005", "EI:006", "EI:009", "EI:011", "EI:012", "EI:014", "EI:015", "EI:026", "EI:037", "EI:041", "EI:044", "EI:045", "EI:059", "EI:060", "EI:061", "EI:062", "EI:092", "EI:108", "EI:130", "EI:133", "EI:134", "EI:136"],
    roles: ["a team lead", "an assistant manager", "a shift supervisor"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} is switching to ${pick(rng, ["a new scheduling system", "a new point-of-sale system", "longer opening hours", "a team-based work structure"])} in ${int(rng, 3, 6)} weeks. ${int(rng, 4, 9)} of the ${Math.max(10, biz.staff)} employees have said they're against it, and two long-time employees are threatening to quit.`,
        problem: `${j} needs the team on board with the change.`,
        tradeoff: `Delaying the change by a month would give people time to adjust but cost about ${money(int(rng, 2000, 8000, 500))} in savings the change is meant to bring.`,
        conflict: `${j} also wants to keep the two long-time employees, whose experience the team depends on.`,
        concern: "how to handle the employees who are most upset",
        objection: "I'm the boss. If they don't like it, they can leave.",
        tasks: [
          "Explain what leadership looks like during change.",
          "Recommend how to communicate the change and build agreement.",
          "Propose how to handle conflict and keep the team motivated."
        ]
      };
    }
  },
  {
    id: "ei-ethical-dilemma",
    area: "Emotional Intelligence",
    title: "an ethical gray area",
    codes: ["EI:004", "EI:021", "EI:022", "EI:038", "EI:075", "EI:076", "EI:103", "EI:123", "EI:124", "EI:125", "EI:126", "EI:127", "EI:128", "EI:129", "EI:131", "EI:132", "EI:135", "EI:137", "EI:029"],
    roles: ["an assistant manager", "a team lead", "an operations associate"],
    write: ({ biz, rng, j }) => {
      const scenario = pick(rng, [
        `a supplier offered ${j} tickets to a game worth ${money(int(rng, 300, 900, 50))} while a contract is being renewed`,
        `a popular employee has been rounding up hours on time sheets by about ${int(rng, 15, 45)} minutes a week`,
        `a sales report sent to an investor counted ${money(int(rng, 8000, 25000, 500))} in orders that hadn't been confirmed`
      ]);
      return {
        facts: `${biz.name} has ${Math.max(8, biz.staff)} employees and a reputation for honesty. Last week ${j} learned that ${scenario}.`,
        problem: `${j} isn't sure what the right thing to do is and wants advice.`,
        tradeoff: `Handling it strictly could cost a valued relationship, while letting it go would be easier this week.`,
        conflict: `${j} also wants to keep morale high during the busiest month of the year.`,
        concern: "how to explain the decision to the team",
        objection: "Everybody does stuff like this. It's not a big deal.",
        tasks: [
          "Explain what makes this an ethical dilemma and who is affected.",
          "Recommend what to do, with honest reasons.",
          "Propose how the business can build trust and model ethical behavior going forward."
        ]
      };
    }
  },
  {
    id: "ei-global-customs",
    area: "Emotional Intelligence",
    title: "hosting international partners",
    codes: ["EI:033", "EI:082", "EI:083", "EI:084", "EI:085", "EI:086", "EI:087", "EI:117", "EI:118", "EI:119", "EI:120", "EI:097", "EI:096", "EI:017", "EI:036"],
    roles: ["an assistant to the owner", "a business development associate", "a partnerships intern"],
    write: ({ biz, rng, j }) => {
      const region = pick(rng, ["Japan", "Germany", "Brazil", "the United Arab Emirates", "India", "Mexico"]);
      return {
        facts: `${biz.name} is hosting a ${int(rng, 3, 6)}-person delegation from a company in ${region} for ${int(rng, 2, 3)} days. A partnership could be worth ${money(tidy(biz.revenue * 0.15))} a year, and no one on the team has worked with partners from ${region} before.`,
        problem: `${j} wants the visit to build trust and lead to an agreement.`,
        tradeoff: `Hiring a cultural consultant would cost ${money(int(rng, 1500, 4000, 100))}, which is most of the visit budget.`,
        conflict: `${j} also wants a signed agreement during the visit, which may not match how the partners like to do business.`,
        concern: "what could accidentally offend the visitors",
        objection: "Business is business everywhere. Good numbers will close the deal.",
        tasks: [
          "Explain how business customs differ and why that matters here.",
          "Recommend how to plan the visit, meetings and social time.",
          "Propose how the team should communicate and negotiate respectfully."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Economics                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: "ec-economic-conditions",
    area: "Economics",
    title: "a slowing economy and rising costs",
    codes: ["EC:005", "EC:006", "EC:010", "EC:011", "EC:018", "EC:081", "EC:082", "EC:083", "EC:084", "EC:017", "EC:023", "EC:013", "EC:012", "EC:105", "EC:001", "EC:077"],
    roles: ["a business analyst", "a management trainee", "an assistant to the owner"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `Prices for ${biz.nameOwn} main supplies rose ${pct(rng, 7, 12)}% this year, and the interest rate on its credit line went from ${int(rng, 5, 6)}% to ${int(rng, 8, 10)}%. Local unemployment has ticked up, and ${biz.customers} are spending ${pct(rng, 4, 9)}% less per visit.`,
        problem: `${j} wants to understand what the economy is doing to the business and how to respond.`,
        tradeoff: `Raising prices ${pct(rng, 4, 8)}% would cover costs but could push price-sensitive ${biz.customers} to cheaper competitors.`,
        conflict: `${j} also planned to hire ${int(rng, 2, 4)} people this year, which now looks risky.`,
        concern: "whether this is a short dip or the start of a recession",
        objection: "The economy is out of my control. Why should I worry about it?",
        tasks: [
          "Explain how inflation, interest rates and consumer spending affect this business.",
          "Recommend how to adjust pricing, costs and plans for the business cycle.",
          "Propose what economic signals to watch and how often."
        ]
      };
    }
  },
  {
    id: "ec-global-trade",
    area: "Economics",
    title: "deciding whether to go international",
    codes: ["EC:016", "EC:045", "EC:100", "EC:104", "EC:109", "EC:110", "EC:112", "EC:113", "EC:114", "EC:116", "EC:140", "EC:141", "EC:094", "EC:102", "EC:115"],
    roles: ["a business development associate", "an international trade intern", "a management trainee"],
    write: ({ biz, rng, j }) => {
      const country = pick(rng, ["Canada", "Mexico", "the United Kingdom", "South Korea", "Germany"]);
      return {
        facts: `A distributor in ${country} has offered to sell ${biz.nameOwn} products there, with a first order worth ${money(tidy(biz.revenue * 0.08))}. The exchange rate has moved ${pct(rng, 6, 12)}% in the last year, and shipping would take ${int(rng, 3, 6)} weeks.`,
        problem: `${j} wants to know whether selling internationally makes sense for a business this size.`,
        tradeoff: `Pricing in the local currency would make the products easier to sell but leave ${biz.name} exposed to exchange-rate swings.`,
        conflict: `${j} also can't let international orders delay deliveries to current ${biz.customers} at home.`,
        concern: "what could go wrong that the business can't see from here",
        objection: "Exporting is for big companies. We'd just be taking on headaches.",
        tasks: [
          "Explain how global trade and exchange rates affect the opportunity.",
          "Assess the cultural, political and economic factors in the target country.",
          "Recommend whether and how to enter the market."
        ]
      };
    }
  },
  {
    id: "ec-business-in-society",
    area: "Economics",
    title: "the business's role in its community",
    codes: ["EC:004", "EC:009", "EC:065", "EC:070", "EC:071", "EC:106", "EC:008", "EC:072", "EC:136", "EC:143", "EC:003", "EC:002"],
    roles: ["a management trainee", "an assistant to the owner", "a community relations intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} is one of the larger employers in its part of town, with ${Math.max(10, biz.staff)} employees. The city has proposed a ${pct(rng, 1, 3)}% local business tax to fund road repairs, and ${j} has been asked to speak at a council meeting in ${int(rng, 2, 4)} weeks.`,
        problem: `${j} wants to explain the business's value to the community and take a position on the tax.`,
        tradeoff: `The tax would cost the business about ${money(int(rng, 4000, 15000, 500))} a year, but better roads would help deliveries and ${biz.customers}.`,
        conflict: `${j} also wants to stay on good terms with council members whose support the business needs for an expansion permit.`,
        concern: "how private businesses and government should work together",
        objection: "Businesses pay enough already. The city should cut spending.",
        tasks: [
          "Explain the economic value the business creates for the community.",
          "Analyze the relationship between business and government in this decision.",
          "Recommend a position on the tax and how to present it."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Communication Skills                                              */
  /* ---------------------------------------------------------------- */
  {
    id: "co-communicating-change",
    area: "Communication Skills",
    title: "news that has to reach everyone",
    codes: ["CO:014", "CO:016", "CO:025", "CO:031", "CO:039", "CO:083", "CO:084", "CO:090", "CO:092", "CO:147", "CO:188", "CO:195", "CO:196", "CO:197", "CO:198", "CO:199", "CO:201", "CO:203", "CO:017"],
    roles: ["a communications assistant", "an assistant manager", "an administrative coordinator"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} is changing ${pick(rng, ["its scheduling policy", "its uniform and dress code", "how tips are shared", "its paid time off policy"])} on the first of next month. Its ${Math.max(10, biz.staff)} employees work different shifts, and the last policy change was announced on a breakroom sign that ${pct(rng, 30, 50)}% of employees say they never saw.`,
        problem: `${j} wants every employee to understand the change and why it is happening.`,
        tradeoff: `Holding meetings for each shift would reach everyone in person but cost about ${int(rng, 10, 25)} hours of paid time.`,
        conflict: `${j} also expects some employees to be upset and wants room for their questions without reopening the decision.`,
        concern: "which channels work best for employees who don't check email",
        objection: "I'll send one email. If people don't read it, that's on them.",
        tasks: [
          "Explain what makes staff communication effective.",
          "Develop a communication plan with messages, channels and timing.",
          "Propose how to gather questions and check that the message landed."
        ]
      };
    }
  },
  {
    id: "co-report-to-leaders",
    area: "Communication Skills",
    title: "a recommendation that needs to be heard",
    codes: ["CO:009", "CO:055", "CO:086", "CO:087", "CO:088", "CO:091", "CO:094", "CO:185", "CO:186", "CO:204", "CO:062", "CO:174", "CO:061", "CO:025", "CO:089"],
    roles: ["an analyst", "an assistant manager", "a management trainee"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `You spent ${int(rng, 3, 6)} weeks studying why ${biz.nameOwn} ${pick(rng, ["delivery times", "customer complaints", "supply costs", "employee overtime"])} rose ${pct(rng, 15, 30)}% this year. ${j} will share your findings with the owners, who have ${int(rng, 10, 15)} minutes for the topic at their next meeting.`,
        problem: `${j} wants your findings turned into a clear, persuasive recommendation the owners will act on.`,
        tradeoff: `Your full analysis is ${int(rng, 20, 40)} pages long, and cutting it down means leaving out details some owners will ask about.`,
        conflict: `${j} also wants the report to be honest about a mistake the management team made, without sounding like blame.`,
        concern: "how to present numbers to people who don't like charts",
        objection: "The owners never read reports. Why spend time on this?",
        tasks: [
          "Organize the findings into a short report with an executive summary.",
          "Choose the graphics and format that make the numbers clear.",
          "Present and defend the recommendation professionally."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Information Management                                            */
  /* ---------------------------------------------------------------- */
  {
    id: "nf-records-and-data",
    area: "Information Management",
    title: "decisions made on guesswork",
    codes: ["NF:001", "NF:002", "NF:014", "NF:077", "NF:078", "NF:079", "NF:080", "NF:081", "NF:110", "NF:111", "NF:139", "NF:143", "NF:145", "NF:236", "NF:237", "NF:238", "NF:278", "NF:216", "NF:093", "NF:185", "NF:284", "NF:288", "NF:280", "NF:076"],
    roles: ["an information management assistant", "a business analyst intern", "an office manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} keeps ${biz.customer} records in ${int(rng, 3, 5)} places: a spreadsheet, the payment system, paper files and a manager's notebook. Last month ${int(rng, 2, 4)} costly decisions were made using numbers that turned out to be months out of date.`,
        problem: `${j} wants accurate information available when decisions are made.`,
        tradeoff: `Moving everything into one system would cost ${money(int(rng, 2000, 8000, 500))} and take staff about ${int(rng, 40, 80)} hours of data entry.`,
        conflict: `${j} also needs to protect ${biz.customer} privacy, which is harder when more people can see more data.`,
        concern: "how to know whether the information can be trusted",
        objection: "We've done fine with what we have. More data just means more work.",
        tasks: [
          "Assess what information the business needs and where it lives now.",
          "Recommend how to organize, store and protect business records.",
          "Explain how managers should use the data to make decisions."
        ]
      };
    }
  },
  {
    id: "nf-new-technology",
    area: "Information Management",
    title: "choosing new technology",
    codes: ["NF:003", "NF:083", "NF:136", "NF:155", "NF:156", "NF:262", "NF:252", "NF:300", "NF:303", "NF:304", "NF:306", "NF:308", "NF:309", "NF:060", "NF:299", "NF:313", "NF:041", "NF:094", "NF:117", "NF:012", "NF:091"],
    roles: ["a technology intern", "an operations assistant", "an office manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.nameOwn} main software is ${int(rng, 8, 14)} years old, crashes about ${int(rng, 2, 5)} times a month and doesn't connect to its online ordering or booking tools. Two vendors have quoted ${money(int(rng, 6000, 12000, 500))} and ${money(int(rng, 14000, 26000, 500))} for new systems.`,
        problem: `${j} wants technology that supports the business for the next five years.`,
        tradeoff: `The cheaper system covers today's needs but would need add-ons later, while the pricier one includes more than the business uses now.`,
        conflict: `${j} also can't afford downtime during the switch, because the busy season starts in ${int(rng, 6, 10)} weeks.`,
        concern: "how to make sure the new system works with the tools the business already uses",
        objection: "The old system still mostly works. Why risk changing it?",
        tasks: [
          "Explain how technology affects the business's operations and customers.",
          "Recommend how to choose between the systems, with criteria.",
          "Propose a plan to switch systems safely."
        ]
      };
    }
  },
  {
    id: "nf-trends",
    area: "Information Management",
    title: "falling behind industry trends",
    codes: ["NF:013", "NF:015", "NF:048", "NF:305", "NF:310", "NF:311", "NF:312", "NF:319", "NF:320", "NF:321", "NF:287", "NF:206", "NF:210", "NF:213", "NF:279", "NF:281", "NF:286"],
    roles: ["a business research assistant", "a marketing intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.nameOwn} sales to ${biz.customers} under 30 have dropped ${pct(rng, 15, 30)}% in two years, while competitors have added ${pick(rng, ["mobile ordering", "self-service options", "eco-friendly packaging", "subscription plans"])}. No one at the business tracks industry news.`,
        problem: `${j} wants to spot trends early and decide which ones matter.`,
        tradeoff: `Following every trend is expensive, and the last trend the business tried cost ${money(int(rng, 4000, 12000, 500))} without paying off.`,
        conflict: `${j} also wants to keep the traditional experience that older, loyal ${biz.customers} love.`,
        concern: "how to tell a lasting trend from a fad",
        objection: "Trends come and go. We should stick with what made us successful.",
        tasks: [
          "Explain how the business should scan its environment for information.",
          "Identify the trends most likely to affect the business and why.",
          "Recommend which trends to act on and how to test them."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Professional Development                                          */
  /* ---------------------------------------------------------------- */
  {
    id: "pd-new-employee",
    area: "Professional Development",
    title: "a promising employee who keeps slipping",
    codes: ["PD:002", "PD:009", "PD:017", "PD:019", "PD:020", "PD:077", "PD:250", "PD:251", "PD:252", "PD:255", "PD:280", "PD:281", "PD:284", "PD:256", "PD:257", "PD:254", "PD:126", "PD:012", "PD:018", "PD:179"],
    roles: ["a team lead", "an assistant manager", "a peer mentor"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `A new employee at ${biz.name} is great with ${biz.customers} but has missed ${int(rng, 3, 6)} deadlines in ${int(rng, 6, 10)} weeks and arrived late ${int(rng, 4, 8)} times. The employee says there is too much to keep track of and nobody explained the priorities.`,
        problem: `${j} wants to help the employee succeed rather than start over with someone new.`,
        tradeoff: `Pairing the employee with a mentor would take ${int(rng, 2, 4)} hours a week from one of the team's busiest people.`,
        conflict: `${j} also has to be fair to the rest of the team, who have been covering the missed work.`,
        concern: "how to give honest feedback without crushing the employee's confidence",
        objection: "If someone can't manage their time by now, they're not going to learn.",
        tasks: [
          "Explain what employers expect and how this employee falls short.",
          "Recommend time-management and organization strategies for the employee.",
          "Propose goals and a check-in plan to track improvement."
        ]
      };
    }
  },
  {
    id: "pd-allergens",
    area: "Professional Development",
    title: "an allergic reaction scare",
    families: ["restaurant"],
    codes: ["PD:373", "PD:380", "PD:382", "PD:383", "PD:384", "PD:385", "PD:386", "PD:387", "PD:391", "PD:392", "PD:393", "PD:394", "PD:374", "PD:375"],
    roles: ["a kitchen supervisor", "an assistant manager", "a food safety intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `Last ${weekday(rng)}, a diner at ${biz.name} had an allergic reaction after a server said a dish was nut-free. The diner recovered, but the story has been shared about ${count(int(rng, 800, 4000, 100))} times online, and bookings are down ${pct(rng, 8, 18)}% this week.`,
        problem: `${j} wants every employee to understand food allergies and handle allergy requests safely.`,
        tradeoff: `A separate allergen prep station would cost about ${money(int(rng, 3000, 8000, 500))} and take space from the busiest part of the kitchen.`,
        conflict: `${j} also wants to keep the menu creative, and many signature dishes use common allergens.`,
        concern: "what servers should say when they aren't sure about an ingredient",
        objection: "Diners with allergies should ask more questions. We can't guarantee everything.",
        tasks: [
          "Explain the difference between food allergies and intolerances and why it matters.",
          "Recommend kitchen and service procedures to prevent exposure.",
          "Propose how to train staff and rebuild diners' trust."
        ]
      };
    }
  },
  {
    id: "pd-banking-products",
    area: "Professional Development",
    title: "matching a member to the right products",
    families: ["finance"],
    codes: ["PD:154", "PD:155", "PD:200", "PD:201", "PD:204", "PD:298", "PD:300", "PD:423", "PD:304", "PD:306", "PD:307", "PD:308", "PD:309", "PD:313"],
    roles: ["a member services representative", "a personal banker", "a financial services associate"],
    judgeRoles: ["member", "client"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${j} has been a ${biz.customer} of ${biz.name} for ${int(rng, 4, 12)} years but only uses a basic checking account. ${j} just received an inheritance of ${money(int(rng, 15000, 60000, 1000))} and is thinking about leaving it in checking.`,
        problem: `${j} wants advice on what to do with the money.`,
        tradeoff: `Safer products earn about ${(2 + rng() * 2).toFixed(1)}% a year, while investments could earn more but can lose value.`,
        conflict: `${j} also wants to help pay for a child's college in ${int(rng, 5, 10)} years and may need some of the money sooner.`,
        concern: "whether the representative is just trying to sell products",
        objection: "Banks always push whatever makes them the most money.",
        tasks: [
          "Ask questions to understand the member's goals and timeline.",
          "Explain the products that fit, including their risks and benefits.",
          "Recommend a plan and explain why it serves the member."
        ]
      };
    }
  },
  {
    id: "pd-insurance-needs",
    area: "Professional Development",
    title: "a client who isn't sure what insurance covers",
    families: ["finance"],
    codes: ["PD:319", "PD:320", "PD:321", "PD:322", "PD:323", "PD:324", "PD:327", "PD:328", "PD:330", "PD:333", "PD:334", "PD:335", "PD:336", "PD:157", "PD:222"],
    roles: ["an insurance agent", "a financial planning assistant", "an insurance services associate"],
    judgeRoles: ["client", "business owner"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${j} runs a small ${pick(rng, ["bakery", "landscaping company", "photography studio", "food truck"])} with ${int(rng, 3, 9)} employees and owns a home. ${j} pays ${money(int(rng, 300, 600, 10))} a month for insurance but doesn't know what is covered, and a neighbor's business was just sued after a customer injury.`,
        problem: `${j} has come to ${biz.name} to find out whether the family and the business are protected.`,
        tradeoff: `Adding liability and disability coverage would raise premiums by about ${money(int(rng, 120, 280, 10))} a month.`,
        conflict: `${j} also wants to start saving for retirement, which competes with paying more for insurance.`,
        concern: "which coverage matters most if the budget only allows one change",
        objection: "Insurance companies never pay out anyway.",
        tasks: [
          "Explain the main types of personal and business insurance that apply.",
          "Evaluate the client's current coverage and gaps.",
          "Recommend coverage changes that fit the budget."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Business Law                                                      */
  /* ---------------------------------------------------------------- */
  {
    id: "bl-contract-dispute",
    area: "Business Law",
    title: "a contract gone wrong",
    codes: ["BL:002", "BL:084", "BL:085", "BL:050", "BL:159", "BL:160", "BL:161", "BL:069", "BL:072", "BL:071", "BL:001", "BL:168", "BL:070", "BL:067"],
    roles: ["a legal and compliance assistant", "an assistant to the owner", "a business law intern"],
    write: ({ biz, rng, j }) => {
      const value = int(rng, 12000, 60000, 1000);
      return {
        facts: `${biz.name} signed a ${money(value)} contract with a contractor to ${pick(rng, ["renovate its space", "build a new website and booking system", "supply equipment for a new location"])}. The work is ${int(rng, 6, 10)} weeks late and partly done, and the contractor is asking for another ${money(tidy(value * 0.25))} before finishing.`,
        problem: `${j} wants to know the business's rights and the best way to resolve the dispute.`,
        tradeoff: `Going to court could recover money but would cost at least ${money(int(rng, 8000, 20000, 1000))} in legal fees and take months.`,
        conflict: `${j} also needs the work finished before a planned opening date, and finding a new contractor would add delay.`,
        concern: "whether the contract can simply be cancelled",
        objection: "A handshake and a signature should be enough. I don't want lawyers involved.",
        tasks: [
          "Explain what makes the contract legally binding and how it may have been breached.",
          "Compare negotiation, mediation, arbitration and litigation for this dispute.",
          "Recommend a course of action and how to protect the business in future contracts."
        ]
      };
    }
  },
  {
    id: "bl-compliance",
    area: "Business Law",
    title: "a business that grew past its paperwork",
    codes: ["BL:001", "BL:007", "BL:008", "BL:009", "BL:010", "BL:011", "BL:162", "BL:163", "BL:074", "BL:067", "BL:120", "BL:119", "BL:073", "BL:006"],
    roles: ["a compliance assistant", "an office manager", "an assistant to the owner"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} has grown from ${int(rng, 4, 8)} to ${Math.max(15, biz.staff)} employees in two years. It still classifies most workers as independent contractors, hasn't updated its workplace safety posters, and missed a state reporting deadline last quarter.`,
        problem: `${j} wants the business to follow the law before a small problem becomes a big one.`,
        tradeoff: `A compliance consultant would charge about ${money(int(rng, 3000, 9000, 500))}, while doing it in-house would take ${j} away from running the business.`,
        conflict: `${j} also worries that reclassifying contractors as employees would raise labor costs by ${pct(rng, 10, 20)}%.`,
        concern: "what the business should fix first",
        objection: "Small businesses can't keep up with every regulation. Nobody's checking.",
        tasks: [
          "Explain the legal issues the business is facing.",
          "Recommend a compliance program with priorities and owners.",
          "Advise on how to handle the worker classification question."
        ]
      };
    }
  },
  {
    id: "bl-hospitality-regs",
    area: "Business Law",
    title: "a guest complaint with legal risk",
    families: ["lodging", "restaurant", "events", "travel"],
    codes: ["BL:065", "BL:135", "BL:170", "BL:171", "BL:172", "BL:173", "BL:174", "BL:175", "BL:176", "BL:165", "BL:166", "BL:177", "BL:169", "BL:168"],
    roles: ["a guest relations manager", "an assistant general manager", "a compliance assistant"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `A ${biz.customer} at ${biz.name} is asking for ${money(int(rng, 2000, 15000, 500))} and threatening legal action after ${
          biz.family === "lodging"
            ? pick(rng, ["slipping on a wet floor near the pool", "having belongings stolen from a room"])
            : biz.family === "restaurant"
              ? pick(rng, ["being served alcohol after already appearing intoxicated", "getting sick after a meal"])
              : pick(rng, ["being denied a refund for a cancelled event", "being injured on an uneven walkway"])
        }. ${j} has also learned that the business's last regulatory inspection was ${int(rng, 18, 30)} months ago.`,
        problem: `${j} wants to handle the complaint fairly and reduce the business's legal risk.`,
        tradeoff: `Offering a settlement of ${money(int(rng, 1500, 6000, 500))} might end the matter quickly but could look like an admission of fault.`,
        conflict: `${j} also wants to protect the business's reputation, and the ${biz.customer} has posted about the incident online.`,
        concern: `what rights the ${biz.customer} actually has`,
        objection: "Guests agree to our policies when they book. That should protect us.",
        tasks: [
          "Explain the regulations and customer rights that apply.",
          "Recommend how to respond to this complaint.",
          "Propose policies that reduce legal risk going forward."
        ]
      };
    }
  },
  {
    id: "bl-finance-compliance",
    area: "Business Law",
    title: "a regulator's warning",
    families: ["finance"],
    codes: ["BL:133", "BL:134", "BL:146", "BL:148", "BL:149", "BL:153", "BL:091", "BL:092", "BL:093", "BL:094", "BL:088", "BL:155", "BL:151", "BL:154"],
    roles: ["a compliance analyst", "a compliance intern", "an operations associate"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `A routine review found that ${biz.name} sent ${int(rng, 30, 120)} loan disclosures late and stored some customer documents on an unsecured shared drive. The regulator has given the business ${int(rng, 60, 90, 30)} days to show a correction plan.`,
        problem: `${j} needs a compliance plan the regulator will accept.`,
        tradeoff: `Compliance software would cost about ${money(int(rng, 8000, 20000, 1000))} a year, while adding manual checks would slow loan approvals.`,
        conflict: `${j} also has to keep growing loan volume, which the board expects to rise ${pct(rng, 8, 15)}% this year.`,
        concern: "how technology can help without replacing good judgment",
        objection: "These rules change every year. We'll fix it when we get fined.",
        tasks: [
          "Explain the legal requirements behind the findings.",
          "Recommend a compliance program with procedures and technology.",
          "Propose how to report progress to the regulator."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Entrepreneurship                                                  */
  /* ---------------------------------------------------------------- */
  {
    id: "en-validate-idea",
    area: "Entrepreneurship",
    title: "testing an idea before betting on it",
    codes: ["EN:001", "EN:002", "EN:003", "EN:004", "EN:005", "EN:006", "EN:038", "EN:007", "EN:008", "EN:014", "EN:009", "EN:010", "EN:011", "EN:012", "EN:039"],
    roles: ["a business consultant", "an entrepreneurship mentor", "a start-up advisor"],
    judgeRoles: ["founder", "co-founder"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${j} wants ${biz.name} to launch ${pick(rng, ["a second service for corporate clients", "a product line sold in stores", "a franchise version of the business", "a subscription add-on"])}. ${j} has ${money(int(rng, 20000, 70000, 1000))} saved and has told friends it will launch in ${int(rng, 3, 5)} months.`,
        problem: `${j} needs to know whether the idea is worth pursuing before spending the savings.`,
        tradeoff: `A small test launch would take ${int(rng, 6, 10)} weeks and about ${money(int(rng, 3000, 9000, 500))}, which pushes back the announced date.`,
        conflict: `${j} also needs the current business to keep growing, and the founders only have so many hours.`,
        concern: "what to do if the test shows the idea won't work",
        objection: "I already know there's demand. My friends all love the idea.",
        tasks: [
          "Explain how entrepreneurs find and assess opportunities.",
          "Recommend how to test whether the venture is feasible.",
          "Identify the start-up requirements and risks, and how to plan for them."
        ]
      };
    }
  },
  {
    id: "en-funding-resources",
    area: "Entrepreneurship",
    title: "finding the money and people to grow",
    codes: ["EN:015", "EN:016", "EN:019", "EN:020", "EN:021", "EN:022", "EN:017", "EN:018", "EN:030", "EN:032", "EN:042", "EN:009"],
    roles: ["a business consultant", "a start-up advisor", "a small-business development intern"],
    judgeRoles: ["founder", "co-founder"],
    write: ({ biz, rng, j }) => {
      const need = tidy(biz.revenue * 0.25);
      return {
        facts: `${biz.name} has doubled its ${biz.customers} in a year and turned away ${int(rng, 40, 150)} orders last month. ${j} estimates it needs ${money(need)} for equipment and ${int(rng, 2, 4)} new hires to keep up.`,
        problem: `${j} needs a plan to get the money, equipment and people to grow.`,
        tradeoff: `An investor has offered the full amount for ${pct(rng, 20, 35)}% of the company, while a small-business loan would cover only part of it.`,
        conflict: `${j} also wants to keep control of the company's direction and culture.`,
        concern: "when it makes sense to hire instead of doing the work yourself",
        objection: "We've been fine doing everything ourselves. Outside money comes with strings.",
        tasks: [
          "Identify the capital and human resources the venture needs.",
          "Compare the funding options using the numbers in the case.",
          "Recommend a growth plan, including hiring decisions."
        ]
      };
    }
  },
  {
    id: "en-systems",
    area: "Entrepreneurship",
    title: "a founder who does everything",
    codes: ["EN:023", "EN:025", "EN:026", "EN:027", "EN:028", "EN:029", "EN:030", "EN:033", "EN:031", "EN:024", "EN:040"],
    roles: ["a business consultant", "an operations advisor", "a start-up mentor"],
    judgeRoles: ["founder"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${j} founded ${biz.name} and still handles ordering, scheduling, billing and most ${biz.customer} questions personally, working about ${int(rng, 65, 80)} hours a week. Errors have risen as the business grew, and ${int(rng, 2, 5)} ${biz.customers} left after billing mistakes last month.`,
        problem: `${j} wants the business to run reliably without depending on one person.`,
        tradeoff: `Writing procedures and training others would take ${j} about ${int(rng, 30, 60)} hours over the next two months, during a busy stretch.`,
        conflict: `${j} also wants to keep the personal touch that made the business popular.`,
        concern: "which task should be handed off first",
        objection: "Nobody will do it as well as I do.",
        tasks: [
          "Explain why systems and procedures matter as a venture grows.",
          "Recommend which processes to document and how to organize the workflow.",
          "Propose how the founder should delegate and adapt as things change."
        ]
      };
    }
  },
  {
    id: "en-exit",
    area: "Entrepreneurship",
    title: "planning what comes next for the founder",
    codes: ["EN:034", "EN:035", "EN:036", "EN:037", "EN:040", "EN:044", "EN:024", "EN:033", "EN:039"],
    roles: ["a business consultant", "a small-business advisor", "a succession planning intern"],
    judgeRoles: ["founder", "owner"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${j} started ${biz.name} ${int(rng, 12, 25)} years ago and wants to step back within ${int(rng, 2, 4)} years. A larger competitor has offered ${money(tidy(biz.revenue * (0.8 + rng() * 0.6)))} for the business, and a long-time manager has asked about buying it instead.`,
        problem: `${j} wants a plan for the business's future and a fair way out.`,
        tradeoff: `The competitor's offer is about ${pct(rng, 20, 35)}% higher than what the manager could likely pay.`,
        conflict: `${j} also wants employees to keep their jobs and the business to keep its name.`,
        concern: "how to treat the manager fairly whichever way the decision goes",
        objection: "I'll keep running it until I can't. Planning an exit feels like giving up.",
        tasks: [
          "Explain why continuation planning matters for the business.",
          "Compare the exit options and what each means for employees and customers.",
          "Recommend an exit strategy and the ethical steps to carry it out."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Strategic Management                                              */
  /* ---------------------------------------------------------------- */
  {
    id: "sm-planning",
    area: "Strategic Management",
    title: "growing without a plan",
    codes: ["SM:005", "SM:006", "SM:007", "SM:008", "SM:009", "SM:010", "SM:011", "SM:012", "SM:013", "SM:027", "SM:074", "SM:063", "SM:004"],
    roles: ["a management trainee", "a business analyst", "an assistant to the owner"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.nameOwn} revenue grew ${pct(rng, 20, 35)}% last year to ${money(biz.revenue)}, but profit fell and managers disagree about priorities. The business has no written mission, goals or plan.`,
        problem: `${j} wants a plan that gets everyone pulling in the same direction.`,
        tradeoff: `A two-day planning retreat would close the business for ${int(rng, 1, 2)} days and cost about ${money(int(rng, 3000, 9000, 500))} in lost sales.`,
        conflict: `${j} also wants to keep the flexibility that let the business grow quickly.`,
        concern: "how the business will know whether the plan is working",
        objection: "Plans just sit on shelves. We grew fine without one.",
        tasks: [
          "Explain the purpose of a mission, goals and a business plan.",
          "Conduct a SWOT analysis using the case details.",
          "Recommend goals, action plans and the metrics to track them."
        ]
      };
    }
  },
  {
    id: "sm-change",
    area: "Strategic Management",
    title: "a reorganization that has to work",
    codes: ["SM:087", "SM:088", "SM:094", "SM:095", "SM:096", "SM:064", "SM:066", "SM:001", "SM:100", "SM:028", "SM:065", "SM:097"],
    roles: ["a management trainee", "a change management assistant", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} is combining ${int(rng, 2, 3)} departments into one team to cut costs by about ${money(tidy(biz.revenue * 0.04))} a year. Two managers will report to a new leader, and rumors about layoffs have started.`,
        problem: `${j} wants the reorganization to succeed without losing key people.`,
        tradeoff: `Moving quickly saves money sooner, but rushing the change raises the risk that strong employees leave.`,
        conflict: `${j} also needs daily operations to keep running smoothly during the change.`,
        concern: "how to answer employees who ask whether their job is safe",
        objection: "Change is hard. People will adjust once it's done.",
        tasks: [
          "Explain the change-management process and where this business is in it.",
          "Recommend how management should organize, staff and direct the new team.",
          "Propose how to lead people through the change."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Market Planning                                                   */
  /* ---------------------------------------------------------------- */
  {
    id: "mp-new-segment",
    area: "Market Planning",
    title: "reaching a new group of customers",
    codes: ["MP:001", "MP:003", "MP:004", "MP:005", "MP:028", "MP:029", "MP:031", "MP:035", "MP:041", "MP:045", "MP:046", "MP:047", "MP:043", "MP:044", "MP:042", "MP:009"],
    roles: ["a marketing coordinator", "a marketing intern", "a market analyst"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${pct(rng, 60, 75)}% of ${biz.nameOwn} ${biz.customers} come from one group, and that group's spending has been flat for ${int(rng, 2, 3)} years. ${j} has heard that ${pick(rng, ["young families", "remote workers", "retirees", "college students", "business travelers"])} are moving into the area.`,
        problem: `${j} wants to know whether to target a new market segment and how.`,
        tradeoff: `Marketing to a new segment would take about ${pct(rng, 25, 40)}% of the marketing budget away from current ${biz.customers}.`,
        conflict: `${j} also doesn't want to change the experience in ways that turn off loyal ${biz.customers}.`,
        concern: "how big the new market really is",
        objection: "Our customers are our customers. Chasing new ones could cost us the ones we have.",
        tasks: [
          "Explain market segmentation and target marketing.",
          "Analyze the possible segments and select a target market.",
          "Recommend a marketing strategy to reach it."
        ]
      };
    }
  },
  {
    id: "mp-marketing-plan",
    area: "Market Planning",
    title: "marketing with no plan",
    codes: ["MP:006", "MP:007", "MP:008", "MP:010", "MP:012", "MP:013", "MP:014", "MP:015", "MP:018", "MP:020", "MP:021", "MP:001"],
    roles: ["a marketing coordinator", "an assistant marketing manager", "a marketing intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} spent ${money(int(rng, 15000, 50000, 1000))} on marketing last year without a written plan, and ${j} can't say which efforts worked. Sales grew only ${pct(rng, 1, 4)}% while two competitors grew faster.`,
        problem: `${j} wants a marketing plan for next year that ties spending to results.`,
        tradeoff: `Cutting the budget by ${pct(rng, 15, 25)}% would help profit now, but the business may lose ground to competitors.`,
        conflict: `${j} also wants a big push for the business's anniversary, which doesn't fit neatly into the plan.`,
        concern: "how to set a sales forecast that is realistic",
        objection: "Marketing is creative. You can't plan it like a budget.",
        tasks: [
          "Explain the parts of a marketing plan and the role of situation analysis.",
          "Set measurable marketing goals and a sales forecast.",
          "Recommend how to link marketing measures to financial results."
        ]
      };
    }
  },

  /* ---------------------------------------------------------------- */
  /* Smaller areas                                                     */
  /* ---------------------------------------------------------------- */
  {
    id: "cm-channels",
    area: "Channel Management",
    title: "choosing how to get products to customers",
    codes: ["CM:001", "CM:003", "CM:004", "CM:005", "CM:006", "CM:007", "CM:008", "CM:009", "CM:010", "CM:011", "CM:021", "CM:026"],
    roles: ["a channel coordinator", "a marketing intern", "a sales operations assistant"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} sells only through its own location and website. A large online marketplace has invited it to sell there for a ${pct(rng, 12, 20)}% fee per sale, and a regional distributor has offered to place its products in ${int(rng, 20, 60)} stores.`,
        problem: `${j} wants to choose the right channels to reach more ${biz.customers}.`,
        tradeoff: `The marketplace reaches millions of shoppers but controls the customer relationship and pricing displays.`,
        conflict: `${j} also wants to protect the business's own website sales, which have the highest margin.`,
        concern: "what happens to the relationship with current retailers if prices differ by channel",
        objection: "Every middleman takes a cut. Why not just sell direct?",
        tasks: [
          "Lay out the three ways the business could reach customers and what each involves.",
          "Evaluate the channel members and their legal and ethical considerations.",
          "Recommend a channel strategy and how to coordinate it with marketing."
        ]
      };
    }
  },
  {
    id: "rm-business-risk",
    area: "Risk Management",
    title: "risks nobody has written down",
    codes: ["RM:044", "RM:045", "RM:056", "RM:059", "RM:094", "RM:041", "RM:042", "RM:043", "RM:062", "RM:088", "RM:098", "RM:058", "RM:066", "RM:096", "RM:077", "RM:047", "RM:048", "RM:086"],
    roles: ["a risk analyst", "a management trainee", "a finance and risk intern"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `In the last year ${biz.name} lost ${money(int(rng, 8000, 30000, 1000))} to ${pick(rng, ["a supplier going out of business", "a week-long power outage", `a key client paying ${int(rng, 3, 5)} months late`, "a data breach at a vendor"])}. It has no risk management plan, and ${pct(rng, 35, 55)}% of its sales come from ${int(rng, 2, 3)} clients.`,
        problem: `${j} wants to identify the biggest risks and prepare for them.`,
        tradeoff: `Spreading sales across more clients and suppliers lowers risk but raises costs by about ${pct(rng, 3, 7)}%.`,
        conflict: `${j} also wants to grow quickly this year, which means taking on some new risks.`,
        concern: "how to decide which risks are worth worrying about",
        objection: "You can't predict the future. Planning for every disaster is a waste of time.",
        tasks: [
          "Identify and assess the main risks to the business.",
          "Explain how risk relates to the business's objectives.",
          "Recommend a risk management program with controls and indicators."
        ]
      };
    }
  },
  {
    id: "pi-pricing",
    area: "Pricing",
    title: "setting the right price",
    codes: ["PI:001", "PI:002", "PI:015", "PI:016", "PI:017", "PI:029", "PI:071", "PI:080", "PI:084", "PI:090", "PI:091"],
    roles: ["a pricing analyst", "a revenue management intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} hasn't changed its prices in ${int(rng, 2, 4)} years, while its costs rose about ${pct(rng, 10, 18)}%. A competitor charges ${pct(rng, 8, 15)}% more and is busy, but another just started a deep-discount promotion.`,
        problem: `${j} wants prices that cover costs and still feel fair to ${biz.customers}.`,
        tradeoff: `A ${pct(rng, 6, 10)}% increase would restore margins, but a survey suggests ${pct(rng, 10, 20)}% of ${biz.customers} would buy less often.`,
        conflict: `${j} also wants to offer lower prices at slow times, which some ${biz.customers} may see as unfair.`,
        concern: "what pricing practices could get the business into legal trouble",
        objection: "If we raise prices, customers will leave. It's that simple.",
        tasks: [
          "Explain the factors that affect this business's pricing decisions.",
          "Recommend a pricing approach, including how to handle peak and slow times.",
          "Address the ethical and legal considerations in pricing."
        ]
      };
    }
  },
  {
    id: "mk-guest-appeal",
    area: "Marketing",
    title: "why visitors choose somewhere else",
    families: ["lodging", "restaurant", "travel", "events"],
    codes: ["MK:027", "MK:028", "MK:029", "MK:032", "MK:033", "MK:034", "MK:035", "MK:014", "MK:025", "MK:030", "MK:031", "MK:024", "MK:001", "MK:002"],
    roles: ["a marketing coordinator", "a sales and marketing intern", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.nameOwn} visits are down ${pct(rng, 10, 20)}% this year even though the area had more visitors overall. In ${int(rng, 40, 120)} recent reviews, guests praise its ${pick(rng, ["location", "staff", "food", "views"])} but describe it as "dated" and "hard to find online."`,
        problem: `${j} wants to understand why visitors pick competitors and how to win them back.`,
        tradeoff: `Updating the property's look would cost ${money(int(rng, 20000, 80000, 5000))}, while marketing changes cost less but may not fix the "dated" feeling.`,
        conflict: `${j} also needs to keep rates competitive, because many visitors choose by price first.`,
        concern: "which factors matter most to visitors when they choose",
        objection: "Our regulars love us the way we are.",
        tasks: [
          "Explain the factors that influence visitors' choices.",
          `Identify the features that set ${biz.name} apart and those holding it back.`,
          "Recommend marketing and experience changes to improve appeal."
        ]
      };
    }
  },
  {
    id: "pj-event-planning",
    area: "Project Management",
    title: "an event with too many loose ends",
    codes: ["PJ:011", "PJ:012", "PJ:013", "PJ:014", "PJ:015", "PJ:025", "PJ:026", "PJ:027", "PJ:028", "PJ:029", "PJ:030", "PJ:031", "PJ:032", "PJ:033", "PJ:034", "PJ:035", "PJ:036", "PJ:037", "PJ:039", "PJ:040", "PJ:005", "PJ:006", "PJ:007", "PJ:009", "PJ:010"],
    roles: ["an event coordinator", "a project coordinator", "an assistant event manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.name} is hosting a ${pick(rng, ["customer appreciation event", "product launch", "community open house", "charity fundraiser"])} for about ${int(rng, 200, 800, 50)} people in ${int(rng, 6, 10)} weeks. The site isn't confirmed, nobody owns the timeline, and ${int(rng, 3, 6)} employees are each handling pieces without talking to each other.`,
        problem: `${j} wants the event planned and managed so nothing falls through the cracks.`,
        tradeoff: `An outside event planner would charge ${money(int(rng, 3000, 9000, 500))}, while managing it in-house risks pulling staff from daily work.`,
        conflict: `${j} also wants the event to be accessible to every guest, which narrows the site options.`,
        concern: "what should happen first, this week",
        objection: "Events always come together at the last minute. We'll figure it out.",
        tasks: [
          "Explain how to plan and manage the event as a project.",
          "Identify the resources, site requirements and services the event needs.",
          "Propose a timeline with owners and checkpoints."
        ]
      };
    }
  },
  {
    id: "km-knowledge",
    area: "Knowledge Management",
    title: "know-how walking out the door",
    codes: ["KM:001", "KM:002", "KM:003", "KM:004", "KM:005", "KM:008", "KM:010", "KM:011", "KM:015", "KM:016", "KM:018", "KM:020", "KM:021", "KM:017"],
    roles: ["a knowledge management assistant", "an operations analyst", "an office manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${int(rng, 2, 4)} of ${biz.nameOwn} most experienced employees plan to retire within ${int(rng, 12, 24)} months. Much of how the business works lives only in their heads, and new employees take about ${int(rng, 4, 8)} months to become fully productive.`,
        problem: `${j} wants to capture what experienced employees know before they leave.`,
        tradeoff: `A knowledge-sharing system costs ${money(int(rng, 2000, 7000, 500))} plus the retiring employees' time, during their last busy seasons.`,
        conflict: `${j} also needs to respect that some of the knowledge involves client relationships and confidential details.`,
        concern: "how to get busy experts to actually share what they know",
        objection: "We'll just have the new people shadow them for a few weeks.",
        tasks: [
          "Explain what knowledge management is and why it matters here.",
          "Recommend techniques to capture and transfer the knowledge.",
          "Propose how to keep the knowledge system up to date."
        ]
      };
    }
  },
  {
    id: "qm-quality",
    area: "Quality Management",
    title: "quality slipping as the business grows",
    codes: ["QM:001", "QM:002", "QM:003", "QM:004", "QM:009", "QM:010", "QM:012", "QM:008"],
    roles: ["a quality coordinator", "an operations analyst", "an assistant manager"],
    write: ({ biz, rng, j }) => {
      return {
        facts: `${biz.nameOwn} return and complaint rate rose from ${pct(rng, 2, 3)}% to ${pct(rng, 6, 9)}% as it grew last year, and fixing problems now costs about ${money(int(rng, 2000, 8000, 500))} a month. There is no standard for what "done right" looks like.`,
        problem: `${j} wants consistent quality that ${biz.customers} can count on.`,
        tradeoff: `Adding quality checks would slow output by about ${pct(rng, 5, 10)}% during the busiest months.`,
        conflict: `${j} also wants to keep growing at the same pace.`,
        concern: "whether quality programs are worth the cost for a business this size",
        objection: "Mistakes happen when you're growing fast. Customers understand.",
        tasks: [
          "Explain what quality management is and the costs of poor quality.",
          "Recommend quality standards and tests for the business.",
          "Propose a continuous-improvement process the team can follow."
        ]
      };
    }
  }
];
