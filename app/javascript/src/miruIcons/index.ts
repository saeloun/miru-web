/* eslint-disable @typescript-eslint/no-var-requires */
import {
  MagnifyingGlass,
  PencilSimple,
  CaretLeft,
  CaretRight,
  Trash,
  Funnel,
  Timer,
  UsersThree,
  Buildings,
  Briefcase,
  Receipt,
  ChartLine,
  Wallet,
  Gear,
  SignOut,
  Plus,
  CaretCircleLeft,
  CaretCircleRight,
  Pencil,
  ArrowLeft,
  ArrowRight,
  DotsThreeVertical,
  X,
  CaretDown,
  CaretUp,
  Pen,
  FileCsv,
  FilePdf,
  Printer,
  Share,
  DownloadSimple,
  Calendar,
  PaperPlaneTilt,
  FloppyDisk,
  Minus,
  CurrencyCircleDollar,
  CheckCircle,
  Phone,
  MapPin,
  Info,
  Globe,
  Copy,
} from "phosphor-react";

const accountsAgingIcon = require("./svgIcons/accountsAging.svg");
const accountsAgingHoverIcon = require("./svgIcons/accountsAgingHover.svg");
const reportcalendarIcon = require("./svgIcons/Calendar.svg");
const calendarHoverIcon = require("./svgIcons/CalendarHover.svg");
const emptyStateInvoices = require("./svgIcons/emptyStateInvoices.svg");
const hoursIcon = require("./svgIcons/Hours.svg");
const hoursHoverIcon = require("./svgIcons/HoursHover.svg");
const overdueOutstandingIcon = require("./svgIcons/OverdueOutstanding.svg");
const overdueOutstandingHoverIcon = require("./svgIcons/OverdueOutstandingHover.svg");
const revenueIcon = require("./svgIcons/Revenue.svg");
const revenueHoverIcon = require("./svgIcons/RevenueHover.svg");

const alert = require("../../../assets/images/alert-error-close.svg");
const amex = require("../../../assets/images/amex.svg");
const apple = require("../../../assets/images/apple.svg");
const applePay = require("../../../assets/images/applePay.svg");
const avatar = require("../../../assets/images/avatar.svg");
const avatar_payments = require("../../../assets/images/avatar_payments.svg");
const cancel_button = require("../../../assets/images/cancel_button.svg");
const checkedCheckbox = require("../../../assets/images/checkbox-checked.svg");
const uncheckedCheckbox = require("../../../assets/images/checkbox-unchecked.svg");
const close_button = require("../../../assets/images/close_button.svg");
const company = require("../../../assets/images/company.svg");
const Connect = require("../../../assets/images/Connect.svg");
const connected_check = require("../../../assets/images/connected_check.svg");
const ConnectPaypal = require("../../../assets/images/ConnectPaypal.svg");
const deleteSVG = require("../../../assets/images/delete.svg");
const delete_image_button = require("../../../assets/images/delete_image_button.svg");
const down = require("../../../assets/images/down-arrow-svgrepo-com.svg");
const downArrow = require("../../../assets/images/down_arrow.svg");
const edit = require("../../../assets/images/edit.svg");
const edit_image_button = require("../../../assets/images/edit_image_button.svg");
const errorOctagon = require("../../../assets/images/error-octagon.svg");
const google = require("../../../assets/images/google.svg");
const help_icon = require("../../../assets/images/help_icon.png");
const circleInfo = require("../../../assets/images/info-circle.svg");
const closeInfo = require("../../../assets/images/info-close-icon.svg");
const Instagram = require("../../../assets/images/Instagram.svg");
const logo = require("../../../assets/images/logo.jpg");
const logout_icon = require("../../../assets/images/logout_icon.svg");
const masterCard = require("../../../assets/images/masterCard.svg");
const miruLogo = require("../../../assets/images/miru-logo.svg");
const miruLogoWithText = require("../../../assets/images/miruLogoWithText.svg");
const MiruWhiteLogoWithText = require("../../../assets/images/MiruWhiteLogowithText.svg");
const mobile = require("../../../assets/images/mobile-menu.svg");
const NavAvatar = require("../../../assets/images/NavAvatar.svg");
const notification = require("../../../assets/images/notification.svg");
const password_icon = require("../../../assets/images/password_icon.svg");
const password_icon_text = require("../../../assets/images/password_icon_text.svg");
const PaypalDropdown = require("../../../assets/images/PaypalDropdown.svg");
const PaypalLogo = require("../../../assets/images/PaypalLogo.svg");
const pConnectInvoice = require("../../../assets/images/pConnectInvoice.svg");
const plus_icon = require("../../../assets/images/plus_icon.svg");
const PurpleMiruLogoWithText = require("../../../assets/images/PurpleMiruLogoWithText.svg");
const saeloun_logo = require("../../../assets/images/saeloun_logo.png");
const save_button = require("../../../assets/images/save_button.svg");
const sConnectInvoice = require("../../../assets/images/sConnectInvoice.svg");
const search_icon = require("../../../assets/images/search_icon.svg");
const setting_icon = require("../../../assets/images/setting_icon.svg");
const shield = require("../../../assets/images/shield.svg");
const stripe_logo = require("../../../assets/images/stripe_logo.svg");
const StripeDropdown = require("../../../assets/images/StripeDropdown.svg");
const clickSuccess = require("../../../assets/images/success-check-circle.svg");
const success = require("../../../assets/images/success-close-icon.svg");
const switcher = require("../../../assets/images/switcher.svg");
const Twitter = require("../../../assets/images/Twitter.svg");
const userAvatar = require("../../../assets/images/user_avatar.svg");
const visa = require("../../../assets/images/visa.svg");
const warningCloseIcon = require("../../../assets/images/warning-close-icon.svg");
const warningTriangle = require("../../../assets/images/warning-triangle.svg");

