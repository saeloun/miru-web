import React from 'react';
import ComponentCreator from '@docusaurus/ComponentCreator';

export default [
  {
    path: '/blog-only/2018/12/14/Happy-First-Birthday-Slash',
    component: ComponentCreator('/blog-only/2018/12/14/Happy-First-Birthday-Slash', 'b2d'),
    exact: true
  },
  {
    path: '/blog-only/archive',
    component: ComponentCreator('/blog-only/archive', '111'),
    exact: true
  },
  {
    path: '/blog-only/blog-with-links',
    component: ComponentCreator('/blog-only/blog-with-links', 'b8a'),
    exact: true
  },
  {
    path: '/blog-only/date-matter',
    component: ComponentCreator('/blog-only/date-matter', 'e95'),
    exact: true
  },
  {
    path: '/blog-only/heading-as-title',
    component: ComponentCreator('/blog-only/heading-as-title', '01d'),
    exact: true
  },
  {
    path: '/blog-only/hey/my super path/héllô',
    component: ComponentCreator('/blog-only/hey/my super path/héllô', '71d'),
    exact: true
  },
  {
    path: '/blog-only/mdx-blog-post',
    component: ComponentCreator('/blog-only/mdx-blog-post', '72e'),
    exact: true
  },
  {
    path: '/blog-only/mdx-require-blog-post',
    component: ComponentCreator('/blog-only/mdx-require-blog-post', 'd01'),
    exact: true
  },
  {
    path: '/blog-only/page/2',
    component: ComponentCreator('/blog-only/page/2', '0a4'),
    exact: true
  },
  {
    path: '/blog-only/page/3',
    component: ComponentCreator('/blog-only/page/3', '070'),
    exact: true
  },
  {
    path: '/blog-only/search',
    component: ComponentCreator('/blog-only/search', '043'),
    exact: true
  },
  {
    path: '/blog-only/simple/slug',
    component: ComponentCreator('/blog-only/simple/slug', 'ff5'),
    exact: true
  },
  {
    path: '/blog-only/tags',
    component: ComponentCreator('/blog-only/tags', '821'),
    exact: true
  },
  {
    path: '/blog-only/tags/birthday',
    component: ComponentCreator('/blog-only/tags/birthday', '8e4'),
    exact: true
  },
  {
    path: '/blog-only/tags/complex',
    component: ComponentCreator('/blog-only/tags/complex', 'f0f'),
    exact: true
  },
  {
    path: '/blog-only/tags/date',
    component: ComponentCreator('/blog-only/tags/date', 'b36'),
    exact: true
  },
  {
    path: '/blog-only/unlisted',
    component: ComponentCreator('/blog-only/unlisted', '8d8'),
    exact: true
  },
  {
    path: '/blog-only/',
    component: ComponentCreator('/blog-only/', '813'),
    exact: true
  },
  {
    path: '*',
    component: ComponentCreator('*'),
  },
];
