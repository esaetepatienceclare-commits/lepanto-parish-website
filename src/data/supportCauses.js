// Colour styles a cause card can use. Written out in full so Tailwind keeps them.
export const CAUSE_COLORS = {
  emerald: {
    label: "Green",
    hoverBorder: "hover:border-emerald-300",
    iconBg: "bg-emerald-100 group-hover:bg-emerald-200",
    button: "bg-emerald-600 group-hover:bg-emerald-700",
    bar: "bg-emerald-500",
  },
  amber: {
    label: "Gold",
    hoverBorder: "hover:border-amber-300",
    iconBg: "bg-amber-100 group-hover:bg-amber-200",
    button: "bg-amber-600 group-hover:bg-amber-700",
    bar: "bg-amber-500",
  },
  blue: {
    label: "Blue",
    hoverBorder: "hover:border-blue-300",
    iconBg: "bg-blue-100 group-hover:bg-blue-200",
    button: "bg-blue-700 group-hover:bg-blue-800",
    bar: "bg-blue-600",
  },
  purple: {
    label: "Purple",
    hoverBorder: "hover:border-purple-300",
    iconBg: "bg-purple-100 group-hover:bg-purple-200",
    button: "bg-purple-600 group-hover:bg-purple-700",
    bar: "bg-purple-500",
  },
  rose: {
    label: "Red",
    hoverBorder: "hover:border-rose-300",
    iconBg: "bg-rose-100 group-hover:bg-rose-200",
    button: "bg-rose-600 group-hover:bg-rose-700",
    bar: "bg-rose-500",
  },
};

// Starting values for a new cause's Mobile Money and Cash/Cheque details.
export const MOBILE_MONEY_NUMBER = "+256 772 473 247";
export const MOBILE_MONEY_NETWORK = "MTN / Airtel";
export const CHEQUE_PAYEE = "Our Lady of the Most Holy Rosary Catholic Parish";

// The parish's original three causes. Used until causes are added in
// Admin → Support Causes (that tab has a button to copy these in).
export const defaultCauses = [
  {
    id: "support-a-child",
    kind: "cause",
    order: 1,
    emoji: "👶",
    color: "emerald",
    title: "Support a Child",
    description: "Help sponsor a child’s education, meals, and spiritual growth in our parish school.",
    buttonLabel: "Sponsor a Child",
    bank: "Centenary Bank",
    accountName: "Holy Rosary Nursery and Primary School",
    accountNumber: "3205108991",
  },
  {
    id: "school-construction",
    kind: "cause",
    order: 2,
    emoji: "🏫",
    color: "amber",
    title: "Support School Construction",
    description: "Contribute towards building and equipping our parish school for the children of Lepanto.",
    buttonLabel: "Support the Project",
    bank: "Centenary Bank",
    accountName: "Our Lady of the Most Holy Rosary Catholic Parish",
    accountNumber: "3204733369",
  },
  {
    id: "building-fund",
    kind: "cause",
    order: 3,
    emoji: "⛪",
    color: "blue",
    title: "Building Fund",
    description: "Support parish construction, renovation, and maintenance projects.",
    buttonLabel: "Contribute to the Fund",
    bank: "Centenary Bank",
    accountName: "Our Lady of the Most Holy Rosary Catholic Parish",
    accountNumber: "3203010627",
  },
];

// The original three are always included. If one with the same title is
// saved in Admin, the saved one is used instead (so it can be edited or hidden).
export function withOriginals(saved = []) {
  const titles = new Set(saved.map((c) => (c.title || "").trim().toLowerCase()));
  return [...defaultCauses.filter((d) => !titles.has(d.title.toLowerCase())), ...saved];
}

// Hidden ones removed, sorted by the order number set in Admin.
export function visibleCauses(list) {
  return list
    .filter((c) => c.active !== false)
    .sort((a, b) => (Number(a.order) || 999) - (Number(b.order) || 999));
}

// Which ways of giving a cause accepts, with their details. Causes saved
// before the tick boxes existed get Bank (if it has an account number),
// Mobile Money and Cash/Cheque with the parish's usual details.
export function paymentOptions(cause) {
  return {
    bank: cause.payBank ?? Boolean(cause.accountNumber),
    mobile: cause.payMobile ?? true,
    cash: cause.payCash ?? true,
    bankName: cause.bank || "",
    accountName: cause.accountName || "",
    accountNumber: cause.accountNumber || "",
    mobileNetwork: cause.mobileNetwork || MOBILE_MONEY_NETWORK,
    mobileNumber: cause.mobileNumber || MOBILE_MONEY_NUMBER,
    mobileName: cause.mobileName || "",
    chequePayee: cause.chequePayee || CHEQUE_PAYEE,
  };
}

export function formatUGX(amount) {
  return `UGX ${Number(amount || 0).toLocaleString("en-US")}`;
}
