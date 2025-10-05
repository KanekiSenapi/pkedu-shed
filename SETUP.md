# 🚀 Setup Guide - Portal Planu Zajęć PK

## 📋 Wymagania

- Node.js 18+
- npm/yarn
- Konto Azure AD (Microsoft)
- Konto Resend (email notifications)

## 🗄️ Baza Danych

Projekt używa **SQLite** (dev) lub **PostgreSQL** (production) z Prisma ORM.

### Migracja bazy:
```bash
npx prisma migrate dev
npx prisma generate
```

### Przeglądanie bazy:
```bash
npx prisma studio
```

## 🔐 Microsoft Azure AD Setup

### 1. Utwórz App Registration w Azure Portal

1. Przejdź do [Azure Portal](https://portal.azure.com)
2. Wybierz **Azure Active Directory** → **App registrations** → **New registration**
3. Wypełnij:
   - **Name:** PK Schedule Portal
   - **Supported account types:** Accounts in this organizational directory only
   - **Redirect URI:**
     - Type: Web
     - URL: `http://localhost:3000/api/auth/callback/azure-ad` (dev)
     - URL production: `https://yourdomain.com/api/auth/callback/azure-ad`

### 2. Pobierz dane konfiguracyjne

Po utworzeniu App Registration:
- **Application (client) ID** → skopiuj do `AZURE_AD_CLIENT_ID`
- **Directory (tenant) ID** → skopiuj do `AZURE_AD_TENANT_ID`

### 3. Utwórz Client Secret

1. W App Registration → **Certificates & secrets** → **New client secret**
2. Skopiuj wartość → `AZURE_AD_CLIENT_SECRET`

⚠️ **UWAGA:** Client secret jest widoczny tylko raz!

### 4. Ustaw uprawnienia API

1. **API permissions** → **Add a permission** → **Microsoft Graph**
2. Dodaj delegowane uprawnienia:
   - `User.Read`
   - `email`
   - `profile`
   - `openid`
3. Kliknij **Grant admin consent**

## 📧 Resend Email Setup

1. Zarejestruj się na [resend.com](https://resend.com)
2. Utwórz API Key
3. Dodaj domenę (opcjonalne, dla production)
4. Skopiuj API Key → `RESEND_API_KEY`

## 🔑 Zmienne Środowiskowe (.env)

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite for dev
# DATABASE_URL="postgresql://user:password@localhost:5432/pk_schedule"  # PostgreSQL for prod

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generated-secret-key"  # Generate: openssl rand -base64 32

# Microsoft Azure AD
AZURE_AD_CLIENT_ID="your-client-id"
AZURE_AD_CLIENT_SECRET="your-client-secret"
AZURE_AD_TENANT_ID="your-tenant-id"

# Email
RESEND_API_KEY="re_xxxxx"
EMAIL_FROM="noreply@yourdomain.com"

# Cron Security
CRON_SECRET="your-cron-secret"  # Generate: openssl rand -base64 32
```

## 🏃 Uruchomienie

### Development:
```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

### Production (Vercel):
1. Push do GitHub
2. Import projektu w Vercel
3. Dodaj zmienne środowiskowe w Vercel Dashboard
4. Deploy!

## ⏰ Cron Job

### Lokalne testowanie:
```bash
curl -H "Authorization: Bearer your-cron-secret" http://localhost:3000/api/cron/fetch-schedule
```

### Vercel Cron:
Automatycznie skonfigurowany w `vercel.json`:
- Częstotliwość: co godzinę
- Endpoint: `/api/cron/fetch-schedule`

## 📊 Prisma Studio (Database GUI)

```bash
npx prisma studio
```
Otwórz: http://localhost:5555

## 🧪 Testowanie Auth

1. Uruchom aplikację: `npm run dev`
2. Przejdź do: http://localhost:3000
3. Kliknij "Sign in with Microsoft"
4. Zaloguj się kontem Microsoft (musi być w skonfigurowanym Azure AD)

## 🔄 Migracja z Plików do DB

Jeśli masz już działającą wersję z plikami cache:

```bash
# Usuń stare pliki cache
rm -rf public/cache

# Frontend automatycznie przełączy się na API z DB
```

## 📝 Notatki

- **SQLite** - dobre dla dev/małych deploymentów
- **PostgreSQL** - zalecane dla production (Vercel, Railway, Supabase)
- **Cron Job** - działa tylko na Vercel Pro/Enterprise (lub użyj zewnętrznego schedulera)
- **Email** - Resend ma darmowy tier (100 emaili/dzień)

## 🆘 Troubleshooting

### Błąd: "Prisma Client not generated"
```bash
npx prisma generate
```

### Błąd: "Database does not exist"
```bash
npx prisma migrate dev --name init
```

### Błąd: "NextAuth configuration error"
- Sprawdź czy `NEXTAUTH_SECRET` jest ustawione
- Sprawdź czy Azure AD credentials są poprawne
- Sprawdź redirect URI w Azure Portal

### Błąd: "Cron job unauthorized"
- Sprawdź `CRON_SECRET` w .env i Vercel
- Dodaj header: `Authorization: Bearer your-secret`
