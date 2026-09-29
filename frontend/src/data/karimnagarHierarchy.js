/**
 * Canonical Karimnagar Administrative Hierarchy
 * Source: Official Karimnagar District Administration & National Informatics Centre (NIC)
 * Reference: https://karimnagar.telangana.gov.in/about-district/administrative-setup/mandals-and-villages/
 * 
 * 16 Official Mandals & 212 Revenue Villages.
 */

export const KARIMNAGAR_ADMIN_HIERARCHY = [
  {
    mandal: "Karimnagar",
    villages: ["Karimnagar", "Mankammathota", "Pothugal", "Hasnapur"]
  },
  {
    mandal: "Kothapally",
    villages: [
      "Malkapur", "Kothapalli(Haveli)", "Laxmipur", "Sitarampur",
      "Rekurthi", "Asifnagar", "Chinthakunta", "Nagulpyloor",
      "Elgandal", "Bopanpalle", "Kothur", "Mallapur"
    ]
  },
  {
    mandal: "Karimnagar Rural",
    villages: [
      "Nagunur", "Jublinagar", "Fakeerpet", "Chamanpalli",
      "Taharakondapur", "Irukulla", "Vallabhapur", "Cherlabuthkur",
      "Chegurthi", "Theegalaguttapalle", "Durshed", "Mokdumpur",
      "Gopalpur", "Bommakal"
    ]
  },
  {
    mandal: "Manakondur",
    villages: [
      "Lingapur", "Veldi", "Vegurupalle", "Utoor", "Pachunur",
      "Manakondur", "Kondapalkala", "Gunjapadugu", "Gangipalle",
      "Eedulagattepalle", "Dhoorpalley", "Devampalle", "Chenjarla",
      "Chandragiri", "Boyinapalle", "Annuaram", "Mutharam", "Vedurugattu"
    ]
  },
  {
    mandal: "Thimmapur",
    villages: [
      "Vachunur", "Thimmapur", "Porandla", "Mannempalle", "Nustulapur",
      "Mogilipalle", "Mallapur", "Marpadaga", "Kothapalle", "Gundlapalle",
      "Renikunta", "Neredupalle", "Parlapalle", "Perlipalle"
    ]
  },
  {
    mandal: "Ganneruvaram",
    villages: [
      "Ganneruvaram", "Paruvella", "Kashimpet", "Madhapur", "Mailaram",
      "Pothugallu", "Jangapalle", "Khanshanpalle", "Gunturpalle",
      "Sangankhanpeta", "Gopalpur", "Yellapur"
    ]
  },
  {
    mandal: "Gangadhara",
    villages: [
      "Venkataipalle", "Ryalapalle", "Kachireddipalle", "Kondaipalle",
      "Burgupalle", "Kurky", "Narayanpur", "Gangadhara", "Garlapalle",
      "Sarvareddipalle", "Islampur", "Rangaraopalle", "Upparamallial",
      "Madhapur", "Achampalle", "Gatlabuthkur", "Sripuram", "Jaggaraopalle", "Kasimpet"
    ]
  },
  {
    mandal: "Ramadugu",
    villages: [
      "Thirmalapur", "Sriramulapalle", "Chippakurthi", "Gundi", "Laxmipur",
      "Deshrajpalli", "Ramadugu", "Rudraram", "Sanigebatla", "Venkatraopalle",
      "Velichala", "Vedira", "Mothe", "Patharlapalle", "Rachapalle",
      "Shanagar", "Gundlapalle", "Kothapalle"
    ]
  },
  {
    mandal: "Choppadandi",
    villages: [
      "Ragampeta", "Chityalpalle", "Arnakonda", "Choppadandi", "Gumlapur",
      "Konapur", "Kollakunta", "Vedurugatte", "Katnapalle", "Rukmapur", "Revellikunta"
    ]
  },
  {
    mandal: "Chigurumamidi",
    villages: [
      "Mudimanikyam", "Ramancha", "Mulkanoor", "Chigurumamidi", "Rekonda",
      "Sundaragiri", "Lambadipalle", "Bommanapalle", "Indurthi", "Ogulapur", "Chinnakkapalle"
    ]
  },
  {
    mandal: "Huzurabad",
    villages: [
      "Singapur", "Sirsapalle", "Pothireddipet", "Chelpur", "Jupaka",
      "Huzurabad", "Bornapalle", "Dharmarajupalle", "Rampur", "Kanakulapalle",
      "Kandugula", "Raipata"
    ]
  },
  {
    mandal: "Veenavanka",
    villages: [
      "Mamidalapalle", "Elbaka", "Bonthupalle", "Challoor", "Ghanmukula",
      "Kothapalle", "Reddykunta", "Veenavanka", "Valabhapur", "Brahmanpalle",
      "Chitrumpalle", "Narasimhulapalle", "Kaniparthi", "Bajjakapalle"
    ]
  },
  {
    mandal: "V. Saidapur",
    villages: [
      "Eklaspur", "Somaram", "Vennampalle", "Ramchandrapur", "Elabotharam",
      "Saidapur", "Akunoor", "Laxmipuram", "Duddanapalle", "Perkapalle",
      "Soorampalle", "Venkepalle", "Jaggaiahpalle", "Kistampalle"
    ]
  },
  {
    mandal: "Jammikunta",
    villages: [
      "Jammikunta", "Korapalli", "Saidabad", "Vilasagar", "Thanugula",
      "Madagula", "Nagampeta", "Abbapuram", "Mutyampeta"
    ]
  },
  {
    mandal: "Ellandakunta",
    villages: [
      "Ellandakunta", "Chinnakomatpalli", "Vanthadupula", "Bujunoor",
      "Rachapalli", "Tekurthi", "Sirsewada", "Mallareddypalli", "Kanagarthi", "Pathipaka"
    ]
  },
  {
    mandal: "Shankarapatnam",
    villages: [
      "Yeradpalle", "Arkandla", "Gaddapaka", "Kalvala", "Kachapur", "Kalleda",
      "Keshavapatnam", "Kothagattu", "Majjigapalle", "Muttaram", "Rachalapalle",
      "Tadikal", "Thiggalapalle", "Vankayapalle", "Eradapalle", "Molangur", "Ambalpur"
    ]
  }
];

