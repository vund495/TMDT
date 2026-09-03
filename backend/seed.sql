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

-- ---------- 7. CART ITEMS (gio hang cua khach hang) ----------
insert into cart_items (id, user_id, product_id, quantity)
select gen_random_uuid(), cu.id, p.id, c.qty
from (values
    ('khach01.tmdt@example.com', 'Xưởng Gốm Gia Long',   'Lư hương trầm gốm cổ',      1),
    ('khach02.tmdt@example.com', 'Gốm House Bát Tràng',  'Ly gốm tay cầm gỗ bộ 2',    2),
    ('khach03.tmdt@example.com', 'Xưởng Gốm Gia Long',   'Lọ hoa men lam vẽ tay',     1),
    ('khach01.tmdt@example.com', 'Gốm House Bát Tràng',  'Bình cắm hoa mini men trắng', 2)
) as c(cust_email, workshop_name, product_name, qty)
join public.users cu on cu.email = c.cust_email
join workshops w on w.name = c.workshop_name
join products p on p.name = c.product_name and p.workshop_id = w.id
where not exists (
    select 1 from cart_items ci where ci.user_id = cu.id and ci.product_id = p.id
);

-- ---------- 8. ORDERS (don hang) ----------
insert into orders (id, code, customer_id, workshop_id, status, subtotal,
                    discount_amount, shipping_fee, total, receiver_name, receiver_phone,
                    shipping_address, anti_shock_packed, created_at)
select gen_random_uuid(), o.code, cu.id, w.id, o.status, o.subtotal,
       o.discount_amount, o.shipping_fee, o.total, o.receiver_name, cu.phone,
       o.shipping_address, o.anti_shock, o.created_at::timestamptz
from (values
    ('OD-GL-01', 'khach01.tmdt@example.com', 'Xưởng Gốm Gia Long',  'completed',  1750000, 0,     25000, 1775000, N'Phạm Văn Khách', N'456 Đường Láng, Đống Đa, Hà Nội',    false, '2026-07-05 09:30:00'),
    ('OD-GL-02', 'khach01.tmdt@example.com', 'Xưởng Gốm Gia Long',  'shipping',   2000000, 0,     30000, 2030000, N'Phạm Văn Khách', N'456 Đường Láng, Đống Đa, Hà Nội',    true,  '2026-07-08 14:20:00'),
    ('OD-GL-03', 'khach02.tmdt@example.com', 'Xưởng Gốm Gia Long',  'returned',   2300000, 0,     25000, 2325000, N'Hoàng Thị Mai',  N'25 Nguyễn Trãi, Thanh Xuân, Hà Nội',  false, '2026-07-12 10:05:00'),
    ('OD-HS-01', 'khach02.tmdt@example.com', 'Gốm House Bát Tràng', 'completed',  2510000, 50000, 25000, 2485000, N'Hoàng Thị Mai',  N'25 Nguyễn Trãi, Thanh Xuân, Hà Nội',  false, '2026-07-15 16:40:00'),
    ('OD-HS-02', 'khach03.tmdt@example.com', 'Gốm House Bát Tràng', 'completed',   980000, 50000, 20000,  950000, N'Đỗ Quang Huy',   N'12 Trần Phú, Ngô Quyền, Hải Phòng',     false, '2026-07-20 11:15:00')
) as o(code, cust_email, workshop_name, status, subtotal, discount_amount, shipping_fee,
       total, receiver_name, shipping_address, anti_shock, created_at)
join public.users cu on cu.email = o.cust_email
join workshops w on w.name = o.workshop_name
where not exists (select 1 from orders od where od.code = o.code);

