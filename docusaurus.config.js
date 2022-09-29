// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Miru Web',
  tagline: 'Miru is an open-source tool, designed to make time tracking, invoice management, and accounting easy for small businesses worldwide. It is a platform for organizations to help them streamline their workflow.',
  url: 'https://docs.getmiru.com',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'saeloun', // Usually your GitHub org/user name.
  projectName: 'miru-docs', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: "/docs",
          sidebarCollapsible: true,
          sidebarPath: require.resolve("./sidebars.js"),
          editUrl: "https://github.com/saeloun/miru-docs/edit/main/",
          showLastUpdateAuthor: true,
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        blog: {
          showReadingTime: true,
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/saeloun/docs/edit/main/blog/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      announcementBar: {
        id: "star_us",
        content:
          '⭐️ If you like Miru, give it a star on <a href="https://github.com/saeloun/miru-web">GitHub</a> and follow us on <a href="https://twitter.com/getmiru">Twitter</a>!',
        isCloseable: true,
        backgroundColor: '#4D72DA',
        textColor: '#ffffff'
      },
      navbar: {
        logo: {
          href: "https://www.getmiru.com",
          alt: 'Miru Logo',
          src: 'https://getmiru.com/assets/images/image01.svg?v=e3b47bc2',
        },
        items: [
          {
            href: 'https://github.com/saeloun/miru-web',
            label: 'GitHub',
            position: 'right',
          },
          {
            href: 'https://discord.gg/UABXyQQ82c',
            label: 'Discord',
            position: 'right',
          }
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Docs',
                to: '/docs/intro',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/miru-web',
              },
              {
                label: 'Discord',
                href: 'https://discord.gg/UABXyQQ82c',
              },
              {
                label: 'Twitter',
                href: 'https://twitter.com/getmiru',
              },
            ],
          },
          {
            title: 'More',
            items: [
              {
                label: 'Blog',
                to: '/blog',
              },
              {
                label: 'GitHub',
                href: 'https://github.com/saeloun/miru-web',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Saeloun, Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
