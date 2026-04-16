import * as path from "path";

export type DemoColumn = {
  name: string;
  datatype: string;
  description: string;
};

export type DemoTable = {
  table: string;
  label: string;
  url?: string;
  nodeType: string;
  materialization?: string;
  downstreamCount: number;
  upstreamCount: number;
  isExternalProject: boolean;
  tests: {
    key: string;
    path: string;
  }[];
  schema?: string;
};

type DemoNode = {
  label: string;
  nodeType: string;
  materialization?: string;
  description: string;
  columns: DemoColumn[];
  upstream: string[];
  downstream: string[];
  schema?: string;
  filePath: string;
  testsPath?: string;
};

const NODE_DEFINITIONS: Record<string, DemoNode> = {
  "source.jaffle_shop.raw_customers": {
    label: "raw_customers",
    nodeType: "source",
    description: "Raw customer records landed from the application database.",
    columns: [
      {
        name: "customer_id",
        datatype: "integer",
        description: "Stable customer identifier.",
      },
      {
        name: "first_name",
        datatype: "string",
        description: "Customer first name.",
      },
      {
        name: "last_name",
        datatype: "string",
        description: "Customer last name.",
      },
      {
        name: "email",
        datatype: "string",
        description: "Customer email address.",
      },
    ],
    upstream: [],
    downstream: ["model.jaffle_shop.stg_customers"],
    schema: "raw",
    filePath: "models/staging/sources.yml",
    testsPath: "models/staging/sources.yml",
  },
  "source.jaffle_shop.raw_orders": {
    label: "raw_orders",
    nodeType: "source",
    description: "Raw order events captured from the commerce platform.",
    columns: [
      {
        name: "order_id",
        datatype: "integer",
        description: "Stable order identifier.",
      },
      {
        name: "customer_id",
        datatype: "integer",
        description: "Customer identifier from the source system.",
      },
      {
        name: "order_date",
        datatype: "date",
        description: "Date the order was placed.",
      },
      {
        name: "status",
        datatype: "string",
        description: "Order lifecycle status.",
      },
    ],
    upstream: [],
    downstream: ["model.jaffle_shop.stg_orders"],
    schema: "raw",
    filePath: "models/staging/sources.yml",
    testsPath: "models/staging/sources.yml",
  },
  "model.jaffle_shop.stg_customers": {
    label: "stg_customers",
    nodeType: "model",
    materialization: "view",
    description: "Standardized customer staging model.",
    columns: [
      {
        name: "customer_id",
        datatype: "integer",
        description: "Normalized customer identifier.",
      },
      {
        name: "customer_name",
        datatype: "string",
        description: "Display-ready full customer name.",
      },
      {
        name: "email",
        datatype: "string",
        description: "Canonical customer email.",
      },
    ],
    upstream: ["source.jaffle_shop.raw_customers"],
    downstream: [
      "model.jaffle_shop.dim_customers",
      "model.jaffle_shop.fct_orders",
    ],
    filePath: "models/staging/stg_customers.sql",
    testsPath: "models/staging/schema.yml",
  },
  "model.jaffle_shop.stg_orders": {
    label: "stg_orders",
    nodeType: "model",
    materialization: "view",
    description: "Standardized order staging model.",
    columns: [
      {
        name: "order_id",
        datatype: "integer",
        description: "Normalized order identifier.",
      },
      {
        name: "customer_id",
        datatype: "integer",
        description: "Order customer identifier.",
      },
      {
        name: "order_date",
        datatype: "date",
        description: "Canonical order date.",
      },
      {
        name: "status",
        datatype: "string",
        description: "Normalized order status.",
      },
    ],
    upstream: ["source.jaffle_shop.raw_orders"],
    downstream: ["model.jaffle_shop.fct_orders"],
    filePath: "models/staging/stg_orders.sql",
    testsPath: "models/staging/schema.yml",
  },
  "model.jaffle_shop.dim_customers": {
    label: "dim_customers",
    nodeType: "model",
    materialization: "table",
    description: "Customer dimension used by reporting models.",
    columns: [
      {
        name: "customer_id",
        datatype: "integer",
        description: "Business key for customers.",
      },
      {
        name: "customer_name",
        datatype: "string",
        description: "Customer display name.",
      },
      {
        name: "email",
        datatype: "string",
        description: "Customer email address.",
      },
    ],
    upstream: ["model.jaffle_shop.stg_customers"],
    downstream: [
      "model.jaffle_shop.fct_orders",
      "exposure.jaffle_shop.customer_dashboard",
    ],
    filePath: "models/marts/dim_customers.sql",
    testsPath: "models/marts/schema.yml",
  },
  "model.jaffle_shop.fct_orders": {
    label: "fct_orders",
    nodeType: "model",
    materialization: "table",
    description: "Order fact model joined to customer attributes.",
    columns: [
      {
        name: "order_id",
        datatype: "integer",
        description: "Order business key.",
      },
      {
        name: "customer_id",
        datatype: "integer",
        description: "Customer business key.",
      },
      {
        name: "customer_name",
        datatype: "string",
        description: "Resolved customer name for reporting.",
      },
      {
        name: "order_date",
        datatype: "date",
        description: "Order date used for time series reporting.",
      },
      {
        name: "status",
        datatype: "string",
        description: "Final order status.",
      },
    ],
    upstream: [
      "model.jaffle_shop.stg_orders",
      "model.jaffle_shop.dim_customers",
      "model.jaffle_shop.stg_customers",
    ],
    downstream: ["exposure.jaffle_shop.customer_dashboard"],
    filePath: "models/marts/fct_orders.sql",
    testsPath: "models/marts/schema.yml",
  },
  "exposure.jaffle_shop.customer_dashboard": {
    label: "customer_dashboard",
    nodeType: "exposure",
    description: "Business-facing dashboard consuming customer and order marts.",
    columns: [],
    upstream: [
      "model.jaffle_shop.dim_customers",
      "model.jaffle_shop.fct_orders",
    ],
    downstream: [],
    filePath: "models/exposures.yml",
  },
};

