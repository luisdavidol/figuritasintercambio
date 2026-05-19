const fs = require('fs');
const path = require('path');

// Team code to country name mapping
const teamMap = {
  'FWC': 'FIFA World Cup',
  'MEX': 'Mexico',
  'RSA': 'Sudafrica',
  'KOR': 'Corea del Sur',
  'CZE': 'Republica Checa',
  'CAN': 'Canada',
  'BIH': 'Bosnia y Herzegovina',
  'QAT': 'Qatar',
  'SUI': 'Suiza',
  'BRA': 'Brasil',
  'MAR': 'Marruecos',
  'HAI': 'Haiti',
  'SCO': 'Escocia',
  'USA': 'Estados Unidos',
  'PAR': 'Paraguay',
  'AUS': 'Australia',
  'TUR': 'Turquia',
  'GER': 'Alemania',
  'CUW': 'Curazao',
  'CIV': 'Costa de Marfil',
  'ECU': 'Ecuador',
  'NED': 'Paises Bajos',
  'JPN': 'Japon',
  'SWE': 'Suecia',
  'TUN': 'Tunez',
  'BEL': 'Belgica',
  'EGY': 'Egipto',
  'IRN': 'Iran',
  'NZL': 'Nueva Zelanda',
  'ESP': 'Espana',
  'CPV': 'Cabo Verde',
  'KSA': 'Arabia Saudita',
  'URU': 'Uruguay',
  'FRA': 'Francia',
  'SEN': 'Senegal',
  'IRQ': 'Irak',
  'NOR': 'Noruega',
  'ARG': 'Argentina',
  'ALG': 'Argelia',
  'AUT': 'Austria',
  'JOR': 'Jordania',
  'POR': 'Portugal',
  'COD': 'RD Congo',
  'UZB': 'Uzbekistan',
  'COL': 'Colombia',
  'ENG': 'Inglaterra',
  'CRO': 'Croacia',
  'GHA': 'Ghana',
  'PAN': 'Panama',
  'CC': 'Coca-Cola',
};

