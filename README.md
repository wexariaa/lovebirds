# Lovebirds

Веб-приложение для пары из двух человек: общий дашборд, realtime через Supabase, фото в Storage.

## Стек

- React 19 + Vite + TypeScript
- Tailwind CSS 4
- Supabase (Auth, Postgres, Realtime, Storage)

## Быстрый старт

### 1. Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. В **SQL Editor** выполните файл `supabase/schema.sql` целиком.
3. **Authentication → Providers**: включите Email, при необходимости отключите подтверждение email для локальной разработки.
4. **Database → Replication**: включите Realtime для таблиц:
   - `heart_pulses`, `chat_messages`, `tic_tac_toe_games`, `savings_goals`
   - `couple_meetings`, `daily_moods`, `compliments`, `album_photos`
   - `couple_members`, `couples`, `activity_ideas`
5. **Storage**: убедитесь, что бакеты `avatars` и `album` созданы (скрипт создаёт их автоматически).

### 2. Фронтенд

```bash
cd lovebirds
npm install
cp .env.example .env
```

Заполните `.env`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Значения: **Project Settings → API**.

```bash
npm run dev
```

Откройте http://localhost:5173

## Сценарий использования

1. **Пользователь A** регистрируется → «Создать пару» → копирует ссылку `/join/:id`.
2. **Пользователь B** регистрируется → переходит по ссылке → выбирает дату «вместе с» → связывается.
3. Оба попадают на **дашборд** с синхронизацией в реальном времени.

## Структура проекта

```
lovebirds/
├── supabase/schema.sql    # БД, RLS, Storage, RPC dissolve_couple
├── src/
│   ├── components/dashboard/  # Виджеты дашборда
│   ├── context/               # Auth + Couple
│   ├── pages/                 # Login, Pair, Join, Dashboard
│   └── lib/                   # Supabase client, утилиты
└── .env.example
```

## Безопасность

- Row Level Security: пользователь видит только строки своей пары (`my_couple_id()`).
- Storage: аватары в папке `{user_id}/`, альбом в `{couple_id}/`.
- Кнопка «Расстались» вызывает `dissolve_couple()` — удаляет общие данные и отвязывает участников.

## Сборка

```bash
npm run build
npm run preview
```

## Опционально: очистка просроченных сообщений чата

В Supabase можно настроить cron (pg_cron) или Edge Function, вызывающую `purge_expired_messages()`.
