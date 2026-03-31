import { I18n } from "i18n-js";

export const LOCALE_STORAGE_KEY = "miru_locale";
export const BROWSER_COUNTRY_STORAGE_KEY = "miru_browser_country";
export const BROWSER_TIMEZONE_STORAGE_KEY = "miru_browser_timezone";

export const SUPPORTED_LOCALES = [
  "en",
  "en-GB",
  "en-US",
  "hi",
  "mr",
  "bn",
  "gu",
  "kn",
  "ml",
  "pa",
  "ta",
  "te",
  "ur",
  "es",
  "fr",
  "de",
  "it",
  "nl",
  "id",
  "pt-BR",
  "tr",
  "ar",
  "ja",
  "ko",
  "zh-CN",
] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LANGUAGE_OPTIONS: { value: SupportedLocale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-US", label: "English (US)" },
  { value: "hi", label: "हिन्दी" },
  { value: "mr", label: "मराठी" },
  { value: "bn", label: "বাংলা" },
  { value: "gu", label: "ગુજરાતી" },
  { value: "kn", label: "ಕನ್ನಡ" },
  { value: "ml", label: "മലയാളം" },
  { value: "pa", label: "ਪੰਜਾਬੀ" },
  { value: "ta", label: "தமிழ்" },
  { value: "te", label: "తెలుగు" },
  { value: "ur", label: "اردو" },
  { value: "es", label: "Español" },
  { value: "fr", label: "Français" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
  { value: "nl", label: "Nederlands" },
  { value: "id", label: "Bahasa Indonesia" },
  { value: "pt-BR", label: "Português (Brasil)" },
  { value: "tr", label: "Türkçe" },
  { value: "ar", label: "العربية" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "zh-CN", label: "简体中文" },
];

const translations = {
  en: {
    invalidImageFormatSize:
      "Incorrect file format. Please upload an image of type PNG or JPG. Max size (%{fileSize}KB)",
    invalidImageSize: "File size exceeded the max limit of %{fileSize}KB.",
    invalidImageFormat:
      "Incorrect file format. Please upload an image of type PNG or JPG",
    common: {
      cancel: "Cancel",
      saveChanges: "Save changes",
      saving: "Saving...",
      language: "Language",
      loading: "Loading...",
    },
    auth: {
      heroTitle: "One place for time, invoices, and payments",
      heroDescription:
        "Keep the day clear, keep billing moving, and keep cash visible.",
      slides: {
        dashboard: {
          title: "Company pulse",
          description:
            "See revenue, active projects, and team momentum without digging for it.",
        },
        invoices: {
          title: "Billing command",
          description:
            "Keep drafts, overdue balances, and paid work in the same place.",
        },
        timeTracking: {
          title: "Clear weekly flow",
          description:
            "Week-by-week time entry stays current without turning into busywork.",
        },
        payments: {
          title: "Cash ledger",
          description:
            "Every payment lands in one ledger with method, status, and source.",
        },
      },
      signIn: {
        title: "Sign in to your workspace",
        description:
          "Track work, send invoices, and keep cash flow clear from one place.",
        continueWithGoogle: "Continue with Google",
        continueWithGitHub: "Continue with GitHub",
        orUseEmail: "or use email",
        email: "Email",
        password: "Password",
        submit: "Sign in",
        waitingForPasskey: "Waiting for passkey...",
        forgotPassword: "Forgot password?",
        noAccount: "Don't have an account?",
        signUp: "Sign up",
        privacy: "Privacy",
        terms: "Terms",
        welcomeBack: "Welcome back!",
        loginFailed: "Login failed. Please try again.",
        passkeyPrompt: "Complete passkey verification to finish signing in.",
        totpPrompt: "Enter your authenticator code to finish signing in.",
        totpTitle: "Verify with your authenticator app",
        totpDescription:
          "Enter the 6-digit code from your authenticator app, or use a recovery code.",
        totpCode: "Authenticator code",
        recoveryCode: "Recovery code",
        verifyAndSignIn: "Verify and sign in",
        back: "Back",
      },
      signUp: {
        title: "Create your workspace",
        description:
          "Set up clients, projects, invoices, and payments in one clear operating system.",
        continueWithGoogle: "Continue with Google",
        continueWithGitHub: "Continue with GitHub",
        orUseEmail: "or use email",
        firstName: "First name",
        lastName: "Last name",
        email: "Email",
        password: "Password",
        confirmPassword: "Confirm password",
        passwordCriteria:
          "Min. 8 characters, 1 uppercase, 1 lowercase, 1 number and 1 special character",
        agreePrefix: "I agree to the",
        termsOfService: "Terms of Service",
        and: "and",
        privacyPolicy: "Privacy Policy",
        submit: "Create account",
        alreadyHaveAccount: "Already have an account?",
        signIn: "Sign in",
      },
      validation: {
        invalidEmail: "Invalid email ID",
        emailRequired: "Email ID cannot be blank",
        passwordRequired: "Password cannot be blank",
        firstNameInvalid: "Please enter valid first name",
        firstNameMax: "Maximum 20 characters are allowed",
        firstNameRequired: "First name cannot be blank",
        lastNameInvalid: "Please enter valid last name",
        lastNameMax: "Maximum 20 characters are allowed",
        lastNameRequired: "Last name cannot be blank",
        passwordSpace: "Password cannot start or end with a blank space",
        passwordComplexity:
          "Must contain at least 8 characters, one uppercase, one lowercase, one number and one special character",
        passwordsMustMatch: "Passwords must match",
        confirmPasswordRequired: "Confirm password cannot be blank",
        acceptTerms: "Please agree to the terms and privacy policy to continue",
      },
    },
    nav: {
      dashboard: "Dashboard",
      timeTracking: "Time Tracking",
      clients: "Clients",
      projects: "Projects",
      team: "Team",
      invoices: "Invoices",
      reports: "Reports",
      payments: "Payments",
      leavesAndHolidays: "Leaves & Holidays",
      expenses: "Expenses",
      settings: "Settings",
      logout: "Logout",
    },
    sidebar: {
      main: "Main",
      organization: "Organization",
      personalSettings: "Personal Settings",
      holidayCalendar: "Holiday Calendar",
      companySettings: "Company Settings",
      paymentSettings: "Payment Settings",
      billing: "Billing",
      profile: "Profile",
      devices: "Devices",
      myLeaves: "My Leaves",
      bankTaxInfo: "Bank & Tax Info",
      expand: "Expand sidebar",
      collapse: "Collapse sidebar",
    },
    dashboard: {
      timeframe: {
        year: "Year to date",
        quarter: "Quarter to date",
        month: "Month to date",
        week: "Week to date",
      },
      companyPulse: "Company Pulse",
      welcomeBack: "Welcome back, %{name}",
      there: "there",
      recentActivity: "Recent Activity",
      workspaceActivity: "Workspace Activity",
      employeeActivityDescription:
        "Your dashboard is focused on time tracking and assigned work.",
      activityDescription: "Latest updates across your invoices and payments",
      noRecentActivityYet: "No recent activity yet",
      loadMore: "Load more",
      caughtUp: "You're all caught up",
      stats: {
        revenue: "Revenue",
        activeProjects: "Active Projects",
        currentlyActive: "Currently active",
        noRecentActivity: "No recent activity",
        teamSize: "Team Size",
        teammates: "Teammates",
        hoursTracked: "Hours Tracked",
        assignedProjects: "Assigned Projects",
        projectsYouCanWorkOn: "Projects you can work on",
        totalInvoiced: "Total Invoiced",
        openInvoices: "Open Invoices",
        awaitingPayment: "Awaiting payment",
        paidInvoices: "Paid Invoices",
        alreadySettled: "Already settled",
        paymentsReceived: "Payments Received",
      },
      roleGuidance: {
        employee:
          "Track your week, submit accurate entries, and keep work moving.",
        bookKeeper:
          "Review incoming payments, reconcile invoices, and keep cash flow clear.",
        client: "Check invoice status and payment history for your account.",
        default: "Revenue, projects, and team momentum at a glance.",
      },
      charts: {
        revenueTrendEyebrow: "Revenue Trend",
        revenueMomentumTitle: "Revenue Momentum",
        revenueMomentumDescription: "Month-by-month revenue year to date",
        topCustomersEyebrow: "Top Customers",
        revenueLeadersTitle: "Revenue Leaders",
        revenueLeadersDescription: "Your highest revenue contributors",
        ofTotal: "%{percentage}% of total",
        noRevenue: "No revenue yet for this period",
      },
    },
    settings: {
      labels: {
        profile: "Profile settings",
        employment: "Employment details",
        devices: "Allocated devices",
        notifications: "Notification settings",
        preferences: "Preferences",
        automation: "Automation & CLI",
        organization: "Org. settings",
        bankInfo: "Bank & tax info",
        leaves: "Leaves",
        holidays: "Holidays",
        payment: "Payment settings",
        billing: "Billing",
      },
      categories: {
        personal: "Personal",
        organization: "Organization",
      },
    },
    preferences: {
      title: "Preferences",
      description: "Manage your language and email notification settings",
      languageTitle: "Display language",
      languageDescription:
        "Choose the language Miru should use across sign-in, navigation, and settings.",
      languageHelp:
        "Hindi and Marathi are part of the first native-language batch. Other supported locales fall back to English where copy has not been backfilled yet.",
      emailPreferencesTitle: "Email preferences",
      emailPreferencesDescription: "Manage your email notification settings",
      weeklyReminderTitle: "Weekly timesheet reminder",
      weeklyReminderDescription:
        "Receive weekly reminders every Monday about pending timesheet entries.",
      missingEntryTitle: "Missing entry reminders",
      missingEntryDescription:
        "Get notified when you haven't logged time for more than 2 days.",
      invoiceTitle: "Invoice email notifications",
      invoiceDescription:
        "Receive emails when invoices are created, sent, or updated.",
      paymentTitle: "Payment email notifications",
      paymentDescription:
        "Get notified when payments are received or payment status changes.",
      timesheetCategory: "Timesheet notifications",
      timesheetCategoryDescription:
        "Manage notifications related to time tracking and timesheets",
      billingCategory: "Billing notifications",
      billingCategoryDescription: "Control invoice and payment notifications",
      activeBadge: "Active",
      importantBadge: "Important",
      enabledCount: "%{enabled} of %{total} enabled",
      confirmUnsubscribeTitle: "Confirm unsubscribe from all emails",
      confirmUnsubscribeBody:
        "Are you sure you want to unsubscribe from all email notifications? You will not receive any emails including important billing and invoice notifications.",
      confirmUnsubscribeAction: "Yes, unsubscribe from all",
      unsubscribedTitle: "You're unsubscribed from all emails",
      unsubscribedBody:
        "You are currently unsubscribed from all email notifications. You won't receive any emails from Miru.",
      resubscribeAction: "Re-enable email notifications",
      deliveryTitle: "Email delivery settings",
      emailAddress: "Email address",
      emailAddressHelp:
        "All notifications will be sent to this email address. To change your email, please update it in your profile settings.",
      unsubscribeTitle: "Unsubscribe",
      unsubscribeBody:
        "If you no longer wish to receive any emails from Miru, you can unsubscribe from all notifications. This will stop all email communications including important billing and invoice notifications.",
      unsubscribeAction: "Unsubscribe from all emails",
    },
  },
  hi: {
    common: {
      cancel: "रद्द करें",
      saveChanges: "बदलाव सहेजें",
      saving: "सहेजा जा रहा है...",
      language: "भाषा",
      loading: "लोड हो रहा है...",
    },
    auth: {
      heroTitle: "समय, इनवॉइस और पेमेंट्स के लिए एक ही जगह",
      heroDescription:
        "दिन को साफ रखें, बिलिंग को आगे बढ़ाएं और कैश को साफ तौर पर देखें।",
      slides: {
        dashboard: {
          title: "कंपनी की नब्ज़",
          description:
            "राजस्व, सक्रिय प्रोजेक्ट और टीम की गति बिना खोजबीन के देखें।",
        },
        invoices: {
          title: "बिलिंग कमांड",
          description: "ड्राफ्ट, बकाया और भुगतान की गई राशि एक ही जगह रखें।",
        },
        timeTracking: {
          title: "साफ़ साप्ताहिक प्रवाह",
          description: "साप्ताहिक टाइम एंट्री बिना झंझट के अद्यतन रहती है।",
        },
        payments: {
          title: "कैश लेजर",
          description:
            "हर भुगतान एक ही लेजर में विधि, स्थिति और स्रोत के साथ आता है।",
        },
      },
      signIn: {
        title: "अपने वर्कस्पेस में साइन इन करें",
        description:
          "एक ही जगह से काम ट्रैक करें, इनवॉइस भेजें और कैश फ्लो साफ रखें।",
        continueWithGoogle: "Google से जारी रखें",
        continueWithGitHub: "GitHub से जारी रखें",
        orUseEmail: "या ईमेल इस्तेमाल करें",
        email: "ईमेल",
        password: "पासवर्ड",
        submit: "साइन इन",
        waitingForPasskey: "पासकी का इंतज़ार हो रहा है...",
        forgotPassword: "पासवर्ड भूल गए?",
        noAccount: "क्या आपका खाता नहीं है?",
        signUp: "साइन अप करें",
        privacy: "प्राइवेसी",
        terms: "शर्तें",
        welcomeBack: "वापसी पर स्वागत है!",
        loginFailed: "लॉगिन विफल रहा। फिर से कोशिश करें।",
        passkeyPrompt: "साइन इन पूरा करने के लिए पासकी सत्यापन पूरा करें।",
        totpPrompt: "साइन इन पूरा करने के लिए अपना ऑथेंटिकेटर कोड दर्ज करें।",
        totpTitle: "अपने ऑथेंटिकेटर ऐप से सत्यापित करें",
        totpDescription:
          "अपने ऑथेंटिकेटर ऐप का 6-अंकों का कोड या रिकवरी कोड दर्ज करें।",
        totpCode: "ऑथेंटिकेटर कोड",
        recoveryCode: "रिकवरी कोड",
        verifyAndSignIn: "सत्यापित करें और साइन इन करें",
        back: "वापस",
      },
      signUp: {
        title: "अपना वर्कस्पेस बनाएं",
        description:
          "क्लाइंट, प्रोजेक्ट, इनवॉइस और पेमेंट्स को एक साफ सिस्टम में सेट करें।",
        continueWithGoogle: "Google से जारी रखें",
        continueWithGitHub: "GitHub से जारी रखें",
        orUseEmail: "या ईमेल इस्तेमाल करें",
        firstName: "पहला नाम",
        lastName: "अंतिम नाम",
        email: "ईमेल",
        password: "पासवर्ड",
        confirmPassword: "पासवर्ड की पुष्टि करें",
        passwordCriteria:
          "कम से कम 8 अक्षर, 1 अपरकेस, 1 लोअरकेस, 1 संख्या और 1 विशेष चिन्ह",
        agreePrefix: "मैं सहमत हूँ",
        termsOfService: "सेवा की शर्तों",
        and: "और",
        privacyPolicy: "प्राइवेसी पॉलिसी",
        submit: "खाता बनाएं",
        alreadyHaveAccount: "क्या आपके पास पहले से खाता है?",
        signIn: "साइन इन करें",
      },
      validation: {
        invalidEmail: "अमान्य ईमेल आईडी",
        emailRequired: "ईमेल आईडी खाली नहीं हो सकती",
        passwordRequired: "पासवर्ड खाली नहीं हो सकता",
        firstNameInvalid: "कृपया सही पहला नाम दर्ज करें",
        firstNameMax: "अधिकतम 20 अक्षर ही मान्य हैं",
        firstNameRequired: "पहला नाम खाली नहीं हो सकता",
        lastNameInvalid: "कृपया सही अंतिम नाम दर्ज करें",
        lastNameMax: "अधिकतम 20 अक्षर ही मान्य हैं",
        lastNameRequired: "अंतिम नाम खाली नहीं हो सकता",
        passwordSpace: "पासवर्ड खाली स्थान से शुरू या समाप्त नहीं होना चाहिए",
        passwordComplexity:
          "कम से कम 8 अक्षर, एक अपरकेस, एक लोअरकेस, एक संख्या और एक विशेष चिन्ह होना चाहिए",
        passwordsMustMatch: "पासवर्ड एक जैसे होने चाहिए",
        confirmPasswordRequired: "पासवर्ड पुष्टि खाली नहीं हो सकती",
        acceptTerms:
          "जारी रखने के लिए कृपया शर्तों और प्राइवेसी पॉलिसी से सहमत हों",
      },
    },
    nav: {
      dashboard: "डैशबोर्ड",
      timeTracking: "समय ट्रैकिंग",
      clients: "क्लाइंट्स",
      projects: "प्रोजेक्ट्स",
      team: "टीम",
      invoices: "इनवॉइस",
      reports: "रिपोर्ट्स",
      payments: "पेमेंट्स",
      leavesAndHolidays: "छुट्टियाँ और अवकाश",
      expenses: "खर्चे",
      settings: "सेटिंग्स",
      logout: "लॉगआउट",
    },
    sidebar: {
      main: "मुख्य",
      organization: "संगठन",
      personalSettings: "व्यक्तिगत सेटिंग्स",
      holidayCalendar: "हॉलिडे कैलेंडर",
      companySettings: "कंपनी सेटिंग्स",
      paymentSettings: "पेमेंट सेटिंग्स",
      billing: "बिलिंग",
      profile: "प्रोफाइल",
      devices: "डिवाइसेज़",
      myLeaves: "मेरी छुट्टियाँ",
      bankTaxInfo: "बैंक और टैक्स जानकारी",
      expand: "साइडबार फैलाएँ",
      collapse: "साइडबार समेटें",
    },
    dashboard: {
      timeframe: {
        year: "इस साल अब तक",
        quarter: "इस तिमाही अब तक",
        month: "इस महीने अब तक",
        week: "इस हफ्ते अब तक",
      },
      companyPulse: "कंपनी की नब्ज़",
      welcomeBack: "वापसी पर स्वागत है, %{name}",
      there: "दोस्त",
      recentActivity: "हाल की गतिविधि",
      workspaceActivity: "वर्कस्पेस गतिविधि",
      employeeActivityDescription:
        "आपका डैशबोर्ड समय ट्रैकिंग और सौंपे गए काम पर केंद्रित है।",
      activityDescription: "आपके इनवॉइस और पेमेंट्स के ताज़ा अपडेट",
      noRecentActivityYet: "अभी तक कोई हाल की गतिविधि नहीं है",
      loadMore: "और लोड करें",
      caughtUp: "आप पूरी तरह अपडेट हैं",
      stats: {
        revenue: "राजस्व",
        activeProjects: "सक्रिय प्रोजेक्ट",
        currentlyActive: "अभी सक्रिय",
        noRecentActivity: "कोई हाल की गतिविधि नहीं",
        teamSize: "टीम आकार",
        teammates: "टीम सदस्य",
        hoursTracked: "ट्रैक किए गए घंटे",
        assignedProjects: "सौंपे गए प्रोजेक्ट",
        projectsYouCanWorkOn: "वे प्रोजेक्ट जिन पर आप काम कर सकते हैं",
        totalInvoiced: "कुल इनवॉइस",
        openInvoices: "खुले इनवॉइस",
        awaitingPayment: "पेमेंट की प्रतीक्षा में",
        paidInvoices: "भुगतान किए गए इनवॉइस",
        alreadySettled: "पहले ही निपटाए गए",
        paymentsReceived: "प्राप्त पेमेंट्स",
      },
      roleGuidance: {
        employee:
          "अपना सप्ताह ट्रैक करें, सही एंट्री भेजें और काम को आगे बढ़ाते रहें।",
        bookKeeper:
          "आने वाले पेमेंट्स देखें, इनवॉइस मिलाएँ और कैश फ्लो को साफ रखें।",
        client: "अपने खाते के लिए इनवॉइस स्थिति और भुगतान इतिहास देखें।",
        default: "राजस्व, प्रोजेक्ट और टीम की गति एक नज़र में।",
      },
      charts: {
        revenueTrendEyebrow: "राजस्व रुझान",
        revenueMomentumTitle: "राजस्व गति",
        revenueMomentumDescription:
          "साल की शुरुआत से अब तक महीने-दर-महीने राजस्व",
        topCustomersEyebrow: "शीर्ष ग्राहक",
        revenueLeadersTitle: "राजस्व लीडर्स",
        revenueLeadersDescription: "आपके सबसे अधिक राजस्व देने वाले ग्राहक",
        ofTotal: "कुल का %{percentage}%",
        noRevenue: "इस अवधि के लिए अभी तक कोई राजस्व नहीं",
      },
    },
    settings: {
      labels: {
        profile: "प्रोफाइल सेटिंग्स",
        employment: "रोज़गार विवरण",
        devices: "आवंटित डिवाइसेज़",
        notifications: "नोटिफिकेशन सेटिंग्स",
        preferences: "प्राथमिकताएँ",
        automation: "ऑटोमेशन और CLI",
        organization: "संगठन सेटिंग्स",
        bankInfo: "बैंक और टैक्स जानकारी",
        leaves: "छुट्टियाँ",
        holidays: "हॉलिडे",
        payment: "पेमेंट सेटिंग्स",
        billing: "बिलिंग",
      },
      categories: {
        personal: "व्यक्तिगत",
        organization: "संगठन",
      },
    },
    preferences: {
      title: "प्राथमिकताएँ",
      description: "अपनी भाषा और ईमेल नोटिफिकेशन सेटिंग्स प्रबंधित करें",
      languageTitle: "डिस्प्ले भाषा",
      languageDescription:
        "साइन-इन, नेविगेशन और सेटिंग्स में Miru किस भाषा का उपयोग करे, चुनें।",
      languageHelp:
        "हिंदी और मराठी पहली मूल-भाषा बैच का हिस्सा हैं। जिन भाषाओं की कॉपी अभी पूरी नहीं हुई है, वहाँ अंग्रेज़ी फ़ॉलबैक रहेगा।",
      emailPreferencesTitle: "ईमेल प्राथमिकताएँ",
      emailPreferencesDescription:
        "अपनी ईमेल नोटिफिकेशन सेटिंग्स प्रबंधित करें",
      weeklyReminderTitle: "साप्ताहिक टाइमशीट रिमाइंडर",
      weeklyReminderDescription:
        "हर सोमवार लंबित टाइमशीट एंट्री की साप्ताहिक याद दिलाई जाएगी।",
      missingEntryTitle: "मिसिंग एंट्री रिमाइंडर",
      missingEntryDescription:
        "जब आपने 2 दिनों से अधिक समय तक टाइम लॉग नहीं किया हो तो सूचित करें।",
      invoiceTitle: "इनवॉइस ईमेल नोटिफिकेशन",
      invoiceDescription:
        "जब इनवॉइस बनें, भेजे जाएँ या अपडेट हों तब ईमेल प्राप्त करें।",
      paymentTitle: "पेमेंट ईमेल नोटिफिकेशन",
      paymentDescription: "जब पेमेंट मिले या स्थिति बदले तब सूचित करें।",
      timesheetCategory: "टाइमशीट नोटिफिकेशन",
      timesheetCategoryDescription:
        "समय ट्रैकिंग और टाइमशीट से जुड़ी नोटिफिकेशन प्रबंधित करें",
      billingCategory: "बिलिंग नोटिफिकेशन",
      billingCategoryDescription: "इनवॉइस और पेमेंट नोटिफिकेशन नियंत्रित करें",
      activeBadge: "सक्रिय",
      importantBadge: "महत्वपूर्ण",
      enabledCount: "%{total} में से %{enabled} सक्रिय",
      confirmUnsubscribeTitle: "सभी ईमेल से अनसब्सक्राइब की पुष्टि करें",
      confirmUnsubscribeBody:
        "क्या आप वाकई सभी ईमेल नोटिफिकेशन से अनसब्सक्राइब करना चाहते हैं? फिर आपको महत्वपूर्ण बिलिंग और इनवॉइस ईमेल भी नहीं मिलेंगे।",
      confirmUnsubscribeAction: "हाँ, सभी से अनसब्सक्राइब करें",
      unsubscribedTitle: "आप सभी ईमेल से अनसब्सक्राइब हैं",
      unsubscribedBody:
        "आप अभी सभी ईमेल नोटिफिकेशन से अनसब्सक्राइब हैं। आपको Miru से कोई ईमेल नहीं मिलेगा।",
      resubscribeAction: "ईमेल नोटिफिकेशन फिर से चालू करें",
      deliveryTitle: "ईमेल डिलीवरी सेटिंग्स",
      emailAddress: "ईमेल पता",
      emailAddressHelp:
        "सभी नोटिफिकेशन इसी ईमेल पते पर भेजे जाएँगे। ईमेल बदलने के लिए प्रोफाइल सेटिंग्स अपडेट करें।",
      unsubscribeTitle: "अनसब्सक्राइब",
      unsubscribeBody:
        "यदि आप Miru से कोई ईमेल नहीं लेना चाहते, तो सभी नोटिफिकेशन बंद कर सकते हैं। इससे महत्वपूर्ण बिलिंग और इनवॉइस ईमेल भी बंद हो जाएँगे।",
      unsubscribeAction: "सभी ईमेल से अनसब्सक्राइब करें",
    },
  },
  mr: {
    common: {
      cancel: "रद्द करा",
      saveChanges: "बदल जतन करा",
      saving: "जतन होत आहे...",
      language: "भाषा",
      loading: "लोड होत आहे...",
    },
    auth: {
      heroTitle: "टाइम, इनव्हॉइस आणि पेमेंट्ससाठी एकच जागा",
      heroDescription:
        "दिवस स्पष्ट ठेवा, बिलिंग चालू ठेवा आणि रोख स्थिती लगेच दिसू द्या.",
      signIn: {
        title: "तुमच्या वर्कस्पेसमध्ये साइन इन करा",
        description:
          "काम ट्रॅक करा, इनव्हॉइस पाठवा आणि रोख प्रवाह स्पष्ट ठेवा.",
        continueWithGoogle: "Google सह पुढे जा",
        continueWithGitHub: "GitHub सह पुढे जा",
        orUseEmail: "किंवा ईमेल वापरा",
        email: "ईमेल",
        password: "पासवर्ड",
        submit: "साइन इन",
        waitingForPasskey: "पासकीची वाट पाहत आहे...",
        forgotPassword: "पासवर्ड विसरलात?",
        noAccount: "तुमचे खाते नाही का?",
        signUp: "साइन अप करा",
        privacy: "गोपनीयता",
        terms: "अटी",
        welcomeBack: "पुन्हा स्वागत आहे!",
        loginFailed: "लॉगिन अयशस्वी झाले. पुन्हा प्रयत्न करा.",
        passkeyPrompt: "साइन इन पूर्ण करण्यासाठी पासकी पडताळणी पूर्ण करा.",
        totpPrompt: "साइन इन पूर्ण करण्यासाठी ऑथेंटिकेटर कोड भरा.",
        totpTitle: "ऑथेंटिकेटर अॅपद्वारे पडताळणी करा",
        totpDescription:
          "तुमच्या ऑथेंटिकेटर अॅपमधील 6-अंकी कोड किंवा रिकव्हरी कोड भरा.",
        totpCode: "ऑथेंटिकेटर कोड",
        recoveryCode: "रिकव्हरी कोड",
        verifyAndSignIn: "पडताळणी करून साइन इन करा",
        back: "मागे",
      },
      signUp: {
        title: "तुमचा वर्कस्पेस तयार करा",
        description:
          "क्लायंट, प्रोजेक्ट, इनव्हॉइस आणि पेमेंट्स एका स्पष्ट सिस्टिममध्ये सेट करा.",
        continueWithGoogle: "Google सह पुढे जा",
        continueWithGitHub: "GitHub सह पुढे जा",
        orUseEmail: "किंवा ईमेल वापरा",
        firstName: "पहिले नाव",
        lastName: "आडनाव",
        email: "ईमेल",
        password: "पासवर्ड",
        confirmPassword: "पासवर्डची पुष्टी करा",
        passwordCriteria:
          "किमान 8 अक्षरे, 1 मोठे अक्षर, 1 छोटे अक्षर, 1 अंक आणि 1 विशेष चिन्ह",
        agreePrefix: "मी सहमत आहे",
        termsOfService: "सेवेच्या अटींना",
        and: "आणि",
        privacyPolicy: "गोपनीयता धोरणाला",
        submit: "खाते तयार करा",
        alreadyHaveAccount: "आधीच खाते आहे का?",
        signIn: "साइन इन करा",
      },
      validation: {
        invalidEmail: "अवैध ईमेल आयडी",
        emailRequired: "ईमेल आयडी रिकामी असू शकत नाही",
        passwordRequired: "पासवर्ड रिकामा असू शकत नाही",
        firstNameInvalid: "कृपया योग्य पहिले नाव भरा",
        firstNameMax: "जास्तीत जास्त 20 अक्षरे मान्य आहेत",
        firstNameRequired: "पहिले नाव रिकामे असू शकत नाही",
        lastNameInvalid: "कृपया योग्य आडनाव भरा",
        lastNameMax: "जास्तीत जास्त 20 अक्षरे मान्य आहेत",
        lastNameRequired: "आडनाव रिकामे असू शकत नाही",
        passwordSpace: "पासवर्ड रिकाम्या जागेने सुरू किंवा संपला जाऊ नये",
        passwordComplexity:
          "किमान 8 अक्षरे, एक मोठे अक्षर, एक छोटे अक्षर, एक अंक आणि एक विशेष चिन्ह आवश्यक आहे",
        passwordsMustMatch: "पासवर्ड जुळले पाहिजेत",
        confirmPasswordRequired: "पासवर्ड पुष्टी रिकामी असू शकत नाही",
        acceptTerms: "पुढे जाण्यासाठी अटी आणि गोपनीयता धोरण मान्य करा",
      },
    },
    nav: {
      dashboard: "डॅशबोर्ड",
      timeTracking: "टाइम ट्रॅकिंग",
      clients: "क्लायंट्स",
      projects: "प्रोजेक्ट्स",
      team: "टीम",
      invoices: "इनव्हॉइस",
      reports: "रिपोर्ट्स",
      payments: "पेमेंट्स",
      leavesAndHolidays: "रजा आणि सुट्ट्या",
      expenses: "खर्च",
      settings: "सेटिंग्स",
      logout: "लॉगआउट",
    },
    sidebar: {
      main: "मुख्य",
      organization: "संस्था",
      personalSettings: "वैयक्तिक सेटिंग्स",
      holidayCalendar: "सुट्टी दिनदर्शिका",
      companySettings: "कंपनी सेटिंग्स",
      paymentSettings: "पेमेंट सेटिंग्स",
      billing: "बिलिंग",
      profile: "प्रोफाइल",
      devices: "डिव्हाइसेस",
      myLeaves: "माझ्या रजा",
      bankTaxInfo: "बँक आणि कर माहिती",
      expand: "साइडबार उघडा",
      collapse: "साइडबार बंद करा",
    },
    dashboard: {
      timeframe: {
        year: "या वर्षात आत्तापर्यंत",
        quarter: "या तिमाहीत आत्तापर्यंत",
        month: "या महिन्यात आत्तापर्यंत",
        week: "या आठवड्यात आत्तापर्यंत",
      },
      companyPulse: "कंपनीचा नाडीस्पर्श",
      welcomeBack: "पुन्हा स्वागत आहे, %{name}",
      there: "मित्रा",
      recentActivity: "अलीकडची क्रिया",
      workspaceActivity: "वर्कस्पेस क्रिया",
      employeeActivityDescription:
        "तुमचा डॅशबोर्ड टाइम ट्रॅकिंग आणि सोपवलेल्या कामावर केंद्रित आहे.",
      activityDescription: "तुमच्या इनव्हॉइस आणि पेमेंट्समधील ताजे अपडेट्स",
      noRecentActivityYet: "अजून अलीकडची कोणतीही क्रिया नाही",
      loadMore: "आणखी लोड करा",
      caughtUp: "तुम्ही पूर्णपणे अद्ययावत आहात",
      stats: {
        revenue: "उत्पन्न",
        activeProjects: "सक्रिय प्रोजेक्ट्स",
        currentlyActive: "सध्या सक्रिय",
        noRecentActivity: "अलीकडची कोणतीही क्रिया नाही",
        teamSize: "टीम आकार",
        teammates: "सहकारी",
        hoursTracked: "ट्रॅक केलेले तास",
        assignedProjects: "सोपवलेले प्रोजेक्ट्स",
        projectsYouCanWorkOn: "ज्या प्रोजेक्ट्सवर तुम्ही काम करू शकता",
        totalInvoiced: "एकूण इनव्हॉइस",
        openInvoices: "उघडे इनव्हॉइस",
        awaitingPayment: "पेमेंटची वाट पाहत आहे",
        paidInvoices: "भरलेले इनव्हॉइस",
        alreadySettled: "आधीच सेटल झालेले",
        paymentsReceived: "मिळालेले पेमेंट्स",
      },
      roleGuidance: {
        employee:
          "तुमचा आठवडा ट्रॅक करा, अचूक एंट्री सबमिट करा आणि काम पुढे चालू ठेवा.",
        bookKeeper:
          "येणारे पेमेंट्स पाहा, इनव्हॉइस जुळवा आणि कॅश फ्लो स्पष्ट ठेवा.",
        client: "तुमच्या खात्याचे इनव्हॉइस स्टेटस आणि पेमेंट इतिहास तपासा.",
        default: "उत्पन्न, प्रोजेक्ट्स आणि टीमची गती एका नजरेत.",
      },
      charts: {
        revenueTrendEyebrow: "उत्पन्नाचा ट्रेंड",
        revenueMomentumTitle: "उत्पन्नाची गती",
        revenueMomentumDescription:
          "वर्षाच्या सुरुवातीपासून महिन्यानुसार उत्पन्न",
        topCustomersEyebrow: "टॉप ग्राहक",
        revenueLeadersTitle: "उत्पन्न नेते",
        revenueLeadersDescription: "तुमचे सर्वाधिक उत्पन्न देणारे ग्राहक",
        ofTotal: "एकूणपैकी %{percentage}%",
        noRevenue: "या कालावधीत अजून उत्पन्न नाही",
      },
    },
    settings: {
      labels: {
        profile: "प्रोफाइल सेटिंग्स",
        employment: "रोजगार तपशील",
        devices: "सोपवलेली डिव्हाइसेस",
        notifications: "सूचना सेटिंग्स",
        preferences: "प्राधान्ये",
        automation: "ऑटोमेशन आणि CLI",
        organization: "संस्था सेटिंग्स",
        bankInfo: "बँक आणि कर माहिती",
        leaves: "रजा",
        holidays: "सुट्ट्या",
        payment: "पेमेंट सेटिंग्स",
        billing: "बिलिंग",
      },
      categories: {
        personal: "वैयक्तिक",
        organization: "संस्था",
      },
    },
    preferences: {
      title: "प्राधान्ये",
      description: "भाषा आणि ईमेल सूचना सेटिंग्स व्यवस्थापित करा",
      languageTitle: "दर्शवण्याची भाषा",
      languageDescription:
        "साइन-इन, नेव्हिगेशन आणि सेटिंग्समध्ये Miru कोणती भाषा वापरेल ते निवडा.",
      languageHelp:
        "हिंदी आणि मराठी या पहिल्या स्थानिक भाषांच्या बॅचमध्ये आहेत. बाकी समर्थित लोकॅलमध्ये अपूर्ण मजकूर असल्यास इंग्रजी फॉलबॅक राहील.",
      emailPreferencesTitle: "ईमेल प्राधान्ये",
      emailPreferencesDescription: "ईमेल सूचना सेटिंग्स व्यवस्थापित करा",
      weeklyReminderTitle: "साप्ताहिक टाइमशीट स्मरणपत्र",
      weeklyReminderDescription:
        "प्रलंबित टाइमशीट एंट्रींसाठी दर सोमवारी स्मरणपत्र मिळवा.",
      missingEntryTitle: "मिसिंग एंट्री स्मरणपत्र",
      missingEntryDescription:
        "2 दिवसांपेक्षा जास्त वेळ लॉग न केल्यास सूचना मिळवा.",
      invoiceTitle: "इनव्हॉइस ईमेल सूचना",
      invoiceDescription:
        "इनव्हॉइस तयार, पाठवले किंवा अपडेट झाले की ईमेल मिळवा.",
      paymentTitle: "पेमेंट ईमेल सूचना",
      paymentDescription: "पेमेंट मिळाले किंवा स्थिती बदलली की सूचना मिळवा.",
      timesheetCategory: "टाइमशीट सूचना",
      timesheetCategoryDescription:
        "टाइम ट्रॅकिंग आणि टाइमशीटशी संबंधित सूचना व्यवस्थापित करा",
      billingCategory: "बिलिंग सूचना",
      billingCategoryDescription: "इनव्हॉइस आणि पेमेंट सूचनांवर नियंत्रण ठेवा",
      activeBadge: "सक्रिय",
      importantBadge: "महत्त्वाचे",
      enabledCount: "%{total} पैकी %{enabled} सक्रिय",
      confirmUnsubscribeTitle: "सर्व ईमेलमधून बाहेर पडण्याची पुष्टी करा",
      confirmUnsubscribeBody:
        "तुम्ही खरोखरच सर्व ईमेल सूचनांमधून बाहेर पडू इच्छिता का? मग महत्त्वाच्या बिलिंग आणि इनव्हॉइस सूचनाही मिळणार नाहीत.",
      confirmUnsubscribeAction: "हो, सर्वातून बाहेर पडा",
      unsubscribedTitle: "तुम्ही सर्व ईमेलमधून बाहेर पडले आहात",
      unsubscribedBody:
        "तुम्ही सध्या सर्व ईमेल सूचनांमधून बाहेर पडले आहात. तुम्हाला Miru कडून ईमेल मिळणार नाही.",
      resubscribeAction: "ईमेल सूचना पुन्हा सुरू करा",
      deliveryTitle: "ईमेल वितरण सेटिंग्स",
      emailAddress: "ईमेल पत्ता",
      emailAddressHelp:
        "सर्व सूचना या ईमेलवर पाठवल्या जातील. ईमेल बदलण्यासाठी प्रोफाइल सेटिंग्स अपडेट करा.",
      unsubscribeTitle: "अनसब्सक्राइब",
      unsubscribeBody:
        "जर तुम्हाला Miru कडून ईमेल नको असतील, तर सर्व सूचनांतून बाहेर पडू शकता. यामुळे महत्त्वाच्या बिलिंग आणि इनव्हॉइस सूचना देखील थांबतील.",
      unsubscribeAction: "सर्व ईमेलमधून बाहेर पडा",
    },
  },
  es: {
    common: {
      cancel: "Cancelar",
      saveChanges: "Guardar cambios",
      saving: "Guardando...",
      language: "Idioma",
    },
    auth: {
      signIn: {
        title: "Inicia sesión en tu espacio de trabajo",
        description:
          "Registra trabajo, envía facturas y mantén el flujo de caja claro desde un solo lugar.",
        continueWithGoogle: "Continuar con Google",
        continueWithGitHub: "Continuar con GitHub",
        orUseEmail: "o usa tu correo",
        email: "Correo",
        password: "Contraseña",
        submit: "Iniciar sesión",
        waitingForPasskey: "Esperando la passkey...",
        forgotPassword: "¿Olvidaste tu contraseña?",
        noAccount: "¿No tienes cuenta?",
        signUp: "Regístrate",
        privacy: "Privacidad",
        terms: "Términos",
        welcomeBack: "¡Bienvenido de nuevo!",
        loginFailed: "No se pudo iniciar sesión. Inténtalo de nuevo.",
        passkeyPrompt:
          "Completa la verificación con passkey para iniciar sesión.",
        totpPrompt:
          "Ingresa tu código del autenticador para completar el inicio de sesión.",
        totpTitle: "Verifica con tu app autenticadora",
        totpDescription:
          "Ingresa el código de 6 dígitos de tu app autenticadora o un código de recuperación.",
        totpCode: "Código del autenticador",
        recoveryCode: "Código de recuperación",
        verifyAndSignIn: "Verificar e iniciar sesión",
        back: "Atrás",
      },
      signUp: {
        title: "Crea tu espacio de trabajo",
        description:
          "Configura clientes, proyectos, facturas y pagos en un sistema claro.",
        continueWithGoogle: "Continuar con Google",
        continueWithGitHub: "Continuar con GitHub",
        orUseEmail: "o usa tu correo",
        firstName: "Nombre",
        lastName: "Apellido",
        email: "Correo",
        password: "Contraseña",
        confirmPassword: "Confirmar contraseña",
        passwordCriteria:
          "Mín. 8 caracteres, 1 mayúscula, 1 minúscula, 1 número y 1 carácter especial",
        agreePrefix: "Acepto los",
        termsOfService: "Términos del servicio",
        and: "y la",
        privacyPolicy: "Política de privacidad",
        submit: "Crear cuenta",
        alreadyHaveAccount: "¿Ya tienes una cuenta?",
        signIn: "Iniciar sesión",
      },
      validation: {
        invalidEmail: "Correo no válido",
        emailRequired: "El correo no puede estar vacío",
        passwordRequired: "La contraseña no puede estar vacía",
        firstNameInvalid: "Ingresa un nombre válido",
        firstNameMax: "Se permiten como máximo 20 caracteres",
        firstNameRequired: "El nombre no puede estar vacío",
        lastNameInvalid: "Ingresa un apellido válido",
        lastNameMax: "Se permiten como máximo 20 caracteres",
        lastNameRequired: "El apellido no puede estar vacío",
        passwordSpace:
          "La contraseña no puede comenzar ni terminar con espacios",
        passwordComplexity:
          "Debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial",
        passwordsMustMatch: "Las contraseñas deben coincidir",
        confirmPasswordRequired:
          "La confirmación de contraseña no puede estar vacía",
        acceptTerms:
          "Acepta los términos y la política de privacidad para continuar",
      },
    },
    nav: {
      dashboard: "Panel",
      timeTracking: "Tiempo",
      clients: "Clientes",
      projects: "Proyectos",
      team: "Equipo",
      invoices: "Facturas",
      reports: "Reportes",
      payments: "Pagos",
      leavesAndHolidays: "Ausencias y feriados",
      expenses: "Gastos",
      settings: "Configuración",
      logout: "Salir",
    },
    settings: {
      categories: {
        personal: "Personal",
        organization: "Organización",
      },
    },
    preferences: {
      title: "Preferencias",
      description:
        "Administra tu idioma y tus preferencias de notificaciones por correo",
      languageTitle: "Idioma de la interfaz",
      languageDescription:
        "Elige el idioma que Miru debe usar en el inicio de sesión, la navegación y la configuración.",
      languageHelp:
        "Hindi y maratí forman parte del primer lote nativo. Otros idiomas compatibles usan inglés donde aún falta traducción.",
      emailPreferencesTitle: "Preferencias de correo",
      emailPreferencesDescription:
        "Administra tu configuración de notificaciones por correo",
    },
  },
  fr: {
    common: {
      cancel: "Annuler",
      saveChanges: "Enregistrer",
      saving: "Enregistrement...",
      language: "Langue",
    },
    auth: {
      signIn: {
        title: "Connectez-vous à votre espace de travail",
        description:
          "Suivez le travail, envoyez des factures et gardez une trésorerie claire depuis un seul endroit.",
        continueWithGoogle: "Continuer avec Google",
        continueWithGitHub: "Continuer avec GitHub",
        orUseEmail: "ou utilisez l'e-mail",
        email: "E-mail",
        password: "Mot de passe",
        submit: "Se connecter",
        waitingForPasskey: "En attente de la passkey...",
        forgotPassword: "Mot de passe oublié ?",
        noAccount: "Vous n'avez pas de compte ?",
        signUp: "Créer un compte",
        privacy: "Confidentialité",
        terms: "Conditions",
      },
      signUp: {
        title: "Créez votre espace de travail",
        description:
          "Configurez clients, projets, factures et paiements dans un système clair.",
        continueWithGoogle: "Continuer avec Google",
        continueWithGitHub: "Continuer avec GitHub",
        orUseEmail: "ou utilisez l'e-mail",
        firstName: "Prénom",
        lastName: "Nom",
        email: "E-mail",
        password: "Mot de passe",
        confirmPassword: "Confirmer le mot de passe",
        passwordCriteria:
          "Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial",
        agreePrefix: "J'accepte les",
        termsOfService: "Conditions d'utilisation",
        and: "et la",
        privacyPolicy: "Politique de confidentialité",
        submit: "Créer un compte",
        alreadyHaveAccount: "Vous avez déjà un compte ?",
        signIn: "Se connecter",
      },
    },
    nav: {
      dashboard: "Tableau de bord",
      timeTracking: "Suivi du temps",
      clients: "Clients",
      projects: "Projets",
      team: "Équipe",
      invoices: "Factures",
      reports: "Rapports",
      payments: "Paiements",
      leavesAndHolidays: "Congés et jours fériés",
      expenses: "Dépenses",
      settings: "Paramètres",
      logout: "Déconnexion",
    },
    settings: {
      categories: {
        personal: "Personnel",
        organization: "Organisation",
      },
    },
    preferences: {
      title: "Préférences",
      description:
        "Gérez votre langue et vos préférences de notification par e-mail",
      languageTitle: "Langue d'affichage",
      languageDescription:
        "Choisissez la langue que Miru doit utiliser dans la connexion, la navigation et les paramètres.",
      languageHelp:
        "L'hindi et le marathi font partie du premier lot natif. Les autres langues prises en charge reviennent à l'anglais si la traduction n'est pas encore complète.",
      emailPreferencesTitle: "Préférences e-mail",
      emailPreferencesDescription:
        "Gérez vos paramètres de notification par e-mail",
    },
  },
  de: {
    common: {
      cancel: "Abbrechen",
      saveChanges: "Änderungen speichern",
      saving: "Wird gespeichert...",
      language: "Sprache",
    },
    auth: {
      signIn: {
        title: "Melden Sie sich in Ihrem Workspace an",
        description:
          "Erfassen Sie Arbeit, senden Sie Rechnungen und behalten Sie den Cashflow an einem Ort im Blick.",
        continueWithGoogle: "Mit Google fortfahren",
        continueWithGitHub: "Mit GitHub fortfahren",
        orUseEmail: "oder E-Mail verwenden",
        email: "E-Mail",
        password: "Passwort",
        submit: "Anmelden",
        waitingForPasskey: "Warte auf Passkey...",
        forgotPassword: "Passwort vergessen?",
        noAccount: "Noch kein Konto?",
        signUp: "Registrieren",
        privacy: "Datenschutz",
        terms: "Bedingungen",
      },
      signUp: {
        title: "Erstellen Sie Ihren Workspace",
        description:
          "Richten Sie Kunden, Projekte, Rechnungen und Zahlungen in einem klaren System ein.",
        continueWithGoogle: "Mit Google fortfahren",
        continueWithGitHub: "Mit GitHub fortfahren",
        orUseEmail: "oder E-Mail verwenden",
        firstName: "Vorname",
        lastName: "Nachname",
        email: "E-Mail",
        password: "Passwort",
        confirmPassword: "Passwort bestätigen",
        passwordCriteria:
          "Mind. 8 Zeichen, 1 Großbuchstabe, 1 Kleinbuchstabe, 1 Zahl und 1 Sonderzeichen",
        agreePrefix: "Ich stimme den",
        termsOfService: "Nutzungsbedingungen",
        and: "und der",
        privacyPolicy: "Datenschutzerklärung",
        submit: "Konto erstellen",
        alreadyHaveAccount: "Sie haben bereits ein Konto?",
        signIn: "Anmelden",
      },
    },
    nav: {
      dashboard: "Dashboard",
      timeTracking: "Zeiterfassung",
      clients: "Kunden",
      projects: "Projekte",
      team: "Team",
      invoices: "Rechnungen",
      reports: "Berichte",
      payments: "Zahlungen",
      leavesAndHolidays: "Urlaub & Feiertage",
      expenses: "Ausgaben",
      settings: "Einstellungen",
      logout: "Abmelden",
    },
    settings: {
      categories: {
        personal: "Persönlich",
        organization: "Organisation",
      },
    },
    preferences: {
      title: "Einstellungen",
      description:
        "Verwalten Sie Ihre Sprache und E-Mail-Benachrichtigungseinstellungen",
      languageTitle: "Anzeigesprache",
      languageDescription:
        "Wählen Sie die Sprache, die Miru für Anmeldung, Navigation und Einstellungen verwenden soll.",
      languageHelp:
        "Hindi und Marathi gehören zur ersten nativen Sprachrunde. Andere unterstützte Sprachen fallen auf Englisch zurück, solange Texte noch nicht vollständig nachgepflegt sind.",
      emailPreferencesTitle: "E-Mail-Einstellungen",
      emailPreferencesDescription:
        "Verwalten Sie Ihre E-Mail-Benachrichtigungseinstellungen",
    },
  },
  "pt-BR": {
    common: {
      cancel: "Cancelar",
      saveChanges: "Salvar alterações",
      saving: "Salvando...",
      language: "Idioma",
    },
    auth: {
      signIn: {
        title: "Entre no seu workspace",
        description:
          "Acompanhe o trabalho, envie faturas e mantenha o fluxo de caixa claro em um só lugar.",
        continueWithGoogle: "Continuar com Google",
        continueWithGitHub: "Continuar com GitHub",
        orUseEmail: "ou use e-mail",
        email: "E-mail",
        password: "Senha",
        submit: "Entrar",
        waitingForPasskey: "Aguardando passkey...",
        forgotPassword: "Esqueceu a senha?",
        noAccount: "Ainda não tem conta?",
        signUp: "Criar conta",
        privacy: "Privacidade",
        terms: "Termos",
      },
      signUp: {
        title: "Crie seu workspace",
        description:
          "Configure clientes, projetos, faturas e pagamentos em um sistema claro.",
        continueWithGoogle: "Continuar com Google",
        continueWithGitHub: "Continuar com GitHub",
        orUseEmail: "ou use e-mail",
        firstName: "Nome",
        lastName: "Sobrenome",
        email: "E-mail",
        password: "Senha",
        confirmPassword: "Confirmar senha",
        passwordCriteria:
          "Mín. 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial",
        agreePrefix: "Eu concordo com os",
        termsOfService: "Termos de serviço",
        and: "e a",
        privacyPolicy: "Política de privacidade",
        submit: "Criar conta",
        alreadyHaveAccount: "Já tem uma conta?",
        signIn: "Entrar",
      },
    },
    nav: {
      dashboard: "Painel",
      timeTracking: "Tempo",
      clients: "Clientes",
      projects: "Projetos",
      team: "Equipe",
      invoices: "Faturas",
      reports: "Relatórios",
      payments: "Pagamentos",
      leavesAndHolidays: "Folgas e feriados",
      expenses: "Despesas",
      settings: "Configurações",
      logout: "Sair",
    },
    settings: {
      categories: {
        personal: "Pessoal",
        organization: "Organização",
      },
    },
    preferences: {
      title: "Preferências",
      description:
        "Gerencie seu idioma e suas preferências de notificações por e-mail",
      languageTitle: "Idioma de exibição",
      languageDescription:
        "Escolha o idioma que o Miru deve usar no login, na navegação e nas configurações.",
      languageHelp:
        "Hindi e marathi fazem parte do primeiro lote nativo. Outros idiomas suportados usam inglês onde o texto ainda não foi preenchido.",
      emailPreferencesTitle: "Preferências de e-mail",
      emailPreferencesDescription:
        "Gerencie suas configurações de notificações por e-mail",
    },
  },
} as const;

const i18n = new I18n(translations);
i18n.enableFallback = true;
i18n.defaultLocale = "en";
i18n.locale = "en";

const canUseWindow = () => typeof window !== "undefined";

export const normalizeLocale = (locale?: string | null): SupportedLocale => {
  const value = locale?.trim();
  if (!value) return "en";

  const exactMatch = SUPPORTED_LOCALES.find(
    supported => supported.toLowerCase() === value.toLowerCase()
  );
  if (exactMatch) return exactMatch;

  const base = value.split("-")[0]?.toLowerCase();
  const baseMatch = SUPPORTED_LOCALES.find(
    supported => supported.toLowerCase() === base
  );

  return baseMatch || "en";
};

export const getActiveLocale = (): SupportedLocale =>
  normalizeLocale(i18n.locale);

export const detectBrowserLocale = (): SupportedLocale => {
  if (!canUseWindow()) return "en";

  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const language of languages) {
    const normalized = normalizeLocale(language);
    if (normalized) return normalized;
  }

  return "en";
};

