/**
 * UI chrome translations, carried over from reach-frontend largely as-is.
 * CLAUDE.md §16 (2026-08-21): the i18n framework is lifted from the cut
 * list for this merge — candidates describe their work history in mixed
 * Hindi-English phrasing, so multilingual UI is core to the product, not a
 * cosmetic layer. Dark mode and analytics (the rest of cut-list item 7)
 * remain cut.
 *
 * SKILL_TRANSLATIONS / getLocalizedSkillName below are keyed on
 * reach-frontend's old ~40-key regex skill taxonomy, not our 113-skill
 * data/skills.json. They do not carry over functionally — components in
 * this app render skill names via getSkill(id).canonicalName (English
 * only) instead of through this dictionary. Kept here rather than deleted
 * per CLAUDE.md §16.
 */

import type { TransportMode } from "@/lib/types";

export type LanguageCode = "en" | "es" | "hi" | "fr" | "sw";

export interface Translations {
  appName: string;
  appTagline: string;
  taglineSub: string;
  civicPlatform: string;
  continueCandidate: string;
  continueEmployer: string;
  backHome: string;
  offlineStatus: string;
  candidateDashboard: string;
  employerPortal: string;
  candidateExperience: string;
  opportunitySummary: string;
  totalJobs: string;
  totalJobsSubtext: string;
  feasibleJobs: string;
  feasibleJobsSubtext: string;
  qualifiedJobs: string;
  qualifiedJobsSubtext: string;
  verifiedQualified: string;
  verifiedQualifiedSubtext: string;
  vacanciesCount: string;

  // Experience Input
  experienceHeading: string;
  experienceBadge: string;
  experienceDesc: string;
  experienceSubDesc: string;
  editExperience: string;
  cancel: string;
  experiencePlaceholder: string;
  clickExampleToLoad: string;
  identifyMySkills: string;
  processingStep1: string;
  processingStep2: string;
  processingStep3: string;
  foundSkillsTitle: string;
  identifiedCount: string;
  identifiedFromExperience: string;
  addAnotherSkill: string;
  addSkillBtn: string;
  lowSignalTitle: string;
  lowSignalDesc: string;
  editExperienceDesc: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  experienceMappedSuccess: string;
  deterministicModel: string;
  verifiedBadge: string;

  // Candidate Profile Banner
  valleyRegion: string;
  profileEvalNotice: string;
  commuteDistance: string;
  hoursWindow: string;
  profileCompetencies: string;

  // Opportunity Simulator
  opportunitySimulatorTitle: string;
  sensitivityEngineBadge: string;
  simulatorDesc: string;
  simulationNote: string;
  resetSimulation: string;
  activeSimReach: string;
  feasibleOpportunitiesAccessible: string;
  deltaVsBase: string;
  additionalOpportunitiesUnlocked: string;
  constrainedBelowBaseline: string;
  matchingBaseProfile: string;
  maxCommute: string;
  commuteWalk: string;
  commuteBase: string;
  commuteRegional: string;
  earliestStart: string;
  earlyStartDesc: string;
  latestEnd: string;
  lateEndDesc: string;
  transportModes: string;
  modesActive: string;
  transportModesDesc: string;
  singleConstraintRelaxation: string;
  yieldLabel: string;
  totalLabel: string;
  simulatorCivicDisclaimer: string;

  // Charts
  economicAnalyticsTitle: string;
  derivedDatasetNotice: string;
  opportunityFunnelTitle: string;
  sequentialGateBadge: string;
  opportunityFunnelDesc: string;
  opportunitiesCount: string;
  topSkillBundlesTitle: string;
  trainingRoiBadge: string;
  skillBundlesDesc: string;
  jobsPer10HoursLabel: string;
  unlocksOpportunities: string;
  coreSkillsLabel: string;
  requestedSkillsTitle: string;
  feasibleOnlyBadge: string;
  requestedSkillsDesc: string;
  distinctEmployers: string;
  presentAcrossVacancies: string;
  noFeasibleFound: string;
  skillsNeededTitle: string;
  qualificationDeltaBadge: string;
  skillsNeededDesc: string;
  skillsAway1: string;
  skillsAway2: string;
  skillsAway3Plus: string;
  skillsAway1Label: string;
  skillsAway2Label: string;
  skillsAway3PlusLabel: string;

  // Opportunity List
  opportunitiesReachTitle: string;
  opportunitiesReachSubtitle: string;
  filterPlaceholder: string;
  tabFeasible: string;
  tabQualified: string;
  tabNearMiss: string;
  tabAll: string;
  noMatchFilter: string;
  badgeVerifiedReady: string;
  badgeQualified: string;
  badgeNearMiss: string;
  badgeOutOfReach: string;
  shiftLabel: string;
  transportLabel: string;
  requiredCompetencies: string;
  constraintGateBreakdown: string;
  viaLabel: string;
  minLabel: string;

  // Map
  mapTitle: string;
  mapSubtitle: string;
  filterFacilities: string;
  filterVacancies: string;
  filterReachBoundary: string;
  civicTaxonomyNotice: string;
  radiusLabel: string;
  candidateLocationTitle: string;
  candidateLocationSub: string;
  commuteHorizon: string;
  businessLocationBadge: string;
  businessLocationNotice: string;
  jobVacancyBadge: string;
  inReachLabel: string;
  outOfReachLabel: string;
  inFeasibilityReach: string;
  mapLegendCandidate: string;
  mapLegendFacilityInReach: string;
  mapLegendFacilityOutReach: string;
  mapLegendJobVacancy: string;
  mapCachedNotice: string;

