# Credit Dispute Helper

A small web app to track errors on your credit reports and write formal dispute letters under the Fair Credit Reporting Act (FCRA).

## What it does

- **Disputes tab:** log each wrong item: creditor, account, bureau, kind of item (late payment, charge-off, repossession, collection, foreclosure, bankruptcy, judgment or tax lien, hard inquiry, personal info) and what's wrong with it. Once you record the date you mailed a dispute, it counts down the 30-day response deadline and flags overdue ones.
- **Letters tab:** turns a dispute into a printable letter. Four templates:
  - Dispute to a credit bureau (FCRA § 611, 15 U.S.C. § 1681i)
  - Direct dispute to the creditor that reported it (FCRA § 623, 15 U.S.C. § 1681s-2)
  - Follow-up asking how a "verified" item was verified (§ 611(a)(7))
  - Identity theft block request (FCRA § 605B, 15 U.S.C. § 1681c-2)
- **Know your rights tab:** plain-language FCRA summary, what to check for each kind of negative item, bureau addresses, and links to the FTC, CFPB and IRS.gov (identity theft, Form 14039, IP PIN, tax liens).

All data stays in your browser (localStorage). There's a backup download and restore.

## Running it

No build step. Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8000
```

then visit http://localhost:8000.

## Disclaimer

This app provides general information, not legal advice. Check bureau mailing addresses on their websites before sending.
