import { defineConfig } from 'umi';

// GitHub Pages 仓库名（一键部署脚本会用同名仓库）
const REPO = process.env.REPO_NAME || 'enter-export';
const isProd = process.env.NODE_ENV === 'production';

export default defineConfig({
  nodeModulesTransform: {
    type: 'none',
  },
  // hash 路由，GitHub Pages 无需额外 404 回退
  history: { type: 'hash' },
  base: isProd ? `/${REPO}/` : '/',
  publicPath: isProd ? `/${REPO}/` : '/',
  outputPath: 'dist',
  title: '仓库管理系统',
  favicon: false,
  headScripts: [
    {
      src: isProd ? `/${REPO}/config.js` : '/config.js',
    },
  ],
  routes: [
    {
      path: '/user',
      layout: false,
      routes: [
        {
          path: '/user/login',
          component: '@/pages/user/login',
        },
      ],
    },
    {
      path: '/',
      component: '@/layouts/index',
      wrappers: ['@/wrappers/auth'],
      routes: [
        {
          path: '/',
          redirect: '/home',
        },
        {
          path: '/home',
          name: '首页',
          component: '@/pages/home/index',
        },
        {
          path: '/inventory',
          name: '库存管理',
          routes: [
            {
              path: '/inventory/product',
              name: '商品管理',
              component: '@/pages/inventory/product/index',
            },
            {
              path: '/inventory/inbound',
              name: '入库',
              component: '@/pages/inventory/inbound/index',
            },
            {
              path: '/inventory/outbound',
              name: '出库',
              component: '@/pages/inventory/outbound/index',
            },
            {
              path: '/inventory/inbound-order',
              name: '入库单',
              component: '@/pages/inventory/inbound-order/index',
            },
            {
              path: '/inventory/outbound-order',
              name: '出库单',
              component: '@/pages/inventory/outbound-order/index',
            },
            {
              path: '/inventory/check',
              name: '库存盘点',
              component: '@/pages/inventory/check/index',
            },
            {
              path: '/inventory/alert',
              name: '库存预警',
              component: '@/pages/inventory/alert/index',
            },
          ],
        },
        {
          path: '/partner',
          name: '合作伙伴',
          routes: [
            {
              path: '/partner/customer',
              name: '客户管理',
              component: '@/pages/partner/customer/index',
            },
            {
              path: '/partner/customer/:id/orders',
              name: '客户历史订单',
              component: '@/pages/partner/customer/orders',
              hideInMenu: true,
            },
            {
              path: '/partner/supplier',
              name: '供应商管理',
              component: '@/pages/partner/supplier/index',
            },
            {
              path: '/partner/supplier/:id/orders',
              name: '供应商历史订单',
              component: '@/pages/partner/supplier/orders',
              hideInMenu: true,
            },
          ],
        },
        {
          path: '/statistics',
          name: '统计报表',
          component: '@/pages/statistics/index',
        },
        {
          path: '/404',
          component: '@/pages/404',
        },
      ],
    },
  ],
  fastRefresh: {},
});