-- ---------- 9. ORDER ITEMS (chi tiet don hang) ----------
insert into order_items (id, order_id, product_id, product_name, unit_price, quantity)
select gen_random_uuid(), o.id, p.id, p.name, coalesce(p.sale_price, p.original_price), i.qty
from (values
    ('OD-GL-01', 'Xưởng Gốm Gia Long',  'Bộ ấm chén men ngọc cao cấp',      1),
    ('OD-GL-01', 'Xưởng Gốm Gia Long',  'Bộ hũ đựng gia vị men xanh',       2),
    ('OD-GL-02', 'Xưởng Gốm Gia Long',  'Đĩa tráng men rạn nghệ thuật',     1),
    ('OD-GL-02', 'Xưởng Gốm Gia Long',  'Lọ hoa men lam vẽ tay',            1),
    ('OD-GL-03', 'Xưởng Gốm Gia Long',  'Tượng Chú Tiến sĩ gốm truyền thống', 1),
    ('OD-GL-03', 'Xưởng Gốm Gia Long',  'Lư hương trầm gốm cổ',             1),
    ('OD-HS-01', 'Gốm House Bát Tràng', 'Bộ bát đĩa gia đình 5 người',      1),
    ('OD-HS-01', 'Gốm House Bát Tràng', 'Bộ chén trà thủ công 4 chiếc',     2),
    ('OD-HS-02', 'Gốm House Bát Tràng', 'Bình cắm hoa mini men trắng',      3),
    ('OD-HS-02', 'Gốm House Bát Tràng', 'Hũ gốm đựng trà men nâu',          1)
) as i(order_code, workshop_name, product_name, qty)
join orders o on o.code = i.order_code
join workshops w on w.name = i.workshop_name
join products p on p.name = i.product_name and p.workshop_id = w.id
where not exists (
    select 1 from order_items oi where oi.order_id = o.id and oi.product_id = p.id
);

-- ---------- 10. SHIPMENTS (van chuyen) ----------
insert into shipments (id, order_id, carrier, tracking_code, status, failed_delivery_count, is_returned)
select gen_random_uuid(), o.id, s.carrier, s.tracking, s.status, s.failed, s.is_returned
from (values
    ('OD-GL-01', 'GHN',          'GHN800123456', 'delivered', 0, false),
    ('OD-GL-02', 'Viettel Post', 'VT200012345',  'in_transit', 0, false),
    ('OD-GL-03', 'GHN',          'GHN800654321', 'returned',  1, true),
    ('OD-HS-01', 'GHTK',         'GHTK963852741','delivered', 0, false),
    ('OD-HS-02', 'Viettel Post', 'VT400098765',  'delivered', 0, false)
) as s(order_code, carrier, tracking, status, failed, is_returned)
join orders o on o.code = s.order_code
where not exists (select 1 from shipments sh where sh.order_id = o.id);

-- ---------- 11. REVIEWS (danh gia san pham) ----------
insert into reviews (id, product_id, user_id, order_id, rating, content, created_at)
select gen_random_uuid(), p.id, cu.id, o.id, r.rating, r.content, r.created_at::timestamptz
from (values
    ('Xưởng Gốm Gia Long',  'Bộ ấm chén men ngọc cao cấp',  'khach01.tmdt@example.com', 'OD-GL-01', 5,
     N'Ấm chén nung rất đẹp, men ngọc trong trẻo, đóng gói chắc chắn. Tôi rất hài lòng.', '2026-07-15 10:00:00'),
    ('Xưởng Gốm Gia Long',  'Bộ hũ đựng gia vị men xanh',   'khach01.tmdt@example.com', 'OD-GL-01', 4,
     N'Hũ chắc chắn, nắp đậy kín nước. Giá hợp lý.', '2026-07-15 11:30:00'),
    ('Gốm House Bát Tràng', 'Bộ bát đĩa gia đình 5 người',  'khach02.tmdt@example.com', 'OD-HS-01', 5,
     N'Bộ bát đĩa rất xinh, phù hợp gia đình 5 người, giao hàng nhanh.', '2026-07-20 09:00:00'),
    ('Gốm House Bát Tràng', 'Bộ chén trà thủ công 4 chiếc', 'khach02.tmdt@example.com', 'OD-HS-01', 4,
     N'Chén trà nhỏ xinh, men kem nhạt, đóng gói cẩn thận.', '2026-07-20 15:40:00'),
    ('Gốm House Bát Tràng', 'Bình cắm hoa mini men trắng',  'khach03.tmdt@example.com', 'OD-HS-02', 5,
     N'Bình mini đáng yêu, để bàn làm việc rất hợp.', '2026-07-25 08:20:00'),
    ('Gốm House Bát Tràng', 'Hũ gốm đựng trà men nâu',      'khach03.tmdt@example.com', 'OD-HS-02', 4,
     N'Hũ đựng trà giữ hương tốt, màu nâu đá đẹp.', '2026-07-25 14:10:00')
) as r(workshop_name, product_name, cust_email, order_code, rating, content, created_at)
join orders o on o.code = r.order_code
join workshops w on w.name = r.workshop_name
join products p on p.name = r.product_name and p.workshop_id = w.id
join public.users cu on cu.email = r.cust_email
where not exists (
    select 1 from reviews x where x.product_id = p.id and x.user_id = cu.id
);