const checklist = [
  '00 FWC1 FWC2 FWC4 FWC8\tFWC3 FWC5 FWC7\tFWC6',
  'MEX1 MEX20\tMEX2 MEX3 MEX5 MEX9\tMEX4 MEX6 MEX10 MEX13\tMEX8 MEX11 MEX14 MEX16\tMEX12 MEX15 MEX17 MEX18\tMEX7 MEX19',
  'RSA1 RSA20\tRSA2 RSA3 RSA5 RSA9\tRSA4 RSA6 RSA10 RSA13\tRSA8 RSA11 RSA14 RSA16\tRSA12 RSA15 RSA17 RSA18\tRSA7 RSA19',
  'KOR1 KOR20\tKOR2 KOR3 KOR5 KOR9\tKOR4 KOR6 KOR10 KOR13\tKOR8 KOR11 KOR14 KOR16\tKOR12 KOR15 KOR17 KOR18\tKOR7 KOR19',
  'CZE1 CZE20\tCZE2 CZE3 CZE5 CZE9\tCZE4 CZE6 CZE10 CZE13\tCZE8 CZE11 CZE14 CZE16\tCZE12 CZE15 CZE17 CZE18\tCZE7 CZE19',
  'CAN1 CAN20\tCAN2 CAN3 CAN5 CAN9\tCAN4 CAN6 CAN10 CAN13\tCAN8 CAN11 CAN14 CAN16\tCAN12 CAN15 CAN17 CAN18\tCAN7 CAN19',
  'BIH1 BIH20\tBIH2 BIH3 BIH5 BIH9\tBIH4 BIH6 BIH10 BIH13\tBIH8 BIH11 BIH14 BIH16\tBIH12 BIH15 BIH17 BIH18\tBIH7 BIH19',
  'QAT1 QAT20\tQAT2 QAT3 QAT5 QAT9\tQAT4 QAT6 QAT10 QAT13\tQAT8 QAT11 QAT14 QAT16\tQAT12 QAT15 QAT17 QAT18\tQAT7 QAT19',
  'SUI1 SUI20\tSUI2 SUI3 SUI5 SUI9\tSUI4 SUI6 SUI10 SUI13\tSUI8 SUI11 SUI14 SUI16\tSUI12 SUI15 SUI17 SUI18\tSUI7 SUI19',
  'BRA1 BRA20\tBRA2 BRA3 BRA5 BRA9\tBRA4 BRA6 BRA10 BRA13\tBRA8 BRA11 BRA14 BRA16\tBRA12 BRA15 BRA17 BRA18\tBRA7 BRA19',
  'MAR1 MAR20\tMAR2 MAR3 MAR5 MAR9\tMAR4 MAR6 MAR10 MAR13\tMAR8 MAR11 MAR14 MAR16\tMAR12 MAR15 MAR17 MAR18\tMAR7 MAR19',
  'HAI1 HAI20\tHAI2 HAI3 HAI5 HAI9\tHAI4 HAI6 HAI10 HAI13\tHAI8 HAI11 HAI14 HAI16\tHAI12 HAI15 HAI17 HAI18\tHAI7 HAI19',
  'SCO1 SCO20\tSCO2 SCO3 SCO5 SCO9\tSCO4 SCO6 SCO10 SCO13\tSCO8 SCO11 SCO14 SCO16\tSCO12 SCO15 SCO17 SCO18\tSCO7 SCO19',
  'USA1 USA20\tUSA2 USA3 USA5 USA9\tUSA4 USA6 USA10 USA13\tUSA8 USA11 USA14 USA16\tUSA12 USA15 USA17 USA18\tUSA7 USA19',
  'PAR1 PAR20\tPAR2 PAR3 PAR5 PAR9\tPAR4 PAR6 PAR10 PAR13\tPAR8 PAR11 PAR14 PAR16\tPAR12 PAR15 PAR17 PAR18\tPAR7 PAR19',
  'AUS1 AUS20\tAUS2 AUS3 AUS5 AUS9\tAUS4 AUS6 AUS10 AUS13\tAUS8 AUS11 AUS14 AUS16\tAUS12 AUS15 AUS17 AUS18\tAUS7 AUS19',
  'TUR1 TUR20\tTUR2 TUR3 TUR5 TUR9\tTUR4 TUR6 TUR10 TUR13\tTUR8 TUR11 TUR14 TUR16\tTUR12 TUR15 TUR17 TUR18\tTUR7 TUR19',
  'GER1 GER20\tGER2 GER3 GER5 GER9\tGER4 GER6 GER10 GER13\tGER8 GER11 GER14 GER16\tGER12 GER15 GER17 GER18\tGER7 GER19',
  'CUW1 CUW20\tCUW2 CUW3 CUW5 CUW9\tCUW4 CUW6 CUW10 CUW13\tCUW8 CUW11 CUW14 CUW16\tCUW12 CUW15 CUW17 CUW18\tCUW7 CUW19',
  'CIV1 CIV20\tCIV2 CIV3 CIV5 CIV9\tCIV4 CIV6 CIV10 CIV13\tCIV8 CIV11 CIV14 CIV16\tCIV12 CIV15 CIV17 CIV18\tCIV7 CIV19',
  'ECU1 ECU20\tECU2 ECU3 ECU5 ECU9\tECU4 ECU6 ECU10 ECU13\tECU8 ECU11 ECU14 ECU16\tECU12 ECU15 ECU17 ECU18\tECU7 ECU19',
  'NED1 NED20\tNED2 NED3 NED5 NED9\tNED4 NED6 NED10 NED13\tNED8 NED11 NED14 NED16\tNED12 NED15 NED17 NED18\tNED7 NED19',
  'JPN1 JPN20\tJPN2 JPN3 JPN5 JPN9\tJPN4 JPN6 JPN10 JPN13\tJPN8 JPN11 JPN14 JPN16\tJPN12 JPN15 JPN17 JPN18\tJPN7 JPN19',
  'SWE1 SWE20\tSWE2 SWE3 SWE5 SWE9\tSWE4 SWE6 SWE10 SWE13\tSWE8 SWE11 SWE14 SWE16\tSWE12 SWE15 SWE17 SWE18\tSWE7 SWE19',
  'TUN1 TUN20\tTUN2 TUN3 TUN5 TUN9\tTUN4 TUN6 TUN10 TUN13\tTUN8 TUN11 TUN14 TUN16\tTUN12 TUN15 TUN17 TUN18\tTUN7 TUN19',
  'BEL1 BEL20\tBEL2 BEL3 BEL5 BEL9\tBEL4 BEL6 BEL10 BEL13\tBEL8 BEL11 BEL14 BEL16\tBEL12 BEL15 BEL17 BEL18\tBEL7 BEL19',
  'EGY1 EGY20\tEGY2 EGY3 EGY5 EGY9\tEGY4 EGY6 EGY10 EGY13\tEGY8 EGY11 EGY14 EGY16\tEGY12 EGY15 EGY17 EGY18\tEGY7 EGY19',
  'IRN1 IRN20\tIRN2 IRN3 IRN5 IRN9\tIRN4 IRN6 IRN10 IRN13\tIRN8 IRN11 IRN14 IRN16\tIRN12 IRN15 IRN17 IRN18\tIRN7 IRN19',
  'NZL1 NZL20\tNZL2 NZL3 NZL5 NZL9\tNZL4 NZL6 NZL10 NZL13\tNZL8 NZL11 NZL14 NZL16\tNZL12 NZL15 NZL17 NZL18\tNZL7 NZL19',
  'ESP1 ESP20\tESP2 ESP3 ESP5 ESP9\tESP4 ESP6 ESP10 ESP13\tESP8 ESP11 ESP14 ESP16\tESP12 ESP15 ESP17 ESP18\tESP7 ESP19',
  'CPV1 CPV20\tCPV2 CPV3 CPV5 CPV9\tCPV4 CPV6 CPV10 CPV13\tCPV8 CPV11 CPV14 CPV16\tCPV12 CPV15 CPV17 CPV18\tCPV7 CPV19',
  'KSA1 KSA20\tKSA2 KSA3 KSA5 KSA9\tKSA4 KSA6 KSA10 KSA13\tKSA8 KSA11 KSA14 KSA16\tKSA12 KSA15 KSA17 KSA18\tKSA7 KSA19',
  'URU1 URU20\tURU2 URU3 URU5 URU9\tURU4 URU6 URU10 URU13\tURU8 URU11 URU14 URU16\tURU12 URU15 URU17 URU18\tURU7 URU19',
  'FRA1 FRA20\tFRA2 FRA3 FRA5 FRA9\tFRA4 FRA6 FRA10 FRA13\tFRA8 FRA11 FRA14 FRA16\tFRA12 FRA15 FRA17 FRA18\tFRA7 FRA19',
  'SEN1 SEN20\tSEN2 SEN3 SEN5 SEN9\tSEN4 SEN6 SEN10 SEN13\tSEN8 SEN11 SEN14 SEN16\tSEN12 SEN15 SEN17 SEN18\tSEN7 SEN19',
  'IRQ1 IRQ20\tIRQ2 IRQ3 IRQ5 IRQ9\tIRQ4 IRQ6 IRQ10 IRQ13\tIRQ8 IRQ11 IRQ14 IRQ16\tIRQ12 IRQ15 IRQ17 IRQ18\tIRQ7 IRQ19',
  'NOR1 NOR20\tNOR2 NOR3 NOR5 NOR9\tNOR4 NOR6 NOR10 NOR13\tNOR8 NOR11 NOR14 NOR16\tNOR12 NOR15 NOR17 NOR18\tNOR7 NOR19',
  'ARG1 ARG20\tARG2 ARG3 ARG5 ARG9\tARG4 ARG6 ARG10 ARG13\tARG8 ARG11 ARG14 ARG16\tARG12 ARG15 ARG17 ARG18\tARG7 ARG19',
  'ALG1 ALG20\tALG2 ALG3 ALG5 ALG9\tALG4 ALG6 ALG10 ALG13\tALG8 ALG11 ALG14 ALG16\tALG12 ALG15 ALG17 ALG18\tALG7 ALG19',
  'AUT1 AUT20\tAUT2 AUT3 AUT5 AUT9\tAUT4 AUT6 AUT10 AUT13\tAUT8 AUT11 AUT14 AUT16\tAUT12 AUT15 AUT17 AUT18\tAUT7 AUT19',
  'JOR1 JOR20\tJOR2 JOR3 JOR5 JOR9\tJOR4 JOR6 JOR10 JOR13\tJOR8 JOR11 JOR14 JOR16\tJOR12 JOR15 JOR17 JOR18\tJOR7 JOR19',
  'POR1 POR20\tPOR2 POR3 POR5 POR9\tPOR4 POR6 POR10 POR13\tPOR8 POR11 POR14 POR16\tPOR12 POR15 POR17 POR18\tPOR7 POR19',
  'COD1 COD20\tCOD2 COD3 COD5 COD9\tCOD4 COD6 COD10 COD13\tCOD8 COD11 COD14 COD16\tCOD12 COD15 COD17 COD18\tCOD7 COD19',
  'UZB1 UZB20\tUZB2 UZB3 UZB5 UZB9\tUZB4 UZB6 UZB10 UZB13\tUZB8 UZB11 UZB14 UZB16\tUZB12 UZB15 UZB17 UZB18\tUZB7 UZB19',
  'COL1 COL20\tCOL2 COL3 COL5 COL9\tCOL4 COL6 COL10 COL13\tCOL8 COL11 COL14 COL16\tCOL12 COL15 COL17 COL18\tCOL7 COL19',
  'ENG1 ENG20\tENG2 ENG3 ENG5 ENG9\tENG4 ENG6 ENG10 ENG13\tENG8 ENG11 ENG14 ENG16\tENG12 ENG15 ENG17 ENG18\tENG7 ENG19',
  'CRO1 CRO20\tCRO2 CRO3 CRO5 CRO9\tCRO4 CRO6 CRO10 CRO13\tCRO8 CRO11 CRO14 CRO16\tCRO12 CRO15 CRO17 CRO18\tCRO7 CRO19',
  'GHA1 GHA20\tGHA2 GHA3 GHA5 GHA9\tGHA4 GHA6 GHA10 GHA13\tGHA8 GHA11 GHA14 GHA16\tGHA12 GHA15 GHA17 GHA18\tGHA7 GHA19',
  'PAN1 PAN20\tPAN2 PAN3 PAN5 PAN9\tPAN4 PAN6 PAN10 PAN13\tPAN8 PAN11 PAN14 PAN16\tPAN12 PAN15 PAN17 PAN18\tPAN7 PAN19',
  'CC1 CC2 CC3 CC5 CC9\tCC4 CC6 CC10 CC13\tCC8 CC11 CC14\tCC12\tCC7',
  'FWC9 FWC10 FWC11 FWC13 FWC17\tFWC12 FWC14 FWC18\tFWC16 FWC19\tFWC15',
];

