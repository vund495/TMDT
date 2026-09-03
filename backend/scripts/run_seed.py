"""Chay backend/seed.sql vao Postgres.

Dung: python scripts/run_seed.py  (tu thu muc backend)
Yeu cau DATABASE_URL trong .env
"""

import asyncio
import pathlib
import re
import sys

import asyncpg

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))

from app.core.config import get_settings


def split_statements(sql: str) -> list[str]:
    parts = []
    for raw in sql.split(";"):
        text = raw.strip()
        text = "\n".join(
            line for line in text.splitlines() if not line.strip().startswith("--")
        ).strip()
        if text:
            parts.append(text)
    return parts


async def main() -> None:
    dsn = get_settings().database_url.replace("postgresql+asyncpg://", "postgresql://")
    seed_path = pathlib.Path(__file__).resolve().parent.parent / "seed.sql"
    statements = split_statements(seed_path.read_text(encoding="utf-8-sig"))
    print(f"Doc {seed_path.name}: {len(statements)} lenh SQL")

    conn = await asyncpg.connect(dsn, ssl="prefer", statement_cache_size=0)
    try:
        for i, stmt in enumerate(statements, 1):
            result = await conn.execute(stmt)
            print(f"  [{i:02d}] {result}")
        counts = await conn.fetchrow(
            """
            select
                (select count(*) from users)            as users,
                (select count(*) from workshops)        as workshops,
                (select count(*) from products)         as products,
                (select count(*) from product_passports) as passports,
                (select count(*) from tour_slots)       as tour_slots,
                (select count(*) from vouchers)         as vouchers,
                (select count(*) from orders)           as orders,
                (select count(*) from tour_bookings)    as tour_bookings,
                (select count(*) from reviews)          as reviews,
                (select count(*) from disputes)         as disputes,
                (select count(*) from payments)         as payments,
                (select count(*) from contact_messages) as contact_messages
            """
        )
        print("== Tong ket ==")
        print(f"  users={counts['users']} workshops={counts['workshops']} "
              f"products={counts['products']} passports={counts['passports']} "
              f"tour_slots={counts['tour_slots']} vouchers={counts['vouchers']} "
              f"orders={counts['orders']} tour_bookings={counts['tour_bookings']} "
              f"reviews={counts['reviews']} disputes={counts['disputes']} "
              f"payments={counts['payments']} contact_messages={counts['contact_messages']}")
    finally:
        await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
