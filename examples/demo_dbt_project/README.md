# Demo dbt Project

This is a fake dbt project fixture for local extension development.

It mirrors the current lineage demo graph:

- `raw.raw_customers` -> `stg_customers`
- `raw.raw_orders` -> `stg_orders`
- `stg_customers` -> `dim_customers`
- `stg_orders` + `dim_customers` + `stg_customers` -> `fct_orders`
- `dim_customers` + `fct_orders` -> `customer_dashboard` exposure

The extension does not parse this project yet. Right now it is a concrete file
fixture that matches the hard-coded lineage demo data and gives the graph
something real to open.
