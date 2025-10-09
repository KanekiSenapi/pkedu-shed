# Funkcje Biznesowe - Plan Zajęć PK

## 1. Zarządzanie planem zajęć

### 1.1 Pobieranie i parsowanie

**Opis funkcji:**
System automatycznie pobiera plany zajęć z oficjalnej strony Politechniki Krakowskiej (https://it.pk.edu.pl/studenci/na-studiach/rozklady-zajec/), parsuje pliki Excel i zapisuje dane do bazy Turso.

**Pliki odpowiedzialne:**
- `lib/scraper.ts` - Scraping strony PK i pobieranie plików Excel
- `lib/excel-parser.ts` - Parsowanie plików Excel
- `lib/parsers/v1-basic-parser.ts` - Parser V1 (podstawowy)
- `lib/parsers/v3-db-aware-parser.ts` - Parser V3 (inteligentny, używający bazy danych)
- `lib/parsers/parser-registry.ts` - Rejestr parserów
- `lib/schedule-db.ts` - Zapis do bazy danych
- `lib/schedule-processor.ts` - Przetwarzanie danych planu

**Endpointy API:**
- `GET /api/schedule/fetch?token=XXX&force=true` - Ręczne pobranie i aktualizacja planu (wymaga tokenu admina)

**Funkcjonalności:**
- Automatyczne wykrywanie plików Excel na stronie PK
- Parsowanie struktury Excel (sekcje, grupy, zajęcia)
- Wykrywanie typu zajęć (wykład, laboratorium, projekt, ćwiczenia)
- Rozpoznawanie prowadzących i sal
- Obsługa zajęć zdalnych (ZDALNIE)
- Wykrywanie konfliktów czasowych

### 1.2 Aktualizacja automatyczna (CRON)

**Opis:**
System codziennie (o 2:00 w nocy) automatycznie sprawdza, czy na stronie PK pojawił się nowy plan zajęć. Jeśli wykryje zmiany (porównanie hash MD5 pliku), automatycznie aktualizuje bazę danych.

**Konfiguracja:**
- Plik: `vercel.json` (konfiguracja Vercel Cron)
- Harmonogram: `0 2 * * *` (codziennie o 2:00)
- Wymagane zmienne środowiskowe:
  - `CRON_SECRET` - sekret do autoryzacji wywołań CRON

**Pliki:**
- `app/api/cron/route.ts` - Endpoint CRON
- `lib/schedule-db.ts` - Funkcje `getLatestScheduleHash()`, `saveScheduleToDB()`

**Endpointy:**
- `GET /api/cron` - Wykonanie automatycznej aktualizacji (wywoływane przez Vercel Cron)

**Funkcjonalności:**
- Sprawdzanie hash pliku przed pobraniem (optymalizacja)
- Automatyczne wykrywanie zmian w planie
- Zapisywanie historii zmian (dodane/usunięte/zmodyfikowane zajęcia)
- Tworzenie notyfikacji dla użytkowników o zmianach

### 1.3 Parser Registry (V1, V3)

**Wersje parserów:**

#### V1 Basic Parser
- Prosty parser bazujący na regex i heurystykach
- Nie używa bazy danych
- Mniej dokładny przy wykrywaniu prowadzących i przedmiotów

#### V3 Database-Aware Parser (domyślny)
- Inteligentny parser wykorzystujący bazę danych
- Dokładne dopasowanie prowadzących i przedmiotów na podstawie aliasów
- Obsługa kontekstu (kierunek, stopień, rok, semestr)
- Wykrywanie nieznanych prowadzących i przedmiotów
- Lepsze radzenie sobie ze skomplikowanymi formatami komórek Excel
- Normalizacja polskich znaków (wykład/wyklad)
- Priorytetyzacja typu single-letter (P) nad pełnym słowem kluczowym (Projekt)

**Możliwości wyboru domyślnego:**
- Domyślny parser ustawiony w tabeli `system_config` (klucz: `default_parser_version`, wartość: `3.0`)
- Admin może zmienić domyślny parser przez panel administracyjny
- Wybór parsera zapisany zarówno w localStorage (UI) jak i bazie danych (system/cron)

**Pliki:**
- `lib/parsers/parser-registry.ts` - Rejestr parserów
- `lib/system-config.ts` - Zarządzanie konfiguracją systemu

**Endpointy:**
- `GET /api/admin/parser-default` - Pobranie aktualnego domyślnego parsera
- `POST /api/admin/parser-default` - Zmiana domyślnego parsera
- `POST /api/admin/parser-test` - Testowanie parsera na pliku Excel

---

## 2. System użytkowników

### 2.1 Autentykacja

**Typy logowania:**

#### Email/hasło
- Klasyczne logowanie przez formularz
- Hasła hashowane za pomocą bcrypt (10 rund)
- JWT session strategy

**Pliki odpowiedzialne:**
- `lib/auth.ts` - Konfiguracja NextAuth
- `lib/auth-db.ts` - Operacje na użytkownikach (tworzenie, weryfikacja)
- `app/api/auth/[...nextauth]/route.ts` - Endpoint NextAuth
- `app/api/auth/register/route.ts` - Rejestracja

**Endpointy:**
- `POST /api/auth/register` - Rejestracja nowego użytkownika
- `POST /api/auth/signin` - Logowanie (NextAuth)
- `GET /api/auth/session` - Pobranie sesji

**Funkcjonalności:**
- Walidacja siły hasła
- Sprawdzanie unikalności email
- Logowanie wszystkich prób logowania (tabela `login_logs`)
- Automatyczne zapisywanie User-Agent przy logowaniu

### 2.2 Role użytkowników

**Dostępne role:**
- `user` (zwykły użytkownik) - domyślna rola
- `starosta` (starosta grupy) - dodatkowe uprawnienia do zarządzania grupą
- `admin` (administrator) - pełny dostęp do panelu administracyjnego

**Uprawnienia:**

#### User
- Przeglądanie planu zajęć
- Filtrowanie po kierunku, roku, grupie
- Dodawanie notatek do zajęć
- Śledzenie obecności
- Zarządzanie zadaniami domowymi
- Eksport planu do formatu ICS (kalendarz)
- Zgłaszanie błędów
- Przeglądanie powiadomień

#### Starosta
- Wszystkie uprawnienia `user`
- Możliwość tworzenia powiadomień dla swojego roku/grupy
- Dostęp do statystyk obecności grupy (planowane)

#### Admin
- Wszystkie uprawnienia `user` i `starosta`
- Pełny dostęp do panelu administracyjnego
- Zarządzanie użytkownikami (nadawanie ról)
- Zarządzanie prowadzącymi i przedmiotami
- Wymuszona aktualizacja planu
- Czyszczenie bazy danych
- Przeglądanie zgłoszeń błędów
- Tworzenie globalnych powiadomień
- Testowanie parserów
- Dostęp do statystyk systemowych

---

## 3. Funkcje studenckie

### 3.1 Przeglądanie planu

**Filtry:**
- Kierunek (Informatyka, Elektronika, Telekomunikacja, itp.)
- Stopień (I, II)
- Rok (1-4)
- Semestr (1-8)
- Tryb studiów (stacjonarne, niestacjonarne)
- Grupa (DS1, DS2, 11, 12, itp.)
- Przedmiot (wyszukiwanie tekstowe)

**Eksport:**
- Format ICS (iCalendar) - import do Google Calendar, Outlook, Apple Calendar
- Eksport zawiera wszystkie zajęcia z wybranego filtru

**Funkcjonalności:**
- Inteligentne cache'owanie (localStorage + serwer)
- Automatyczne odświeżanie przy zmianach
- Podgląd zajęć weekendowych
- Kalendarz stacjonarnych dni
- Statystyki zajęć (liczba wykładów, laboratoriów, itp.)

### 3.2 Notatki do zajęć

**Możliwości:**
- Dodawanie notatek do konkretnych zajęć (data + czas + przedmiot)
- Edycja istniejących notatek
- Usuwanie notatek
- Markdown support (planowane)

**Endpointy:**
- `GET /api/notes` - Pobranie wszystkich notatek użytkownika
- `POST /api/notes` - Dodanie/aktualizacja notatki
- `DELETE /api/notes?id=X` - Usunięcie notatki

### 3.3 Obecności

**Śledzenie obecności:**
- Zaznaczanie obecności/nieobecności na zajęciach
- Powiązanie z konkretnym terminem zajęć (data + czas + przedmiot)
- Unikalny constraint (user + data + czas + przedmiot)

**Statystyki:**
- Łączna liczba zajęć
- Liczba obecności
- Liczba nieobecności
- Procent frekwencji
- Łączna liczba godzin
- Liczba godzin obecności
- Statystyki per przedmiot

**Endpointy:**
- `GET /api/attendance` - Pobranie obecności użytkownika
- `POST /api/attendance` - Oznaczenie obecności
- `GET /api/attendance?stats=true` - Pobranie statystyk

**Funkcjonalności:**
- Automatyczna kalkulacja godzin (domyślnie 1.5h na zajęcia)
- Filtrowanie po zakresie dat
- Statystyki globalne i per przedmiot

### 3.4 Zadania domowe

**Lista zadań:**
- Tytuł zadania
- Opis (opcjonalny)
- Data wykonania (due_date)
- Priorytet (low, medium, high)
- Status ukończenia (completed)
- Powiązanie z konkretnym przedmiotem i terminem zajęć

**Endpointy:**
- `GET /api/homework` - Pobranie zadań użytkownika
- `POST /api/homework` - Dodanie nowego zadania
- `PUT /api/homework` - Aktualizacja zadania
- `DELETE /api/homework?id=X` - Usunięcie zadania
- `POST /api/homework/toggle?id=X` - Zmiana statusu ukończenia

**Funkcjonalności:**
- Filtrowanie po statusie (tylko nieukończone)
- Sortowanie po dacie deadline i priorytecie
- Filtrowanie po zakresie dat
- Liczniki zadań (ukończone/nieukończone)

---

## 4. Panel administracyjny

### 4.1 Zarządzanie planem

**Wymuszona aktualizacja:**
- Ręczne pobranie najnowszego planu z PK
- Pomija sprawdzanie hash (zawsze pobiera)
- Dostępne tylko dla admina
- Używa domyślnego parsera z konfiguracji systemowej

**Czyszczenie bazy:**
Dwa tryby:
1. `clear-db` - Usuwa tylko dane planu (schedules, entries, changes)
2. `clear-all` - Usuwa wszystkie dane (łącznie z użytkownikami, notatkami, itp.)

**Endpointy:**
- `POST /api/admin/force-update` - Wymuszona aktualizacja (admin)
- `POST /api/admin/clear-db` - Czyszczenie danych planu (admin)
- `POST /api/admin/clear-all` - Czyszczenie wszystkich danych (admin)

### 4.2 Parser Tester

**Testowanie parserów:**
- Upload pliku Excel
- Wybór parsera (V1 lub V3)
- Wizualizacja wyników parsowania
- Debug info dla każdej komórki Excel
- Podgląd całego arkusza Excel
- Przycisk COPY do kopiowania debug info w formacie JSON

**Wizualizacja Excel:**
- Podgląd pełnej struktury arkusza (bez limitu wierszy/kolumn)
- Kolorowanie komórek według confidence parsowania
- Informacje o merged cells
- Wykryte sekcje i grupy
- Błędy parsowania
- Szczegóły komórki (kliknięcie pokazuje modal z debug info)

**Debug info:**
- Liczba przetworzonych komórek
- Liczba błędów
- Nieznani prowadzący (z liczbą wystąpień i przyciskiem COPY)
- Nieznane przedmioty (z liczbą wystąpień i przyciskiem COPY)
- Czas przetwarzania
- Statystyki parsowania

**Wybór domyślnego parsera:**
- Przycisk "Ustaw domyślny" zapisuje parser jako domyślny
- Wskaźnik ★ przy domyślnym parserze w dropdownie
- Info o parserze systemowym (używany przez cron)
- Zapis do localStorage (UI) i bazy danych (system)

**Endpointy:**
- `POST /api/admin/parser-test` - Testowanie parsera (admin)
- `GET /api/admin/parser-test` - Lista dostępnych parserów

### 4.3 Zarządzanie encjami

#### Prowadzący (instructors)

**Funkcjonalności:**
- Lista wszystkich prowadzących
- Dodawanie nowego prowadzącego
- Edycja prowadzącego (pełna nazwa, aliasy)
- Usuwanie prowadzącego
- Automatyczne linkowanie z przedmiotami po dodaniu
- Fuzzy matching z auto-wygenerowanymi aliasami

**Pola:**
- `full_name` - Pełna nazwa (np. "dr hab. inż. Maciej Jaworski, prof. PK")
- `abbreviations` - Lista aliasów (np. ["M. Jaworski", "Jaworski", "MJ"])

**Endpointy:**
- `GET /api/admin/instructors` - Lista prowadzących
- `POST /api/admin/instructors` - Dodanie prowadzącego
- `PUT /api/admin/instructors` - Aktualizacja prowadzącego
- `DELETE /api/admin/instructors?id=X` - Usunięcie prowadzącego
- `POST /api/admin/instructors/[id]/auto-link` - Auto-link z przedmiotami

#### Przedmioty (subjects)

**Funkcjonalności:**
- Lista przedmiotów z filtrowaniem po kontekście
- Dodawanie nowego przedmiotu
- Edycja przedmiotu (nazwa, aliasy, kontekst)
- Usuwanie przedmiotu
- Przypisywanie prowadzących do przedmiotu
- Multi-select dla grup
- Fuzzy matching z auto-wygenerowanymi aliasami

**Pola:**
- `name` - Pełna nazwa przedmiotu
- `abbreviations` - Lista aliasów/skrótów
- `kierunek` - Kierunek studiów
- `stopien` - Stopień (I lub II)
- `rok` - Rok studiów (1-4)
- `semestr` - Semestr (1-8)
- `tryb` - Tryb studiów (stacjonarne/niestacjonarne)

**Endpointy:**
- `GET /api/admin/subjects?kierunek=X&rok=Y` - Lista przedmiotów (z filtrami)
- `POST /api/admin/subjects` - Dodanie przedmiotu
- `PUT /api/admin/subjects` - Aktualizacja przedmiotu
- `DELETE /api/admin/subjects?id=X` - Usunięcie przedmiotu
- `GET /api/admin/subjects/[id]/instructors` - Lista prowadzących przedmiotu
- `POST /api/admin/subjects/[id]/instructors` - Dodanie prowadzącego do przedmiotu

### 4.4 Zgłoszenia błędów

**Lista zgłoszeń:**
- Wszystkie zgłoszenia uporządkowane po dacie
- Filtrowanie po statusie
- Sortowanie

**Statusy:**
- `open` - Nowe zgłoszenie
- `in_progress` - W trakcie rozpatrywania
- `resolved` - Rozwiązane
- `closed` - Zamknięte

**Notatki admina:**
- Możliwość dodawania notatek do zgłoszenia
- Historia notatek
- Autor notatki (admin)

**Endpointy:**
- `GET /api/admin/bug-reports` - Lista zgłoszeń (admin)
- `PUT /api/admin/bug-reports/[id]` - Aktualizacja statusu (admin)
- `POST /api/admin/bug-reports/[id]/notes` - Dodanie notatki (admin)
- `POST /api/bug-report` - Zgłoszenie błędu (user)

### 4.5 Notyfikacje

**Tworzenie notyfikacji:**
- Tytuł
- Treść (message)
- Typ (info, success, warning, error)
- Targetowanie (opcjonalne)

**Targetowanie:**
- Globalne (wszystkie osoby)
- Per rok (np. tylko 3 rok)
- Per grupy (np. tylko DS1, DS2)
- Kombinacja (rok + grupy)

**Historia:**
- Wszystkie utworzone notyfikacje
- Data utworzenia
- Przycisk DELETE do usuwania notyfikacji
- Lista w panelu admina

**Endpointy:**
- `POST /api/admin/notifications` - Utworzenie notyfikacji (admin)
- `GET /api/notifications` - Pobranie notyfikacji dla użytkownika (user)
- `DELETE /api/admin/notifications?id=X` - Usunięcie notyfikacji (admin)

---

## 5. Baza danych

### 5.1 Tabele główne

**Kluczowe tabele:**

#### schedules
Przechowuje wersje planu zajęć (file_hash, file_name, last_updated)

#### schedule_entries
Pojedyncze zajęcia z pełnym kontekstem (date, time, subject, instructor, room, grupa, kierunek, rok, semestr)

#### schedule_changes
Historia zmian między wersjami (added/removed/modified)

#### users
Użytkownicy systemu (email, password_hash, role, is_admin)

#### instructors
Prowadzący z aliasami (full_name, abbreviations)

#### subjects
Przedmioty z kontekstem (name, abbreviations, kierunek, rok, semestr, tryb)

#### subject_instructors
Relacja many-to-many (przedmioty ↔ prowadzący)

#### notifications
Powiadomienia systemowe (type, title, message, target_rok, target_groups)

#### bug_reports
Zgłoszenia błędów (type, title, description, status)

#### class_notes, class_attendance, class_homework
Funkcje studenckie (notatki, obecności, zadania)

#### system_config
Konfiguracja systemu (default_parser_version)

### 5.2 Indeksy

**Optymalizacje:**
- `idx_entries_date_group` - Szybkie filtrowanie po dacie i grupie
- `idx_entries_filters` - Filtrowanie po kierunku/roku/semestrze
- `idx_subjects_filters` - Szybkie wyszukiwanie przedmiotów
- `idx_attendance_user_date` - Statystyki obecności
- `idx_homework_user_completed` - Lista zadań

### 5.3 Batch Operations

**Optymalizacja zapisu:**
- Użycie `turso.batch()` dla wstawiania wielu rekordów
- 887 wpisów w jednej transakcji (~5s zamiast 2 minut)
- Batch insert dla schedule_entries
- Batch insert dla schedule_changes

---

## 6. Integracje zewnętrzne

### 6.1 Scraping PK

**URL źródłowy:**
```
https://it.pk.edu.pl/studenci/na-studiach/rozklady-zajec/
```

**Format danych:**
- Pliki Excel (.xlsx, .xls)
- Struktura arkusza:
  - Wiersz 5: Stopień studiów (I STOPIEŃ, II STOPIEŃ)
  - Wiersz 6: Nagłówki sekcji (ROK I SEM 1, ROK II SEM 3, itp.)
  - Wiersz 7: Grupy (DS1, DS2, 11, 12, itp.)
  - Wiersz 8+: Dane zajęć

**Technologie:**
- axios - HTTP client
- cheerio - Parsowanie HTML

### 6.2 NextAuth

**Providery:**
- Credentials (email/password) - aktualnie zaimplementowany
- Google OAuth - planowany

**Konfiguracja:**
- Session strategy: JWT
- Callbacks: jwt, session

### 6.3 Turso Database

**Konfiguracja:**
- Client: `@libsql/client`
- Tryb lokalny: `file:./data/local.db` (jeśli brak TURSO_DATABASE_URL)
- Automatyczne migracje schemy

---

## 7. Funkcje pomocnicze

### 7.1 Cache management
- localStorage cache po stronie klienta
- Server-side cache dla API
- Hash-based invalidation

### 7.2 Hash checking
- MD5 hash pliku Excel
- Optymalizacja pobierania (skip jeśli identyczny)
- Wersjonowanie z parser version

### 7.3 Schedule diff/changes
- Automatyczne wykrywanie zmian
- Typy: added/removed/modified
- Historia w bazie danych

### 7.4 Fuzzy matching
- Automatyczne generowanie aliasów (inicjały, skróty)
- Normalizacja (usuwanie kropek, spacji, polskich znaków)
- Matching prowadzących i przedmiotów z confidence score

---

## Podsumowanie techniczne

**Stack technologiczny:**
- Next.js 15 (App Router, React Server Components)
- TypeScript
- Turso Database (LibSQL/SQLite)
- NextAuth (autentykacja)
- Tailwind CSS
- XLSX (parsowanie Excel)

**Architektura:**
- Serverless (Vercel)
- API Routes
- CRON jobs
- Multi-layer cache
- Batch database operations

**Kluczowe optymalizacje:**
- Batch inserts (887 rekordów w ~5s)
- Hash-based caching
- Database indexing
- Parser registry pattern
- Normalizacja i fuzzy matching
