// Dropdown ka ek item (State ya Area of Interest dono ke liye)
export interface DropdownItem {
  id: string | number;
  name: string;
}

// Filter form ki values
export interface GrantFilter {
  state: string | number;
  areaOfInterest: string | number;
  publishedFrom: string;
  publishedTo: string;
}

// Grant card ka data (dono design isi se chalenge)
// Grant card ka data (saare design isi se chalenge)
export interface GrantCardData {
  id: number | string;
  title: string;
  donor: string;
  amount: string; // "$5,000-$25,000" ya "Not Available"
  state: string;
  category: string; // "Community Development"
  deadline: string; // ISO date: '2026-11-03'
  posted?: string; // ISO date (detailed design me dikhta hai)
  type?: 'Grant' | 'Program' | 'Fellowship' | 'Scholarship';
  description?: string; // row design me selected hone par dikhta hai
  isNew?: boolean; // row design me "NEW" badge
  source?: GrantSource; // 'federal' ya 'foundation' (Latest page ke tabs ke liye)
  icon: string; // bootstrap icon class, jaise 'bi-geo-alt'
  tone: string; // blue, red, indigo, gold, pink, slate, green, purple, teal, orange
  isFav?: boolean;
  eligibility?: string[];
  orgType?: string;
}
export type ResourceType = 'proposal' | 'ebook' | 'video' | 'article' | 'course';

export interface ResourceData {
  id: number | string;
  type: ResourceType;
  title: string;
  icon: string;
  tone: string;
  date?: string;
  category?: string;
  tags?: string[];
  excerpt?: string;
  fileSize?: string;
  pages?: number;
  presenter?: string;
  minutes?: number;
  readMinutes?: number;
  author?: string;
  quick?: boolean;
  isFav?: boolean;
}

// Advanced Search ke filter ki values
export interface AdvancedFilterValue {
  dateBy: string;
  from: string;
  to: string;
  states: (string | number)[];
  areas: (string | number)[];
  grantSizes: string[];
  donors: (string | number)[];
}

export type SearchBarType = 'all' | 'Grant' | 'Fellowship' | 'Scholarship' | 'Program';

export interface SearchBarValue {
  keyword: string;
  type: SearchBarType;
  closingSoon: boolean;
  includeExpired: boolean;
}

/* =====================================================
   LEFTBAR ke types
   ===================================================== */
// Chhota link (panel ke andar ya accordion ke andar)
export interface SubLink {
  key: string; // unique id (active tab pehchanne ke liye)
  label: string; // screen par dikhne wala naam
}

// Accordion group (jaise "Funds For NGOs")
export interface AccordionGroup {
  id: string;
  label: string;
  links: SubLink[];
}

// Ek poora panel (Grants, Resources, Alerts, Profile)
export interface Panel {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  groups: AccordionGroup[]; // accordion wale (upar dikhte hain)
  links: SubLink[]; // normal links (accordion ke neeche)
}

// Main menu ki ek entry: label, link ya drill (panel kholne wala button)
export type MenuEntry =
  | { type: 'label'; label: string }
  | { type: 'link'; label: string; key: string; icon: string }
  | { type: 'drill'; label: string; panel: string; icon: string; badge?: number };

export interface BrandInfo {
  logo: string;
  name: string;
  tagline: string;
}

export interface HelpButtonInfo {
  label: string;
  icon: string;
}

/* =====================================================
   TOPBAR ke types
   ===================================================== */
export interface TopbarUser {
  name: string;
  initials: string;
  plan: string;
}

export interface TopbarMenuLink {
  label: string;
  path: string;
}

/* =====================================================
   SEARCH HERO ke type chips
   ===================================================== */
export interface SearchTypeChip {
  key: SearchBarType;
  label: string;
  icon: string;
}

/* =====================================================
   LATEST GRANTS page ke types
   ===================================================== */
export type GrantSource = 'federal' | 'foundation';

export type LatestTabKey = 'all' | 'new' | 'soon' | 'federal' | 'foundation';

export interface LatestTab {
  key: LatestTabKey;
  label: string;
  icon: string; // bootstrap icon
}

export type SortKey = 'newest' | 'deadline' | 'title';

export interface SortOption {
  key: SortKey;
  label: string;
}

// Page ke upar ka heading
export interface PageHeading {
  eyebrow: string;
  title: string;
  subtitle: string;
}
/* =====================================================
   FOOTER ke types
   ===================================================== */
