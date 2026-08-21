-- Seed: existing submissions exported from Replit DB before cutover
-- Run AFTER 0001_init.sql

insert into public.submissions
  (id, created_at, full_name, gender, unit, years_exp, is_senior,
   target_ic_count, skills, preferred_ic_events, helper_events,
   preferred_partners, notes)
values
('0d3e606e-0f06-427f-8824-5e1923cbbf0a', '2026-08-21T10:44:21.007Z', 'fdfasd', '男', 'P6', 4, true, 2, ARRAY['First Aid & Health Safety (急救 / 衛生保健)', 'IT, AI & Web Development (資訊科技 / AI 應用 / 網站開發)', 'Astronomy & Weather Observation (天文 / 氣象觀察)', 'MC, Games & Stage Performance (活動主持 / 團康司儀 / 遊戲帶領)', 'Handicrafts & Badge Crafts (手藝創作 / 徽章製作)']::text[], ARRAY[]::text[], ARRAY['entertainment-badge']::text[], ARRAY['親子活動組']::text[], ''),
('67dd2b9c-38f0-4281-af98-9872da917c30', '2026-08-21T10:06:39.200Z', 'TSC', '女', 'P5', 3, true, 2, ARRAY['Camping & Map/Compass Navigation (戶外露營 / 遠足導航)', 'Media, Photography & Graphic Design (影音製作 / 攝影 / 宣傳設計)', 'Handicrafts & Badge Crafts (手藝創作 / 徽章製作)', 'Environmental & Nature Conservation (環保生態 / 自然觀察)', 'Administration & Secretarial (行政管理 / 檔案文書)']::text[], ARRAY[]::text[], ARRAY[]::text[], ARRAY['行政支援組']::text[], ''),
('9c7459eb-80e5-41cb-84ec-4f73e1819430', '2026-08-21T10:01:42.088Z', 'fsadfsd', '未提供', 'P3', 8, true, 2, ARRAY['戶外技能', '急救照護', '攝影紀錄', '交通接送', '行政文書']::text[], ARRAY[]::text[], ARRAY['craft-badge']::text[], ARRAY['行政支援組', '親子活動組']::text[], ''),
('f2cc4a74-f58b-455e-bbf6-44121b1d87e7', '2026-08-21T09:12:23.386Z', '陳嘉儀', '未提供', 'P5', 6, true, 2, ARRAY['First Aid & Health Safety (急救 / 衛生保健)', 'Camping & Map/Compass Navigation (戶外露營 / 遠足導航)']::text[], ARRAY['autumn-camp', 'winter-hike']::text[], ARRAY['craft-badge']::text[], ARRAY['黃志遠']::text[], '週日下午可協助活動。');
