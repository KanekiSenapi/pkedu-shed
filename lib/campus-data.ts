export interface Building {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  rooms: string[];
  description?: string;
  polygon?: [number, number][];
  entrance?: [number, number];
}

export interface RoomLocation {
  room: string;
  building: string;
  fullName?: string;
}

// Współrzędne budynków kampusu PK Warszawska 24
export const buildings: Building[] = [
  {
    id: 'W-3',
    name: 'Budynek Wydziału Inżynierii Elektrycznej i Komputerowej',
    shortName: 'W-3',
    lat: 50.0710,
    lng: 19.9430,
    rooms: ['12', '303', '9', '10', 'sala seminaryjna'],
    description: 'Katedra Matematyki Stosowanej',
    polygon: [
      [50.07069965245365, 19.942933983182506],
      [50.07082360418434, 19.943009111908466],
      [50.07079261628169, 19.943121804997446],
      [50.07113003903241, 19.943336458500262],
      [50.07114725441521, 19.943234498086426],
      [50.07127464805592, 19.94331499315],
      [50.071343509342434, 19.94311643865987],
      [50.071209229742166, 19.943030577258764],
      [50.071202343598664, 19.943068141621744],
      [50.07108872208845, 19.942993012895784],
      [50.07109560824826, 19.94295008219519],
      [50.07100953117969, 19.94288568614438],
      [50.0709992019211, 19.94293934952008],
      [50.070871807548656, 19.942848121781356],
      [50.070882136834705, 19.942821290093526],
      [50.07074785594255, 19.942735428692377]
    ],
    entrance: [50.071050848191895, 19.94291251783221],
  },
  {
    id: 'W-4',
    name: 'Budynek Biblioteki Politechniki Krakowskiej',
    shortName: 'W-4',
    lat: 50.0709,
    lng: 19.9421,
    rooms: [],
    description: 'Biblioteka',
    polygon: [
      [50.07106806360312, 19.941748022579425],
      [50.07101297426539, 19.941973408757384],
      [50.07103363277446, 19.941989507770103],
      [50.07096132795381, 19.942349052387307],
      [50.07093034014017, 19.94233295337462],
      [50.07088902302416, 19.942547606877437],
      [50.070806388685355, 19.94251540885199],
      [50.07084081967716, 19.942263190986196],
      [50.070806388685355, 19.94225782464862],
      [50.07088557992957, 19.94190901270653],
      [50.07092345395665, 19.941925111719254],
      [50.07096132795381, 19.941672893853465]
    ],
    entrance: [50.071037075858435, 19.941941210731976],
  },
  {
    id: 'W-7',
    name: 'Budynek Galerii "GIL"',
    shortName: 'W-7',
    lat: 50.0726,
    lng: 19.9431,
    rooms: ['S-1', 'S-2', 'S-3', 'S-8', '114'],
    description: 'Sale seminaryjne i laboratoria komputerowe',
    polygon: [
      [50.072317885947875, 19.943556478340646],
      [50.07248659225399, 19.94366380509205],
      [50.07262086827753, 19.94320230006102],
      [50.0726793987342, 19.94299837923336],
      [50.072638083125135, 19.94298764655821],
      [50.07263464015612, 19.94295008219519],
      [50.072579552618, 19.94289105248195],
      [50.0725554518002, 19.94293934952008],
      [50.07249003523366, 19.94288568614438]
    ],
    entrance: [50.072335100904276, 19.94343841891413],
  },
  {
    id: 'W-10',
    name: 'Budynek Wydziału Architektury',
    shortName: 'W-10',
    lat: 50.0720,
    lng: 19.9423,
    rooms: ['N'],
    description: 'Biuro dziekana, dziekanat, sala seminaryjna N',
    polygon: [
      [50.07215606505577, 19.942375884075176],
      [50.072283456016564, 19.942451012801175],
      [50.0722386970689, 19.942644200953694],
      [50.07199768663259, 19.942451012801175],
      [50.07197702853883, 19.94249394350173],
      [50.0718875100297, 19.94244028012603],
      [50.07189783909698, 19.942397349425477],
      [50.07164994086835, 19.942247091973474],
      [50.07169814340206, 19.942048537483384],
      [50.07197702853883, 19.942198794935347],
      [50.07200457266185, 19.94227928999892]
    ],
    entrance: [50.071932269305144, 19.942483210826584],
  },
  {
    id: 'W-12',
    name: 'Budynek Wydziału Inżynierii i Technologii Chemicznej',
    shortName: 'W-12',
    lat: 50.0714,
    lng: 19.9408,
    rooms: ['135', '136', '142', '143', '150', '151', 'KI-135a', 'sala wykładowa KI'],
    description: 'Katedra Informatyki, laboratoria komputerowe',
    polygon: [
      [50.07110938056487, 19.941372378949502],
      [50.07139515524243, 19.941533369076613],
      [50.07164649782837, 19.940358141148717],
      [50.07136072464862, 19.940202517359143]
    ],
    entrance: [50.07129530645224, 19.941490438376057],
  },
  {
    id: 'W-15',
    name: 'Budynek dydaktyczno-administracyjny "Houston"',
    shortName: 'W-15',
    lat: 50.0724,
    lng: 19.9413,
    rooms: ['131'],
    description: 'Laboratorium komputerowe',
    polygon: [
      [50.07226968403712, 19.941528002739037],
      [50.07225591205373, 19.941592398789886],
      [50.07229034200483, 19.941603131465033],
      [50.072252469057254, 19.94176948792972],
      [50.07241428962405, 19.941849982993254],
      [50.072431504545825, 19.941699725541294],
      [50.072465934370854, 19.94170509187887],
      [50.072617425307264, 19.940986002644433],
      [50.072579552618, 19.94096990363171],
      [50.07262431124754, 19.940884042230596],
      [50.072472820332884, 19.940819646179747],
      [50.07245216244382, 19.94096453729417],
      [50.07237985976195, 19.940986002644433],
      [50.072390188723176, 19.941045032357707],
      [50.07241084663895, 19.94105039869528],
      [50.072304113978326, 19.941549468089335]
    ],
    entrance: [50.07226968403712, 19.94156020076448],
  },
  {
    id: 'W-23',
    name: 'Międzywydziałowe Centrum Edukacyjno-Badawcze PK "Działownia"',
    shortName: 'W-23',
    lat: 50.0719,
    lng: 19.9400,
    rooms: ['0/1', '0/19', '1/7', '1/9', '1/15'],
    description: 'Sale wykładowe',
    polygon: [
      [50.07158108002187, 19.940025428219347],
      [50.07214229303973, 19.940266913409992],
      [50.072187052077396, 19.94005225990718],
      [50.07163272566597, 19.939810774716534]
    ],
    entrance: [50.0718806239836, 19.940159586658584],
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
  { room: '142', building: 'W-12', fullName: 'Sala ćwiczeniowa 142' },
  { room: '143', building: 'W-12', fullName: 'Sala ćwiczeniowa 143' },
  { room: '150', building: 'W-12', fullName: 'Sala ćwiczeniowa 150' },
  { room: '151', building: 'W-12', fullName: 'Laboratorium komputerowe 151' },
  { room: 'KI-135a', building: 'W-12', fullName: 'Sala seminaryjna KI-135a' },
  { room: 'sala wykładowa KI', building: 'W-12', fullName: 'Sala wykładowa Katedry Informatyki' },

  // W-15 Houston
  { room: '131', building: 'W-15', fullName: 'Laboratorium komputerowe 131' },

  // W-23 Działownia
  { room: '0/1', building: 'W-23', fullName: 'Sala wykładowa 0/1' },
  { room: '0/19', building: 'W-23', fullName: 'Sala wykładowa 0/19' },
  { room: '1/7', building: 'W-23', fullName: 'Sala wykładowa 1/7' },
  { room: '1/9', building: 'W-23', fullName: 'Sala wykładowa 1/9' },
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
  const cleaned = roomText.replace(/sala\s*/i, '').trim().toLowerCase();

  // Najpierw próbuj dokładnego dopasowania (case-insensitive)
  let match = roomToBuilding.find(r =>
    r.room.toLowerCase() === cleaned
  );

  // Jeśli nie znaleziono, szukaj po częściowym dopasowaniu
  if (!match) {
    match = roomToBuilding.find(r =>
      cleaned.includes(r.room.toLowerCase()) || r.room.toLowerCase().includes(cleaned)
    );
  }

  // Obsługa specjalnych przypadków
  if (!match) {
    // S1 -> S-1, S2 -> S-2, S3 -> S-3
    if (/^s\d+$/i.test(cleaned)) {
      const num = cleaned.substring(1);
      match = roomToBuilding.find(r => r.room.toLowerCase() === `s-${num}`);
    }

    // "114 GIL" -> "114"
    if (cleaned.includes('gil')) {
      const num = cleaned.replace(/[^\d]/g, '');
      if (num) {
        match = roomToBuilding.find(r => r.room === num && r.building === 'W-7');
      }
    }
  }

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
  lat: 50.0719,
  lng: 19.9415,
};
