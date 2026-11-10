// Reference data shared by the app and letter templates.

const BUREAUS = {
  equifax: {
    name: "Equifax",
    address: ["Equifax Information Services LLC", "P.O. Box 740256", "Atlanta, GA 30374-0256"],
    url: "https://www.equifax.com/personal/credit-report-services/credit-dispute/",
  },
  experian: {
    name: "Experian",
    address: ["Experian", "P.O. Box 4500", "Allen, TX 75013"],
    url: "https://www.experian.com/disputes/main.html",
  },
  transunion: {
    name: "TransUnion",
    address: ["TransUnion LLC", "Consumer Dispute Center", "P.O. Box 2000", "Chester, PA 19016"],
    url: "https://www.transunion.com/credit-disputes/dispute-your-credit",
  },
};

// Kinds of negative (or other) items. `errors` lists the error reasons that fit
// each kind, in the order shown in the form. `tip` is a short hint for the form.
const ITEM_TYPES = {
  late_payment: {
    label: "Late payment",
    errors: ["late_paid_on_time", "late_wrong_date", "late_wrong_severity", "late_forbearance", "not_mine", "identity_theft", "outdated", "other"],
    tip: "Late payments can be reported for 7 years from the date of the late payment. Check each month's code (30, 60, 90 days) against your statements.",
  },
  charge_off: {
    label: "Charge-off",
    errors: ["co_balance_after_sale", "co_paid_shows_unpaid", "co_wrong_amount", "reaged", "outdated", "not_mine", "identity_theft", "duplicate", "other"],
    tip: "A charge-off stays 7 years from the date of first delinquency. If the debt was sold, the original creditor should show a $0 balance.",
  },
  repossession: {
    label: "Repossession",
    errors: ["repo_deficiency_wrong", "repo_voluntary", "repo_paid", "repo_wrong_date", "reaged", "outdated", "not_mine", "identity_theft", "other"],
    tip: "After a repo, the lender sells the vehicle and credits the sale price. The remaining 'deficiency' balance must be accurate.",
  },
  collection: {
    label: "Collection account",
    errors: ["coll_paid", "coll_not_mine_debt", "duplicate", "reaged", "coll_wrong_amount", "outdated", "identity_theft", "other"],
    tip: "A collection can't extend the original 7-year clock. The same debt shouldn't show as owed by two collectors at once.",
  },
  foreclosure: {
    label: "Foreclosure or short sale",
    errors: ["fc_short_sale", "fc_wrong_balance", "fc_wrong_date", "outdated", "not_mine", "other"],
    tip: "A foreclosure stays 7 years from the first missed payment that led to it.",
  },
  bankruptcy: {
    label: "Bankruptcy or debt included in one",
    errors: ["bk_discharged_balance", "bk_wrong_chapter", "outdated", "not_mine", "other"],
    tip: "Debts discharged in bankruptcy should show a $0 balance and 'included in bankruptcy'. Chapter 7 can stay 10 years; Chapter 13 usually 7.",
  },
  public_record: {
    label: "Judgment or tax lien",
    errors: ["pr_satisfied", "pr_vacated", "outdated", "not_mine", "other"],
    tip: "The major bureaus stopped reporting civil judgments and tax liens in 2017–2018. If one appears, dispute it.",
  },
  inquiry: {
    label: "Hard inquiry",
    errors: ["inq_unauthorized", "identity_theft", "other"],
    tip: "Hard inquiries stay 2 years. You can dispute ones you didn't authorize.",
  },
  account: {
    label: "Other account error",
    errors: ["not_mine", "identity_theft", "wrong_balance", "wrong_status", "paid_or_closed", "duplicate", "other"],
    tip: "",
  },
  personal_info: {
    label: "Personal information",
    errors: ["wrong_personal", "identity_theft", "other"],
    tip: "Wrong names or addresses can mean someone else's accounts are mixed into your file.",
  },
};