  // Footer & Employer Portal
  footerPlatform: string;
  footerEngine: string;
  employerHeader: string;
  businessInfo: string;
  postOpportunity: string;
  localReachSim: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  en: {
    appName: 'Reach',
    appTagline: 'Find work that fits your reach.',
    taglineSub: 'Connect local skills with opportunities that work for you.',
    civicPlatform: 'Civic Employment Platform',
    continueCandidate: 'Continue as Candidate',
    continueEmployer: 'Continue as Employer',
    backHome: 'Overview',
    offlineStatus: 'Offline Ready • Local Data Cached',
    candidateDashboard: 'Candidate Reach Dashboard',
    employerPortal: 'Employer Portal',
    candidateExperience: 'Candidate Experience',
    opportunitySummary: 'Opportunity Summary',
    totalJobs: 'Total Regional Jobs',
    totalJobsSubtext: 'Identified employer vacancies in area',
    feasibleJobs: 'Feasible Opportunities',
    feasibleJobsSubtext: 'Within commute distance & shift window',
    qualifiedJobs: 'Directly Qualified',
    qualifiedJobsSubtext: 'Matches self-declared skill set',
    verifiedQualified: 'Ready Post-Verification',
    verifiedQualifiedSubtext: 'Skills certified by community records',
    vacanciesCount: 'vacancies',

    // Experience
    experienceHeading: 'Tell us about your experience',
    experienceBadge: 'Natural Language Skill Extraction',
    experienceDesc: 'Describe what you’ve done in your own words. We’ll identify your skills and find opportunities that fit.',
    experienceSubDesc: 'You don’t need a formal job title. Previous work, family business, informal tasks, volunteering, or shop management all count.',
    editExperience: 'Edit experience',
    cancel: 'Cancel',
    experiencePlaceholder: 'Example: I worked at my father’s showroom for 4 years. I handled customers, managed inventory, prepared bills using Excel, and managed the cash counter...',
    clickExampleToLoad: 'Or click an example to load:',
    identifyMySkills: 'Identify My Skills',
    processingStep1: '1/3: Parsing real-world tasks & responsibilities...',
    processingStep2: '2/3: Extracting structured competencies & tools...',
    processingStep3: '3/3: Evaluating geographic & qualification reach...',
    foundSkillsTitle: 'We found these skills in your experience',
    identifiedCount: 'identified',
    identifiedFromExperience: 'Identified from your experience',
    addAnotherSkill: 'Add another skill',
    addSkillBtn: 'Add',
    lowSignalTitle: 'We couldn’t identify many skills yet.',
    lowSignalDesc: 'Try describing what you did day-to-day — even informal or family-business experience counts. Mention equipment used, customer interactions, physical tasks, or records kept.',
    editExperienceDesc: 'Edit experience description',
    step1Title: 'Input',
    step1Desc: 'Your Experience',
    step2Title: 'Extracted',
    step2Desc: 'Skills Identified',
    step3Title: 'Reach Outcome',
    step3Desc: 'within reach • qualified',
    experienceMappedSuccess: 'Your experience is now mapped to opportunities.',
    deterministicModel: 'Deterministic economic model',
    verifiedBadge: 'Verified',

    // Candidate Profile Banner
    valleyRegion: 'Valley Region',
    profileEvalNotice: 'Evaluation based on verified baseline skills, physical travel modes, and daily shift availability.',
    commuteDistance: 'Commute',
    hoursWindow: 'Hours',
    profileCompetencies: 'Profile Competencies',

    // Simulator
    opportunitySimulatorTitle: 'Opportunity Reach Simulator',
    sensitivityEngineBadge: 'Interactive Sensitivity Engine',
    simulatorDesc: 'Real-time sensitivity modeling: Evaluate how modifying commute, shift timings, or transit access expands your practical pool.',
    simulationNote: 'Simulation mode • Does not change your saved profile',
    resetSimulation: 'Reset to Baseline',
    activeSimReach: 'Active Simulated Reach',
    feasibleOpportunitiesAccessible: 'feasible opportunities accessible',
    deltaVsBase: 'Delta vs Base',
    additionalOpportunitiesUnlocked: 'additional regional opportunities unlocked',
    constrainedBelowBaseline: 'Constrained below baseline',
    matchingBaseProfile: 'Matching standard candidate profile',
    maxCommute: '1. Maximum Commute',
    commuteWalk: '1.5 km (Local Walk)',
    commuteBase: 'Base',
    commuteRegional: '16.0 km (Regional)',
    earliestStart: '2. Earliest Shift Start Availability',
    earlyStartDesc: 'Earlier start unlocks agricultural and processing shifts starting before 07:00',
    latestEnd: '3. Latest Shift End Availability',
    lateEndDesc: 'Later availability accommodates multi-shift sorting and freight centers',
    transportModes: '4. Usable Transport Modes',
    modesActive: 'modes active',
    transportModesDesc: 'Adding transit or a two-wheeler enables higher effective travel speeds',
    singleConstraintRelaxation: 'Single-Constraint Relaxation Sensitivity Benchmarks:',
    yieldLabel: 'Yield:',
    totalLabel: 'total',
    simulatorCivicDisclaimer: 'Simulation Mode: Sliders compute access dynamically in-browser. Adjustments do not overwrite your permanent profile or notify employers.',

    // Charts
    economicAnalyticsTitle: 'Local Economic Feasibility Analytics',
    derivedDatasetNotice: 'Derived directly from active regional dataset',
    opportunityFunnelTitle: 'Opportunity Funnel',
    sequentialGateBadge: 'Sequential Gate',
    opportunityFunnelDesc: 'Progressive feasibility reduction from regional vacancies to qualified matches',
    opportunitiesCount: 'opportunities',
    topSkillBundlesTitle: 'Top Skill Bundles',
    trainingRoiBadge: 'Training ROI',
    skillBundlesDesc: 'Ranked by unlocked regional jobs per 10 hours of training investment (jobsPer10Hours)',
    jobsPer10HoursLabel: 'jobs / 10h training',
    unlocksOpportunities: 'Unlocks',
    coreSkillsLabel: 'Core',
    requestedSkillsTitle: 'Skills Requested Nearby',
    feasibleOnlyBadge: 'Feasible Only',
    requestedSkillsDesc: 'Number of unique regional employers demanding each skill within your commute zone',
    distinctEmployers: 'distinct employers',
    presentAcrossVacancies: 'Present across',
    noFeasibleFound: 'No feasible opportunities found with current constraints.',
    skillsNeededTitle: 'Skills Gap to Qualification',
    qualificationDeltaBadge: 'Qualification Delta',
    skillsNeededDesc: 'Feasible local opportunities categorized by count of additional skills required',
    skillsAway1: '1 skill away',
    skillsAway2: '2 skills away',
    skillsAway3Plus: '3+ skills away',
    skillsAway1Label: 'Single skill gap to reach full qualification',
    skillsAway2Label: 'Two skill additions required',
    skillsAway3PlusLabel: 'Three or more skill gaps to bridge',

    // Opportunity List
    opportunitiesReachTitle: 'Opportunities by Reach & Skill Alignment',
    opportunitiesReachSubtitle: 'Transparent breakdown of why opportunities match or fall just outside reach',
    filterPlaceholder: 'Filter title, skill, or sector...',
    tabFeasible: 'Feasible',
    tabQualified: 'Fully Qualified',
    tabNearMiss: 'Near-Miss (1–2 skills away)',
    tabAll: 'All Opportunities',
    noMatchFilter: 'No opportunities match the selected filter criteria.',
    badgeVerifiedReady: 'VERIFIED & READY',
    badgeQualified: 'QUALIFIED',
    badgeNearMiss: 'NEAR MISS',
    badgeOutOfReach: 'OUTSIDE REACH',
    shiftLabel: 'Shift',
    transportLabel: 'Transport',
    requiredCompetencies: 'Required Competencies',
    constraintGateBreakdown: 'Constraint Gate Breakdown:',
    viaLabel: 'via',
    minLabel: 'min',

    // Map
    mapTitle: 'Spatial Commute Reach & Regional Facilities',
    mapSubtitle: 'Clear visual classification: registered business sites vs active job vacancies',
    filterFacilities: 'Facilities',
    filterVacancies: 'Job Vacancies',
    filterReachBoundary: 'Reach Boundary',
    civicTaxonomyNotice: 'Civic Taxonomy: Square markers designate Business Locations (registered facilities). Diamond markers designate Job Vacancies.',
    radiusLabel: 'Radius',
    candidateLocationTitle: 'Your Baseline Location',
    candidateLocationSub: 'Origin point for travel calculations',
    commuteHorizon: 'Commute Horizon',
    businessLocationBadge: 'Business location',
    businessLocationNotice: '*Registered facility site, not an active vacancy.',
    jobVacancyBadge: 'Job Vacancy',
    inReachLabel: 'Inside Reach',
    outOfReachLabel: 'Outside Reach',
    inFeasibilityReach: 'In Feasibility Reach',
    mapLegendCandidate: 'Candidate Location',
    mapLegendFacilityInReach: 'Business Facility (In Reach)',
    mapLegendFacilityOutReach: 'Facility (Outside Reach)',
    mapLegendJobVacancy: 'Job Vacancy',
    mapCachedNotice: 'Estimated reach — not a routed boundary',

    // Footer
    footerPlatform: 'Reach Civic Platform • Local Skills Feasibility Architecture',
    footerEngine: 'Engine: Pure Deterministic Matching • No Mock Trends',
    employerHeader: 'Local Employer Management',
    businessInfo: 'Business Information',
    postOpportunity: 'Create New Opportunity',
    localReachSim: 'Estimated Local Candidate Reach',
  },
  es: {
    appName: 'Reach',
    appTagline: 'Encuentre trabajo que esté a su alcance.',
    taglineSub: 'Conecte sus habilidades locales con oportunidades que funcionan para usted.',
    civicPlatform: 'Plataforma Cívica de Empleo',
    continueCandidate: 'Continuar como Candidato',
    continueEmployer: 'Continuar como Empleador',
    backHome: 'Resumen',
    offlineStatus: 'Disponible sin conexión • Datos en caché local',
    candidateDashboard: 'Panel de Alcance del Candidato',
    employerPortal: 'Portal del Empleador',
    candidateExperience: 'Experiencia del Candidato',
    opportunitySummary: 'Resumen de Oportunidades',
    totalJobs: 'Empleos Regionales Totales',
    totalJobsSubtext: 'Vacantes identificadas en la zona',
    feasibleJobs: 'Oportunidades Factibles',
    feasibleJobsSubtext: 'Dentro de su distancia y horario de viaje',
    qualifiedJobs: 'Calificado Directamente',
    qualifiedJobsSubtext: 'Coincide con sus habilidades declaradas',
    verifiedQualified: 'Listo tras Verificación',
    verifiedQualifiedSubtext: 'Habilidades certificadas por registros',
    vacanciesCount: 'vacantes',

    experienceHeading: 'Cuéntenos sobre su experiencia',
    experienceBadge: 'Extracción de Habilidades en Lenguaje Natural',
    experienceDesc: 'Describa lo que ha hecho con sus propias palabras. Identificaremos sus habilidades y buscaremos oportunidades.',
    experienceSubDesc: 'No necesita un título formal. El trabajo previo, negocios familiares, tareas informales, voluntariado o tiendas cuentan.',
    editExperience: 'Editar experiencia',
    cancel: 'Cancelar',
    experiencePlaceholder: 'Ejemplo: Trabajé en el negocio familiar durante 4 años. Atendí clientes, gestioné inventario, hice facturas en Excel y cobré en caja...',
    clickExampleToLoad: 'O haga clic en un ejemplo para cargar:',
    identifyMySkills: 'Identificar Mis Habilidades',
    processingStep1: '1/3: Analizando tareas y responsabilidades reales...',
    processingStep2: '2/3: Extrayendo competencias y herramientas...',
    processingStep3: '3/3: Evaluando alcance geográfico y requisitos...',
    foundSkillsTitle: 'Encontramos estas habilidades en su experiencia',
    identifiedCount: 'identificadas',
    identifiedFromExperience: 'Identificadas a partir de su experiencia',
    addAnotherSkill: 'Agregar otra habilidad',
    addSkillBtn: 'Agregar',
    lowSignalTitle: 'Aún no pudimos identificar muchas habilidades.',
    lowSignalDesc: 'Describa lo que hacía a diario: tareas prácticas, atención al cliente, manejo de herramientas o registro de datos.',
    editExperienceDesc: 'Editar descripción de experiencia',
    step1Title: 'Entrada',
    step1Desc: 'Su Experiencia',
    step2Title: 'Extraídas',
    step2Desc: 'Habilidades Identificadas',
    step3Title: 'Resultado',
    step3Desc: 'a su alcance • calificado',
    experienceMappedSuccess: 'Su experiencia ahora está vinculada a oportunidades.',
    deterministicModel: 'Modelo económico determinista',
    verifiedBadge: 'Verificado',

    valleyRegion: 'Región del Valle',
    profileEvalNotice: 'Evaluación basada en competencias verificadas, modos de transporte físico y disponibilidad horaria.',
    commuteDistance: 'Distancia',
    hoursWindow: 'Horarios',
    profileCompetencies: 'Competencias del Perfil',

    opportunitySimulatorTitle: 'Simulador de Alcance de Oportunidades',
    sensitivityEngineBadge: 'Motor Interactivo de Sensibilidad',
    simulatorDesc: 'Modelado en tiempo real: evalúe cómo modificar distancia, horarios o transporte expande sus opciones prácticas.',
    simulationNote: 'Modo simulación • No modifica su perfil guardado',
    resetSimulation: 'Restablecer',
    activeSimReach: 'Alcance Simulado Activo',
    feasibleOpportunitiesAccessible: 'oportunidades factibles accesibles',
    deltaVsBase: 'Diferencia vs Base',
    additionalOpportunitiesUnlocked: 'oportunidades regionales adicionales desbloqueadas',
    constrainedBelowBaseline: 'Por debajo de su perfil base',
    matchingBaseProfile: 'Coincide con su perfil inicial',
    maxCommute: '1. Distancia Máxima de Viaje',
    commuteWalk: '1.5 km (Caminata Local)',
    commuteBase: 'Base',
    commuteRegional: '16,0 km (Regional)',
    earliestStart: '2. Hora de Inicio Más Temprana',
    earlyStartDesc: 'Un inicio más temprano desbloquea turnos agrícolas y de procesamiento antes de las 07:00',
    latestEnd: '3. Hora de Salida Más Tardía',
    lateEndDesc: 'Mayor disponibilidad permite acceder a centros de logística y distribución nocturna',
    transportModes: '4. Modos de Transporte Disponibles',
    modesActive: 'modos activos',
    transportModesDesc: 'Agregar transporte público o moto permite mayores velocidades de desplazamiento',
    singleConstraintRelaxation: 'Pruebas de Sensibilidad con Relajación Individual:',
    yieldLabel: 'Ganancia:',
    totalLabel: 'total',
    simulatorCivicDisclaimer: 'Modo Simulación: Los controles calculan el acceso dinámicamente. No modifican su perfil permanente ni notifican a empleadores.',

    economicAnalyticsTitle: 'Análisis de Factibilidad Económica Local',
    derivedDatasetNotice: 'Calculado directamente a partir del conjunto de datos regional activo',
    opportunityFunnelTitle: 'Embudo de Oportunidades',
    sequentialGateBadge: 'Filtro Secuencial',
    opportunityFunnelDesc: 'Reducción progresiva de factibilidad desde vacantes regionales hasta calificación',
    opportunitiesCount: 'oportunidades',
    topSkillBundlesTitle: 'Paquetes Principales de Habilidades',
    trainingRoiBadge: 'Retorno de Capacitación',
    skillBundlesDesc: 'Ordenados por empleos desbloqueados por cada 10 horas de capacitación (jobsPer10Hours)',
    jobsPer10HoursLabel: 'empleos / 10h capacitación',
    unlocksOpportunities: 'Desbloquea',
    coreSkillsLabel: 'Núcleo',
    requestedSkillsTitle: 'Habilidades Solicitadas en la Zona',
    feasibleOnlyBadge: 'Solo Factibles',
    requestedSkillsDesc: 'Número de empleadores únicos que solicitan cada habilidad en su radio de viaje',
    distinctEmployers: 'empleadores distintos',
    presentAcrossVacancies: 'Presente en',
    noFeasibleFound: 'No se encontraron oportunidades factibles con los parámetros actuales.',
    skillsNeededTitle: 'Brecha de Habilidades para Calificar',
    qualificationDeltaBadge: 'Brecha de Calificación',
    skillsNeededDesc: 'Oportunidades locales factibles categorizadas por número de habilidades adicionales necesarias',
    skillsAway1: 'A 1 habilidad',
    skillsAway2: 'A 2 habilidades',
    skillsAway3Plus: 'A 3+ habilidades',
    skillsAway1Label: 'Una sola habilidad para calificar por completo',
    skillsAway2Label: 'Se requieren dos habilidades adicionales',
    skillsAway3PlusLabel: 'Tres o más habilidades faltantes',

    opportunitiesReachTitle: 'Oportunidades por Alcance y Habilidades',
    opportunitiesReachSubtitle: 'Desglose transparente de por qué una vacante coincide o queda fuera de su alcance',
    filterPlaceholder: 'Filtrar por título, habilidad o sector...',
    tabFeasible: 'Factibles',
    tabQualified: 'Completamente Calificado',
    tabNearMiss: 'Casi Calificado (1–2 habilidades)',
    tabAll: 'Todas las Oportunidades',
    noMatchFilter: 'Ninguna oportunidad coincide con los criterios de filtro seleccionados.',
    badgeVerifiedReady: 'VERIFICADO Y LISTO',
    badgeQualified: 'CALIFICADO',
    badgeNearMiss: 'CASI CALIFICADO',
    badgeOutOfReach: 'FUERA DE ALCANCE',
    shiftLabel: 'Turno',
    transportLabel: 'Transporte',
    requiredCompetencies: 'Competencias Requeridas',
    constraintGateBreakdown: 'Desglose de Restricciones:',
    viaLabel: 'en',
    minLabel: 'min',

    mapTitle: 'Alcance Geográfico y Establecimientos Regionales',
    mapSubtitle: 'Clasificación visual clara: sedes empresariales registradas vs vacantes laborales activas',
    filterFacilities: 'Establecimientos',
    filterVacancies: 'Vacantes de Empleo',
    filterReachBoundary: 'Límite de Alcance',
    civicTaxonomyNotice: 'Taxonomía Cívica: Los marcadores cuadrados indican Sedes de Negocios (instalaciones). Los diamantes indican Vacantes de Empleo.',
    radiusLabel: 'Radio',
    candidateLocationTitle: 'Su Ubicación Base',
    candidateLocationSub: 'Punto de origen para cálculos de viaje',
    commuteHorizon: 'Horizonte de Desplazamiento',
    businessLocationBadge: 'Sede de empresa',
    businessLocationNotice: '*Instalación registrada, no una vacante activa.',
    jobVacancyBadge: 'Vacante de Empleo',
    inReachLabel: 'Dentro del Alcance',
    outOfReachLabel: 'Fuera del Alcance',
    inFeasibilityReach: 'Accesible',
    mapLegendCandidate: 'Ubicación del Candidato',
    mapLegendFacilityInReach: 'Sede Empresarial (En Alcance)',
    mapLegendFacilityOutReach: 'Sede Empresarial (Fuera de Alcance)',
    mapLegendJobVacancy: 'Vacante Laboral',
    mapCachedNotice: 'Alcance estimado — no es un límite navegado',

    footerPlatform: 'Plataforma Cívica Reach • Arquitectura de Factibilidad Local',
    footerEngine: 'Motor: Coincidencia Determinista Pura • Sin Tendencias Simuladas',
    employerHeader: 'Gestión para Empleadores Locales',
    businessInfo: 'Información Empresa',
    postOpportunity: 'Publicar Nueva Oportunidad',
    localReachSim: 'Alcance Estimado de Candidatos Locales',
  },
  hi: {
    appName: 'Reach',
    appTagline: 'काम खोजें जो आपकी पहुँच में हो।',
    taglineSub: 'अपने स्थानीय हुनर को उन अवसरों से जोड़ें जो आपके अनुकूल हों।',
    civicPlatform: 'नागरिक रोजगार मंच',
    continueCandidate: 'उम्मीदवार के रूप में आगे बढ़ें',
    continueEmployer: 'नियोक्ता के रूप में आगे बढ़ें',
    backHome: 'अवलोकन',
    offlineStatus: 'ऑफ़लाइन तैयार • स्थानीय डेटा सुरक्षित',
    candidateDashboard: 'उम्मीदवार पहुँच डैशबोर्ड',
    employerPortal: 'नियोक्ता पोर्टल',
    candidateExperience: 'उम्मीदवार अनुभव',
    opportunitySummary: 'अवसर सारांश',
    totalJobs: 'कुल क्षेत्रीय नौकरियां',
    totalJobsSubtext: 'क्षेत्र में उपलब्ध नियोक्ता रिक्तियां',
    feasibleJobs: 'पहुँच योग्य अवसर',
    feasibleJobsSubtext: 'यात्रा दूरी और कार्य समय के भीतर',
    qualifiedJobs: 'सीधे योग्य',
    qualifiedJobsSubtext: 'आपके घोषित कौशल के अनुरूप',
    verifiedQualified: 'सत्यापन पश्चात तैयार',
    verifiedQualifiedSubtext: 'प्रमाणित कौशल रिकॉर्ड के आधार पर',
    vacanciesCount: 'रिक्तियां',

    experienceHeading: 'हमें अपने अनुभव के बारे में बताएं',
    experienceBadge: 'प्राकृतिक भाषा कौशल निष्कर्षण',
    experienceDesc: 'अपने शब्दों में बताएं कि आपने क्या काम किया है। हम आपके कौशल की पहचान करेंगे और उपयुक्त अवसर खोजेंगे।',
    experienceSubDesc: 'औपचारिक पद की आवश्यकता नहीं है। पिछला काम, पारिवारिक व्यवसाय, अनौपचारिक कार्य, सेवा या दुकान प्रबंधन सभी मान्य हैं।',
    editExperience: 'अनुभव संपादित करें',
    cancel: 'रद्द करें',
    experiencePlaceholder: 'उदाहरण: मैंने 4 साल अपने पिता के शोरूम में काम किया। ग्राहकों को संभाला, इन्वेंट्री संभाली, एक्सेल में बिलिंग की और कैश काउंटर संभाला...',
    clickExampleToLoad: 'या उदाहरण लोड करने के लिए क्लिक करें:',
    identifyMySkills: 'मेरे कौशल की पहचान करें',
    processingStep1: '1/3: वास्तविक कार्यों और जिम्मेदारियों का विश्लेषण...',
    processingStep2: '2/3: कौशल और उपकरणों की पहचान...',
    processingStep3: '3/3: भौगोलिक पहुँच और योग्यता का मूल्यांकन...',
    foundSkillsTitle: 'हमने आपके अनुभव में ये कौशल पाए',
    identifiedCount: 'पहचाने गए',
    identifiedFromExperience: 'आपके अनुभव से निकाले गए',
    addAnotherSkill: 'अन्य कौशल जोड़ें',
    addSkillBtn: 'जोड़ें',
    lowSignalTitle: 'हमें अभी अधिक कौशल नहीं मिले।',
    lowSignalDesc: 'कृपया विस्तार से बताएं कि आप रोज़ाना क्या काम करते थे — ग्राहक सेवा, औजारों का उपयोग, या रिकॉर्ड रखना।',
    editExperienceDesc: 'अनुभव विवरण संपादित करें',
    step1Title: 'इनपुट',
    step1Desc: 'आपका अनुभव',
    step2Title: 'पहचाने गए',
    step2Desc: 'कौशल निकाले गए',
    step3Title: 'पहुँच परिणाम',
    step3Desc: 'पहुँच में • योग्य',
    experienceMappedSuccess: 'आपका अनुभव अब नौकरियों से जुड़ गया है।',
    deterministicModel: 'सटीक आर्थिक मॉडल',
    verifiedBadge: 'सत्यापित',

    valleyRegion: 'वैली क्षेत्र',
    profileEvalNotice: 'सत्यापित कौशल, यात्रा साधन और कार्य समय की उपलब्धता के आधार पर मूल्यांकन।',
    commuteDistance: 'यात्रा दूरी',
    hoursWindow: 'समय',
    profileCompetencies: 'प्रोफ़ाइल कौशल',

    opportunitySimulatorTitle: 'अवसर पहुँच सिम्युलेटर',
    sensitivityEngineBadge: 'संवेदनशीलता सिमुलेशन इंजन',
    simulatorDesc: 'वास्तविक समय सिमुलेशन: देखें कि यात्रा दूरी या समय बदलने से आपके अवसर कैसे बढ़ते हैं।',
    simulationNote: 'सिमुलेशन मोड • आपकी प्रोफ़ाइल में कोई बदलाव नहीं होगा',
    resetSimulation: 'रीसेट करें',
    activeSimReach: 'सक्रिय सिमुलेटेड पहुँच',
    feasibleOpportunitiesAccessible: 'पहुँच योग्य अवसर उपलब्ध',
    deltaVsBase: 'आधार से अंतर',
    additionalOpportunitiesUnlocked: 'अतिरिक्त क्षेत्रीय अवसर अनलॉक हुए',
    constrainedBelowBaseline: 'आधार प्रोफ़ाइल से कम',
    matchingBaseProfile: 'मानक उम्मीदवार प्रोफ़ाइल से मेल खाता है',
    maxCommute: '1. अधिकतम यात्रा समय',
    commuteWalk: '1.5 km (पैदल दूरी)',
    commuteBase: 'आधार',
    commuteRegional: '16.0 km (क्षेत्रीय)',
    earliestStart: '2. कार्य शुरू करने का समय',
    earlyStartDesc: 'सुबह जल्दी शुरू करने से कृषि और प्रसंस्करण की नौकरियों में मदद मिलती है',
    latestEnd: '3. कार्य समाप्ति का समय',
    lateEndDesc: 'देर तक उपलब्धता से लॉजिस्टिक्स और डिलीवरी केंद्र के अवसर मिलते हैं',
    transportModes: '4. परिवहन साधन',
    modesActive: 'साधन सक्रिय',
    transportModesDesc: 'सार्वजनिक परिवहन या दोपहिया जोड़ने से यात्रा की गति बढ़ती है',
    singleConstraintRelaxation: 'एकल-बाधा संवेदनशीलता बेंचमार्क:',
    yieldLabel: 'लाभ:',
    totalLabel: 'कुल',
    simulatorCivicDisclaimer: 'सिमुलेशन मोड: परिणाम तुरंत ब्राउज़र में गिने जाते हैं। इससे आपकी स्थायी प्रोफ़ाइल नहीं बदलती।',

    economicAnalyticsTitle: 'स्थानीय आर्थिक व्यवहार्यता विश्लेषण',
    derivedDatasetNotice: 'सक्रिय क्षेत्रीय डेटासेट से सीधे प्राप्त',
    opportunityFunnelTitle: 'अवसर फ़नल',
    sequentialGateBadge: 'क्रमिक फ़िल्टर',
    opportunityFunnelDesc: 'क्षेत्रीय रिक्तियों से योग्यता तक प्रगतिशील पहुँच',
    opportunitiesCount: 'अवसर',
    topSkillBundlesTitle: 'शीर्ष कौशल समूह',
    trainingRoiBadge: 'प्रशिक्षण रिटर्न',
    skillBundlesDesc: '10 घंटे के प्रशिक्षण से मिलने वाली नौकरियों के अनुसार रैंक (jobsPer10Hours)',
    jobsPer10HoursLabel: 'नौकरियां / 10 घंटे प्रशिक्षण',
    unlocksOpportunities: 'अनलॉक करता है',
    coreSkillsLabel: 'मुख्य',
    requestedSkillsTitle: 'आस-पास आवश्यक कौशल',
    feasibleOnlyBadge: 'केवल पहुँच योग्य',
    requestedSkillsDesc: 'आपकी यात्रा सीमा के भीतर कौशल मांगने वाले नियोक्ताओं की संख्या',
    distinctEmployers: 'अलग-अलग नियोक्ता',
    presentAcrossVacancies: 'उपलब्ध रिक्तियों में',
    noFeasibleFound: 'वर्तमान सेटिंग्स के साथ कोई पहुँच योग्य अवसर नहीं मिला।',
    skillsNeededTitle: 'पात्रता हेतु आवश्यक कौशल अंतर',
    qualificationDeltaBadge: 'योग्यता अंतर',
    skillsNeededDesc: 'अतिरिक्त कौशल की संख्या के आधार पर वर्गीकृत स्थानीय अवसर',
    skillsAway1: '1 कौशल दूर',
    skillsAway2: '2 कौशल दूर',
    skillsAway3Plus: '3+ कौशल दूर',
    skillsAway1Label: 'पूरी योग्यता के लिए केवल एक कौशल की आवश्यकता',
    skillsAway2Label: 'दो अतिरिक्त कौशलों की आवश्यकता',
    skillsAway3PlusLabel: 'तीन या अधिक कौशल की आवश्यकता',

    opportunitiesReachTitle: 'पहुँच और कौशल संरेखण के अनुसार अवसर',
    opportunitiesReachSubtitle: 'अवसर आपकी पहुँच में क्यों आते हैं या बाहर क्यों हैं, इसका पारदर्शी विवरण',
    filterPlaceholder: 'पद, कौशल या क्षेत्र द्वारा खोजें...',
    tabFeasible: 'पहुँच योग्य',
    tabQualified: 'पूर्ण योग्य',
    tabNearMiss: 'निकटतम योग्य (1–2 कौशल)',
    tabAll: 'सभी अवसर',
    noMatchFilter: 'चयनित फ़िल्टर के अनुसार कोई अवसर नहीं मिला।',
    badgeVerifiedReady: 'सत्यापित और तैयार',
    badgeQualified: 'योग्य',
    badgeNearMiss: 'निकटतम योग्य',
    badgeOutOfReach: 'पहुँच से बाहर',
    shiftLabel: 'शिफ्ट',
    transportLabel: 'परिवहन',
    requiredCompetencies: 'आवश्यक कौशल',
    constraintGateBreakdown: 'बाधा विवरण:',
    viaLabel: 'द्वारा',
    minLabel: 'मिनट',

    mapTitle: 'स्थानिक यात्रा पहुँच और क्षेत्रीय सुविधाएं',
    mapSubtitle: 'स्पष्ट वर्गीकरण: पंजीकृत व्यावसायिक स्थल बनाम सक्रिय रिक्तियां',
    filterFacilities: 'व्यावसायिक स्थल',
    filterVacancies: 'नौकरी रिक्तियां',
    filterReachBoundary: 'पहुँच सीमा',
    civicTaxonomyNotice: 'नागरिक वर्गीकरण: चौकोर चिह्न व्यावसायिक स्थल (सुविधाएं) दर्शाते हैं। हीरे के आकार के चिह्न नौकरी रिक्तियां दर्शाते हैं।',
    radiusLabel: 'दायरा',
    candidateLocationTitle: 'आपका प्रारंभिक स्थान',
    candidateLocationSub: 'यात्रा गणना का आरंभ बिंदु',
    commuteHorizon: 'यात्रा सीमा',
    businessLocationBadge: 'व्यावसायिक स्थल',
    businessLocationNotice: '*पंजीकृत स्थल, सक्रिय रिक्ति नहीं।',
    jobVacancyBadge: 'नौकरी रिक्ति',
    inReachLabel: 'पहुँच के भीतर',
    outOfReachLabel: 'पहुँच से बाहर',
    inFeasibilityReach: 'पहुँच में',
    mapLegendCandidate: 'उम्मीदवार का स्थान',
    mapLegendFacilityInReach: 'व्यावसायिक स्थल (पहुँच में)',
    mapLegendFacilityOutReach: 'व्यावसायिक स्थल (पहुँच से बाहर)',
    mapLegendJobVacancy: 'नौकरी रिक्ति',
    mapCachedNotice: 'अनुमानित पहुँच — नक्शा किया हुआ सीमा नहीं',

    footerPlatform: 'Reach नागरिक मंच • स्थानीय कौशल व्यवहार्यता संरचना',
    footerEngine: 'इंजन: सटीक गणितीय मिलान • कोई नकली रुझान नहीं',
    employerHeader: 'स्थानीय नियोक्ता प्रबंधन',
    businessInfo: 'व्यापार जानकारी',
    postOpportunity: 'नया अवसर बनाएं',
    localReachSim: 'अनुमानित स्थानीय उम्मीदवार पहुँच',
  },
  fr: {
    appName: 'Reach',
    appTagline: 'Trouvez un travail à votre portée.',
    taglineSub: 'Reliez vos compétences locales à des opportunités concrètes qui vous conviennent.',
    civicPlatform: 'Plateforme Civique pour l’Emploi',
    continueCandidate: 'Continuer en tant que Candidat',
    continueEmployer: 'Continuer en tant qu’Employeur',
    backHome: 'Vue d’ensemble',
    offlineStatus: 'Prêt hors-ligne • Données en cache local',
    candidateDashboard: 'Tableau de bord Portée Candidat',
    employerPortal: 'Portail Employeur',
    candidateExperience: 'Expérience Candidat',
    opportunitySummary: 'Résumé des Opportunités',
    totalJobs: 'Total des Emplois Régionaux',
    totalJobsSubtext: 'Postes identifiés dans la région',
    feasibleJobs: 'Opportunités Accessibles',
    feasibleJobsSubtext: 'Dans votre rayon de déplacement et horaires',
    qualifiedJobs: 'Directement Qualifié',
    qualifiedJobsSubtext: 'Correspond à vos compétences déclarées',
    verifiedQualified: 'Prêt après Vérification',
    verifiedQualifiedSubtext: 'Compétences certifiées par des dossiers',
    vacanciesCount: 'postes',

    experienceHeading: 'Parlez-nous de votre expérience',
    experienceBadge: 'Extraction de Compétences en Langage Naturel',
    experienceDesc: 'Décrivez ce que vous avez fait avec vos propres mots. Nous identifierons vos compétences et trouverons des opportunités adaptées.',
    experienceSubDesc: 'Aucun intitulé de poste formel n’est requis. Expérience passée, entreprise familiale, tâches informelles ou bénévolat comptent.',
    editExperience: 'Modifier l’expérience',
    cancel: 'Annuler',
    experiencePlaceholder: 'Exemple : J’ai travaillé 4 ans dans le magasin familial. J’ai accueilli les clients, géré les stocks, fait la facturation sur Excel et tenu la caisse...',
    clickExampleToLoad: 'Ou cliquez sur un exemple pour le charger :',
    identifyMySkills: 'Identifier mes compétences',
    processingStep1: '1/3 : Analyse des tâches et responsabilités réelles...',
    processingStep2: '2/3 : Extraction des compétences et outils...',
    processingStep3: '3/3 : Évaluation de la portée géographique et des critères...',
    foundSkillsTitle: 'Nous avons identifié ces compétences dans votre expérience',
    identifiedCount: 'identifiées',
    identifiedFromExperience: 'Identifiées à partir de votre expérience',
    addAnotherSkill: 'Ajouter une autre compétence',
    addSkillBtn: 'Ajouter',
    lowSignalTitle: 'Nous n’avons pas encore identifié beaucoup de compétences.',
    lowSignalDesc: 'Décrivez vos activités quotidiennes : manipulation d’outils, accueil de clients, tenue de registres ou tâches manuelles.',
    editExperienceDesc: 'Modifier la description de l’expérience',
    step1Title: 'Entrée',
    step1Desc: 'Votre Expérience',
    step2Title: 'Extraites',
    step2Desc: 'Compétences Identifiées',
    step3Title: 'Résultat',
    step3Desc: 'accessible • qualifié',
    experienceMappedSuccess: 'Votre expérience est désormais associée à des opportunités.',
    deterministicModel: 'Modèle économique déterministe',
    verifiedBadge: 'Vérifié',

    valleyRegion: 'Région de la Vallée',
    profileEvalNotice: 'Évaluation basée sur les compétences vérifiées, modes de transport et disponibilités horaires.',
    commuteDistance: 'Trajet',
    hoursWindow: 'Horaires',
    profileCompetencies: 'Compétences du Profil',

    opportunitySimulatorTitle: 'Simulateur de Portée des Opportunités',
    sensitivityEngineBadge: 'Moteur Interactif de Sensibilité',
    simulatorDesc: 'Modélisation en temps réel : observez comment modifier distance, horaires ou transport élargit vos opportunités.',
    simulationNote: 'Mode simulation • Ne modifie pas votre profil enregistré',
    resetSimulation: 'Réinitialiser',
    activeSimReach: 'Portée Simulée Active',
    feasibleOpportunitiesAccessible: 'opportunités accessibles',
    deltaVsBase: 'Écart vs Base',
    additionalOpportunitiesUnlocked: 'opportunités régionales supplémentaires débloquées',
    constrainedBelowBaseline: 'Inférieur au profil de base',
    matchingBaseProfile: 'Conforme au profil candidat de référence',
    maxCommute: '1. Temps de Trajet Maximal',
    commuteWalk: '1.5 km (Marche Locale)',
    commuteBase: 'Base',
    commuteRegional: '16,0 km (Régional)',
    earliestStart: '2. Heure de Début au Plus Tôt',
    earlyStartDesc: 'Un début plus tôt ouvre l’accès aux postes agricoles et industriels avant 07h00',
    latestEnd: '3. Heure de Fin au Plus Tard',
    lateEndDesc: 'Une disponibilité tardive permet d’accéder aux centres logistiques et de tri',
    transportModes: '4. Modes de Transport Utilisables',
    modesActive: 'modes actifs',
    transportModesDesc: 'Ajouter les transports ou un deux-roues augmente votre vitesse de déplacement',
    singleConstraintRelaxation: 'Tests de Sensibilité à Contrainte Unique :',
    yieldLabel: 'Gain :',
    totalLabel: 'total',
    simulatorCivicDisclaimer: 'Mode Simulation : Les curseurs calculent l’accès en direct dans le navigateur sans modifier votre profil permanent.',

    economicAnalyticsTitle: 'Analyses de Faisabilité Économique Locale',
    derivedDatasetNotice: 'Issu directement du jeu de données régional actif',
    opportunityFunnelTitle: 'Entonnoir des Opportunités',
    sequentialGateBadge: 'Filtre Séquentiel',
    opportunityFunnelDesc: 'Réduction progressive de faisabilité depuis les postes régionaux jusqu’à la qualification',
    opportunitiesCount: 'opportunités',
    topSkillBundlesTitle: 'Principaux Ensembles de Compétences',
    trainingRoiBadge: 'Retour sur Formation',
    skillBundlesDesc: 'Classés par opportunités débloquées pour 10 heures de formation (jobsPer10Hours)',
    jobsPer10HoursLabel: 'postes / 10h formation',
    unlocksOpportunities: 'Débloque',
    coreSkillsLabel: 'Cœur',
    requestedSkillsTitle: 'Compétences Demandées à Proximité',
    feasibleOnlyBadge: 'Accessibles Uniquement',
    requestedSkillsDesc: 'Nombre d’employeurs distincts demandant chaque compétence dans votre zone',
    distinctEmployers: 'employeurs distincts',
    presentAcrossVacancies: 'Présent dans',
    noFeasibleFound: 'Aucune opportunité accessible avec les paramètres actuels.',
    skillsNeededTitle: 'Écart de Compétences pour Qualification',
    qualificationDeltaBadge: 'Écart de Qualification',
    skillsNeededDesc: 'Opportunités locales accessibles classées par nombre de compétences manquantes',
    skillsAway1: 'À 1 compétence',
    skillsAway2: 'À 2 compétences',
    skillsAway3Plus: 'À 3+ compétences',
    skillsAway1Label: 'Une seule compétence pour une qualification complète',
    skillsAway2Label: 'Deux compétences supplémentaires requises',
    skillsAway3PlusLabel: 'Trois compétences ou plus à acquérir',

    opportunitiesReachTitle: 'Opportunités par Portée et Compétences',
    opportunitiesReachSubtitle: 'Détail transparent expliquant pourquoi une offre correspond ou reste hors de portée',
    filterPlaceholder: 'Filtrer par titre, compétence ou secteur...',
    tabFeasible: 'Accessibles',
    tabQualified: 'Pleinement Qualifié',
    tabNearMiss: 'Presque Qualifié (1–2 compétences)',
    tabAll: 'Toutes les Opportunités',
    noMatchFilter: 'Aucune opportunité ne correspond aux critères sélectionnés.',
    badgeVerifiedReady: 'VÉRIFIÉ ET PRÊT',
    badgeQualified: 'QUALIFIÉ',
    badgeNearMiss: 'PRESQUE QUALIFIÉ',
    badgeOutOfReach: 'HORS DE PORTÉE',
    shiftLabel: 'Poste',
    transportLabel: 'Transport',
    requiredCompetencies: 'Compétences Requises',
    constraintGateBreakdown: 'Détail des Contraintes :',
    viaLabel: 'en',
    minLabel: 'min',

    mapTitle: 'Portée Géographique & Établissements Régionaux',
    mapSubtitle: 'Distinction visuelle claire : sites d’entreprises enregistrés vs postes vacants actifs',
    filterFacilities: 'Établissements',
    filterVacancies: 'Postes Vacants',
    filterReachBoundary: 'Rayon de Déplacement',
    civicTaxonomyNotice: 'Taxonomie Civique : Les marqueurs carrés indiquent des Sites d’Entreprises (infrastructures). Les losanges indiquent des Postes Vacants.',
    radiusLabel: 'Rayon',
    candidateLocationTitle: 'Votre Emplacement de Base',
    candidateLocationSub: 'Point d’origine pour les calculs de trajet',
    commuteHorizon: 'Horizon de Déplacement',
    businessLocationBadge: 'Site d’entreprise',
    businessLocationNotice: '*Établissement enregistré, pas un poste vacant.',
    jobVacancyBadge: 'Poste Vacant',
    inReachLabel: 'À Portée',
    outOfReachLabel: 'Hors de Portée',
    inFeasibilityReach: 'Accessible',
    mapLegendCandidate: 'Emplacement du Candidat',
    mapLegendFacilityInReach: 'Établissement (À Portée)',
    mapLegendFacilityOutReach: 'Établissement (Hors de Portée)',
    mapLegendJobVacancy: 'Poste Vacant',
    mapCachedNotice: 'Portée estimée — pas un tracé de trajet réel',

    footerPlatform: 'Plateforme Civique Reach • Architecture de Faisabilité Locale',
    footerEngine: 'Moteur : Correspondance Déterministe Pure • Sans Tendances Simulées',
    employerHeader: 'Gestion Employeurs Locaux',
    businessInfo: 'Informations Entreprise',
    postOpportunity: 'Créer une Opportunité',
    localReachSim: 'Portée Estimée des Candidats Locaux',
  },
  sw: {
    appName: 'Reach',
    appTagline: 'Pata kazi inayolingana na uwezo wako wa kufika.',
    taglineSub: 'Unganisha ujuzi wako wa eneo lako na fursa zinazokufaa na zinazofikika.',
    civicPlatform: 'Jukwaa la Kiraia la Ajira',
    continueCandidate: 'Endelea kama Mwombaji Kazi',
    continueEmployer: 'Endelea kama Mwajiri',
    backHome: 'Muhtasari',
    offlineStatus: 'Tayari Nje ya Mtandao • Data Imehifadhiwa',
    candidateDashboard: 'Dashibodi ya Uwezo wa Mwombaji',
    employerPortal: 'Tovuti ya Waajiri',
    candidateExperience: 'Uzoefu wa Mwombaji',
    opportunitySummary: 'Muhtasari wa Fursa',
    totalJobs: 'Jumla ya Kazi za Kanda',
    totalJobsSubtext: 'Nafasi za waajiri zilizotambuliwa eneo hili',
    feasibleJobs: 'Fursa Zinazofikika',
    feasibleJobsSubtext: 'Ndani ya umbali na masaa ya safari',
    qualifiedJobs: 'Mwenye Sifa Moja kwa Moja',
    qualifiedJobsSubtext: 'Inalingana na ujuzi uliobainisha',
    verifiedQualified: 'Tayari Baada ya Uthibitisho',
    verifiedQualifiedSubtext: 'Ujuzi uliothibitishwa na kumbukumbu',
    vacanciesCount: 'nafasi',

    experienceHeading: 'Tueleze kuhusu uzoefu wako',
    experienceBadge: 'Uchimbaji wa Ujuzi kwa Lugha ya Kawaida',
    experienceDesc: 'Eleza ulichofanya kwa maneno yako mwenyewe. Tutatambua ujuzi wako na kutafuta fursa zinazofaa.',
    experienceSubDesc: 'Huhitaji cheo rasmi. Kazi ya awali, biashara ya familia, vibarua, kujitolea au duka vyote vinahesabiwa.',
    editExperience: 'Hariri uzoefu',
    cancel: 'Ghairi',
    experiencePlaceholder: 'Mfano: Nilifanya kazi katika duka la familia kwa miaka 4. Nilihudumia wateja, nilisimamia bidhaa, nilifanya hesabu kwenye Excel na kushika kaunta...',
    clickExampleToLoad: 'Au bonyeza mfano kupakia:',
    identifyMySkills: 'Tambua Ujuzi Wangu',
    processingStep1: '1/3: Kuchambua majukumu na kazi halisi...',
    processingStep2: '2/3: Kutoa ujuzi na zana zilizotumika...',
    processingStep3: '3/3: Kutathmini umbali na vigezo vya kazi...',
    foundSkillsTitle: 'Tumetambua ujuzi huu katika uzoefu wako',
    identifiedCount: 'zimetambuliwa',
    identifiedFromExperience: 'Imebainishwa kutoka uzoefu wako',
    addAnotherSkill: 'Ongeza ujuzi mwingine',
    addSkillBtn: 'Ongeza',
    lowSignalTitle: 'Bado hatujatambua ujuzi mwingi.',
    lowSignalDesc: 'Tafadhali eleza ulichofanya kila siku: huduma kwa wateja, matumizi ya vifaa, utunzaji wa rekodi au kazi za mikono.',
    editExperienceDesc: 'Hariri maelezo ya uzoefu',
    step1Title: 'Ingizo',
    step1Desc: 'Uzoefu Wako',
    step2Title: 'Zilizotolewa',
    step2Desc: 'Ujuzi Uliotambuliwa',
    step3Title: 'Matokeo',
    step3Desc: 'inafikika • amehitimu',
    experienceMappedSuccess: 'Uzoefu wako sasa umeunganishwa na fursa za kazi.',
    deterministicModel: 'Mfumo thabiti wa kiuchumi',
    verifiedBadge: 'Imethibitishwa',

    valleyRegion: 'Eneo la Bonde',
    profileEvalNotice: 'Tathmini inategemea ujuzi uliothibitishwa, njia za usafiri na masaa ya upatikanaji.',
    commuteDistance: 'Safari',
    hoursWindow: 'Masaa',
    profileCompetencies: 'Ujuzi wa Wasifu',

    opportunitySimulatorTitle: 'Kielelezo cha Uwezo wa Fursa',
    sensitivityEngineBadge: 'Injini ya Majaribio ya Safari',
    simulatorDesc: 'Tathmini ya moja kwa moja: Angalia jinsi kurekebisha umbali, masaa au usafiri kunavyoongeza fursa zako.',
    simulationNote: 'Mfumo wa majaribio tu • Haubadilishi wasifu wako uliopo',
    resetSimulation: 'Rejesha Upya',
    activeSimReach: 'Uwezo wa Majaribio Uliopo',
    feasibleOpportunitiesAccessible: 'fursa zinazofikika kwa urahisi',
    deltaVsBase: 'Tofauti na Msingi',
    additionalOpportunitiesUnlocked: 'fursa za ziada za kikanda zimefunguliwa',
    constrainedBelowBaseline: 'Chini ya wasifu wa msingi',
    matchingBaseProfile: 'Inalingana na wasifu wa kawaida wa mwombaji',
    maxCommute: '1. Muda wa Juu wa Kusafiri',
    commuteWalk: '1.5 km (Kutembea kwa Miguu)',
    commuteBase: 'Msingi',
    commuteRegional: '16.0 km (Kikanda)',
    earliestStart: '2. Muda wa Kuanza Mapema Zaidi',
    earlyStartDesc: 'Kuanza mapema kunafungua kazi za kilimo na viwanda kabla ya 07:00',
    latestEnd: '3. Muda wa Kumaliza wa Mwisho',
    lateEndDesc: 'Kupatikana hadi jioni kunasaidia kazi za maghala na usambazaji',
    transportModes: '4. Njia za Usafiri Zinazotumika',
    modesActive: 'njia zinazotumika',
    transportModesDesc: 'Kuongeza usafiri wa umma au pikipiki huongeza kasi ya safari',
    singleConstraintRelaxation: 'Vipimo vya Majaribio ya Kizuizi Kimoja:',
    yieldLabel: 'Faida:',
    totalLabel: 'jumla',
    simulatorCivicDisclaimer: 'Hali ya Majaribio: Hesabu hufanyika papo hapo kwenye kivinjari. Haibadilishi wasifu wako wala kutuma taarifa kwa waajiri.',

    economicAnalyticsTitle: 'Takwimu za Kiuchumi za Upatikanaji wa Kazi',
    derivedDatasetNotice: 'Inatokana moja kwa moja na data halisi ya eneo',
    opportunityFunnelTitle: 'Mfuatano wa Fursa',
    sequentialGateBadge: 'Kichujio cha Hatua',
    opportunityFunnelDesc: 'Kupungua kwa fursa kuanzia nafasi zote hadi sifa zilizothibitishwa',
    opportunitiesCount: 'fursa',
    topSkillBundlesTitle: 'Makundi Makuu ya Ujuzi',
    trainingRoiBadge: 'Thamani ya Mafunzo',
    skillBundlesDesc: 'Yamepangwa kwa kazi zilizofunguliwa kwa kila masaa 10 ya mafunzo (jobsPer10Hours)',
    jobsPer10HoursLabel: 'kazi / masaa 10 mafunzo',
    unlocksOpportunities: 'Inafungua',
    coreSkillsLabel: 'Msingi',
    requestedSkillsTitle: 'Ujuzi Unaohitajika Karibu',
    feasibleOnlyBadge: 'Zinazofikika Tu',
    requestedSkillsDesc: 'Idadi ya waajiri wanaohitaji kila ujuzi ndani ya umbali wako wa safari',
    distinctEmployers: 'waajiri tofauti',
    presentAcrossVacancies: 'Iko katika',
    noFeasibleFound: 'Hakuna fursa zinazofikika kwa vigezo vya sasa.',
    skillsNeededTitle: 'Pengo la Ujuzi Kufikia Sifa',
    qualificationDeltaBadge: 'Pengo la Sifa',
    skillsNeededDesc: 'Fursa zinazofikika zilizopangwa kwa idadi ya ujuzi unaokosekana',
    skillsAway1: 'Ujuzi 1 umepungua',
    skillsAway2: 'Ujuzi 2 imepungua',
    skillsAway3Plus: 'Ujuzi 3+ imepungua',
    skillsAway1Label: 'Pengo la ujuzi mmoja kufikia sifa kamili',
    skillsAway2Label: 'Inahitaji ujuzi wawili wa ziada',
    skillsAway3PlusLabel: 'Mapengo matatu au zaidi ya ujuzi',

    opportunitiesReachTitle: 'Fursa kwa Uwezo wa Kufika na Ujuzi',
    opportunitiesReachSubtitle: 'Ufafanuzi wazi wa kwanini nafasi inafaa au iko nje ya uwezo wako',
    filterPlaceholder: 'Tafuta kwa nafasi, ujuzi au sekta...',
    tabFeasible: 'Zinazofikika',
    tabQualified: 'Mwenye Sifa Kamili',
    tabNearMiss: 'Karibu Kuhitimu (Ujuzi 1–2)',
    tabAll: 'Fursa Zote',
    noMatchFilter: 'Hakuna fursa zilizopatikana kwa vigezo ulivyochagua.',
    badgeVerifiedReady: 'IMETHIBITISHWA NA TAYARI',
    badgeQualified: 'AMEHITIMU',
    badgeNearMiss: 'KARIBU KUHITIMU',
    badgeOutOfReach: 'NJE YA UWEZO',
    shiftLabel: 'Zamu',
    transportLabel: 'Usafiri',
    requiredCompetencies: 'Ujuzi Unaohitajika',
    constraintGateBreakdown: 'Mchanganuo wa Vizuizi:',
    viaLabel: 'kwa',
    minLabel: 'dak',

    mapTitle: 'Uwezo wa Kijiografia na Vituo vya Kikanda',
    mapSubtitle: 'Uainishaji wazi: maeneo ya biashara yaliyosajiliwa dhidi ya nafasi za kazi wazi',
    filterFacilities: 'Vituo vya Biashara',
    filterVacancies: 'Nafasi za Kazi',
    filterReachBoundary: 'Mpaka wa Kufika',
    civicTaxonomyNotice: 'Ufafanuzi wa Alama: Alama za mraba zinaonyesha Vituo vya Biashara (majengo). Alama za almasi zinaonyesha Nafasi za Kazi.',
    radiusLabel: 'Kipenyo',
    candidateLocationTitle: 'Mahali Ulipo',
    candidateLocationSub: 'Kianzio cha mahesabu ya usafiri',
    commuteHorizon: 'Upeo wa Safari',
    businessLocationBadge: 'Kituo cha Biashara',
    businessLocationNotice: '*Kituo kilichosajiliwa, si nafasi ya kazi wazi.',
    jobVacancyBadge: 'Nafasi ya Kazi',
    inReachLabel: 'Ndani ya Uwezo',
    outOfReachLabel: 'Nje ya Uwezo',
    inFeasibilityReach: 'Inafikika',
    mapLegendCandidate: 'Mahali pa Mwombaji',
    mapLegendFacilityInReach: 'Kituo cha Biashara (Kinafikika)',
    mapLegendFacilityOutReach: 'Kituo cha Biashara (Nje ya Uwezo)',
    mapLegendJobVacancy: 'Nafasi ya Kazi',
    mapCachedNotice: 'Umbali uliokadiriwa — si mpaka uliopimwa',

    footerPlatform: 'Jukwaa la Kiraia la Reach • Muundo wa Uwezo wa Kazi wa Eneo',
    footerEngine: 'Injini: Hesabu Sahihi za Kazi • Hakuna Makadirio Bandia',
    employerHeader: 'Usimamizi wa Waajiri wa Ndani',
    businessInfo: 'Taarifa za Biashara',
    postOpportunity: 'Tengeneza Fursa Mpya',
    localReachSim: 'Makadirio ya Wafanyakazi Wanaoweza Kufika',
  },
};

