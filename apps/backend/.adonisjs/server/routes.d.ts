import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'inventory.create_product': { paramsTuple?: []; params?: {} }
    'inventory.list_products': { paramsTuple?: []; params?: {} }
    'inventory.update_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'inventory.delete_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'inventory.create_batch': { paramsTuple?: []; params?: {} }
    'inventory.create_batches_bulk': { paramsTuple?: []; params?: {} }
    'inventory.expiring_batches': { paramsTuple?: []; params?: {} }
    'sales.checkout': { paramsTuple?: []; params?: {} }
    'dashboard.summary': { paramsTuple?: []; params?: {} }
    'dashboard.expiring_chart': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'inventory.list_products': { paramsTuple?: []; params?: {} }
    'inventory.expiring_batches': { paramsTuple?: []; params?: {} }
    'dashboard.summary': { paramsTuple?: []; params?: {} }
    'dashboard.expiring_chart': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'inventory.list_products': { paramsTuple?: []; params?: {} }
    'inventory.expiring_batches': { paramsTuple?: []; params?: {} }
    'dashboard.summary': { paramsTuple?: []; params?: {} }
    'dashboard.expiring_chart': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'auth.register': { paramsTuple?: []; params?: {} }
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'inventory.create_product': { paramsTuple?: []; params?: {} }
    'inventory.create_batch': { paramsTuple?: []; params?: {} }
    'inventory.create_batches_bulk': { paramsTuple?: []; params?: {} }
    'sales.checkout': { paramsTuple?: []; params?: {} }
  }
  PUT: {
    'inventory.update_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
  DELETE: {
    'inventory.delete_product': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}