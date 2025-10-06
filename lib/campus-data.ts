export interface Building {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  rooms: string[];
  description?: string;
}

export interface RoomLocation {
  room: string;
  building: string;
  fullName?: string;
}

// Współrzędne budynków kampusu PK Warszawska 24
export const buildings: Building[] = [
  {
    id: 'W-1',
    name: 'Budynek Wydziału Inżynierii Lądowej / Rektorat',
    shortName: 'W-1',
    lat: 50.0676,
    lng: 19.9183,
    rooms: [],
  },
  {
    id: 'W-2',
    name: 'Budynek Wydziału Inżynierii Środowiska i Energetyki',
    shortName: 'W-2',
    lat: 50.0678,
    lng: 19.9189,
    rooms: [],
  },
  {
    id: 'W-3',
    name: 'Budynek Wydziału Inżynierii Elektrycznej i Komputerowej',
    shortName: 'W-3',
    lat: 50.0682,
    lng: 19.9195,
    rooms: ['12', '303', '9', '10', 'sala seminaryjna'],
    description: 'Katedra Matematyki Stosowanej',
  },
  {
    id: 'W-4',
    name: 'Budynek Biblioteki Politechniki Krakowskiej',
    shortName: 'W-4',
    lat: 50.0680,
    lng: 19.9200,
    rooms: [],
  },
  {
    id: 'W-5',
    name: 'Bar "Łupinko"',
    shortName: 'W-5',
    lat: 50.0675,
    lng: 19.9202,
    rooms: [],
  },
  {
    id: 'W-6',
    name: 'Pawilon Biblioteki - Czytelnia',
    shortName: 'W-6',
    lat: 50.0677,
    lng: 19.9205,
    rooms: [],
  },
  {
    id: 'W-7',
    name: 'Budynek Galerii "GIL"',
    shortName: 'GIL',
    lat: 50.0685,
    lng: 19.9188,
    rooms: ['S-1', 'S-2', 'S-3', 'S-8', '114'],
    description: 'Sale seminaryjne i laboratoria komputerowe',
  },
  {
    id: 'W-8',
    name: 'Budynek Muzeum Politechniki Krakowskiej - "Areszt"',
    shortName: 'W-8',
    lat: 50.0687,
    lng: 19.9195,
    rooms: [],
  },
  {
    id: 'W-9',
    name: 'Budynek dydaktyczno-administracyjny "CUP"',
    shortName: 'CUP',
    lat: 50.0684,
    lng: 19.9200,
    rooms: [],
  },
  {
    id: 'W-10',
    name: 'Budynek Wydziału Architektury',
    shortName: 'W-10',
    lat: 50.0689,
    lng: 19.9185,
    rooms: ['N'],
    description: 'Biuro dziekana, dziekanat, sala seminaryjna N',
  },
  {
    id: 'W-11',
    name: 'Budynek Konferencyjno-Wystawowy "Kotłownia"',
    shortName: 'Kotłownia',
    lat: 50.0690,
    lng: 19.9192,
    rooms: [],
  },
  {
    id: 'W-12',
    name: 'Budynek Wydziału Inżynierii i Technologii Chemicznej',
    shortName: 'W-12',
    lat: 50.0686,
    lng: 19.9178,
    rooms: ['135', '136', '151', 'KI-135a'],
    description: 'Katedra Informatyki, laboratoria komputerowe',
  },
  {
    id: 'W-13',
    name: 'Budynek dydaktyczno-laboratoryjny WIL',
    shortName: 'W-13',
    lat: 50.0683,
    lng: 19.9175,
    rooms: [],
  },
  {
    id: 'W-15',
    name: 'Budynek dydaktyczno-administracyjny "Houston"',
    shortName: 'Houston',
    lat: 50.0681,
    lng: 19.9168,
    rooms: ['131'],
    description: 'Laboratorium komputerowe',
  },
  {
    id: 'W-16',
    name: 'Budynek Trakcji Elektrycznej WIEIK',
    shortName: 'W-16',
    lat: 50.0679,
    lng: 19.9172,
    rooms: [],
  },
  {
    id: 'W-17',
    name: 'Budynek Techniki Wysokich Napięć WIEIK',
    shortName: 'W-17',
    lat: 50.0677,
    lng: 19.9175,
    rooms: [],
  },
  {
    id: 'W-18',
    name: 'Budynek laboratoryjny WIL',
    shortName: 'W-18',
    lat: 50.0675,
    lng: 19.9178,
    rooms: [],
  },
  {
    id: 'W-19',
    name: 'Magazyn Centralny',
    shortName: 'W-19',
    lat: 50.0673,
    lng: 19.9182,
    rooms: [],
  },
  {
    id: 'W-23',
    name: 'Międzywydziałowe Centrum Edukacyjno-Badawcze PK "Działownia"',
    shortName: 'Działownia',
    lat: 50.0688,
    lng: 19.9205,
    rooms: ['1/15'],
    description: 'Sala wykładowa',
  },
  {
    id: 'W-24',
    name: 'Małopolskie Laboratorium Budownictwa Energooszczędnego',
    shortName: 'W-24',
    lat: 50.0691,
    lng: 19.9210,
    rooms: [],
  },
];