/**
 * Returns all official revenue villages for a specific mandal in Karimnagar.
 */
export const getVillagesForMandal = (mandalName) => {
  if (!mandalName) return [];
  const found = KARIMNAGAR_ADMIN_HIERARCHY.find(
    (m) => m.mandal.toLowerCase() === mandalName.trim().toLowerCase()
  );
  return found ? [...found.villages].sort() : [];
};

/**
 * Returns all unique villages in Karimnagar across all 16 mandals.
 */
export const getAllKarimnagarVillages = () => {
  const set = new Set();
  KARIMNAGAR_ADMIN_HIERARCHY.forEach((m) => {
    m.villages.forEach((v) => set.add(v));
  });
  return Array.from(set).sort();
};

/**
 * Finds all mandals where a given village name exists in Karimnagar.
 * Enables strict zero-guessing disambiguation.
 */
export const findMandalsForVillage = (villageName) => {
  if (!villageName) return [];
  const clean = villageName.trim().toLowerCase();
  const matches = [];

  KARIMNAGAR_ADMIN_HIERARCHY.forEach((m) => {
    const matchedVillage = m.villages.find((v) => v.toLowerCase() === clean);
    if (matchedVillage) {
      matches.push({
        state: "Telangana",
        district: "Karimnagar",
        mandal: m.mandal,
        village: matchedVillage
      });
    }
  });

  return matches;
};

/**
 * Intelligent location query resolver.
 * Evaluates whether a search term corresponds to:
 * - A unique village in Karimnagar -> auto-selects State, District, Mandal, Village
 * - An ambiguous village in multiple mandals -> returns disambiguation options
 * - A mandal in Karimnagar -> auto-selects State, District, Mandal
 * - A specific mandi center name -> auto-selects that center's State, District, Mandal, Village
 * - A district / state -> auto-selects District / State
 * - Generic search (commodity, generic term) -> leaves location filters unchanged
 */
