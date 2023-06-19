import {
  MiruTimeTrackingScreen,
  MiruReportAndAnalysisScreen,
  MiruPaymentAndInvoicesScreen,
  MiruManagingProjectsScreen,
  MiruManagingClientsScreen,
  MiruManagingEmployeesScreen,
} from "miruIcons";

export const carouselItems = [
  {
    type: "video",
    url: "https://www.youtube.com/watch?v=KvLh-XYMdpM",
    texts: {
      title: "Learn how to connect stripe in Miru to enable payments",
      description:
        "In this video, we will walk you through the process of connecting Stripe to your Miru account to enable payment processing for your sent invoices.",
    },
  },
  {
    type: "video",
    url: "https://www.youtube.com/watch?v=OCgCYKs_4fY",
    texts: {
      title: "Learn to Create and Send Invoices to Clients",
      description:
        "Create and send invoices instantly to clients instantly using Miru's intuitive and user-friendly interface",
    },
  },
  {
    type: "video",
    url: "https://www.youtube.com/watch?v=-0YwRN-tYpg",
    texts: {
      title: "Learn to Make Payments for Your Invoices using Stripe",
      description: "Make payments for your invoices using Stripe",
    },
  },
  {
    type: "image",
    image: MiruTimeTrackingScreen,
    texts: {
      title: "Start with effortless time tracking today",
      description:
        "Get a detailed report of your team's efforts & measure their time distribution across different projects. Identify team burnouts & underworked members for better decision-making.",
    },
  },
  {
    type: "image",
    image: MiruReportAndAnalysisScreen,
    texts: {
      title: "Powerful Reporting & Analysis ",
      description:
        "Get a wide range of business reports with accurate insights and data into your business profitability, sales revenue, and operational efficiency.",
    },
  },
  {
    type: "image",
    image: MiruPaymentAndInvoicesScreen,
    texts: {
      title: "Payment & Invoices",
      description:
        "Create and send invoices instantly to clients, and accept payments in a seamless way with integrated online payment methods.",
    },
  },
  {
    type: "image",
    image: MiruManagingClientsScreen,
    texts: {
      title: "Managing Clients",
      description:
        "Analyze and manage clients effectively, gauge your team efforts on every client, and track budgets, cost constraints, and profitability.",
    },
  },
  {
    type: "image",
    image: MiruManagingEmployeesScreen,
    texts: {
      title: "Managing Employees",
      description:
        "Store and manage employee details, track team contribution, and settle salary payments securely.",
    },
  },
  {
    type: "image",
    image: MiruManagingProjectsScreen,
    texts: {
      title: "Managing Projects",
      description:
        "Get comprehensive and in-depth reports on all projects handled by your teams and monitor team contributions in individual projects.",
    },
  },
];