export interface FooterColumn {
  title: string;
  links: string[];
}

export interface FooterInfo {
  about: string;
  social: string[];
  columns: FooterColumn[];
  email: string;
  phone: string;
  address: string;
  helpLabel: string;
  legal: string[];
}

// Related carousel ka ek card
export interface RelatedGrant {
  id: number | string;
  title: string;
  label: string; // card ke neeche-left me bada text (DIRECT SERVICES, TEXAS...)
  icon: string;
  tone: string;
  posted: string;
}

// Details page ka poora data
export interface GrantDetail {
  id: string;
  title: string;
  shortTitle: string;
  intro: string;
  image?: string;
  posted: string;
  deadline: string; // '' = Ongoing
  grantSize: string;
  duration: string;
  donor: string;
  category: string;
  overview: OverviewBlock[];
  focusAreas: string[];
  counties: string[];
  states: string[];
  websiteUrl: string;
  relatedState: RelatedGrant[];
  relatedThematic: RelatedGrant[];
}

// Overview ka ek tukda (heading / paragraph / list / link)
export interface OverviewBlock {
  type: 'p' | 'h' | 'sub' | 'ul' | 'link';
  text?: string; // p, h, sub, aur link ke aage ka text
  items?: string[]; // ul ke points
  name?: string; // link ka text
  url?: string; // link ka url
  after?: string; // link ke baad ka text (jaise ".")
}

/* =====================================================
   datatype.ts me NEECHE ye add karo
   (AdvancedFilterValue aur SearchBarValue pehle se hain)
   ===================================================== */
export interface GrantSizeOption {
  key: string; // AdvancedFilterValue.grantSizes me yahi key jayegi
  label: string;
  min: number; // 0 = koi lower limit nahi
  max: number; // Infinity = koi upper limit nahi
  unknown?: boolean; // true => "Not Available" wale grants
}

export interface DateByOption {
  key: 'posted' | 'deadline';
  label: string;
}

export interface MultiFilterConfig {
  key: 'states' | 'areas' | 'donors';
  label: string;
  placeholder: string;
  icon: string;
}

/* datatype.ts me NEECHE ye add karo */

export type MyGrantStatus = 'saved' | 'inprogress' | 'submitted' | 'awarded' | 'declined';

export interface MyGrantStatusOption {
  key: MyGrantStatus;
  label: string;
  icon: string; // bootstrap icon
}

// User ne jo grant track ki hai uska ek item
export interface MyGrantItem {
  id: number | string; // grant ki id (details page isi se khulta hai)
  title: string;
  donor: string;
  amount: string;
  state: string;
  category: string;
  deadline: string; // '' = Ongoing
  type?: 'Grant' | 'Program' | 'Fellowship' | 'Scholarship';
  status: MyGrantStatus;
  addedOn: string; // ISO date
  note: string;
}

export interface SavedGrantItem {
  id: string | number;
  title: string;
  description: string;
  amount: string;
  deadline: string;
  category: string;
  donor: string;
  thumb: 'bank' | 'star' | 'edu';
  favorite: boolean;
  addedOn: string;
}

/* ===== MY FAVORITES (collections) ===== */
export type FavKind = 'funding' | 'proposal' | 'ebook' | 'article' | 'video' | 'course' | 'donor';

export interface FavCollection {
  kind: FavKind;
  label: string; // card ka title
  single: string; // drawer me item ke upar chhota label
  icon: string; // bootstrap icon
  preview: number; // card me kitne bullet titles dikhane hain
  emptyText?: string;
  emptyCta?: string;
}

export interface FavItem {
  id: string | number;
  kind: FavKind;
  title: string;
  meta: string; // donor / presenter / category
  tone: string; // thumbnail ka colour
  icon: string;
  addedOn: string; // YYYY-MM-DD
  deadline?: string; // sirf funding items ke liye
}

export interface ArchivedGrantItem {
  id: string | number; // archive record ki id
  grantId: string | number; // asli grant ki id (View Grant isi se khulega)
  title: string;
  description: string;
  amount: string;
  deadline: string; // YYYY-MM-DD
  category: string;
  donor: string;
  icon: string; // bootstrap icon
  tone: string; // thumbnail colour: red, gold, green, blue...
  archivedOn: string; // YYYY-MM-DD
}