export const detectBrowserCountry = (): string => {
  if (!canUseWindow()) return "US";

  const locale =
    navigator.languages?.find(Boolean) || navigator.language || "en-US";
  const region = locale.split("-")[1];

  return (region || "US").toUpperCase();
};

export const detectBrowserTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export const persistBrowserProfile = () => {
  if (!canUseWindow()) return;

  localStorage.setItem(BROWSER_COUNTRY_STORAGE_KEY, detectBrowserCountry());
  localStorage.setItem(BROWSER_TIMEZONE_STORAGE_KEY, detectBrowserTimeZone());
};

export const getStoredBrowserCountry = (): string =>
  canUseWindow()
    ? localStorage.getItem(BROWSER_COUNTRY_STORAGE_KEY) ||
      detectBrowserCountry()
    : "US";

export const getStoredBrowserTimeZone = (): string =>
  canUseWindow()
    ? localStorage.getItem(BROWSER_TIMEZONE_STORAGE_KEY) ||
      detectBrowserTimeZone()
    : "UTC";

export const getStoredLocale = (): SupportedLocale | null => {
  if (!canUseWindow()) return "en";

  const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (!storedLocale) return null;

  return normalizeLocale(storedLocale);
};

export const applyLocale = (locale?: string | null): SupportedLocale => {
  const normalizedLocale = normalizeLocale(locale || getStoredLocale());
  i18n.locale = normalizedLocale;

  if (canUseWindow()) {
    localStorage.setItem(LOCALE_STORAGE_KEY, normalizedLocale);
    document.documentElement.lang = normalizedLocale;
  }

  return normalizedLocale;
};

