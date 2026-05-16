# Настройка Supabase

## 1. Создать проект

1. Зайдите на https://supabase.com → New Project.
2. Запомните пароль БД (он не нужен в приложении, но потеряется навсегда).
3. Дождитесь, пока проект инициализируется (≈ 2 минуты).

## 2. Применить миграцию

1. В Dashboard → **SQL Editor** → New query.
2. Вставьте содержимое [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Run. Должны появиться таблицы `tests`, `results`, `attempts` с включённым RLS.

## 3. Включить аутентификацию

В Dashboard → **Authentication → Providers**:
- **Email**: уже включён по умолчанию. Если не нужно подтверждение почты, в **Authentication → Sign In / Up** снимите галочку «Confirm email».
- **Anonymous Sign-Ins**: ползунок включить (это нужно для студентов).

## 4. Создать аккаунт преподавателя

Самый простой путь — Dashboard → **Authentication → Users → Add user → Create new user**.
- Email: `teacher@example.com` (любой).
- Password: задайте пароль.
- Auto Confirm User: **включить**.

Этот пользователь будет видеться приложению как teacher (т.к. он не анонимный — RLS-политики разрешают ему писать тесты).

> Регистрация преподавателя через UI приложения **отключена** намеренно — иначе любой может стать teacher. Если нужна регистрация — добавьте проверочную ссылку или настройте domain-allowlist в Auth.

## 5. Положить ключи в `.env.local`

В Dashboard → **Project Settings → API**:
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` → `VITE_SUPABASE_ANON_KEY`

Создайте файл `.env.local` в корне проекта (см. `.env.example`):

```
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Перезапустите `npm run dev`.

## Архитектура

| Таблица    | Что хранит                                | Политика                                  |
|------------|-------------------------------------------|-------------------------------------------|
| `tests`    | Тесты с вопросами в `jsonb`               | Читают все авторизованные (включая студентов). Пишут только не-анонимные (преподаватели). |
| `results`  | Завершённые попытки                       | Студент пишет свой (student_id = auth.uid()). Читает только преподаватель. |
| `attempts` | Snapshot текущей попытки (для F5-восстановления) | Только владелец (student_id = auth.uid()). |

Студент при входе вызывает `signInAnonymously()` — получает UID, который привязывается к его попыткам и результатам. Имя студента хранится отдельным полем (`student_name`), т.к. UID не несёт человекочитаемой информации.