/* ===== SAVED SEARCHES ===== */
export type AlertFreq = 'off' | 'daily' | 'weekly' | 'monthly';
export type SavedSearchSortKey = 'recent' | 'name' | 'matches';

export interface SavedSearchSortOption {
  key: SavedSearchSortKey;
  label: string;
}

export interface AlertOption {
  key: AlertFreq;
  label: string;
}

export interface SavedSearchItem {
  id: string | number;
  name: string;
  savedOn: string; // YYYY-MM-DD
  chips: string[]; // filters ke chhote tags
  matches: number; // abhi kitni grants match karti hain
  newThisWeek: number;
  alert: AlertFreq;
  params?: Record<string, string>; // Advanced Search ko bhejne wale filters
}

/* ===== DOWNLOAD LIST ===== */
export interface DownloadItem {
  id: number | string;
  title: string;
  done: boolean; // true = download ho chuka
  url?: string; // real file ka link (nahi hai to dummy .txt download hoga)
  area?: string; // cover ke icon / subtitle ke liye (optional)
}

export interface DownloadPageText {
  title: string;
  subtitle: string;
  heading: string;
  noteStart: string; // "... up to" (iske baad limit bold me aata hai)
  noteMiddle: string; // "... sample proposals in a year ... and up to" (iske baad monthly limit)
  noteEnd: string; // baaki line
  addMore: string;
  downloadAll: string;
  emptyTitle: string;
  emptyText: string;
  emptyCta: string;
}

/* ===== MY INVOICES ===== */
export type InvoiceStatus = 'Success' | 'Pending' | 'Failed';

export interface InvoiceItem {
  id: string; // 'USIN-202409-00008/USD-01'
  date: string; // YYYY-MM-DD (invoice ki date)
  plan: string; // 'USD 1'
  net: string; // 'USD 1'
  via: string; // 'Stripe', 'InstaMojo'
  dur: string; // '1 Year'
  end: string; // YYYY-MM-DD (plan kab tak chalega)
  status: InvoiceStatus;
}

export interface InvoicePageText {
  title: string;
  subtitle: string;
  emptyText: string;
}

/* ===== DONOR SEARCH ===== */
export interface DonorItem {
  id: number;
  name: string;
  country: string; // donor ka country
  focus: string; // focus country ('Global' bhi ho sakta hai)
  areas: string[]; // area of interest ke naam
  posted: string; // YYYY-MM-DD
  url: string;
}

export type DonorSortKey = 'newest' | 'az' | 'za' | 'country';

export interface DonorSortOption {
  key: DonorSortKey;
  label: string;
}

export type DonorFilterKey = 'countries' | 'focuses' | 'areas';

export interface DonorFilterValue {
  countries: string[];
  focuses: string[];
  areas: string[];
}

export interface DonorFilterSection {
  key: DonorFilterKey;
  label: string;
  icon: string; // bootstrap icon
  placeholder: string;
  empty: string;
}

export interface DonorPopularSearch {
  label: string;
  area: string; // click par ye area filter lagega
}

export type DonorChipKey = 'keyword' | DonorFilterKey | 'saved';

export interface DonorChip {
  key: DonorChipKey;
  label: string;
}

export interface DonorPageText {
  titleStart: string;
  titleAccent: string;
  subtitle: string;
  tutorialBtn: string;
  searchPlaceholder: string;
  searchBtn: string;
  filterTitle: string;
  popularTitle: string;
  savedLabel: string;
  emptyTitle: string;
  emptyText: string;
  emptySavedTitle: string;
  emptySavedText: string;
  resetBtn: string;
  tutorialTitle: string;
  tutorialSteps: string[];
}

// ===== Funding Alert =====
export type FundingAlertFrequency = 'Daily' | 'Weekly' | 'Monthly';

export type FundingAlertPickerKey = 'states' | 'areas';

export interface FundingAlertPickerConfig {
  key: FundingAlertPickerKey;
  title: string;
  icon: string;
  placeholder: string;
  noun: string; // "states" / "thematic areas"
  emptyText: string; // kuch select na ho to
}

export interface FundingAlertFreqOption {
  key: FundingAlertFrequency;
  title: string;
  sub: string;
}

export interface FundingAlertStep {
  title: string;
  text: string;
}

export interface FundingAlertSettings {
  states: string[];
  areas: string[];
  frequency: FundingAlertFrequency;
}