export const initializeLocale = (preferredLocale?: string | null) => {
  persistBrowserProfile();

  return applyLocale(
    preferredLocale || getStoredLocale() || detectBrowserLocale()
  );
};

const isMissingTranslation = (value: unknown): value is string =>
  typeof value === "string" && value.startsWith("[missing ");

export const t = (key: string, options?: Record<string, unknown>) => {
  const translated = i18n.t(key, options);
  if (!isMissingTranslation(translated)) return translated;

  const englishFallback = i18n.t(key, { ...options, locale: "en" });
  if (!isMissingTranslation(englishFallback)) return englishFallback;

  return key.split(".").pop() || key;
};

const COUNTRY_TO_CURRENCY: Record<string, string> = {
  AU: "AUD",
  BR: "BRL",
  CA: "CAD",
  CN: "CNY",
  DE: "EUR",
  ES: "EUR",
  FR: "EUR",
  GB: "GBP",
  IN: "INR",
  JP: "JPY",
  PT: "EUR",
  US: "USD",
};

export const defaultCurrencyForCountry = (countryCode?: string) =>
  COUNTRY_TO_CURRENCY[
    (countryCode || getStoredBrowserCountry()).toUpperCase()
  ] || "USD";

export const defaultDateFormatForCountry = (countryCode?: string) => {
  const country = (countryCode || getStoredBrowserCountry()).toUpperCase();

  if (["IN", "GB", "DE", "FR", "ES", "BR", "PT"].includes(country)) {
    return "DD-MM-YYYY";
  }

  if (["JP", "CN"].includes(country)) {
    return "YYYY-MM-DD";
  }

  return "MM-DD-YYYY";
};

export { i18n };
