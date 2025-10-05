# 📚 Portal Planu Zajęć PK

Aplikacja webowa do automatycznego pobierania, parsowania i wyświetlania planu zajęć dla studentów Politechniki Krakowskiej z integracją Microsoft SSO i systemem powiadomień.

## ✨ Funkcje

### 🔐 Autentykacja
- **Microsoft Azure AD SSO** - logowanie kontem uczelnianym
- **Sesje bazodanowe** - bezpieczne zarządzanie sesjami
- **Protected routes** - chronione endpointy

### 📅 Plan Zajęć
- **Automatyczne pobieranie** - scraping ze strony PK
- **Uniwersalny parser** - parsuje WSZYSTKIE kierunki/lata/grupy z Excel
- **Inteligentne rozpoznawanie** - wykład/lab/projekt, prowadzący, sala
- **Baza danych** - PostgreSQL/SQLite z Prisma ORM

### 🔔 Powiadomienia
- **In-app notifications** - powiadomienia w aplikacji
- **Email alerts** - powiadomienia email (Resend)
- **User subscriptions** - subskrypcja konkretnych grup/przedmiotów
- **Web Push** - (opcjonalnie)

### ⏰ Backend Scheduler
- **Vercel Cron** - automatyczne sprawdzanie co 1h
- **Hash verification** - MD5 do detekcji zmian
- **Auto-notify** - powiadamianie użytkowników o zmianach

### 🎨 UI/UX
- **Multi-level Filters** - kierunek → rok → semestr → grupa
- **Calendar View** - react-big-calendar z kolorowaniem
- **Weekend Schedule** - lista zjazdów weekendowych
- **Statistics** - podsumowania i statystyki
- **Responsive** - mobile-first design (Tailwind CSS)

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** SQLite (dev) / PostgreSQL (prod)
- **Auth:** NextAuth.js + Azure AD
- **Notifications:** Resend (email)
- **State:** Zustand
- **Calendar:** react-big-calendar
- **Scraping:** axios + cheerio
- **Excel:** xlsx

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Configure environment variables (see SETUP.md)
cp .env.example .env

# Run development server
npm run dev
```

Otwórz [http://localhost:3000](http://localhost:3000)

## 📖 Dokumentacja

- [SETUP.md](./SETUP.md) - Szczegółowa instrukcja konfiguracji
- [Prisma Studio](http://localhost:5555) - GUI bazy danych (po `npx prisma studio`)

## 🔑 Konfiguracja

### Wymagane zmienne (.env):

```bash
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..." # openssl rand -base64 32
AZURE_AD_CLIENT_ID="..."
AZURE_AD_CLIENT_SECRET="..."
AZURE_AD_TENANT_ID="..."
RESEND_API_KEY="..."
EMAIL_FROM="noreply@yourdomain.com"
CRON_SECRET="..." # openssl rand -base64 32
```

Zobacz [SETUP.md](./SETUP.md) dla szczegółów konfiguracji Azure AD.

## 📊 Architektura

### Database Schema:

```
User
├── Account (OAuth)
├── Session
├── UserSubscription (filtry subskrypcji)
└── Notification (powiadomienia)

Schedule
├── ScheduleSection (kierunek, rok, semestr)
└── ScheduleEntry (pojedyncze zajęcia)
```

### API Routes:

```
/api/auth/[...nextauth]        # NextAuth endpoints
/api/schedule/fetch             # Pobieranie planu (z DB)
/api/schedule/check             # Sprawdzanie aktualizacji
/api/cron/fetch-schedule        # Cron job (co 1h)
```

### Frontend Flow:

1. User loguje się przez Microsoft SSO
2. Frontend ładuje plan z `/api/schedule/fetch` (z DB)
3. User ustawia subskrypcje (grupy do obserwowania)
4. Cron job sprawdza zmiany co 1h
5. Jeśli zmiana → tworzy powiadomienia dla subskrybentów
6. User otrzymuje email + in-app notification

## 🎯 Use Cases

### Student:
1. Loguje się kontem Microsoft
2. Wybiera swoją grupę (np. Informatyka II st., DS1)
3. Widzi kalendarz zajęć
4. Subskrybuje powiadomienia o zmianach
5. Dostaje email gdy plan się zmieni

### System:
1. Co godzinę cron job pobiera plik Excel z PK
2. Oblicza MD5 hash
3. Jeśli hash się zmienił → parsuje i zapisuje do DB
4. Tworzy powiadomienia dla użytkowników
5. Wysyła emaile do subskrybentów

## 🧪 Development

```bash
# Watch mode
npm run dev

# Build
npm run build

# Start production
npm start

# Database GUI
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Seed database (optional)
npx prisma db seed
```

## 📦 Deployment

### Vercel (Recommended):

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy!

Cron job automatycznie skonfigurowany w `vercel.json`.

### Railway / Render:

1. Zmień DATABASE_URL na PostgreSQL
2. Dodaj zmienne środowiskowe
3. Dodaj build command: `npx prisma generate && npm run build`
4. Deploy!

## 🔒 Security

- ✅ Microsoft SSO (Azure AD)
- ✅ Database sessions
- ✅ CSRF protection (NextAuth)
- ✅ Cron job authorization
- ✅ Environment variables
- ✅ SQL injection prevention (Prisma)

## 📝 License

MIT

## 👥 Contributors

Developed for students of Politechnika Krakowska.

## 🆘 Support

- [GitHub Issues](https://github.com/yourusername/pk-schedule/issues)
- [Setup Guide](./SETUP.md)
