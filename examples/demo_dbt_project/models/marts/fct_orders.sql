with orders as (
    select *
    from {{ ref('stg_orders') }}
),

customers as (
    select *
    from {{ ref('dim_customers') }}
),

staged_customers as (
    select customer_id
    from {{ ref('stg_customers') }}
)

select
    orders.order_id,
    orders.customer_id,
    customers.customer_name,
    orders.order_date,
    orders.status
from orders
left join customers
    on orders.customer_id = customers.customer_id
left join staged_customers
    on orders.customer_id = staged_customers.customer_id
