// Ansprüche der Tierarten in Savanne und Dschungel: für die Expeditionen (planMap in expedition.js) und die kleinen Maps
// hinter den Durchgängen der großen Erkundungs-Maps (sideMaps.js). Ohne Importe, damit es überall verwendbar ist.
// Ansprüche der Tierarten: needs = Merkmal, das die Map haben muss (features in expeditionMaps.js), seasons = bei welchem
// Wetter sie vorkommen (ohne Angabe: bei jedem), units = so viele Fang-Einheiten [min, max] (Herde, Kolonie, Rudel = eine)
export const SPECIES_RULES = {
  savanna: {
    antelope: { units: [1, 2] },
    zebra: { units: [1, 2] },
    giraffe: { units: [1, 2] },
    lion: { units: [1, 2] },
    meerkat: { units: [1, 2] },
    crocodile: { needs: 'water', seasons: ['normal', 'rain'], units: [1, 1] },
    hippo: { needs: 'water', seasons: ['rain'], units: [1, 2] },
    fish: { needs: 'water', seasons: ['rain'], units: [1, 2] }, // Lungenfisch
    heron: { needs: 'water', seasons: ['rain'], units: [1, 2] }, // Schuhschnabel
    warthog: { seasons: ['dry'], units: [1, 2] },
    hyena: { needs: 'graveyard', seasons: ['dry'], units: [1, 1] },
    vulture: { needs: 'graveyard', seasons: ['dry'], units: [1, 2] },
  },
  jungle: {
    jaguar: { units: [1, 1] },
    anteater: { units: [1, 2] },
    howler: { seasons: ['normal', 'fog'], units: [1, 2] },
    snake: { needs: 'thicket', units: [1, 2] },
    tarantula: { needs: 'thicket', units: [1, 2] },
    iguana: { needs: 'waterfall', seasons: ['normal'], units: [1, 2] }, // sonnen sich am Wasserfall
    piranha: { needs: 'river', seasons: ['rain'], units: [1, 2] },
    toucan: { needs: 'river', seasons: ['rain'], units: [1, 2] },
    macaw: { needs: 'river', seasons: ['normal', 'fog'], units: [1, 2] },
    gorilla: { needs: 'clearing', seasons: ['fog'], units: [1, 2] },
    tapir: { needs: 'river', units: [1, 1] }, // grast lange am Ufer, frisst Blätter vom Futterstrauch
    okapi: { needs: 'thicket', seasons: ['normal', 'fog'], units: [1, 1] }, // scheu, im dichten Wald
  },
};
export const BIOME_SEASONS = { savanna: ['normal', 'rain', 'dry'], jungle: ['normal', 'rain', 'fog'] };