export interface FundingAlertPageText {
  title: string;
  tipTitle: string;
  tipText: string;
  tutorialBtn: string;
  deliveryTitle: string;
  deliverySub: string;
  checklist: string[];
  sendTitle: string;
  sendText: string;
  previewTitle: string;
  previewTag: string;
  previewNote: string;
  previewEmpty: string;
  howTitle: string;
  howSub: string;
  steps: FundingAlertStep[];
  tipBold: string;
  tipBody: string;
  unsaved: string;
  savedToast: string;
  tutorialUrl: string;
}

// ===== Alert Grants =====
export type AlertGrantSort = 'newest' | 'deadline' | 'relevant';

export interface AlertGrantSortOption {
  key: AlertGrantSort;
  label: string;
}

export interface AlertGrantFilters {
  state: string;
  area: string;
  from: string;
  to: string;
}

export interface AlertGrantsPageText {
  title: string;
  subtitle: string;
  editBtn: string;
  stateLabel: string;
  stateAll: string;
  areaLabel: string;
  areaAll: string;
  fromLabel: string;
  toLabel: string;
  searchBtn: string;
  resetBtn: string;
  listTitle: string;
  noAreasText: string;
  setupBtn: string;
  noMatchText: string;
  noAreaChips: string;
}
/* ===== UPDATE PROFILE ===== */
export interface ProfileNotifications {
  newGrants: boolean;
  deadlines: boolean;
  webinars: boolean;
  product: boolean;
}

export interface ProfileData {
  name: string;
  role: string;
  email: string;
  phone: string;
  bio: string;
  org: string;
  orgType: string;
  budget: string;
  web: string;
  address: string;
  city: string;
  zip: string;
  state: string;
  country: string;
  interests: string[];
  notifications: ProfileNotifications;
  photo: string; // base64 / url ('' = initials dikhengi)
}

export type ProfileSectionKey = 'personal' | 'org' | 'address' | 'interests' | 'notifications';

export interface ProfileSection {
  key: ProfileSectionKey;
  id: string; // scroll ke liye element id
  label: string;
  title: string;
  subtitle: string;
}

export interface ProfileBadge {
  label: string;
  ok?: boolean; // true => green dot wala badge
}

export interface ProfileNotifOption {
  key: keyof ProfileNotifications;
  title: string;
  sub: string;
}

/* ===== UPDATE PAYMENT DETAILS ===== */
export interface PaymentCard {
  brand: string; // 'Visa', 'Mastercard'
  last4: string; // '4242'
  exp: string; // '08/27'
  updatedOn: string; // YYYY-MM-DD
}

export interface PaymentPlanInfo {
  plan: string; // 'Professional membership'
  nextRenewal: string; // YYYY-MM-DD
  autopay: boolean;
}

export interface PaymentStep {
  title: string;
  text: string;
}

export interface PaymentPageText {
  title: string;
  subtitle: string;
  cardTitle: string;
  autopayOn: string;
  autopayOff: string;
  holderLabel: string;
  expiresLabel: string;
  planLabel: string;
  renewalLabel: string;
  receiptsLabel: string;
  updatedLabel: string;
  updateBtn: string;
  note: string;
  howTitle: string;
  steps: PaymentStep[];
  secTitle: string;
  secText: string;
  invoicesLink: string;
  dialogTitle: string;
  dialogText: string;
  dialogNo: string;
  dialogGo: string;
  dialogGoing: string;
  toastUpdated: string;
}

/* ===== CHANGE PASSWORD ===== */
export type PasswordFieldKey = 'current' | 'next' | 'confirm';
export type PasswordRuleKey = 'len' | 'case' | 'num' | 'sym' | 'diff';

export interface PasswordFieldConfig {
  key: PasswordFieldKey;
  label: string; // input ke upar ka label
  autocomplete: 'current-password' | 'new-password';
}

export interface PasswordRule {
  key: PasswordRuleKey; // component isi key se rule check karta hai
  label: string; // sidebar list me dikhne wala text
}

// Form submit par API ko bhejne wala data
export interface PasswordChangePayload {
  currentPassword: string;
  newPassword: string;
  signOutOthers: boolean;
}

// API error: kaun si field galat hai aur kya message dikhana hai
export interface PasswordChangeError {
  field: 'current' | 'next';
  msg: string;
}

// User ki password info (API se aayegi)
export interface PasswordInfo {
  lastChanged: string; // YYYY-MM-DD ('' = kabhi nahi badla)
  email: string; // reset link is email par jayega
}

