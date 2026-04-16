with source_orders as (
    select
        order_id,
        customer_id,
        order_date,
        status
    from {{ source('raw', 'raw_orders') }}
)

select
    order_id,
    customer_id,
    cast(order_date as date) as order_date,
    lower(status) as status
from source_orders