const stickers = [];
let globalNumber = 0;

for (const line of checklist) {
  if (line.startsWith('00')) {
    // Skip the duplicate FWC header line (already captured in last lines)
    // But FWC1-FWC8 from line 0 -> we extract them
    const codes = line.match(/([A-Z]+)(\d+)/g);
    if (codes) {
      for (const code of codes) {
        if (code.startsWith('00')) continue;
        const match = code.match(/^([A-Z]+)(\d+)$/);
        if (!match) continue;
        const teamCode = match[1];
        const teamNumber = parseInt(match[2]);
        const country = teamMap[teamCode] || teamCode;
        globalNumber++;
        stickers.push({
          number: globalNumber,
          code: code,
          teamCode: teamCode,
          teamNumber: teamNumber,
          country: country,
          playerName: '',
          type: 'especial',
          section: 'especiales',
        });
      }
    }
    continue;
  }

  const codes = line.match(/([A-Z]+)(\d+)/g);
  if (!codes) continue;

  for (const code of codes) {
    if (code.startsWith('00')) continue;
    const match = code.match(/^([A-Z]+)(\d+)$/);
    if (!match) continue;
    const teamCode = match[1];
    const teamNumber = parseInt(match[2]);
    const country = teamMap[teamCode] || teamCode;

    let type = 'jugador';
    let section = 'equipos';

    if (teamCode === 'FWC' || teamCode === 'CC') {
      type = 'especial';
      section = teamCode === 'CC' ? 'coca-cola' : 'especiales';
    } else if (teamNumber === 1) {
      type = 'escudo';
    } else if (teamNumber === 20) {
      type = 'especial';
    }

    globalNumber++;
    stickers.push({
      number: globalNumber,
      code: code,
      teamCode: teamCode,
      teamNumber: teamNumber,
      country: country,
      playerName: '',
      type: type,
      section: section,
    });
  }
}