/**
 * Legacy per-skill translation dictionary from reach-frontend. Keyed on its
 * old ~40-key regex skill taxonomy — NOT our 113-skill data/skills.json.
 * Not used by this app's components (see file header); kept per CLAUDE.md
 * §16 rather than deleted.
 */
export const SKILL_TRANSLATIONS: Record<string, Record<LanguageCode, string>> = {
  customer_service: {
    en: 'Customer Service',
    es: 'Atención al Cliente',
    hi: 'ग्राहक सेवा',
    fr: 'Service Client',
    sw: 'Huduma kwa Wateja',
  },
  inventory_logging: {
    en: 'Inventory Management',
    es: 'Gestión de Inventario',
    hi: 'इन्वेंट्री प्रबंधन',
    fr: 'Gestion des Stocks',
    sw: 'Usimamizi wa Bidhaa',
  },
  inventory_management: {
    en: 'Inventory Management',
    es: 'Gestión de Inventario',
    hi: 'इन्वेंट्री प्रबंधन',
    fr: 'Gestion des Stocks',
    sw: 'Usimamizi wa Bidhaa',
  },
  data_entry: {
    en: 'Data Entry & Spreadsheets',
    es: 'Entrada de Datos y Hojas de Cálculo',
    hi: 'डेटा प्रविष्टि और स्प्रेडशीट',
    fr: 'Saisie de Données & Tableurs',
    sw: 'Kuingiza Data na Majedwali',
  },
  basic_recordkeeping: {
    en: 'Basic Recordkeeping',
    es: 'Registro Básico de Datos',
    hi: 'बुनियादी रिकॉर्ड रखना',
    fr: 'Tenue de Registres de Base',
    sw: 'Utunzaji wa Rekodi wa Msingi',
  },
  cash_handling: {
    en: 'Cash Counter & Register Handling',
    es: 'Manejo de Caja y Cobro',
    hi: 'कैश काउंटर और रजिस्टर प्रबंधन',
    fr: 'Tenue de Caisse & Encaissement',
    sw: 'Kushika Kaunta na Pesa',
  },
  cold_storage_handling: {
    en: 'Cold Storage Handling',
    es: 'Manejo de Almacenamiento en Frío',
    hi: 'कोल्ड स्टोरेज प्रबंधन',
    fr: 'Manutention en Chambre Froide',
    sw: 'Utunzaji wa Hifadhi ya Baridi',
  },
  forklift_operation: {
    en: 'Forklift Operation',
    es: 'Operación de Montacargas',
    hi: 'फोर्कलिफ्ट संचालन',
    fr: 'Conduite de Chariot Élévateur',
    sw: 'Uendeshaji wa Forklift',
  },
  heavy_lifting: {
    en: 'Heavy Material Lifting',
    es: 'Carga de Material Pesado',
    hi: 'भारी सामग्री उठाना',
    fr: 'Port de Charges Lourdes',
    sw: 'Kunyanyua Mizigo Mizito',
  },
  safety_compliance: {
    en: 'Workplace Safety Compliance',
    es: 'Cumplimiento de Seguridad Laboral',
    hi: 'कार्यस्थल सुरक्षा अनुपालन',
    fr: 'Conformité Sécurité au Travail',
    sw: 'Uzingatiaji wa Usalama Kazini',
  },
  power_tools: {
    en: 'Power Tool Operation',
    es: 'Operación de Herramientas Eléctricas',
    hi: 'इलेक्ट्रिक टूल्स संचालन',
    fr: 'Utilisation d’Outillage Électroportatif',
    sw: 'Matumizi ya Vifaa vya Umeme',
  },
  basic_welding: {
    en: 'Basic Welding & Fabrication',
    es: 'Soldadura Básica y Fabricación',
    hi: 'बुनियादी वेल्डिंग और निर्माण',
    fr: 'Soudure de Base & Assemblage',
    sw: 'Uchomeleaji wa Msingi',
  },
  machine_operation: {
    en: 'Machine Operation & Maintenance',
    es: 'Operación de Maquinaria',
    hi: 'मशीन संचालन और रखरखाव',
    fr: 'Conduite de Machines',
    sw: 'Uendeshaji wa Mashine',
  },
  shipping_receiving: {
    en: 'Shipping & Receiving Logistics',
    es: 'Logística de Envíos y Recepción',
    hi: 'शिपिंग और प्राप्ति रसद',
    fr: 'Réception & Expédition Logistique',
    sw: 'Upokeaji na Usafirishaji Bidhaa',
  },
  bilingual_spanish: {
    en: 'Bilingual Translation (Spanish)',
    es: 'Traducción Bilingüe (Español)',
    hi: 'द्विभाषी अनुवाद (स्पेनिश)',
    fr: 'Traduction Bilingue (Espagnol)',
    sw: 'Tafsiri ya Lugha Mbili (Kihispania)',
  },
  patient_intake: {
    en: 'Patient Intake & Reception',
    es: 'Recepción y Registro de Pacientes',
    hi: 'रोगी पंजीकरण और स्वागत',
    fr: 'Accueil & Enregistrement des Patients',
    sw: 'Mapokezi na Usajili wa Wagonjwa',
  },
  food_prep: {
    en: 'Commercial Food Preparation',
    es: 'Preparación de Alimentos',
    hi: 'व्यावसायिक खाद्य तैयारी',
    fr: 'Préparation Culinaire',
    sw: 'Utayarishaji wa Chakula',
  },
  sanitation: {
    en: 'Facility Sanitation & Hygiene',
    es: 'Higiene y Desinfección de Instalaciones',
    hi: 'स्वच्छता और सफाई प्रबंधन',
    fr: 'Nettoyage & Désinfection des Locaux',
    sw: 'Usafi na Usafi wa Mazingira',
  },
  vehicle_maintenance: {
    en: 'Basic Vehicle Maintenance',
    es: 'Mantenimiento Básico de Vehículos',
    hi: 'बुनियादी वाहन रखरखाव',
    fr: 'Entretien de Base des Véhicules',
    sw: 'Ukarabati wa Msingi wa Magari',
  },
  packing_sorting: {
    en: 'Packing & Sorting Logistics',
    es: 'Empaque y Clasificación',
    hi: 'पैकिंग और छंटाई रसद',
    fr: 'Emballage & Tri Logistique',
    sw: 'Upakiaji na Upangaji Bidhaa',
  },
};