// icons from phosphor
export const EditIcon = PencilSimple;
export const DeleteIcon = Trash;
export const LeftArrowIcon = CaretLeft;
export const RightArrowIcon = CaretRight;
export const SearchIcon = MagnifyingGlass;
export const FilterIcon = Funnel;
export const TimeTrackingIcon = Timer;
export const TeamsIcon = UsersThree;
export const ClientsIcon = Buildings;
export const ProjectsIcon = Briefcase;
export const InvoicesIcon = Receipt;
export const ReportsIcon = ChartLine;
export const PaymentsIcon = Wallet;
export const SettingIcon = Gear;
export const SignOutIcon = SignOut;
export const PlusIcon = Plus;
export const MinusIcon = Minus;
export const CaretCircleLeftIcon = CaretCircleLeft;
export const CaretCircleRightIcon = CaretCircleRight;
export const PencilIcon = Pencil;
export const ArrowLeftIcon = ArrowLeft;
export const ArrowRightIcon = ArrowRight;
export const DotsThreeVerticalIcon = DotsThreeVertical;
export const XIcon = X;
export const CaretDownIcon = CaretDown;
export const CaretUpIcon = CaretUp;
export const PenIcon = Pen;
export const FileCsvIcon = FileCsv;
export const FilePdfIcon = FilePdf;
export const PrinterIcon = Printer;
export const ShareIcon = Share;
export const DownloadSimpleIcon = DownloadSimple;
export const CalendarIcon = Calendar;
export const PaperPlaneTiltIcon = PaperPlaneTilt;
export const FloppyDiskIcon = FloppyDisk;
export const CurrencyCircleDollarIcon = CurrencyCircleDollar;
export const CheckCircleIcon = CheckCircle;
export const PhoneIcon = Phone;
export const MapPinIcon = MapPin;
export const InfoIcon = Info;
export const GlobeIcon = Globe;
export const CopyIcon = Copy;
// custom svg icons
export const WarningTriangleSVG = warningTriangle;
export const WarningCloseIconSVG = warningCloseIcon;
export const UserAvatarSVG = userAvatar;
export const VisaSVG = visa;
export const SuccessSVG = success;
export const ClickSuccessSVG = clickSuccess;
export const StripeLogoSVG = stripe_logo;
export const ShieldSVG = shield;
export const Setting_iconSVG = setting_icon;
export const SaveButtonSVG = search_icon;
export const SearchIconSVG = save_button;
export const SaelounLogoSVG = saeloun_logo;
export const SConnectInvoiceSVG = sConnectInvoice;
export const PlusIconSVG = plus_icon;
export const PasswordIconTextSVG = password_icon_text;
export const PasswordIconSVG = password_icon;
export const NotificationSVG = notification;
export const MiruLogoWithTextSVG = miruLogoWithText;
export const MobileSVG = mobile;
export const PConnectInvoiceSVG = pConnectInvoice;
export const MasterCardSVG = masterCard;
export const LogoutIconSVG = logout_icon;
export const LogoSVG = logo;
export const CloseInfoSVG = closeInfo;
export const HelpIconSVG = help_icon;
export const CircleInfoSVG = circleInfo;
export const GoogleSVG = google;
export const ErrorOctagonSVG = errorOctagon;
export const EditImageButtonSVG = edit_image_button;
export const EditSVG = edit;
export const DownArrowSVG = downArrow;
export const DownSVG = down;
export const DeleteImageButtonSVG = delete_image_button;
export const CloseButtonSVG = close_button;
export const CompanySVG = company;
export const ConnectedCheckSVG = connected_check;
export const CheckedCheckboxSVG = checkedCheckbox;
export const CancelButtonSVG = cancel_button;
export const UncheckedCheckboxSVG = uncheckedCheckbox;
export const AvatarPaymentsSVG = avatar_payments;
export const AvatarSVG = avatar;
export const ApplePaySVG = applePay;
export const AppleSVG = apple;
export const PaypalDropdownSVG = PaypalDropdown;
export const PaypalLogoSVG = PaypalLogo;
export const PurpleMiruLogoWithTextSVG = PurpleMiruLogoWithText;
export const StripeDropdownSVG = StripeDropdown;
export const TwitterSVG = Twitter;
export const AlertSVG = alert;
export const AmexSVG = amex;
export const NavAvatarSVG = NavAvatar;
export const InstagramSVG = Instagram;
export const MiruWhiteLogoWithTextSVG = MiruWhiteLogoWithText;
export const ConnectPaypalSVG = ConnectPaypal;
export const ConnectSVG = Connect;
export const MiruLogoSVG = miruLogo;
export const DeleteIconSVG = deleteSVG;
export const ReportcalendarIcon = reportcalendarIcon;
export const CalendarHoverIcon = calendarHoverIcon;
export const HoursIcon = hoursIcon;
export const HoursHoverIcon = hoursHoverIcon;
export const OverdueOutstandingIcon = overdueOutstandingIcon;
export const OverdueOutstandingHoverIcon = overdueOutstandingHoverIcon;
export const RevenueIcon = revenueIcon;
export const RevenueHoverIcon = revenueHoverIcon;
export const AccountsAgingIcon = accountsAgingIcon;
export const AccountsAgingHoverIcon = accountsAgingHoverIcon;
export const Switcher = switcher;
export const EmptyStateInvoices = emptyStateInvoices;
