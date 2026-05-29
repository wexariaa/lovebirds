# Как выложить Lovebirds на GitHub Pages (бесплатно)

Я уже настроил автодеплой. **Полностью без твоих действий нельзя** — нужен доступ к твоему GitHub и ключам Supabase. Ниже **5 шагов**, каждый 2–5 минут.

---

## Шаг 1. Supabase (если ещё не сделал)

1. [supabase.com](https://supabase.com) → проект → **SQL Editor** → вставь весь `supabase/schema.sql` → **Run**.
2. **Authentication → Providers → Email** — выключи **Confirm email** (для теста).
3. **Database → Replication** — включи Realtime для таблиц из `supabase/realtime.md`.
4. **Project Settings → API** — скопируй **Project URL** и **anon public key** (понадобятся в шаге 4).

---

## Шаг 2. Установи Git

1. Скачай: [git-scm.com/download/win](https://git-scm.com/download/win) → установи (везде «Далее»).
2. **Перезапусти Cursor** (чтобы Git появился в терминале).

---

## Шаг 3. Загрузи код на GitHub

### Вариант А — через сайт (проще для новичка)

1. [github.com/new](https://github.com/new) → имя репозитория: **`lovebirds`** (важно!) → **Create repository**.
2. На странице репозитория: **Add file → Upload files**.
3. Перетащи **всю папку** `lovebirds` с компьютера  
   (`c:\Users\wexaria\Desktop\memory\lovebirds`), **кроме** папки `node_modules`.
4. **Commit changes**.

### Вариант Б — через терминал

```powershell
cd c:\Users\wexaria\Desktop\memory\lovebirds
git init
git add .
git commit -m "Lovebirds app"
git branch -M main
git remote add origin https://github.com/ТВОЙ_ЛОГИН/lovebirds.git
git push -u origin main
```

Замени `ТВОЙ_ЛОГИН` на свой логин GitHub.

---

## Шаг 4. Секреты и Pages (один раз)

1. Репозиторий на GitHub → **Settings → Secrets and variables → Actions → New repository secret**:
   - `VITE_SUPABASE_URL` = твой Project URL
   - `VITE_SUPABASE_ANON_KEY` = твой anon key

2. **Settings → Pages**:
   - **Source**: **GitHub Actions** (не «Deploy from branch»).

3. **Actions** → workflow **Deploy to GitHub Pages** → если не запустился сам, **Run workflow**.

4. Через 2–3 минуты на **Settings → Pages** появится ссылка вида:  
   `https://ТВОЙ_ЛОГИН.github.io/lovebirds/`

---

## Шаг 5. Supabase — разрешить твой сайт

1. Supabase → **Authentication → URL Configuration**.
2. **Site URL**: `https://ТВОЙ_ЛОГИН.github.io/lovebirds/`
3. **Redirect URLs** — добавь:
   - `https://ТВОЙ_ЛОГИН.github.io/lovebirds/**`
   - `https://ТВОЙ_ЛОГИН.github.io/lovebirds/#/**`

Сохрани.

---

## Готово

Открой в браузере:

**`https://ТВОЙ_ЛОГИН.github.io/lovebirds/#/`**

(обрати внимание на `#` в адресе — так работает GitHub Pages)

Дальше как обычно: регистрация → создать пару → ссылку партнёру.

---

## Что делает автоматика

При каждом `git push` в ветку `main` GitHub сам:
- собирает проект;
- подставляет ключи из Secrets;
- публикует на Pages.

---

## Если репозиторий не `lovebirds`

Имя репозитория должно быть **`lovebirds`**, иначе пути к файлам сломаются.

---

## Что я **не** могу сделать за тебя

| Нужен доступ | Почему |
|--------------|--------|
| Твой GitHub | Загрузить код в **твой** аккаунт |
| Secrets в репозитории | Ключи Supabase только у тебя |
| Supabase URL Configuration | Привязка домена GitHub Pages |

Сейчас на твоём ПК **Git не установлен** — без шага 2 и 3 код на GitHub не попадёт.
