/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'auth.register': {
    methods: ["POST"],
    pattern: '/api/auth/register',
    tokens: [{"old":"/api/auth/register","type":0,"val":"api","end":""},{"old":"/api/auth/register","type":0,"val":"auth","end":""},{"old":"/api/auth/register","type":0,"val":"register","end":""}],
    types: placeholder as Registry['auth.register']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/auth/login',
    tokens: [{"old":"/api/auth/login","type":0,"val":"api","end":""},{"old":"/api/auth/login","type":0,"val":"auth","end":""},{"old":"/api/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/api/auth/logout',
    tokens: [{"old":"/api/auth/logout","type":0,"val":"api","end":""},{"old":"/api/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/me',
    tokens: [{"old":"/api/auth/me","type":0,"val":"api","end":""},{"old":"/api/auth/me","type":0,"val":"auth","end":""},{"old":"/api/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.me']['types'],
  },
  'inventory.create_product': {
    methods: ["POST"],
    pattern: '/api/inventory/products',
    tokens: [{"old":"/api/inventory/products","type":0,"val":"api","end":""},{"old":"/api/inventory/products","type":0,"val":"inventory","end":""},{"old":"/api/inventory/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['inventory.create_product']['types'],
  },
  'inventory.list_products': {
    methods: ["GET","HEAD"],
    pattern: '/api/inventory/products',
    tokens: [{"old":"/api/inventory/products","type":0,"val":"api","end":""},{"old":"/api/inventory/products","type":0,"val":"inventory","end":""},{"old":"/api/inventory/products","type":0,"val":"products","end":""}],
    types: placeholder as Registry['inventory.list_products']['types'],
  },
  'inventory.update_product': {
    methods: ["PUT"],
    pattern: '/api/inventory/products/:id',
    tokens: [{"old":"/api/inventory/products/:id","type":0,"val":"api","end":""},{"old":"/api/inventory/products/:id","type":0,"val":"inventory","end":""},{"old":"/api/inventory/products/:id","type":0,"val":"products","end":""},{"old":"/api/inventory/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['inventory.update_product']['types'],
  },
  'inventory.delete_product': {
    methods: ["DELETE"],
    pattern: '/api/inventory/products/:id',
    tokens: [{"old":"/api/inventory/products/:id","type":0,"val":"api","end":""},{"old":"/api/inventory/products/:id","type":0,"val":"inventory","end":""},{"old":"/api/inventory/products/:id","type":0,"val":"products","end":""},{"old":"/api/inventory/products/:id","type":1,"val":"id","end":""}],
    types: placeholder as Registry['inventory.delete_product']['types'],
  },
  'inventory.create_batch': {
    methods: ["POST"],
    pattern: '/api/inventory/batches',
    tokens: [{"old":"/api/inventory/batches","type":0,"val":"api","end":""},{"old":"/api/inventory/batches","type":0,"val":"inventory","end":""},{"old":"/api/inventory/batches","type":0,"val":"batches","end":""}],
    types: placeholder as Registry['inventory.create_batch']['types'],
  },
  'inventory.create_batches_bulk': {
    methods: ["POST"],
    pattern: '/api/inventory/batches/bulk',
    tokens: [{"old":"/api/inventory/batches/bulk","type":0,"val":"api","end":""},{"old":"/api/inventory/batches/bulk","type":0,"val":"inventory","end":""},{"old":"/api/inventory/batches/bulk","type":0,"val":"batches","end":""},{"old":"/api/inventory/batches/bulk","type":0,"val":"bulk","end":""}],
    types: placeholder as Registry['inventory.create_batches_bulk']['types'],
  },
  'inventory.expiring_batches': {
    methods: ["GET","HEAD"],
    pattern: '/api/inventory/batches/expiring',
    tokens: [{"old":"/api/inventory/batches/expiring","type":0,"val":"api","end":""},{"old":"/api/inventory/batches/expiring","type":0,"val":"inventory","end":""},{"old":"/api/inventory/batches/expiring","type":0,"val":"batches","end":""},{"old":"/api/inventory/batches/expiring","type":0,"val":"expiring","end":""}],
    types: placeholder as Registry['inventory.expiring_batches']['types'],
  },
  'sales.checkout': {
    methods: ["POST"],
    pattern: '/api/sales/checkout',
    tokens: [{"old":"/api/sales/checkout","type":0,"val":"api","end":""},{"old":"/api/sales/checkout","type":0,"val":"sales","end":""},{"old":"/api/sales/checkout","type":0,"val":"checkout","end":""}],
    types: placeholder as Registry['sales.checkout']['types'],
  },
  'dashboard.summary': {
    methods: ["GET","HEAD"],
    pattern: '/api/dashboard/summary',
    tokens: [{"old":"/api/dashboard/summary","type":0,"val":"api","end":""},{"old":"/api/dashboard/summary","type":0,"val":"dashboard","end":""},{"old":"/api/dashboard/summary","type":0,"val":"summary","end":""}],
    types: placeholder as Registry['dashboard.summary']['types'],
  },
  'dashboard.expiring_chart': {
    methods: ["GET","HEAD"],
    pattern: '/api/dashboard/expiring-chart',
    tokens: [{"old":"/api/dashboard/expiring-chart","type":0,"val":"api","end":""},{"old":"/api/dashboard/expiring-chart","type":0,"val":"dashboard","end":""},{"old":"/api/dashboard/expiring-chart","type":0,"val":"expiring-chart","end":""}],
    types: placeholder as Registry['dashboard.expiring_chart']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