-- ---------- 12. COMMENTS (binh luan san pham) ----------
insert into comments (id, product_id, user_id, parent_id, content, created_at)
select gen_random_uuid(), p.id, cu.id, NULL, c.content, c.created_at::timestamptz
from (values
    ('Xưởng Gốm Gia Long',  'Bộ ấm chén men ngọc cao cấp', 'khach01.tmdt@example.com',
     N'Men ngọc đẹp quá, nung thủ công rất tỉ mỉ.', '2026-07-06 10:00:00'),
    ('Xưởng Gốm Gia Long',  'Lọ hoa men lam vẽ tay',       'khach02.tmdt@example.com',
     N'Họa tiết chim công vẽ tay rất kỹ, đáng giá.', '2026-07-11 16:00:00'),
    ('Gốm House Bát Tràng', 'Bộ bát đĩa gia đình 5 người', 'khach02.tmdt@example.com',
     N'Bộ này dùng được cho lò vi sóng, rất tiện.', '2026-07-16 13:00:00'),
    ('Gốm House Bát Tràng', 'Ly gốm tay cầm gỗ bộ 2',      'khach03.tmdt@example.com',
     N'Ly có tay cầm gỗ tự nhiên, làm quà tặng rất ý nghĩa.', '2026-07-21 09:30:00')
) as c(workshop_name, product_name, cust_email, content, created_at)
join workshops w on w.name = c.workshop_name
join products p on p.name = c.product_name and p.workshop_id = w.id
join public.users cu on cu.email = c.cust_email
where not exists (
    select 1 from comments x where x.user_id = cu.id and x.content = c.content
);

-- ---------- 13. TOUR BOOKINGS (dat tour lam gom) ----------
insert into tour_bookings (id, slot_id, customer_id, num_guests, total_amount, status, voucher_issued, created_at)
select gen_random_uuid(), ts.id, cu.id, t.num_guests, t.total_amount, t.status, t.voucher_issued, t.created_at::timestamptz
from (values
    ('Xưởng Gốm Gia Long',  '09:00', 'khach01.tmdt@example.com', 2, 300000, 'confirmed',       false, '2026-07-08 08:00:00'),
    ('Gốm House Bát Tràng', '09:30', 'khach02.tmdt@example.com', 3, 360000, 'attended',        true,  '2026-07-10 08:30:00'),
    ('Gốm House Bát Tràng', '14:30', 'khach02.tmdt@example.com', 4, 640000, 'pending_payment', false, '2026-07-25 19:00:00')
) as t(workshop_name, start_time, cust_email, num_guests, total_amount, status, voucher_issued, created_at)
join workshops w on w.name = t.workshop_name
join tour_slots ts on ts.workshop_id = w.id and ts.start_time = t.start_time::time
join public.users cu on cu.email = t.cust_email
where not exists (
    select 1 from tour_bookings tb
    where tb.slot_id = ts.id and tb.customer_id = cu.id
      and tb.created_at = t.created_at::timestamptz
);

-- ---------- 13b. VOUCHER TOUR (phat cho khach da tham du) ----------
insert into vouchers (id, code, workshop_id, discount_percent, max_discount_amount,
                      valid_from, valid_until, usage_limit, used_count, active)
select gen_random_uuid(), 'TOUR-ATTEND1',
       (select id from workshops where name = 'Gốm House Bát Tràng'),
       10, 50000, '2026-07-10', '2026-08-09', 20, 0, true
where not exists (select 1 from vouchers v where v.code = 'TOUR-ATTEND1');

update vouchers set used_count = 1 where code = 'GIAM10' and used_count = 0;
update vouchers set used_count = 1 where code = 'TOUR-ATTEND1' and used_count = 0;

-- ---------- 14. PAYMENTS (thanh toan don hang va tour) ----------
insert into payments (id, ref_type, ref_id, tour_booking_id, provider, amount, status,
                      transaction_ref, paid_at, created_at)
select gen_random_uuid(), 'order', o.id, NULL, 'vietqr', o.total, 'paid',
       'TXNORD-' || upper(left(replace(o.id::text, '-', ''), 10)), o.created_at, o.created_at
from orders o
where o.code in ('OD-GL-01', 'OD-GL-02', 'OD-GL-03', 'OD-HS-01', 'OD-HS-02')
  and not exists (
      select 1 from payments p where p.ref_type = 'order' and p.ref_id = o.id
  );

insert into payments (id, ref_type, ref_id, tour_booking_id, provider, amount, status,
                      transaction_ref, paid_at, created_at)
select gen_random_uuid(), 'tour', NULL, tb.id, 'vietqr', tb.total_amount, 'paid',
       'TXNTUR-' || upper(left(replace(tb.id::text, '-', ''), 10)), tb.created_at, tb.created_at
