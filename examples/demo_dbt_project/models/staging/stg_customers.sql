with source_customers as (
    select
        customer_id,
        first_name,
        last_name,
        email
    from {{ source('raw', 'raw_customers') }}
)

select
    customer_id,
    trim(first_name || ' ' || last_name) as customer_name,
    lower(email) as email
from source_customers