// Remove duplicate codes (keep first occurrence)
const seen = new Set();
const uniqueStickers = [];
for (const s of stickers) {
  if (seen.has(s.code)) continue;
  seen.add(s.code);
  uniqueStickers.push(s);
}

// Renumber
uniqueStickers.forEach((s, i) => { s.number = i + 1; });

// Stats
const stats = {
  totalStickers: uniqueStickers.length,
  bySection: {},
  byType: {},
  teams: [],
};

for (const s of uniqueStickers) {
  stats.bySection[s.section] = (stats.bySection[s.section] || 0) + 1;
  stats.byType[s.type] = (stats.byType[s.type] || 0) + 1;
}

// Team list
const teamSet = new Set();
for (const s of uniqueStickers) {
  if (s.section === 'equipos') {
    teamSet.add(s.country);
  }
}
stats.teams = Array.from(teamSet).sort();

console.log('=== CATALOG GENERATED ===');
console.log('Total stickers:', uniqueStickers.length);
console.log('By section:', JSON.stringify(stats.bySection));
console.log('By type:', JSON.stringify(stats.byType));
console.log('Teams:', stats.teams.length);
console.log('');

// Sample
console.log('First 5:');
uniqueStickers.slice(0, 5).forEach(s => console.log('  ', s.number, s.code, s.country, s.type));
console.log('...');
console.log('Last 3:');
uniqueStickers.slice(-3).forEach(s => console.log('  ', s.number, s.code, s.country, s.type));

// Write to src/data
const outDir = path.join(__dirname, '..', 'src', 'data');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'catalog.json'), JSON.stringify(uniqueStickers, null, 2), 'utf-8');
fs.writeFileSync(path.join(outDir, 'catalog-stats.json'), JSON.stringify(stats, null, 2), 'utf-8');

// Also write a compact version for the app
const compactStats = {
  total: uniqueStickers.length,
  sections: stats.bySection,
  types: stats.byType,
  teams: stats.teams,
};
fs.writeFileSync(path.join(outDir, 'catalog-stats.json'), JSON.stringify(compactStats, null, 2), 'utf-8');

console.log('\nFiles written to:', outDir);
