// Letter templates. Each returns plain text built from the profile and a dispute.

function formatDate(iso) {
  const d = iso ? new Date(iso + "T00:00:00") : new Date();
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function senderBlock(p) {
  const lines = [p.name || "[Your full name]", p.street || "[Street address]", p.cityStateZip || "[City, State ZIP]"];
  if (p.phone) lines.push(p.phone);
  return lines.join("\n");
}

function identityLines(p) {
  const lines = [`Full name: ${p.name || "[Your full name]"}`];
  if (p.dob) lines.push(`Date of birth: ${formatDate(p.dob)}`);
  lines.push(`Social Security number: XXX-XX-${p.ssn4 || "____"}`);
  lines.push(`Current address: ${[p.street, p.cityStateZip].filter(Boolean).join(", ") || "[Current address]"}`);
  if (p.prevAddress) lines.push(`Previous address: ${p.prevAddress}`);
  return lines.join("\n");
}

function itemBlock(d) {
  const lines = [
    `Creditor / furnisher: ${d.creditor || "[Creditor name]"}`,
    `Account number: ${d.account || "[Account number]"}`,
  ];
  const kind = ITEM_TYPES[d.itemType];
  if (kind && d.itemType !== "account") lines.push(`Item type: ${kind.label}`);
  if (d.dofd) lines.push(`Date of first delinquency (per my records): ${formatDate(d.dofd)}`);
  lines.push(`Reason: ${(ERROR_TYPES[d.errorType] || ERROR_TYPES.other)[1]}`);
  if (d.details) lines.push(`Details: ${d.details}`);
  if (d.correction) lines.push(`Requested correction: ${d.correction}`);
  return lines.join("\n");
}

function enclosureBlock(d, extra = []) {
  const items = [
    "Copy of government-issued photo ID",
    "Copy of a utility bill or bank statement showing my current address",
    ...extra,
    ...(d.enclosures || "").split("\n").map((s) => s.trim()).filter(Boolean),
  ];
  return "Enclosures:\n" + items.map((s) => `- ${s}`).join("\n");
}

function signature(p) {
  return `Sincerely,\n\n\n______________________________\n${p.name || "[Your full name]"}`;
}

const LETTERS = {
  bureau611: {
    hint: "Send to the credit bureau that shows the error. Under FCRA § 611 it generally has 30 days to investigate.",
    build(p, d) {
      const b = BUREAUS[d.bureau];
      return [
        senderBlock(p),
        formatDate(),
        b.address.join("\n"),
        `Re: Dispute of inaccurate information under the Fair Credit Reporting Act, 15 U.S.C. § 1681i`,
        `To Whom It May Concern:`,
        `I am writing to dispute information in my ${b.name} credit file that is inaccurate or incomplete. Please use the following information to locate my file:`,
        identityLines(p),
        `The item I dispute is:`,
        itemBlock(d),
        `Under Section 611 of the Fair Credit Reporting Act (15 U.S.C. § 1681i), you must conduct a reasonable reinvestigation of this information, forward all relevant information I have provided to the company that furnished it, and record the current status of the disputed information, or delete it, within 30 days of receiving this letter. If the information cannot be verified as accurate, it must be promptly deleted or modified.`,
        `Please send me written notice of the results of your reinvestigation and a free copy of my credit report if any change is made, as required by 15 U.S.C. § 1681i(a)(6). If the item is changed or deleted, I also request that you send notice of the correction to anyone who received my report in the past six months, as allowed by 15 U.S.C. § 1681i(d).`,
        enclosureBlock(d),
        signature(p),
      ].join("\n\n");
    },
  },

  furnisher623: {
    hint: "Send to the creditor or collector that reported the item, at the dispute address on your report or statement. Under FCRA § 623 it must investigate and generally respond within 30 days.",
    build(p, d) {
      const b = BUREAUS[d.bureau];
      return [
        senderBlock(p),
        formatDate(),
        [d.creditor || "[Creditor name]", d.creditorAddress || "[Creditor dispute address]"].join("\n"),
        `Re: Direct dispute of inaccurate credit reporting, 15 U.S.C. § 1681s-2(a)(8) and 12 C.F.R. § 1022.43\nAccount number: ${d.account || "[Account number]"}`,
        `To Whom It May Concern:`,
        `I am writing to dispute information your company is reporting about me to ${b.name} and possibly other consumer reporting agencies. This information is inaccurate.`,
        identityLines(p),
        `The information I dispute is:`,
        itemBlock(d),
        `Under Section 623(a)(8) of the Fair Credit Reporting Act (15 U.S.C. § 1681s-2(a)(8)) and Regulation V (12 C.F.R. § 1022.43), you must conduct a reasonable investigation of this direct dispute, review all relevant information I have provided, and report the results to me within the time allowed, generally 30 days. If you find the information is inaccurate, you must promptly notify every consumer reporting agency to which you reported it and provide the corrected information, as required by 15 U.S.C. § 1681s-2(a)(2).`,
        `While this dispute is pending, please note on any reporting that the information is disputed by the consumer, as required by 15 U.S.C. § 1681s-2(a)(3).`,
        enclosureBlock(d),
        signature(p),
      ].join("\n\n");
    },
  },

  verification: {
    hint: "Use this after a bureau says the item was \"verified.\" Under FCRA § 611(a)(7) the bureau must describe how it verified the item within 15 days of your request.",
    build(p, d) {
      const b = BUREAUS[d.bureau];
      const sent = d.dateSent ? formatDate(d.dateSent) : "[date of original dispute]";
      return [
        senderBlock(p),
        formatDate(),
        b.address.join("\n"),
        `Re: Request for description of reinvestigation procedure, 15 U.S.C. § 1681i(a)(7)`,
        `To Whom It May Concern:`,
        `On ${sent}, I disputed the following item in my ${b.name} credit file. You responded that the information was verified. I still believe it is inaccurate.`,
        identityLines(p),
        itemBlock(d),
        `Under Section 611(a)(6)(B)(iii) and (a)(7) of the Fair Credit Reporting Act (15 U.S.C. § 1681i(a)(6)(B)(iii) and (a)(7)), I request a description of the procedure you used to determine the accuracy and completeness of this information, including the business name, address, and telephone number of any furnisher you contacted. You must provide this description within 15 days of receiving this request.`,
        `I also request that you tell me what documents, if any, the furnisher provided to support the information, and that you reinvestigate this item again in light of the enclosed documents. If the information cannot be verified, it must be deleted.`,
        enclosureBlock(d, ["Copy of your reinvestigation results"]),
        signature(p),
      ].join("\n\n");
    },
  },

  block605b: {
    hint: "For accounts caused by identity theft. Include your FTC Identity Theft Report (from IdentityTheft.gov) and proof of identity. The bureau must block the items within 4 business days of accepting your request.",
    build(p, d) {
      const b = BUREAUS[d.bureau];
      return [
        senderBlock(p),
        formatDate(),
        b.address.join("\n"),
        `Re: Request to block information resulting from identity theft, 15 U.S.C. § 1681c-2`,
        `To Whom It May Concern:`,
        `I am a victim of identity theft. I am writing to request that you block the following information from my credit file because it resulted from identity theft and does not relate to any transaction I made or authorized.`,
        identityLines(p),
        `The information to be blocked is:`,
        itemBlock(d),
        `Under Section 605B of the Fair Credit Reporting Act (15 U.S.C. § 1681c-2), you must block this information within four business days after receiving (1) appropriate proof of my identity, (2) a copy of my identity theft report, (3) identification of the information that resulted from identity theft, and (4) my statement that the information does not relate to any transaction I made. All four are included with this letter. You must also promptly notify the furnisher that the information may be the result of identity theft, that an identity theft report has been filed, and that a block has been requested.`,
        `Please send me written confirmation that the block has been placed.`,
        enclosureBlock(d, ["Copy of my FTC Identity Theft Report (IdentityTheft.gov)", "Police report, if filed"]),
        signature(p),
      ].join("\n\n");
    },
  },
};
