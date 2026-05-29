# Выложить Lovebirds в интернет (для девушки)

Сайт будет по адресу: **`https://ТВОЙ_ЛОГИН.github.io/lovebirds/`**

`localhost` с телефона не открывается — нужен этот шаг.

---

## Шаг 1. Репозиторий на GitHub (5 мин)

1. Зайди на [github.com/new](https://github.com/new)
2. **Repository name:** `lovebirds` (именно так!)
3. **Public**
4. **Create repository** (без README — код уже есть)

---

## Шаг 2. Загрузить код

В терминале Cursor:

```powershell
cd c:\Users\wexaria\Desktop\memory\lovebirds
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/lovebirds.git
git push -u origin main
```

Замени `ТВОЙ_ЛОГИН` на свой логин GitHub.  
При первом push откроется окно входа в GitHub — войди.

> Если `git push` ругается на remote — репозиторий уже создан, просто выполни push.

---

## Шаг 3. Секреты Supabase в GitHub

1. Репозиторий **lovebirds** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret:**
   - Name: `VITE_SUPABASE_URL`  
     Value: из файла `.env` (строка `VITE_SUPABASE_URL=...`)
   - Name: `VITE_SUPABASE_ANON_KEY`  
     Value: из `.env` (строка `VITE_SUPABASE_ANON_KEY=...`)

---

## Шаг 4. Включить GitHub Pages

1. **Settings** → **Pages**
2. **Source:** **GitHub Actions**
3. Вкладка **Actions** → workflow **Deploy to GitHub Pages**
4. Если жёлтый/красный — открой run и посмотри ошибку.  
   Если зелёный — через 2–3 минуты сайт живой.

Адрес: `https://ТВОЙ_ЛОГИН.github.io/lovebirds/`

---

## Шаг 5. Supabase — разрешить новый адрес

1. [supabase.com/dashboard](https://supabase.com/dashboard) → твой проект
2. **Authentication** → **URL Configuration**
3. **Site URL:**  
   `https://ТВОЙ_ЛОГИН.github.io/lovebirds/`
4. **Redirect URLs** — добавь (каждая строка отдельно):
   ```
   https://ТВОЙ_ЛОГИН.github.io/lovebirds/**
   https://ТВОЙ_ЛОГИН.github.io/lovebirds/#/**
   http://localhost:5173/**
   ```
5. **Save**

---

## Как пользоваться вдвоём

### Ты
1. Открой `https://ТВОЙ_ЛОГИН.github.io/lovebirds/`
2. Войди → **Создать пару** → **Копировать** ссылку
3. Отправь ссылку девушке в Telegram / WhatsApp

### Она
1. Открывает ссылку **на телефоне**
2. Регистрируется (свой email)
3. Выбирает дату «вместе с» → **Связаться**

### Оба
Попадаете на дашборд — чат, сердечко, фото и т.д.

---

## Если что-то сломалось

| Проблема | Решение |
|----------|---------|
| Actions красный | Secrets добавлены? Имя репо `lovebirds`? |
| Белый экран | Подожди 3 мин после зелёного Actions |
| Не входит после регистрации | Supabase → выключи **Confirm email** |
| Ссылка join не работает | Проверь Redirect URLs в Supabase (шаг 5) |

---

## Локально vs интернет

| | localhost | GitHub Pages |
|--|-----------|--------------|
| Только твой ПК | ✅ | ❌ |
| Телефон девушки | ❌ | ✅ |
| Ссылка join | не отправить | отправить в мессенджер |