export interface PasswordPageText {
  title: string;
  subtitle: string;
  forgotBtn: string;
  capsText: string;
  signOutTitle: string;
  signOutSub: string;
  saveBtn: string;
  savingBtn: string;
  lastChangedLabel: string;
  neverChanged: string;
  rulesTitle: string;
  tipsTitle: string;
  tips: string[];
  mismatch: string;
  match: string;
  genericError: string;
  toastDone: string;
  toastDoneOthers: string;
  // Forgot password dialog
  fpTitle: string;
  fpTextBefore: string; // "... reset link to" (iske baad email bold me aata hai)
  fpTextAfter: string;
  fpSentTitle: string;
  fpSentBefore: string;
  fpSentAfter: string;
  fpCancel: string;
  fpSend: string;
  fpSending: string;
  fpResend: string;
  fpResendIn: string; // "Resend in" (iske baad 30s aata hai)
  fpDone: string;
  fpError: string;
}

/* =====================================================
   datatype.ts ke ekdum END me ye paste karo
   ===================================================== */

/* ===== SAMPLE PROPOSALS ===== */
export interface SampleProposal {
  id: number | string;
  title: string;
  area: string; // Area of interest (pills + dropdown filter isi se chalte hain)
  subArea: string; // card par neela chhota tag (jaise "Conservation")
  fileSize: string; // '2.3 MB'
  pages: number;
  updatedOn: string; // YYYY-MM-DD
  colorFrom: string; // generated book cover ka gradient start
  colorTo: string; // gradient end
  coverImg?: string; // real cover image ka url (hai to wahi dikhegi)
  pdfUrl?: string;
}

export interface SampleProposalTagColor {
  bg: string;
  text: string;
}

export interface SampleProposalPageText {
  eyebrow: string;
  title: string;
  subtitle: string;
  tutorialLink: string;
  tutorialUrl: string;
  searchPlaceholder: string;
  searchAria: string;
  areaLabel: string;
  areaAll: string;
  selectAll: string;
  areaSearchPlaceholder: string;
  areaNothing: string;
  areasSelectedSuffix: string;
  pillAll: string;
  pillMore: string;
  countSingular: string;
  countPlural: string;
  coverTag: string;
  coverBrand: string;
  pdfLabel: string;
  pagesLabel: string;
  updatedLabel: string;
  viewBtn: string;
  addToList: string;
  inList: string;
  addToListHint: string;
  emptyTitle: string;
  emptyText: string;
  emptyBtn: string;
  prev: string;
  next: string;
  loading: string;
}

export interface Ebook {
  id: number | string;
  title: string;
  area: string;
  subArea: string;
  fileSize: string;
  pages: number;
  updatedOn: string;
  colorFrom: string;
  colorTo: string;
  coverImg?: string;
  pdfUrl?: string;
}

export interface EbookPageText {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchAria: string;
  areaLabel: string;
  areaAll: string;
  selectAll: string;
  areaSearchPlaceholder: string;
  areaNothing: string;
  areasSelectedSuffix: string;
  pillAll: string;
  pillMore: string;
  countSingular: string;
  countPlural: string;
  coverTag: string;
  coverBrand: string;
  pdfLabel: string;
  pagesLabel: string;
  updatedLabel: string;
  viewBtn: string;
  downloadBtn: string;
  emptyTitle: string;
  emptyText: string;
  emptyBtn: string;
  loading: string;
}

/* =====================================================
   datatype.ts ke ekdum END me ye paste karo
   ===================================================== */

/* ===== TRAINING VIDEOS ===== */
export type TrainingVideoSortKey = 'newest' | 'az' | 'shortest';

export interface TrainingVideoSortOption {
  key: TrainingVideoSortKey;
  label: string;
}

export interface TrainingVideoCategory {
  name: string;
  colorFrom: string;
  colorTo: string;
}

export interface TrainingVideoPresenter {
  name: string;
  role: string;
  bio: string;
  photo?: string;
}

export interface TrainingVideoAttachment {
  name: string;
  url: string;
}

export interface TrainingVideoCaption {
  label: string;
  lang: string;
  src: string;
  isDefault?: boolean;
}

export interface TrainingVideo {
  id: number | string;
  title: string;
  category: string;
  presenter: string;
  minutes: number;
  postedOn: string;
  videoUrl?: string;
  description?: string;
  attachments?: TrainingVideoAttachment[];
  captions?: TrainingVideoCaption[];
}