export const resolveLocationQuery = (rawQuery, mandisList = []) => {
  if (!rawQuery || typeof rawQuery !== 'string') {
    return { type: 'NONE' };
  }

  const query = rawQuery.trim();
  const qLower = query.toLowerCase();
  if (qLower.length < 2) {
    return { type: 'NONE' };
  }

  // 1. Check exact or high-confidence match with Karimnagar Mandals
  const mandalMatch = KARIMNAGAR_ADMIN_HIERARCHY.find(
    (m) => m.mandal.toLowerCase() === qLower
  );
  if (mandalMatch) {
    return {
      type: 'MANDAL_UNIQUE',
      data: {
        state: 'Telangana',
        district: 'Karimnagar',
        mandal: mandalMatch.mandal
      }
    };
  }

  // 2. Check exact or high-confidence match with Karimnagar Villages
  const villageMatches = findMandalsForVillage(query);
  if (villageMatches.length === 1) {
    return {
      type: 'VILLAGE_UNIQUE',
      data: villageMatches[0]
    };
  }
  if (villageMatches.length > 1) {
    return {
      type: 'VILLAGE_AMBIGUOUS',
      village: villageMatches[0].village,
      options: villageMatches
    };
  }

  // 3. Partial check: If query matches a village name prefix or substring with exact word match
  const partialMatches = [];
  KARIMNAGAR_ADMIN_HIERARCHY.forEach((m) => {
    m.villages.forEach((v) => {
      if (v.toLowerCase() === qLower) {
        partialMatches.push({
          state: 'Telangana',
          district: 'Karimnagar',
          mandal: m.mandal,
          village: v
        });
      }
    });
  });

  if (partialMatches.length === 1) {
    return {
      type: 'VILLAGE_UNIQUE',
      data: partialMatches[0]
    };
  }
  if (partialMatches.length > 1) {
    return {
      type: 'VILLAGE_AMBIGUOUS',
      village: partialMatches[0].village,
      options: partialMatches
    };
  }

  // 4. Check known Mandi Center names from the real active dataset
  if (Array.isArray(mandisList) && mandisList.length > 0) {
    // Exact or near-exact mandi name match
    const exactMandi = mandisList.find(
      (m) => (m.name || '').toLowerCase() === qLower
    );
    if (exactMandi) {
      return {
        type: 'MANDI_UNIQUE',
        data: {
          state: exactMandi.state || '',
          district: exactMandi.district || '',
          mandal: exactMandi.mandal || '',
          village: exactMandi.village || '',
          mandiName: exactMandi.name
        }
      };
    }

    // High confidence mandi name match (mandi name includes full search query and query is specific)
    if (qLower.length >= 6) {
      const candidates = mandisList.filter((m) =>
        (m.name || '').toLowerCase().includes(qLower)
      );
      if (candidates.length === 1) {
        const c = candidates[0];
        return {
          type: 'MANDI_UNIQUE',
          data: {
            state: c.state || '',
            district: c.district || '',
            mandal: c.mandal || '',
            village: c.village || '',
            mandiName: c.name
          }
        };
      }
    }

    // Check district match
    const districtMatch = mandisList.find(
      (m) => (m.district || '').toLowerCase() === qLower
    );
    if (districtMatch) {
      return {
        type: 'DISTRICT_UNIQUE',
        data: {
          state: districtMatch.state,
          district: districtMatch.district
        }
      };
    }

    // Check state match
    const stateMatch = mandisList.find(
      (m) => (m.state || '').toLowerCase() === qLower
    );
    if (stateMatch) {
      return {
        type: 'STATE_UNIQUE',
        data: {
          state: stateMatch.state
        }
      };
    }
  }

  // If no geographic entity was uniquely identified, it is a generic query
  return { type: 'GENERIC' };
};
