// Public waitlist copy. Wording here is the consent record.
// Change FORM_VERSION and save a new dated HTML snapshot when it changes.

export const FORM_VERSION = '2026-10-12';

export const CONTROLLER_STATEMENT =
  'PerfectDay Technologies Ltd, registered in England and Wales, company no. 16952922, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom';

export const FORM_STATEMENT =
  "Join the Hubbly waitlist and we'll email you about Hubbly until launch: early access, the Android beta (if you tick it) and launch-day news. We use MailerLite to send these. You can unsubscribe at any time from any email. See our privacy notice.";

export const CHECKBOX_AGE = "I'm a parent or carer aged 18 or over.";

export const CHECKBOX_BETA =
  "Invite me to test Hubbly early. We'll add this email to our Google Play (Android) or TestFlight (iPhone) tester list.";

export const CHECKBOX_TIPS = 'After launch, send me Hubbly tips and printables too.';

export const AGE_ERROR = 'Please tick this box to continue.';
export const STORE_ERROR = 'Please choose one option to continue.';
export const EMAIL_ERROR = 'Enter an email address to continue.';
export const EMAIL_INVALID = 'Check your email address, it looks incomplete.';

export const CONFIRM_SUBJECT = 'Please confirm you want Hubbly emails';
export const CONFIRM_BODY =
  "Tap to confirm. If you didn't sign up, ignore this and we'll delete your address within 21 days.";

export const TRIAL_AFTER =
  "After that, keeping Hubbly needs a subscription. You'll see the price in the app before you choose, and you're never charged unless you subscribe.";

export const TRIAL_SHORT = '30-day free trial in the app, no card needed to start. ' + TRIAL_AFTER;

export const TRIAL_LONG =
  'When you download Hubbly, the full app is free to use for 30 days, with every feature unlocked. The trial is managed by the app rather than by your app store, and no payment details are required to begin it. Certain in-app activities (for example connecting a calendar) can extend the trial by a number of days; the current offers and amounts are shown in the app and may change over time. If you reach the end of the trial and decide not to subscribe, you will not be charged. ' +
  TRIAL_AFTER;

export const FOUNDERS_CAP =
  "The first 100 subscriptions get a special founders' price for the first year when you subscribe, then the standard price. Google Play first, from launch day.";

export const WAITLIST_NO_PLACE = "Joining the waitlist doesn't reserve a founders' place.";

export const COOLING_OFF =
  "If you subscribe and change your mind, you can cancel within 14 days of your first payment and ask for a refund (less anything you've used) through Google Play or the App Store.";

export const REFERRAL_SUMMARY =
  'Share your link. When 3 friends confirm, you get Calm-down cards; at 5, Family adventure bingo.';

export const REFERRAL_TERMS =
  "Share your own link. When someone joins through it and confirms their email, that counts as one referral. 3 referrals: Calm-down cards (printable A4 PDF, calm-down-cards.pdf). 5 referrals: Family adventure bingo (printable A4 PDF, family-adventure-bingo.pdf). Both are referral-only and are sent only in the reward emails. Referrals count until 23:59 UK time on Thu 31 Dec 2026. Your own sign-ups, duplicate or fake addresses don't count. If several sign-ups come from the same internet connection within an hour, we check them by hand before they count. A referral stops counting if that person unsubscribes before 23:59 UK time on 31 Dec 2026. Referrals never give a founders' place or a discount on Hubbly's price. Rewards are sent by email by Fri 15 Jan 2027. Promoter: PerfectDay Technologies Ltd, registered in England and Wales, company no. 16952922, 71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, United Kingdom.";

export const PRIVACY_WAITLIST =
  "Hubbly waitlist. If you join our waitlist we collect your email address, first name (optional), which store you'll use, whether you'd like to test early, your confirmation that you're 18 or over, a referral code (and, if you joined through someone's link, that link's code), and the time and IP address of your sign-up and confirmation (as a record of your consent). We use the sign-up time and IP address only to check referrals for fake or self-referrals, under our legitimate interest in running a fair referral promotion. The check is a hand review only, and it has no effect beyond whether a referral counts. For that check we keep an IPv4 /24 or IPv6 /64 prefix, and we delete that prefix on the same schedule as the rest of this waitlist record. We use this only to email you about Hubbly until launch and, if you ticked the box, after launch. Our lawful basis is your consent, which you can withdraw at any time using the unsubscribe link. MailerLite (UAB MailerLite, Lithuania) sends our emails as our processor and stores the data in the EU. If you ask to test early, we give your email address to Google or Apple to add you as a tester. We delete waitlist data 6 months after Hubbly launches on Google Play, and in any case by 31 July 2027. If you asked for emails after launch, we keep your email address, first name and consent record until you unsubscribe. We delete unconfirmed sign-ups within 21 days. You can complain to the ICO (ico.org.uk).";

export const PRIVACY_REFERRAL_COUNT =
  'We also store how many confirmed people joined through your link, so we can send a referral reward if one is due.';

export const PRIVACY_FREEBIES =
  'Downloading a printable from the freebie library does not collect your email address. We email a printable only after you confirm your waitlist place, or when you have earned a referral reward.';

export const SHARE_TEXT =
  'Hubbly is a family organiser, coming to Google Play in January. Join the waitlist:';

export const LAUNCH_LINE = 'Coming to Google Play in January, App Store soon after.';

export const GIFT_LINE =
  "When you confirm your email, we'll send you the Calmer Mornings Starter, a free printable with morning and bedtime routine charts and a star chart. It is not tied to referrals.";

export const SUBSCRIBER_FLAG_AT = 200;

/** 23:59 UK time on 31 Dec 2026. The UK is on GMT that day, so this is 23:59 UTC. */
export const REFERRAL_DEADLINE_ISO = '2026-12-31T23:59:59.999Z';

export const REWARD_REVIEW_AT = 5;
export const UNCONFIRMED_RETENTION_DAYS = 14;

/**
 * Hard stop in the privacy notice. The approved IP assessment says the
 * sign-up IP is deleted on that schedule. 31 July 2027 is the latest date.
 */
export const NETWORK_PREFIX_PURGE_AT = '2027-07-31T23:59:59.999Z';
