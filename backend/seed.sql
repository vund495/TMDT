-- =====================================================================
-- SEED DATA - TMDT Go su Bat Trang (DATABASE LOCAL)
-- Chay: python scripts/run_seed.py  (tu thu muc backend)
-- Idempotent: chay lai nhieu lan khong bi trung du lieu
-- Luu y: cac chuoi du lieu KHONG chua ky tu cham phay
-- =====================================================================

-- ---------- 0. EXTENSION pgcrypto (hash bcrypt trong Postgres) ----------
create extension if not exists pgcrypto;

-- ---------- 1. USERS (tao truc tiep, mat khau hash bang bcrypt) ----------
insert into public.users (id, email, full_name, phone, role, password_hash)
select gen_random_uuid(), v.email, v.full_name, v.phone, v.role,
       crypt(v.password, gen_salt('bf', 10))
from (values
    ('admin.tmdt@example.com',      'Admin123!', N'Nguyễn Văn Quản Lý', '0901000001', 'admin'),
    ('workshop01.tmdt@example.com', 'Xuong123!', N'Trần Văn Gia Long',  '0902000002', 'workshop_owner'),
    ('workshop02.tmdt@example.com', 'Xuong123!', N'Lê Thị Hồng Gốm',    '0903000003', 'workshop_owner'),
    ('khach01.tmdt@example.com',    'Khach123!', N'Phạm Văn Khách',     '0904000004', 'customer'),
    ('khach02.tmdt@example.com',    'Khach123!', N'Hoàng Thị Mai',      '0905000005', 'customer'),
    ('khach03.tmdt@example.com',    'Khach123!', N'Đỗ Quang Huy',       '0906000006', 'customer')
) as v(email, password, full_name, phone, role)
where not exists (
    select 1 from public.users pu where pu.email = v.email
);

-- ---------- 2. WORKSHOPS (2 xuong da duyet) ----------
insert into workshops (id, owner_id, name, description, address, lat, lng, status, rating_avg)
select gen_random_uuid(), pu.id, 'Xưởng Gốm Gia Long',
       N'Xưởng gốm gia truyền 3 đời tại Bát Tràng, chuyên men ngọc celadon và men lam vẽ tay',
       N'Số 12, Làng Gốm Bát Tràng, Gia Lâm, Hà Nội', 20.874900, 105.902600, 'approved', 4.80
from public.users pu
where pu.email = 'workshop01.tmdt@example.com'
  and not exists (select 1 from workshops w where w.name = 'Xưởng Gốm Gia Long');

insert into workshops (id, owner_id, name, description, address, lat, lng, status, rating_avg)
select gen_random_uuid(), pu.id, 'Gốm House Bát Tràng',
       N'Xưởng gốm hiện đại kết hợp không gian trải nghiệm làm gốm cho du khách',
       N'Lô A3, Làng Gốm Bát Tràng, Gia Lâm, Hà Nội', 20.875700, 105.899500, 'approved', 4.60
from public.users pu
where pu.email = 'workshop02.tmdt@example.com'
  and not exists (select 1 from workshops w where w.name = 'Gốm House Bát Tràng');

-- ---------- 3. PRODUCTS (12 san pham, trang thai approved) ----------
insert into products (id, workshop_id, name, description, theme, material, firing_technique,
                      glaze, original_price, sale_price, stock, sold_count, images, status)
select gen_random_uuid(), w.id, p.name, p.description, p.theme, p.material, p.firing_technique,
       p.glaze, p.original_price, p.sale_price, p.stock, p.sold_count,
       '[]'::jsonb, 'approved'