// Short label for the form, and the sentence used inside letters.
const ERROR_TYPES = {
  // General
  not_mine: ["Account is not mine", "This account does not belong to me. I have never opened or authorized this account."],
  identity_theft: ["Result of identity theft", "This item is the result of identity theft. I did not open it, use it, or authorize anyone to do so."],
  wrong_balance: ["Wrong balance or credit limit", "The balance or credit limit reported for this account is incorrect."],
  wrong_status: ["Wrong account status", "The status reported for this account is incorrect."],
  paid_or_closed: ["Paid or closed but shown open/unpaid", "This account has been paid and/or closed, but it is not reported that way."],
  duplicate: ["Reported more than once", "This debt is reported more than once, which overstates what I owe."],
  outdated: ["Too old to report", "This negative information is older than the reporting period allowed by FCRA § 605 (15 U.S.C. § 1681c) and must be removed."],
  reaged: ["Wrong date of first delinquency (re-aged)", "The date of first delinquency is reported incorrectly. A later date makes this item appear newer than it is and extends how long it would stay on my report, which FCRA § 623(a)(5) (15 U.S.C. § 1681s-2(a)(5)) does not allow."],
  wrong_personal: ["Wrong name, address or other personal info", "The personal information on my file is incorrect."],
  other: ["Other", "The information reported for this item is inaccurate or incomplete."],

  // Late payments
  late_paid_on_time: ["Reported late but I paid on time", "This account shows a late payment, but I made the payment on time."],
  late_wrong_date: ["Late payment shown in the wrong month", "A late payment is reported for a month in which my payment was not late."],
  late_wrong_severity: ["Wrong number of days late (e.g. 60 instead of 30)", "The number of days late reported for this account is higher than it actually was."],
  late_forbearance: ["Reported late during an agreed deferment or forbearance", "This account was in an approved deferment, forbearance, or payment arrangement during the period reported as late, and I met the terms of that arrangement."],

  // Charge-offs
  co_balance_after_sale: ["Sold to a collector but still shows a balance", "This charged-off account was sold or transferred to another company, but it still shows a balance owed to the original creditor. The balance should be reported as $0 so the same debt is not counted twice."],
  co_paid_shows_unpaid: ["Paid or settled but shown as unpaid", "I paid or settled this charged-off account, but it is not reported as paid or settled with a $0 balance."],
  co_wrong_amount: ["Charge-off amount is wrong", "The charged-off amount or current balance reported for this account is incorrect."],

  // Repossessions
  repo_deficiency_wrong: ["Deficiency balance is wrong", "The deficiency balance reported after the repossession is incorrect. It does not properly credit the sale proceeds of the vehicle and/or includes improper fees."],
  repo_voluntary: ["Voluntary surrender reported as involuntary repo", "I voluntarily surrendered this vehicle, but it is reported as an involuntary repossession."],
  repo_paid: ["Deficiency paid but still shown owed", "I have paid or settled the deficiency balance from this repossession, but it is still reported as owed."],
  repo_wrong_date: ["Wrong repossession or delinquency date", "The date of the repossession or of first delinquency is reported incorrectly."],

  // Collections
  coll_paid: ["Paid but shown as unpaid", "I paid or settled this collection account, but it is not reported as paid with a $0 balance."],
  coll_not_mine_debt: ["Don't recognize this debt", "I do not recognize this debt and have no record of owing it to this collector or the original creditor."],
  coll_wrong_amount: ["Amount is wrong or includes improper fees", "The amount reported is higher than what I owed and appears to include fees or interest I did not agree to."],

  // Foreclosure
  fc_short_sale: ["Short sale or deed-in-lieu reported as foreclosure", "This property was resolved by a short sale or deed in lieu of foreclosure, but it is reported as a foreclosure."],
  fc_wrong_balance: ["Shows a balance after foreclosure", "This mortgage still shows a balance owed after the foreclosure, which is incorrect."],
  fc_wrong_date: ["Wrong foreclosure or delinquency date", "The date of the foreclosure or of first delinquency is reported incorrectly."],

  // Bankruptcy
  bk_discharged_balance: ["Discharged debt still shows a balance", "This debt was included in and discharged in my bankruptcy, but it still shows a balance and/or a past-due status. It should report a $0 balance and 'discharged in bankruptcy'."],
  bk_wrong_chapter: ["Wrong chapter, dates or status", "The bankruptcy chapter, filing date, or discharge status reported is incorrect."],

  // Public records
  pr_satisfied: ["Paid or satisfied", "This judgment or lien has been paid or satisfied, but it is not reported that way."],
  pr_vacated: ["Vacated, dismissed or released", "This judgment or lien was vacated, dismissed, or released and should not be reported."],

  // Inquiries
  inq_unauthorized: ["I didn't authorize this inquiry", "I did not authorize this company to obtain my credit report, and I have no account or application with it. This inquiry was made without a permissible purpose under FCRA § 604 (15 U.S.C. § 1681b)."],
};

const STATUS_LABELS = {
  draft: "Not sent yet",
  sent: "Waiting for response",
  corrected: "Corrected / deleted",
  verified: "Bureau says verified",
  closed: "Closed",
};