export interface TrainingVideoPageText {
  eyebrow: string;
  title: string;
  subtitle: string;
  areaLabel: string;
  areaAll: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchAria: string;
  searchBtn: string;
  resetBtn: string;
  pillAll: string;
  sortLabel: string;
  showingLabel: string;
  ofLabel: string;
  countSingular: string;
  countPlural: string;
  minutesUnit: string;
  playAria: string;
  emptyTitle: string;
  emptyText: string;
  prev: string;
  next: string;
  modalTitlePrefix: string;
  descriptionTemplate: string;
  defaultRole: string;
  attachmentsTitle: string;
  closeBtn: string;
  favAria: string;
  videoErrorTitle: string;
  videoErrorText: string;
}
/* =====================================================
   datatype.ts ke ekdum END me ye paste karo
   ===================================================== */

/* ===== ARTICLES ===== */
export type ArticleCategoryKey =
  | 'alerts'
  | 'proposal'
  | 'regional'
  | 'thematic'
  | 'tips'
  | 'stories';

// 'all' sirf filter chips ke liye hai (article ki apni category 'all' nahi hoti)
export type ArticleFilterKey = 'all' | ArticleCategoryKey;

export type ArticleSortKey = 'newest' | 'oldest' | 'az' | 'quick';

export interface ArticleSortOption {
  key: ArticleSortKey;
  label: string;
}

export interface ArticleCategory {
  key: ArticleFilterKey;
  label: string; // chip / pill ka naam
  icon: string; // bootstrap icon
  color: string; // main colour (text, button, border)
  tint: string; // halka background colour
  from: string; // gradient start (thumbnail / hero)
  to: string; // gradient end
  blurb: string; // card ke neeche chhota description (article ka apna summary na ho to)
}

export interface ArticleSection {
  heading: string;
  text: string;
}

export interface ArticleAuthor {
  name: string;
  role: string;
  bio: string;
}

// Article ka poora body (details page me dikhta hai)
export interface ArticleBody {
  lead: string; // bada pehla paragraph
  keyTakeaways: string[];
  sections: ArticleSection[];
  quote: string; // pehle section ke baad ka quote
  checklist: string[]; // "Before you apply" checkboxes
}

export interface Article {
  id: number;
  title: string;
  category: ArticleCategoryKey;
  publishedOn: string; // YYYY-MM-DD
  readMinutes: number;
  author: ArticleAuthor;
  body: ArticleBody;
  summary?: string; // nahi diya to category ka blurb dikhega
  coverImg?: string; // real image ka url (hai to wahi dikhegi, nahi to gradient + icon)
}

export interface ArticleStat {
  icon: string; // bootstrap icon
  title: string; // {count} = total articles, {topics} = total topics
  sub: string;
  color: string;
  tint: string;
}

export interface ArticlePageText {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchAria: string;
  listTitle: string;
  sortLabel: string;
  showLabel: string;
  perPageSuffix: string;
  pageOf: string; // {p} aur {t} replace hote hain
  featuredTag: string;
  minRead: string;
  emptyText: string;
  favAria: string;
  loading: string;
  prevAria: string;
  nextAria: string;
  eyebrow: string;
  resetBtn: string;
  showingLabel: string;
  ofLabel: string;
  countSingular: string;
  countPlural: string;
}

export interface ArticleDetailText {
  backBtn: string;
  keyTitle: string;
  tocTitle: string;
  actionsTitle: string;
  favBtn: string;
  favBtnOn: string;
  copyBtn: string;
  printBtn: string;
  moreTitle: string;
  grantsTitle: string;
  grantsIntro: string;
  closes: string;
  checklistTitle: string;
  readyText: string; // {n} aur {total} replace hote hain
  allReady: string;
  ctaTitle: string;
  ctaText: string;
  ctaBtn: string;
  writtenBy: string;
  newer: string;
  older: string;
  atNewest: string;
  atOldest: string;
  minRead: string;
  linkCopied: string;
  copyFailed: string;
  loading: string;
  notFoundTitle: string;
  notFoundText: string;
}
/* =====================================================
   datatype.ts ke ekdum END me ye paste karo
   ===================================================== */

/* ===== WEBINARS ===== */
export type WebinarCategoryKey =
  | 'leadership'
  | 'donor'
  | 'proposal'
  | 'design'
  | 'mne'
  | 'storytelling';

