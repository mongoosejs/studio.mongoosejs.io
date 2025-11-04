---
title: Dashboards
description: Explore what is available in Mongoose Studio's dashboarding framework.
image: /studio-dashboard.png
---

# Dashboard scripting reference

This guide describes the execution environment for dashboard code and the return value conventions that the runtime and UI understand.

## Execution model

In Mongoose Studio, dashboards are written using JavaScript code.
Dashboard code is wrapped in an async IIFE before it is evaluated, so you can freely use `await` and `return` the final value from anywhere in your script.

```js
return await db.collection('orders').countDocuments();
```

At runtime the script executes in a `vm` context that exposes a minimal set of globals:

| Global | Description |
| --- | --- |
| `db` | The Mongoose connection for the current workspace. Use this to call `db.collection()` or `db.model()` inside the dashboard. |
| `ObjectId` | Shortcut to `mongoose.Types.ObjectId`. Useful when constructing aggregation queries or matching by `_id`. |
| `setTimeout` | The standard Node.js `setTimeout` helper. |

These are the only guaranteed values injected into the sandbox. Anything else must be defined within your script. The implementation lives in [`backend/db/dashboardSchema.js`](../backend/db/dashboardSchema.js).

## Return shapes understood by the UI

Dashboards may return any JSON-serializable value. The renderer inspects the shape of the result (and any nested values) to pick an appropriate component. Arrays are rendered element-by-element, so you can mix and match multiple widgets by returning an array of values.

### Primitive values

* **Plain primitives** (`string`, `number`, `boolean`, `null`) render with the primitive card component.
* **Decorated primitives**: wrap your data in `{ $primitive: { value, header? } }` to supply an optional title.

### Charts

Return an object with a `$chart` property that contains a standard Chart.js configuration object. You can optionally include a `header` field on the `$chart` payload to render a title above the canvas. Example:

```js
return {
  $chart: {
    header: 'Orders by day',
    type: 'bar',
    data: { /* ... Chart.js dataset ... */ },
    options: { responsive: true }
  }
};
```

The component instantiates `new Chart(ctx, value.$chart)` on mount, so the payload must be a valid Chart.js config object.

### MongoDB documents

When the script returns `{ $document: mongooseDocument }`, the backend augments the value with schema metadata before sending it to the client. The UI renders the document fields along with type information and an optional `header` property.

### GeoJSON maps

Wrap a GeoJSON FeatureCollection in `{ $featureCollection: featureCollection }` to display it on a Leaflet map. If you already have an object shaped like `{ featureCollection: ... }`, the renderer falls back to the inner `featureCollection` property. A `header` property on the wrapper is also supported.

### Text blocks

Return `{ $text: 'Some preformatted output' }` to show raw text in a monospace block. The component currently only reads the `$text` value; additional metadata is ignored.

### Grids

To compose layouts, return `{ $grid: [ [cell00, cell01], [cell10, cell11] ] }`. Each cell is passed back through the dashboard renderer, so you can nest any of the shapes listed in this document. The renderer calculates the grid width from the longest row.

### Nesting and arrays

All of the shapes above can be nested arbitrarily. For example, you can return a grid whose cells are themselves arrays of chart results. Arrays at any level are rendered sequentially using the same detection logic.

## Error handling

If dashboard execution throws, the backend captures the error message and stores it alongside the failed run. You do not need to return anything special for errors; just throw or let the exception propagate.

## Examples

```js
// Show a primitive metric and a chart side-by-side
return [
  { $primitive: { header: 'Total orders', value: await db.collection('orders').countDocuments() } },
  {
    $chart: {
      header: 'Orders by status',
      type: 'pie',
      data: await buildChartData()
    }
  }
];
```

```js
// Render documents returned by a query
const latestInvoices = await db.model('Invoice').find().sort({ createdAt: -1 }).limit(5);
return latestInvoices.map(invoice => ({
  $document: invoice,
  header: `Invoice ${invoice.number}`
}));
```