// Mapping sal do budynków - rozszerzony o wszystkie możliwe sale
export const roomToBuilding: RoomLocation[] = [
  // W-3
  { room: '12', building: 'W-3', fullName: 'Laboratorium komputerowe 12' },
  { room: '303', building: 'W-3', fullName: 'Laboratorium komputerowe 303' },
  { room: '9', building: 'W-3', fullName: 'Sala ćwiczeniowa 9' },
  { room: '10', building: 'W-3', fullName: 'Sala ćwiczeniowa 10' },

  // W-7 GIL
  { room: 'S-1', building: 'W-7', fullName: 'Sala seminaryjna S-1' },
  { room: 'S-2', building: 'W-7', fullName: 'Sala seminaryjna S-2' },
  { room: 'S-3', building: 'W-7', fullName: 'Sala seminaryjna S-3' },
  { room: 'S-8', building: 'W-7', fullName: 'Laboratorium komputerowe S-8' },
  { room: '114', building: 'W-7', fullName: 'Sala 114' },

  // W-10
  { room: 'N', building: 'W-10', fullName: 'Sala seminaryjna N' },

  // W-12
  { room: '135', building: 'W-12', fullName: 'Laboratorium komputerowe 135' },
  { room: '136', building: 'W-12', fullName: 'Laboratorium komputerowe 136' },
  { room: '151', building: 'W-12', fullName: 'Laboratorium komputerowe 151' },
  { room: 'KI-135a', building: 'W-12', fullName: 'Sala seminaryjna KI-135a' },

  // W-15 Houston
  { room: '131', building: 'W-15', fullName: 'Laboratorium komputerowe 131' },

  // W-23 Działownia
  { room: '1/15', building: 'W-23', fullName: 'Sala wykładowa 1/15' },
];

// Funkcja pomocnicza do znalezienia budynku dla sali
export function findBuildingForRoom(room: string): Building | null {
  const location = roomToBuilding.find(r => r.room === room);
  if (!location) return null;

  return buildings.find(b => b.id === location.building) || null;
}

// Parsowanie sali z tekstu zajęć (np. "sala 151" -> "151")
export function parseRoomFromText(roomText: string | null): string | null {
  if (!roomText) return null;

  // Usuń "sala" i trim
  const cleaned = roomText.replace(/sala\s*/i, '').trim();

  // Szukaj dopasowania w naszych salach
  const match = roomToBuilding.find(r =>
    cleaned.includes(r.room) || r.room.includes(cleaned)
  );

  return match?.room || null;
}

// Funkcja do wyszukiwania sal
export function searchRooms(query: string): RoomLocation[] {
  const q = query.toLowerCase().trim();
  if (!q) return roomToBuilding;

  return roomToBuilding.filter(r =>
    r.room.toLowerCase().includes(q) ||
    r.building.toLowerCase().includes(q) ||
    r.fullName?.toLowerCase().includes(q)
  );
}

// Centralne współrzędne kampusu (do centrowania mapy)
export const campusCenter = {
  lat: 50.0682,
  lng: 19.9187,
};