from tour_bookings tb
where tb.status in ('confirmed', 'attended')
  and not exists (
      select 1 from payments p where p.ref_type = 'tour' and p.tour_booking_id = tb.id
  );

insert into payments (id, ref_type, ref_id, tour_booking_id, provider, amount, status,
                      transaction_ref, paid_at, created_at)
select gen_random_uuid(), 'refund', o.id, NULL, 'manual', o.total, 'paid',
       'RFND-' || upper(left(replace(o.id::text, '-', ''), 10)),
       o.created_at + interval '4 days', o.created_at + interval '4 days'
from orders o
where o.code = 'OD-GL-03'
  and not exists (
      select 1 from payments p where p.ref_type = 'refund' and p.ref_id = o.id
  );

-- ---------- 15. DISPUTES (khieu nai don hang) ----------
insert into disputes (id, order_id, customer_id, reason, evidence_urls, status,
                      resolution, admin_note, resolved_at, created_at)
select gen_random_uuid(), o.id, cu.id, d.reason, d.evidence::jsonb, d.status,
       d.resolution, d.admin_note, d.resolved_at::timestamptz, d.created_at::timestamptz
from (values
    ('OD-GL-03', 'khach02.tmdt@example.com',
     N'Tượng Chú Tiến sĩ bị sứt mẻ ở phần chân khi nhận hàng, tôi yêu cầu hoàn tiền.',
     '["https://storage.example.com/evidence/od-gl-03-1.jpg","https://storage.example.com/evidence/od-gl-03-2.jpg"]',
     'resolved', 'refunded',
     N'Đã xác nhận hàng bị lỗi trong quá trình vận chuyển, hoàn tiền toàn bộ cho khách.',
     '2026-07-16 09:00:00', '2026-07-12 11:30:00')
) as d(order_code, cust_email, reason, evidence, status, resolution, admin_note, resolved_at, created_at)
join orders o on o.code = d.order_code
join public.users cu on cu.email = d.cust_email
where not exists (
    select 1 from disputes x where x.order_id = o.id
);

-- ---------- 16. REVENUE RECORDS (doanh thu cho xuong) ----------
insert into revenue_records (id, period, workshop_id, gross_amount, commission_amount, payout_amount, generated_at)
select gen_random_uuid(), r.period, w.id, r.gross, r.commission, r.payout, '2026-08-01 00:00:00'::timestamptz
from (values
    ('2026-07', 'Xưởng Gốm Gia Long',  6130000, 613000, 5517000),
    ('2026-07', 'Gốm House Bát Tràng', 3435000, 343500, 3091500),
    ('2026-08', 'Xưởng Gốm Gia Long',  2000000, 200000, 1800000),
    ('2026-08', 'Gốm House Bát Tràng', 1500000, 150000, 1350000)
) as r(period, workshop_name, gross, commission, payout)
join workshops w on w.name = r.workshop_name
where not exists (
    select 1 from revenue_records rr where rr.period = r.period and rr.workshop_id = w.id
);

-- ---------- 17. CONTACT MESSAGES (phan hoi tu khach) ----------
insert into contact_messages (id, name, email, subject, message, status, reply_note, created_at)
select gen_random_uuid(), cm.name, cm.email, cm.subject, cm.message, cm.status, cm.reply_note, cm.created_at::timestamptz
from (values
    (N'Phạm Văn Khách', 'khach01.tmdt@example.com', N'Hỏi về chính sách đổi trả',
     N'Tôi muốn biết thời hạn đổi trả sản phẩm gốm khi giao hàng là bao lâu?',
     'replied', N'Cảm ơn anh, thời hạn đổi trả là 7 ngày kể từ khi nhận hàng.', '2026-07-02 09:00:00'),
    (N'Hoàng Thị Mai', 'khach02.tmdt@example.com', N'Đặt tour cho đoàn',
     N'Cho tôi hỏi nhóm 25 người có thể đặt tour làm gốm vào cuối tuần được không?',
     'new', NULL, '2026-07-14 14:30:00'),
    (N'Đỗ Quang Huy', 'khach03.tmdt@example.com', N'Góp ý về đóng gói',
     N'Hy vọng xuống nâng cấp đóng gói chống sốc cho các sản phẩm dễ vỡ.',
     'new', NULL, '2026-07-22 10:15:00')
) as cm(name, email, subject, message, status, reply_note, created_at)
where not exists (
    select 1 from contact_messages m where m.email = cm.email and m.message = cm.message
);
