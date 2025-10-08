import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plan Zajęć PK - Kiedy Mam Zajęcia | Rozkład Zajęć Politechnika Krakowska',
  description: 'Portal planu zajęć Politechniki Krakowskiej - sprawdź kiedy mam zajęcia, harmonogram i rozkład zajęć dla wszystkich kierunków. Kalendarz, powiadomienia, mapa kampusu i więcej.',
  alternates: {
    canonical: '/',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image
                src="/images/logo.png"
                alt="Logo Plan Zajęć Politechnika Krakowska"
                width={48}
                height={48}
                className="object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Plan Zajęć</h1>
                <p className="text-sm text-gray-600">Politechnika Krakowska</p>
              </div>
            </div>
            <Link
              href="/login"
              className="px-6 py-2.5 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Zaloguj się
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl font-bold text-gray-900 mb-6">
              Kiedy Mam Zajęcia? Sprawdź Plan Zajęć PK
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Przeglądaj rozkład zajęć i harmonogram dla wszystkich kierunków Politechniki Krakowskiej.
              Kalendarz, powiadomienia o zmianach, mapa kampusu - wszystko w jednym miejscu.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-blue-600 text-white text-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Wejdź jako Gość
              </Link>
              <Link
                href="/login"
                className="px-8 py-4 bg-white text-blue-600 text-lg font-medium border-2 border-blue-600 hover:bg-blue-50 transition-colors"
              >
                Zaloguj się
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Funkcje Portalu Planu Zajęć
            </h2>
            <p className="text-lg text-gray-600">
              Wszystko czego potrzebujesz do zarządzania planem studiów
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 p-8 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Kalendarz i Plan Zajęć
              </h3>
              <p className="text-gray-600">
                Zobacz wszystkie swoje zajęcia w przejrzystym kalendarzu. Filtruj po przedmiotach, grupach i typach zajęć.
                Pełny rozkład zajęć z podziałem na wykłady, laboratoria i projekty.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 p-8 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">🔔</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Powiadomienia o Zmianach
              </h3>
              <p className="text-gray-600">
                Otrzymuj powiadomienia email i w aplikacji o zmianach w harmonogramie zajęć.
                Nigdy więcej nie przegapisz ważnej zmiany w planie studiów.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 p-8 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">📍</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Mapa Kampusu PK
              </h3>
              <p className="text-gray-600">
                Znajdź sale wykładowe na interaktywnej mapie kampusu Politechniki Krakowskiej
                z nawigacją do wybranej sali. Idealne dla studentów pierwszego roku.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-gray-200 p-8 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">✓</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Śledzenie Obecności
              </h3>
              <p className="text-gray-600">
                Zapisuj swoją obecność na zajęciach i sprawdzaj statystyki frekwencji.
                Pełna kontrola nad Twoją obecnością na wykładach i laboratoriach.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-gray-200 p-8 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">📝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Notatki i Zadania
              </h3>
              <p className="text-gray-600">
                Dodawaj notatki do zajęć i twórz listę zadań domowych z terminami i priorytetami.
                Organizuj swoją naukę w jednym miejscu.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-gray-200 p-8 hover:border-blue-500 transition-colors">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                Statystyki i Podsumowania
              </h3>
              <p className="text-gray-600">
                Zobacz podsumowanie godzin zajęć, liczbę wykładów i laboratoriów.
                Planuj swój czas z dokładnymi statystykami harmonogramu studiów.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
              Najczęściej Zadawane Pytania
            </h2>

            <div className="space-y-6">
              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Jak sprawdzić kiedy mam zajęcia na Politechnice Krakowskiej?
                </h3>
                <p className="text-gray-600">
                  Wystarczy wejść na portal Plan Zajęć PK, wybrać swój kierunek studiów, rok i grupę.
                  Zobaczysz pełny rozkład zajęć w kalendarzu z wykładami, laboratoriami i projektami.
                  Możesz również zalogować się, aby zapisać swoje preferencje i otrzymywać powiadomienia o zmianach.
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Jak działa rozkład zajęć w portalu Plan PK?
                </h3>
                <p className="text-gray-600">
                  Portal automatycznie pobiera aktualny plan zajęć z systemu Politechniki Krakowskiej
                  i prezentuje go w przejrzystym kalendarzu. Dane są aktualizowane co godzinę,
                  więc zawsze masz dostęp do najnowszego harmonogramu zajęć.
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Czy mogę otrzymywać powiadomienia o zmianach w planie zajęć?
                </h3>
                <p className="text-gray-600">
                  Tak! Po zalogowaniu możesz subskrybować powiadomienia dla swojej grupy.
                  Gdy plan zajęć się zmieni (odwołane zajęcia, zmiana sali, nowy termin),
                  otrzymasz powiadomienie email oraz w aplikacji. System automatycznie wykrywa wszystkie zmiany.
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Czy portal jest dostępny dla wszystkich kierunków studiów?
                </h3>
                <p className="text-gray-600">
                  Tak, portal obsługuje wszystkie kierunki, lata i grupy na Politechnice Krakowskiej.
                  Możesz przeglądać plan zarówno dla studiów stacjonarnych jak i niestacjonarnych
                  (weekendowych zjazdów). System automatycznie parsuje wszystkie dostępne grupy.
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  Czy portal jest darmowy?
                </h3>
                <p className="text-gray-600">
                  Tak, portal Plan Zajęć PK jest całkowicie darmowy dla wszystkich studentów
                  i pracowników Politechniki Krakowskiej. Nie ma żadnych ukrytych kosztów ani płatnych funkcji.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Zacznij Zarządzać Swoim Planem Zajęć Już Dziś
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Dołącz do tysięcy studentów Politechniki Krakowskiej, którzy używają portalu Plan Zajęć PK
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="px-8 py-4 bg-white text-blue-600 text-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Wejdź jako Gość
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-blue-700 text-white text-lg font-medium hover:bg-blue-800 transition-colors border-2 border-white"
            >
              Zaloguj się / Zarejestruj
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div>
              <h3 className="text-white font-bold mb-4">Plan Zajęć PK</h3>
              <p className="text-sm">
                Portal planu zajęć dla studentów i pracowników Politechniki Krakowskiej.
                Sprawdź kiedy mam zajęcia, harmonogram i rozkład zajęć.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Szybkie Linki</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/dashboard" className="hover:text-white transition-colors">
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Logowanie
                  </Link>
                </li>
                <li>
                  <Link href="/map" className="hover:text-white transition-colors">
                    Mapa Kampusu
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-bold mb-4">Politechnika Krakowska</h3>
              <p className="text-sm">
                ul. Warszawska 24<br />
                31-155 Kraków<br />
                Polska
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
            <p>&copy; 2025 Plan Zajęć PK. Aplikacja stworzona dla studentów Politechniki Krakowskiej.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
