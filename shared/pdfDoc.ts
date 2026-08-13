import type { Contract, EventEntry } from "./types";

type Content = any;

function fmtDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function fmtMoney(v: string): string {
  const n = Number(v);
  if (!isFinite(n) || v === "") return v || "";
  return `$${n.toFixed(2)}`;
}

function todayFmt(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${mm}/${dd}/${d.getFullYear()}`;
}

function labeledLine(label: string, value: string): Content {
  return {
    text: [
      { text: `${label} `, bold: true },
      { text: value || "" },
    ],
    margin: [0, 2, 0, 2],
  };
}

function divider(): Content {
  return {
    canvas: [
      { type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.6, lineColor: "#999999" },
    ],
    margin: [0, 8, 0, 8],
  };
}

function h1(text: string): Content {
  return { text, style: "h1" };
}

function h2(text: string): Content {
  return { text, style: "h2", margin: [0, 12, 0, 6] };
}

function bulletList(items: (string | Content)[]): Content {
  return {
    ul: items,
    margin: [0, 2, 0, 6],
  };
}

function numberedList(items: string[]): Content {
  return {
    ol: items,
    margin: [0, 2, 0, 6],
  };
}

function renderEventBlock(ev: EventEntry, idx: number): Content {
  return {
    stack: [
      labeledLine(`Event ${idx + 1}:`, ev.name),
      labeledLine("Date of Service:", ev.date ? fmtDate(ev.date) : ""),
      labeledLine("Location:", ev.location),
      labeledLine("Address:", ev.address),
      labeledLine("Timings:", ev.timings),
      labeledLine("Number of Artists:", ev.numArtists),
    ],
    margin: [0, 0, 0, 8],
  };
}

function renderHiringLine(c: Contract): Content {
  const names = c.events.map((e) => e.name).filter((n) => n.trim().length > 0);
  if (names.length === 0) {
    return { text: "Client is hiring Fatema for Henna services.", margin: [0, 4, 0, 4] };
  }
  const parts: Content[] = ["Client is hiring Fatema for Henna services for "];
  names.forEach((name, i) => {
    parts.push({ text: name, bold: true });
    if (i < names.length - 2) parts.push(", ");
    else if (i === names.length - 2) parts.push(names.length === 2 ? " and " : ", and ");
  });
  parts.push(".");
  return { text: parts, margin: [0, 4, 0, 4] };
}

function renderPricing(c: Contract): Content[] {
  const eventsWithItems = c.events
    .map((ev) => ({
      ev,
      items: c.pricing.find((p) => p.eventId === ev.id)?.lineItems || [],
    }))
    .filter((x) => x.items.length > 0);

  if (eventsWithItems.length === 0) return [];

  const out: Content[] = [h2("SERVICES & PRICING")];
  for (const { ev, items } of eventsWithItems) {
    out.push({
      text: [{ text: `${ev.name || "Event"} Services:`, bold: true }],
      margin: [0, 4, 0, 2],
    });
    out.push(
      bulletList(
        items.map((li) => ({
          text: [
            { text: `${li.description}: `, bold: true },
            { text: fmtMoney(li.amount) },
          ],
        }))
      )
    );
  }
  out.push({
    text: [
      { text: "Tampa Bay Henna is to arrive: ", bold: true },
      { text: "10 minutes before start time to set up" },
    ],
    margin: [0, 4, 0, 4],
  });
  return out;
}

export function buildPdfDocDefinition(contract: Contract): any {
  const c = contract;
  const content: Content[] = [];

  content.push({ text: "TAMPA BAY HENNA by Fatema", style: "title" });
  content.push({ text: "Henna Contract", style: "h2", margin: [0, 0, 0, 6] });

  content.push(labeledLine("Phone:", "813-406-1704"));
  content.push(labeledLine("Email:", "tampabayhenna.tattoo@gmail.com"));

  content.push(divider());

  content.push({ text: "This is an agreement between Tampa Bay Henna and Client:", margin: [0, 4, 0, 6] });

  content.push(labeledLine("Name:", c.client.name));
  content.push(labeledLine("Contact Phone:", c.client.phone));
  content.push(labeledLine("Email:", c.client.email));
  content.push(labeledLine("Date:", c.client.dateSigned ? fmtDate(c.client.dateSigned) : ""));

  content.push(renderHiringLine(c));

  c.events.forEach((ev, i) => content.push(renderEventBlock(ev, i)));

  content.push(...renderPricing(c));

  content.push(h2("ARTIST PROVIDES:"));
  content.push({
    text: "Our henna artist affirms that she is qualified to perform the henna artistry and will provide:",
    margin: [0, 0, 0, 4],
  });
  content.push(
    numberedList([
      "Henna and relevant materials",
      "Henna application",
      "Patterns",
      "Photographs of previous work",
      "Essential oil",
      "Aftercare Instructions",
    ])
  );

  content.push(h2("CLIENT SHALL PROVIDE:"));
  content.push(
    numberedList([
      "Sufficient lighting for henna work",
      "Portable fan for cross air ventilation",
      "Kitchen paper towel",
      "Table and chair",
      "Comfortable seating arrangement for bridal henna and party henna",
    ])
  );

  content.push(h2("PAYMENT TERMS:"));
  content.push({
    text: [
      { text: "Deposit: ", bold: true },
      { text: `Client shall pay a deposit of ${fmtMoney(c.deposit.amount)} upon signing this agreement. This deposit is ` },
      { text: "non-refundable", bold: true },
      { text: ". Please initial here: ________________" },
    ],
    margin: [0, 4, 0, 4],
  });

  content.push(labeledLine("Deposit Status:", c.deposit.status));
  if (c.deposit.status === "Received") {
    content.push(
      labeledLine(
        "Date Deposit Received:",
        c.deposit.dateReceived ? fmtDate(c.deposit.dateReceived) : "________________"
      )
    );
  }

  content.push({
    text: [{ text: "Deposit payment can be accepted via:", bold: true }],
    margin: [0, 6, 0, 2],
  });
  content.push({
    ul: [
      {
        stack: [
          { text: [{ text: "Zelle:", bold: true }] },
          {
            ul: [
              "Name: FATEMA AKOLAWALA",
              "Phone Number: 813-406-1704",
              "Email: fatema.akolawala@gmail.com",
            ],
            type: "circle",
          },
        ],
      },
      { text: [{ text: "Venmo", bold: true }] },
      { text: [{ text: "Cash App", bold: true }] },
      { text: [{ text: "Cash", bold: true }] },
    ],
    margin: [0, 2, 0, 6],
  });

  content.push({
    text: "Deposit amount shall be deducted from the total amount on the day of event",
    italics: true,
    margin: [0, 4, 0, 6],
  });

  content.push(h2("HELPFUL SUGGESTIONS"));
  content.push(
    bulletList([
      "Leg waxing/sugaring or shaving should be done 2-4 days before henna. Doing this after your henna is done will impede the color results.",
      "Pedicure and manicures should be done the day or morning before the henna day. Please skip all massage oils, and body oils as this can impede color results.",
      "Do not do any heavy rubbing, housework, kitchen work, nor have excessive contact with water.",
      "Please make sure to rub coconut oil all over the areas where the henna designs are to ensure best results.",
      "Please wear comfortable clothing to do your henna in.",
      "Remove your contacts, if this applies, before getting your henna done.",
      "Keep your henna overnight, and warm for best results.",
      "Henna stains will be bright orange at first and darken within 24-48 hours to reach peak color results of deep reddish-brown and up to dark cherry tones.",
    ])
  );

  content.push(h2("TAMPA BAY HENNA GUARANTEES:"));
  content.push(
    bulletList([
      "The henna will be of the highest quality.",
      "The henna paste will contain henna, essential oil, lemon juice, tea, sugar concoction",
      "The henna paste will NOT contain para-phenylenediamine.",
      "If there is an emergency such that Fatema is not available, she will provide to the client contacts of one or more other henna artists who can provide the same quality of services.",
    ])
  );

  content.push(h2("TAMPA BAY HENNA CANNOT GUARANTEE:"));
  content.push(
    bulletList([
      "That the henna stains will be equally dark on every person as stains progress differently as per person's body and warmth. Hand lotions, spray-on tanning products, other oils and cosmetics, after care, as well as stress may cause henna to stain a lighter color.",
      "Proper aftercare is very important to ensure darkest stain results.",
      "While our henna is completely safe and natural, individuals with specific allergies to henna may experience skin irritation, for which Tampa Bay Henna assumes no responsibility for any adverse effects.",
    ])
  );

  content.push(h2("CANCELLATION POLICY:"));
  content.push(
    bulletList([
      {
        text: [
          { text: "More than 2 weeks before event: ", bold: true },
          { text: "Deposit Refunded" },
        ],
      },
      {
        text: [
          { text: "Within 7 days of event: ", bold: true },
          { text: "Deposited not refunded, but can be applicable for future events or henna appointments." },
        ],
      },
    ])
  );

  if (c.photographyConsent) {
    content.push(h2("PHOTOGRAPHY CONSENT:"));
    content.push(
      bulletList([
        "[ ] I consent to having my henna photographed for the artist's portfolio and social media",
        "[ ] I do NOT consent to photography of my henna",
      ])
    );
  }

  content.push(divider());
  content.push(labeledLine("Date:", todayFmt()));
  content.push(labeledLine("Fatema (e-signature):", "Fatema"));
  content.push(labeledLine("Date:", "_________________________________"));
  content.push(labeledLine("Client Signature:", "_________________________________"));
  content.push(labeledLine("Client Printed Name:", "_________________________________"));
  content.push(divider());

  content.push({
    text: [{ text: "Follow us on social media:", bold: true }],
    margin: [0, 8, 0, 2],
  });
  content.push(
    bulletList([
      "Instagram: https://www.instagram.com/tampabayhenna/",
      "Facebook: https://www.facebook.com/tampabayhenna/",
      "Google: https://share.google/R3asLoUOALbq4JXCn",
    ])
  );

  return {
    pageSize: "LETTER",
    pageMargins: [54, 54, 54, 54],
    defaultStyle: {
      font: "Roboto",
      fontSize: 10.5,
      lineHeight: 1.25,
      color: "#000000",
    },
    styles: {
      title: {
        fontSize: 20,
        bold: true,
        margin: [0, 0, 0, 6],
      },
      h1: {
        fontSize: 18,
        bold: true,
        margin: [0, 8, 0, 6],
      },
      h2: {
        fontSize: 13,
        bold: true,
        margin: [0, 12, 0, 6],
      },
    },
    content,
  };
}