/** Legacy fallback formatter — not used for our skill IDs, see file header. */
export function getLocalizedSkillName(rawSkill: string, lang: LanguageCode | string = 'en'): string {
  const clean = rawSkill.toLowerCase().trim();
  const validLang = (['en', 'es', 'hi', 'fr', 'sw'].includes(lang) ? lang : 'en') as LanguageCode;
  if (SKILL_TRANSLATIONS[clean] && SKILL_TRANSLATIONS[clean][validLang]) {
    return SKILL_TRANSLATIONS[clean][validLang];
  }
  return rawSkill
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Localized transport mode names, keyed on our TransportMode
 * ("walk" | "cycle" | "bus" | "two_wheeler") — rekeyed from
 * reach-frontend's "walking" | "bicycle" | "transit" | "motorcycle".
 */
export const TRANSPORT_MODE_TRANSLATIONS: Record<TransportMode, Record<LanguageCode, string>> = {
  walk: {
    en: 'Walking',
    es: 'Caminando',
    hi: 'पैदल',
    fr: 'Marche',
    sw: 'Kutembea',
  },
  cycle: {
    en: 'Bicycle',
    es: 'Bicicleta',
    hi: 'साइकिल',
    fr: 'Vélo',
    sw: 'Baiskeli',
  },
  bus: {
    en: 'Bus',
    es: 'Transporte Público',
    hi: 'सार्वजनिक परिवहन',
    fr: 'Transports en Commun',
    sw: 'Usafiri wa Umma',
  },
  two_wheeler: {
    en: 'Two-Wheeler',
    es: 'Motocicleta',
    hi: 'मोटरसाइकिल',
    fr: 'Deux-Roues',
    sw: 'Pikipiki',
  },
};

export function getLocalizedTransportMode(mode: TransportMode, lang: LanguageCode | string = 'en'): string {
  const validLang = (['en', 'es', 'hi', 'fr', 'sw'].includes(lang) ? lang : 'en') as LanguageCode;
  return TRANSPORT_MODE_TRANSLATIONS[mode]?.[validLang] || mode;
}

/** Localized prompt examples for the candidate experience input. */
export interface LocalizedPromptExample {
  id: string;
  tag: Record<LanguageCode, string>;
  text: Record<LanguageCode, string>;
}

export const LOCALIZED_PROMPT_EXAMPLES: LocalizedPromptExample[] = [
  {
    id: 'family_biz',
    tag: {
      en: 'Family showroom & retail',
      es: 'Tienda familiar y ventas',
      hi: 'पारिवारिक शोरूम और खुदरा',
      fr: 'Boutique familiale & vente',
      sw: 'Duka la familia na mauzo',
    },
    text: {
      en: "I worked at my father's showroom for 4 years. I handled customers, managed inventory, did billing using Excel, and handled the cash counter.",
      es: "Trabajé en la tienda de mi padre durante 4 años. Atendí clientes, administré el inventario, hice facturas en Excel y cobré en caja.",
      hi: "मैंने 4 साल अपने पिता के शोरूम में काम किया। ग्राहकों को संभाला, इन्वेंट्री संभाली, एक्सेल में बिलिंग की और कैश काउंटर संभाला।",
      fr: "J'ai travaillé dans le magasin de mon père pendant 4 ans. J'ai accueilli les clients, géré les stocks, fait la facturation sur Excel et tenu la caisse.",
      sw: "Nilifanya kazi katika duka la baba yangu kwa miaka 4. Nilihudumia wateja, nilisimamia bidhaa, nilifanya hesabu kwenye Excel na kushika kaunta ya fedha.",
    },
  },
  {
    id: 'shop_mgmt',
    tag: {
      en: 'Neighborhood store helper',
      es: 'Ayudante de tienda de barrio',
      hi: 'मोहल्ले की दुकान में सहायक',
      fr: 'Aide-épicerie de quartier',
      sw: 'Msaidizi wa duka la mtaani',
    },
    text: {
      en: "Helped manage a busy neighborhood grocery shop. Handled daily customer checkout, received stock shipments, logged delivery items, and kept basic recordkeeping ledgers.",
      es: "Ayudé a administrar una tienda de comestibles muy transitada. Atendí caja, recibí pedidos de mercadería, registré entregas y llevé libros contables básicos.",
      hi: "मोहल्ले की व्यस्त किराने की दुकान को संभालने में मदद की। दैनिक ग्राहक चेकआउट संभाला, स्टॉक शिपमेंट प्राप्त किया, डिलीवरी दर्ज की और बुनियादी बहीखाता रखा।",
      fr: "J'ai aidé à gérer une épicerie de quartier très fréquentée. J'ai géré les encaissements, réceptionné les livraisons, enregistré les marchandises et tenu le registre.",
      sw: "Nilisaidia kuendesha duka lenye wateja wengi mtaani. Nilihudumia wateja, nilipokea mizigo, nilinakili bidhaa na kuweka vitabu vya msingi vya hesabu.",
    },
  },
  {
    id: 'construction_crew',
    tag: {
      en: 'Construction & workshop',
      es: 'Construcción y taller',
      hi: 'निर्माण और कार्यशाला',
      fr: 'Chantier & atelier',
      sw: 'Ujenzi na karakana',
    },
    text: {
      en: "Worked with a local construction and repair crew. Handled power tools safely, did heavy material lifting, assisted with basic welding, and set up safety detour signs.",
      es: "Trabajé con un equipo local de construcción y reparaciones. Usé herramientas eléctricas de forma segura, cargué materiales pesados, ayudé en soldadura básica y coloqué señalización de seguridad.",
      hi: "स्थानीय निर्माण और मरम्मत दल के साथ काम किया। सुरक्षित रूप से इलेक्ट्रिक टूल्स चलाए, भारी सामान उठाया, वेल्डिंग में सहायता की और सुरक्षा संकेत लगाए।",
      fr: "J'ai travaillé avec une équipe locale de rénovation et bâtiment. J'ai utilisé des outils électriques en toute sécurité, porté des charges lourdes, aidé en soudure et posé des panneaux de sécurité.",
      sw: "Nilifanya kazi na mafundi wa ujenzi na ukarabati. Nilitumia vifaa vya umeme kwa usalama, nilinyanyua mizigo mizito, nilisaidia kuchomelea na kuweka alama za usalama barabarani.",
    },
  },
  {
    id: 'warehouse_logistics',
    tag: {
      en: 'Warehouse & packing',
      es: 'Almacén y empaque',
      hi: 'गोदाम और पैकिंग',
      fr: 'Entrepôt & emballage',
      sw: 'Ghala na upakiaji',
    },
    text: {
      en: "Worked in a regional packaging depot. Handled forklift moving, scanned barcodes on incoming crates, did temperature checks in cold storage, and logged inventory.",
      es: "Trabajé en un centro logístico regional de empaque. Manejé montacargas, escaneé códigos de barras, verifiqué temperaturas en almacenamiento en frío y registré inventarios.",
      hi: "एक क्षेत्रीय पैकेजिंग डिपो में काम किया। फोर्कलिफ्ट चलाई, आने वाले बक्सों पर बारकोड स्कैन किए, कोल्ड स्टोरेज में तापमान की जांच की और इन्वेंट्री लॉग की।",
      fr: "J'ai travaillé dans un centre logistique régional. J'ai conduit un chariot élévateur, scanné les codes-barres des caisses, vérifié les températures en chambre froide et géré les stocks.",
      sw: "Nilifanya kazi katika kituo kikuu cha kufungasha mizigo. Niliendesha forklift, niliskani kadi za mizigo iliyoingia, nilikagua viwango vya joto kwenye ghala la baridi na kuweka kumbukumbu.",
    },
  },
  {
    id: 'community_clinic',
    tag: {
      en: 'Clinic support & intake',
      es: 'Apoyo en clínica y recepción',
      hi: 'क्लिनिक सहायता और पंजीकरण',
      fr: 'Soutien clinique & accueil',
      sw: 'Msaada wa zahanati na mapokezi',
    },
    text: {
      en: "Volunteered at a local community health center. Assisted with patient intake and appointment scheduling, did computer data entry, and helped with patient inquiries.",
      es: "Fui voluntario en un centro de salud comunitario local. Ayudé en la recepción de pacientes y asignación de citas, hice ingreso de datos en computadora y atendí consultas.",
      hi: "स्थानीय सामुदायिक स्वास्थ्य केंद्र में स्वयंसेवा की। रोगी पंजीकरण और अपॉइंटमेंट शेड्यूलिंग में सहायता की, कंप्यूटर डेटा प्रविष्टि की और रोगियों की पूछताछ में मदद की।",
      fr: "J'ai été bénévole dans un centre de santé communautaire. J'ai aidé à l'accueil des patients et à la prise de rendez-vous, fait de la saisie informatique et orienté les usagers.",
      sw: "Nilijitolea katika kituo cha afya cha jamii. Nilisaidia usajili wa wagonjwa na ratiba za miadi, niliingiza data kwenye kompyuta na kusaidia maswali ya wagonjwa.",
    },
  },
];
