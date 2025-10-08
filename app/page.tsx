import Link from 'next/link';
import type { Metadata } from 'next';
import { LandingNavbar } from '@/components/landing/LandingNavbar';

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
      <LandingNavbar />

      {/* Hero Content */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Kiedy Mam Zajęcia? Sprawdź Plan Zajęć PK
            </h2>
            <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
              Przeglądaj rozkład zajęć i harmonogram dla wszystkich kierunków Politechniki Krakowskiej.
              Kalendarz, powiadomienia o zmianach, mapa kampusu - wszystko w jednym miejscu.
            </p>

            {/* Pilot Notice */}
            <div className="bg-blue-50 border border-blue-200 px-4 py-3 mb-6 inline-block">
              <p className="text-sm text-blue-800">
                <span className="font-semibold">Program pilotażowy:</span> Obecnie dostępne tylko dla{' '}
                <span className="font-semibold">Wydziału Informatyki i Telekomunikacji</span>
              </p>
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/login?mode=guest"
                className="px-5 py-2.5 bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Wejdź jako Gość
              </Link>
              <Link
                href="/login"
                className="px-5 py-2.5 bg-white text-gray-900 text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                Zaloguj się
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Funkcje Portalu Planu Zajęć
            </h2>
            <p className="text-base text-gray-600">
              Wszystko czego potrzebujesz do zarządzania planem studiów
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 p-6 hover:border-gray-400 transition-colors">
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Kalendarz i Plan Zajęć
              </h3>
              <p className="text-sm text-gray-600">
                Zobacz wszystkie swoje zajęcia w przejrzystym kalendarzu. Filtruj po przedmiotach, grupach i typach zajęć.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 p-6 hover:border-gray-400 transition-colors">
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Powiadomienia o Zmianach
              </h3>
              <p className="text-sm text-gray-600">
                Otrzymuj powiadomienia email i w aplikacji o zmianach w harmonogramie zajęć.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 p-6 hover:border-gray-400 transition-colors">
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Mapa Kampusu PK
              </h3>
              <p className="text-sm text-gray-600">
                Znajdź sale wykładowe na interaktywnej mapie kampusu Politechniki Krakowskiej z nawigacją do wybranej sali.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white border border-gray-200 p-6 hover:border-gray-400 transition-colors">
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Śledzenie Obecności
              </h3>
              <p className="text-sm text-gray-600">
                Zapisuj swoją obecność na zajęciach i sprawdzaj statystyki frekwencji.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white border border-gray-200 p-6 hover:border-gray-400 transition-colors">
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Notatki i Zadania
              </h3>
              <p className="text-sm text-gray-600">
                Dodawaj notatki do zajęć i twórz listę zadań domowych z terminami i priorytetami.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white border border-gray-200 p-6 hover:border-gray-400 transition-colors">
              <div className="w-10 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Statystyki i Podsumowania
              </h3>
              <p className="text-sm text-gray-600">
                Zobacz podsumowanie godzin zajęć, liczbę wykładów i laboratoriów.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Najczęściej Zadawane Pytania
            </h2>

            <div className="space-y-4">
              <div className="bg-white border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Jak sprawdzić kiedy mam zajęcia na Politechnice Krakowskiej?
                </h3>
                <p className="text-sm text-gray-600">
                  Wystarczy wejść na portal Plan Zajęć PK, wybrać swój kierunek studiów, rok i grupę.
                  Zobaczysz pełny rozkład zajęć w kalendarzu z wykładami, laboratoriami i projektami.
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Jak działa rozkład zajęć w portalu Plan PK?
                </h3>
                <p className="text-sm text-gray-600">
                  Portal automatycznie pobiera aktualny plan zajęć z systemu Politechniki Krakowskiej
                  i prezentuje go w przejrzystym kalendarzu. Dane są aktualizowane co godzinę.
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Czy mogę otrzymywać powiadomienia o zmianach w planie zajęć?
                </h3>
                <p className="text-sm text-gray-600">
                  Tak! Po zalogowaniu możesz subskrybować powiadomienia dla swojej grupy.
                  Gdy plan zajęć się zmieni, otrzymasz powiadomienie email oraz w aplikacji.
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Czy portal jest dostępny dla wszystkich kierunków studiów?
                </h3>
                <p className="text-sm text-gray-600">
                  Tak, portal obsługuje wszystkie kierunki, lata i grupy na Politechnice Krakowskiej.
                  Możesz przeglądać plan zarówno dla studiów stacjonarnych jak i niestacjonarnych.
                </p>
              </div>

              <div className="bg-white border border-gray-200 p-5">
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  Czy portal jest darmowy?
                </h3>
                <p className="text-sm text-gray-600">
                  Tak, portal Plan Zajęć PK jest całkowicie darmowy dla wszystkich studentów
                  i pracowników Politechniki Krakowskiej.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Zacznij Zarządzać Swoim Planem Zajęć Już Dziś
          </h2>
          <p className="text-base text-gray-400 mb-6 max-w-2xl mx-auto">
            Dołącz do tysięcy studentów Politechniki Krakowskiej, którzy używają portalu Plan Zajęć PK
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/login?mode=guest"
              className="px-5 py-2.5 bg-white text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Wejdź jako Gość
            </Link>
            <Link
              href="/login"
              className="px-5 py-2.5 bg-gray-800 text-white text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700"
            >
              Zaloguj się / Zarejestruj
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div>
              <h3 className="text-white font-bold mb-3 text-sm">Plan Zajęć PK</h3>
              <p className="text-xs">
                Portal planu zajęć dla studentów i pracowników Politechniki Krakowskiej.
                Sprawdź kiedy mam zajęcia, harmonogram i rozkład zajęć.
              </p>
            </div>
            <div>
              <h3 className="text-white font-bold mb-3 text-sm">Szybkie Linki</h3>
              <ul className="space-y-2 text-xs">
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
              <h3 className="text-white font-bold mb-3 text-sm">Politechnika Krakowska</h3>
              <p className="text-xs">
                ul. Warszawska 24<br />
                31-155 Kraków<br />
                Polska
              </p>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-xs">
            <p>&copy; 2025 Plan Zajęć PK. Aplikacja stworzona dla studentów Politechniki Krakowskiej.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