const TESTS = (table: string, filePath?: string) => [
  {
    key: `${table}.not_null`,
    path: filePath ?? "",
  },
];

export const ROOT_TABLE = "model.jaffle_shop.fct_orders";

function resolveProjectPath(
  projectRoot: string | undefined,
  relativePath: string | undefined,
) {
  if (!projectRoot || !relativePath) {
    return undefined;
  }

  return path.join(projectRoot, relativePath);
}

function toDemoTable(key: string, projectRoot?: string): DemoTable {
  const node = NODE_DEFINITIONS[key];
  const filePath = resolveProjectPath(projectRoot, node.filePath);
  const testsPath = resolveProjectPath(projectRoot, node.testsPath);
  return {
    table: key,
    label: node.label,
    url: filePath,
    nodeType: node.nodeType,
    materialization: node.materialization,
    downstreamCount: node.downstream.length,
    upstreamCount: node.upstream.length,
    isExternalProject: false,
    tests: TESTS(key, testsPath),
    schema: node.schema,
  };
}

export function getRootLineage(projectRoot?: string) {
  return {
    node: toDemoTable(ROOT_TABLE, projectRoot),
    aiEnabled: false,
  };
}

export function getUpstreamTables(table: string, projectRoot?: string) {
  const node = NODE_DEFINITIONS[table];
  if (!node) {
    return [];
  }
  return node.upstream.map((key) => toDemoTable(key, projectRoot));
}

export function getDownstreamTables(table: string, projectRoot?: string) {
  const node = NODE_DEFINITIONS[table];
  if (!node) {
    return [];
  }
  return node.downstream.map((key) => toDemoTable(key, projectRoot));
}

export function getColumns(table: string) {
  const node = NODE_DEFINITIONS[table];
  if (!node) {
    return undefined;
  }

  return {
    id: table,
    purpose: node.description,
    columns: node.columns.map((column) => ({
      table,
      name: column.name,
      datatype: column.datatype,
      can_lineage_expand: false,
      description: column.description,
    })),
  };
}

export function getExposureDetails(name: string) {
  const node = NODE_DEFINITIONS[name];
  if (!node || node.nodeType !== "exposure") {
    return undefined;
  }

  return {
    name: node.label,
    label: "Customer Dashboard",
    type: "dashboard",
    description: node.description,
    owner: {
      email: "analytics@example.com",
      name: "Analytics Team",
    },
    tags: ["demo"],
    path: "README.md",
    unique_id: name,
  };
}
