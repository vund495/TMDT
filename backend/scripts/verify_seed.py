import asyncio
import sys
import pathlib

import asyncpg

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from app.core.config import get_settings


async def main() -> None:
    dsn = get_settings().database_url.replace("postgresql+asyncpg://", "postgresql://")
    conn = await asyncpg.connect(dsn, ssl="prefer")
    try:
        rows = await conn.fetch(
            "select role, email, full_name, left(password_hash, 7) as hash_prefix, "
            "length(password_hash) as hash_len from users order by role, email"
        )
        print("== USERS ==")
        for r in rows:
            print(f"  {r['role']:16} {r['email']:32} hash={r['hash_prefix']}... "
                  f"(len={r['hash_len']})")
        stats = await conn.fetchrow(
            """
            select
                (select count(*) from workshops) as workshops,
                (select count(*) from products) as products,
                (select count(*) from tour_slots) as slots,
                (select count(*) from vouchers) as vouchers
            """
        )
        print(f"== DATA == workshops={stats['workshops']} products={stats['products']} "
              f"slots={stats['slots']} vouchers={stats['vouchers']}")
    finally:
        await conn.close()


asyncio.run(main())