from (values
    ('Xưởng Gốm Gia Long', N'Bộ ấm chén men ngọc cao cấp',
     N'Bộ ấm chén 6 chiếc men ngọc celadon nung lò củi truyền thống',
     N'Truyền thống', N'Đất sét Bát Tràng', N'Nung lò củi 1300 độ', N'Men ngọc celadon',
     1250000, 990000, 40, 12),
    ('Xưởng Gốm Gia Long', N'Lọ hoa men lam vẽ tay',
     N'Lọ hoa hình cổ điển, họa tiết chim công vẽ thủ công bằng men lam',
     N'Hoa văn cung đình', N'Đất sét trắng', N'Nung lò củi', N'Men lam',
     850000, NULL, 25, 8),
    ('Xưởng Gốm Gia Long', N'Đĩa tráng men rạn nghệ thuật',
     N'Đĩa trưng bày đường kính 32cm, men rạn nứt độc đáo không lặp lại',
     N'Nghệ thuật trưng bày', N'Đất sét Bát Tràng', N'Nhị thứ nung', N'Men rạn nâu',
     1450000, 1150000, 15, 5),
    ('Xưởng Gốm Gia Long', N'Tượng Chú Tiến sĩ gốm truyền thống',
     N'Tượng gốm Chú Tiến sĩ cao 45cm, món quà tặng tân gia ý nghĩa',
     N'Tượng phong thủy', N'Đất sét Bát Tràng', N'Nung lò củi', N'Men rạn xanh ngọc',
     1650000, NULL, 10, 3),
    ('Xưởng Gốm Gia Long', N'Bộ hũ đựng gia vị men xanh',
     N'Bộ 3 hũ gốm đựng muối tiêu đường, nắp đậy kín bằng nước',
     N'Gia dụng', N'Đất sét Bát Tràng', N'Nung lò gas', N'Men xanh lam',
     450000, 380000, 60, 22),
    ('Xưởng Gốm Gia Long', N'Lư hương trầm gốm cổ',
     N'Lư hương ba chân kiểu Lê - Nguyễn, dùng thờ cúng và xông trầm',
     N'Thờ cúng', N'Đất sét Bát Tràng', N'Nung lò củi', N'Men nâu da lươn',
     720000, 650000, 30, 9),
    ('Gốm House Bát Tràng', N'Bộ bát đĩa gia đình 5 người',
     N'Bộ bát đĩa 16 chiếc an toàn lò vi sóng, men trắng ngà mờ nhẹ nhàng',
     N'Gia dụng', N'Sành trắng cao cấp', N'Nung lò gas', N'Men trắng ngà',
     1890000, 1590000, 50, 18),
    ('Gốm House Bát Tràng', N'Bộ chén trà thủ công 4 chiếc',
     N'Bộ chén trà nhỏ xíu men kem, phù hợp thưởng trà và quà tặng',
     N'Trà đạo', N'Sành trắng cao cấp', N'Nung lò điện', N'Men kem',
     520000, 460000, 80, 31),
    ('Gốm House Bát Tràng', N'Bình cắm hoa mini men trắng',
     N'Bình mini cao 15cm nhiều dáng, hợp bàn làm việc và kệ sách',
     N'Deco hiện đại', N'Sành trắng cao cấp', N'Nung lò điện', N'Men trắng bóng',
     220000, NULL, 100, 47),
    ('Gốm House Bát Tràng', N'Mô hình lò gốm Bát Tràng lưu niệm',
     N'Mô hình lò bậc thang thu nhỏ, quà lưu niệm đặc trưng làng nghề',
     N'Lưu niệm', N'Đất sét Bát Tràng', N'Nung lò gas', N'Men nâu đất',
     350000, 290000, 70, 26),
    ('Gốm House Bát Tràng', N'Hũ gốm đựng trà men nâu',
     N'Hũ đựng trà 800gr có nắp kín, giữ hương trà tốt',
     N'Gia dụng', N'Đất sét Bát Tràng', N'Nung lò gas', N'Men nâu đá',
     380000, 320000, 55, 14),
    ('Gốm House Bát Tràng', N'Ly gốm tay cầm gỗ bộ 2',
     N'Cặp ly gốm men tro trà kèm tay cầm gỗ tự nhiên, hộp quà xinh xắn',
     N'Quà tặng', N'Sành trắng cao cấp', N'Nung lò điện', N'Men tro trà',
     480000, 420000, 65, 19)
) as p(workshop_name, name, description, theme, material, firing_technique, glaze,
       original_price, sale_price, stock, sold_count)
join workshops w on w.name = p.workshop_name
where not exists (
    select 1 from products x where x.name = p.name and x.workshop_id = w.id
);

-- ---------- 4. PRODUCT PASSPORTS (moi san pham 1 ho so) ----------
insert into product_passports (id, product_id, qr_code, unlocked)
select gen_random_uuid(), pr.id, 'PP-' || upper(left(replace(pr.id::text, '-', ''), 12)), false
from products pr
where not exists (
    select 1 from product_passports pp where pp.product_id = pr.id
);

-- ---------- 5. TOUR SLOTS (cac ngay toi, ca sang va chieu) ----------
insert into tour_slots (id, workshop_id, tour_date, start_time, capacity, slots_left, price_per_guest)
select gen_random_uuid(), w.id, current_date + o.day_offset, o.start_time::time, o.capacity, o.capacity, o.price
from (values
    ('Xưởng Gốm Gia Long',   3, '09:00', 12, 150000),
    ('Xưởng Gốm Gia Long',   5, '14:00', 10, 180000),
    ('Gốm House Bát Tràng',  4, '09:30', 15, 120000),
    ('Gốm House Bát Tràng',  6, '14:30', 12, 160000)
) as o(workshop_name, day_offset, start_time, capacity, price)
join workshops w on w.name = o.workshop_name
where not exists (
    select 1 from tour_slots ts
    where ts.workshop_id = w.id
      and ts.tour_date = current_date + o.day_offset
      and ts.start_time = o.start_time::time
);

-- ---------- 6. VOUCHERS (1 chung toan san + 1 rieng xuong) ----------
insert into vouchers (id, code, workshop_id, discount_percent, max_discount_amount,
                      valid_from, valid_until, usage_limit, used_count, active)
select gen_random_uuid(), 'GIAM10', NULL, 10, 50000, '2026-01-01', '2026-12-31', 100, 0, true
where not exists (select 1 from vouchers v where v.code = 'GIAM10');

insert into vouchers (id, code, workshop_id, discount_percent, max_discount_amount,
                      valid_from, valid_until, usage_limit, used_count, active)
select gen_random_uuid(), 'GIAM15-GIA-LONG',
       (select id from workshops where name = 'Xưởng Gốm Gia Long'),
       15, 75000, '2026-01-01', '2026-12-31', 50, 0, true
where not exists (select 1 from vouchers v where v.code = 'GIAM15-GIA-LONG');