// 'all' sirf filter chips ke liye hai (webinar ki apni category 'all' nahi hoti)
export type WebinarFilterKey = 'all' | WebinarCategoryKey;

// Status filter (All / Upcoming / Recorded) + card ka status
export type WebinarStatus = 'upcoming' | 'live' | 'recorded';
export type WebinarStatusFilter = 'all' | 'upcoming' | 'recorded';

export type WebinarSortKey = 'newest' | 'oldest' | 'az' | 'shortest';

export interface WebinarSortOption {
  key: WebinarSortKey;
  label: string;
}

export interface WebinarStatusOption {
  key: WebinarStatusFilter;
  label: string;
}

export interface WebinarCategory {
  key: WebinarFilterKey;
  label: string; // chip / pill ka naam
  icon: string; // bootstrap icon
  color: string; // main colour (text, button, border)
  tint: string; // halka background colour
  from: string; // gradient start (thumbnail / hero)
  to: string; // gradient end
  blurb: string; // card ke neeche chhota description (webinar ka apna summary na ho to)
}

// Trainer / presenter
export interface WebinarTrainer {
  name: string;
  role: string;
  bio: string[]; // har item ek paragraph
  tags: string[];
  photo?: string; // real photo ka url (nahi hai to initials dikhenge)
}

// Category ke hisaab se default aim / objectives / subjects (webinar ka apna na ho to ye dikhega)
export interface WebinarCategoryContent {
  aim: string;
  objectives: string[];
  subjects: string[];
}

export interface Webinar {
  id: number;
  title: string;
  category: WebinarCategoryKey;
  date: string; // YYYY-MM-DD (webinar ki date)
  postedOn: string; // YYYY-MM-DD (page par kab post hua)
  minutes: number; // session ki length
  trainer: WebinarTrainer;
  summary?: string; // nahi diya to category ka blurb dikhega
  lead?: string; // details page ka bada pehla paragraph
  body?: string; // lead ke neeche ka paragraph
  aim?: string;
  objectives?: string[];
  subjects?: string[];
  videoUrl?: string; // recording ka link (YouTube / Vimeo / .mp4)
  registerUrl?: string; // upcoming webinar ka registration link
}

export interface WebinarStat {
  icon: string; // bootstrap icon
  title: string; // {count} = total webinars, {upcoming} = upcoming ginti
  sub: string;
  color: string;
  tint: string;
}

export interface WebinarPageText {
  eyebrow: string;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  searchAria: string;
  listTitle: string;
  statusAria: string;
  sortLabel: string;
  showLabel: string;
  perPageSuffix: string;
  showingLabel: string;
  ofLabel: string;
  countSingular: string;
  countPlural: string;
  pageOf: string;
  tagNext: string;
  tagFeatured: string;
  upcomingBadge: string;
  recordedBadge: string;
  liveBadge: string;
  minUnit: string;
  emptyText: string;
  loading: string;
  prevAria: string;
  nextAria: string;
}

export interface WebinarDetailText {
  backBtn: string;
  badgeUpcoming: string;
  badgeLive: string;
  badgeRecorded: string;
  postedLabel: string;
  online: string;
  factDate: string;
  factRecorded: string;
  factTime: string;
  factLength: string;
  factFormat: string;
  formatLive: string;
  formatRecorded: string;
  yourTime: string;
  recordedOn: string;
  minuteSession: string;
  aimTitle: string;
  objectivesTitle: string;
  subjectsTitle: string;
  trainerTitle: string;
  checklistTitle: string;
  checklist: string[];
  readyText: string; // {n} aur {total} replace hote hain
  allReady: string;
  ctaUpcomingTitle: string;
  ctaRecordedTitle: string;
  ctaRecordedSub: string;
  btnRegister: string;
  btnRegistered: string;
  btnWatch: string;
  startsIn: string;
  happeningNow: string;
  ended: string;
  days: string;
  hrs: string;
  min: string;
  sec: string;
  addCalendar: string;
  favBtn: string;
  favBtnOn: string;
  copyBtn: string;
  tocTitle: string;
  moreTitle: string;
  newer: string;
  older: string;
  atNewest: string;
  atOldest: string;
  linkCopied: string;
  copyFailed: string;
  registered: string;
  unregistered: string;
  loading: string;
  notFoundTitle: string;
  notFoundText: string;
}
