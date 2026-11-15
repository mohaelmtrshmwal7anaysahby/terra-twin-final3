import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, Download, Info, RotateCcw } from 'lucide-react';
import {
  ActionButton,
  AnimatedCounter,
  ModalDialog,
  ScientificTooltip,
  SurfacePanel,
  qualityPresentation,
} from '../components/DesignSystem';
import {
  AxisAlignmentBarChart,
  RadarComparisonChart,
  ThermalLineChart,
} from '../components/charts/ScientificCharts';
import { useObservatory } from '../context/ObservatoryContext';
import {
  calculateComparison,
  DEFAULT_WEIGHTS,
  EARTH_ANALOG_SITES,
  PLANETARY_REGIONS,
} from '../data/planetaryData';
import {
  ComparisonWeights,
  PlanetaryRegionId,
} from '../types/terratwin';

const REGION_IDS: PlanetaryRegionId[] = [
  'mars-jezero',
  'mars-gale',
  'moon-mare',
  'moon-south-pole',
];

export const ComparePage: React.FC = () => {
  const { locale, level, route, navigate, t } = useObservatory();

  const siteId = route.compareSiteId || 'atacama';
  const regionId = (route.compareRegionId || 'mars-jezero') as PlanetaryRegionId;
  const [weights, setWeights] = useState<ComparisonWeights>(DEFAULT_WEIGHTS);
  const [methodologyOpen, setMethodologyOpen] = useState(false);

  const selectedSite =
    EARTH_ANALOG_SITES.find((s) => s.id === siteId) ?? EARTH_ANALOG_SITES[0];
  const selectedRegion = PLANETARY_REGIONS[regionId] ?? PLANETARY_REGIONS['mars-jezero'];

  const comparison = useMemo(
    () => calculateComparison(selectedSite, selectedRegion, weights),
    [selectedSite, selectedRegion, weights]
  );

  const handleSiteChange = (id: string) => {
    navigate('compare', { compareSiteId: id, compareRegionId: regionId });
  };

  const handleRegionChange = (rid: PlanetaryRegionId) => {
    navigate('compare', { compareSiteId: siteId, compareRegionId: rid });
  };

  const handleExportCsv = () => {
    const header = [
      t.compare.axisLabel,
      t.compare.earthValueLabel,
      t.compare.targetValueLabel,
      'Similarity %',
      t.compare.qualityLabel,
      t.compare.varianceLabel,
    ];
    const rows = comparison.axes.map((ax) => [
      t.compare.axisNames[ax.key],
      ax.earthDisplay[locale],
      ax.planetDisplay[locale],
      ax.similarityPct !== null ? `${ax.similarityPct}` : 'NULL',
      t.compare.qualityNames[ax.quality],
      ax.deltaDisplay[locale],
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `terratwin-${selectedSite.id}-vs-${selectedRegion.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const accentPlanetColor =
    selectedRegion.planet === 'mars'
      ? 'text-tt-mars-deep dark:text-tt-mars'
      : 'text-[#475569] dark:text-[#CBD5E1]';

  const planetBarColor =
    selectedRegion.planet === 'mars'
      ? 'bg-tt-mars-deep dark:bg-tt-mars'
      : 'bg-[#64748B] dark:bg-[#CBD5E1]';

  return (
    <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10 py-10 space-y-10">
      {/* Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-tt-ink/10 dark:border-white/10">
        <div className="space-y-2 max-w-2xl">
          <p className="text-xs font-mono-tabular text-tt-teal-deep dark:text-tt-teal">
            {t.nav.compare}
          </p>
          <h1 className="font-display text-[clamp(1.9rem,3.6vw,3rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-tt-ink dark:text-tt-paper">
            {t.compare.title}
          </h1>
          <p className="text-sm sm:text-base text-tt-slate dark:text-tt-mist">
            {t.compare.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            variant="secondary"
            size="sm"
            onClick={() => setMethodologyOpen(true)}
          >
            <Info className="w-4 h-4" />
            <span>{t.compare.verifiedMethodology}</span>
          </ActionButton>

          {(level === 'scientist' || level === 'pioneer') && (
            <ActionButton variant="primary" size="sm" onClick={handleExportCsv}>
              <Download className="w-4 h-4" />
              <span>{t.compare.exportCsv}</span>
            </ActionButton>
          )}
        </div>
      </div>

      {/* Dual Selector Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SurfacePanel className="p-5 space-y-2">
          <label
            htmlFor="earth-site-select"
            className="block text-xs font-medium text-tt-teal-deep dark:text-tt-teal"
          >
            {t.compare.selectEarthSite}
          </label>
          <select
            id="earth-site-select"
            value={siteId}
            onChange={(e) => handleSiteChange(e.target.value)}
            className="w-full rounded-lg border border-tt-ink/15 dark:border-tt-sand/20 bg-tt-paper dark:bg-[#04070D] px-3.5 py-2.5 text-sm font-medium text-tt-ink dark:text-tt-paper focus:outline-none focus:ring-2 focus:ring-[#2A9D9F]"
          >
            {EARTH_ANALOG_SITES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name[locale]} — {s.country[locale]}
                {s.missingDataNotes ? ` (${t.explorer.missingTag})` : ''}
              </option>
            ))}
          </select>
        </SurfacePanel>

        <SurfacePanel className="p-5 space-y-2">
          <label
            htmlFor="planetary-target-select"
            className="block text-xs font-medium text-[#9C7F50] dark:text-tt-sand"
          >
            {t.compare.selectPlanetaryTarget}
          </label>
          <select
            id="planetary-target-select"
            value={regionId}
            onChange={(e) => handleRegionChange(e.target.value as PlanetaryRegionId)}
            className="w-full rounded-lg border border-tt-ink/15 dark:border-tt-sand/20 bg-tt-paper dark:bg-[#04070D] px-3.5 py-2.5 text-sm font-medium text-tt-ink dark:text-tt-paper focus:outline-none focus:ring-2 focus:ring-[#2A9D9F]"
          >
            {REGION_IDS.map((rid) => {
              const r = PLANETARY_REGIONS[rid];
              return (
                <option key={rid} value={rid}>
                  {t.explorer.targets[r.planet]} · {r.name[locale]}
                </option>
              );
            })}
          </select>
        </SurfacePanel>
      </div>

      {/* Composite Similarity Score Banner (With Animated Count-Up & Honest Null Withholding) */}
      <motion.div
        key={`${siteId}-${regionId}-${comparison.overallScore ?? 'null'}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <SurfacePanel className="p-6 sm:p-8">
          {comparison.isReliable && comparison.overallScore !== null ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3 text-xs font-mono-tabular text-tt-teal-deep dark:text-tt-teal">
                  <span>{t.compare.similarityScoreTitle}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {comparison.verifiedAxisCount}/{comparison.totalAxisCount}{' '}
                    {t.compare.axesVerifiedLabel}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-tt-ink dark:text-tt-paper">
                  {selectedSite.name[locale]} ↔ {selectedRegion.name[locale]}
                </h2>
                <p className="text-sm text-tt-slate dark:text-tt-mist">
                  {selectedRegion.adaptiveOverview[level][locale]}
                </p>
              </div>

              <div className="flex items-center gap-5 shrink-0" dir="ltr">
                <div className="relative w-24 h-24 flex items-center justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                    <circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      className="stroke-tt-ink/10 dark:stroke-white/10"
                      strokeWidth="8"
                    />
                    <motion.circle
                      cx="50"
                      cy="50"
                      r="42"
                      fill="none"
                      stroke="#2A9D9F"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={264}
                      initial={{ strokeDashoffset: 264 }}
                      animate={{
                        strokeDashoffset: 264 - (264 * comparison.overallScore) / 100,
                      }}
                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </svg>
                  <AnimatedCounter
                    value={comparison.overallScore}
                    suffix="%"
                    className="absolute text-2xl font-semibold text-tt-ink dark:text-tt-paper"
                  />
                </div>
              </div>
            </div>
          ) : comparison.provisionalScore !== null ? (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex items-center gap-3 text-xs font-mono-tabular text-[#8C6D3F] dark:text-tt-sand">
                  <span className="rounded-full border border-current px-2 py-0.5">
                    {t.compare.provisionalScoreBadge}
                  </span>
                  <span>
                    {comparison.verifiedAxisCount}/{comparison.totalAxisCount} {t.compare.axesVerifiedLabel}
                  </span>
                </div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-tt-ink dark:text-tt-paper">
                  {selectedSite.name[locale]} ↔ {selectedRegion.name[locale]}
                </h2>
                <p className="text-sm font-medium text-tt-mars-deep dark:text-[#E58464]">
                  {t.compare.provisionalScoreTitle}
                </p>
                <p className="text-sm text-tt-slate dark:text-tt-mist leading-relaxed">
                  {comparison.insufficiencyReason?.[locale]}
                </p>
              </div>
              <div className="relative w-24 h-24 flex items-center justify-center shrink-0" dir="ltr">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
                  <circle cx="50" cy="50" r="42" fill="none" className="stroke-tt-ink/10 dark:stroke-white/10" strokeWidth="8" />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#D9C5A3"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="264 8"
                    initial={{ strokeDashoffset: 264 }}
                    animate={{ strokeDashoffset: 264 - (264 * comparison.provisionalScore) / 100 }}
                    transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  />
                </svg>
                <AnimatedCounter
                  value={comparison.provisionalScore}
                  suffix="%"
                  className="absolute text-2xl font-semibold text-tt-ink dark:text-tt-paper"
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="p-2.5 rounded-lg bg-tt-mars-deep/12 dark:bg-tt-mars/20 text-tt-mars-deep dark:text-[#E58464] shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1.5">
                <h2 className="font-display text-xl font-semibold text-tt-ink dark:text-tt-paper">
                  {t.compare.scoreUnavailableTitle}
                </h2>
                <p className="text-sm text-tt-slate dark:text-tt-mist leading-relaxed">
                  {comparison.insufficiencyReason?.[locale]}
                </p>
              </div>
            </div>
          )}
        </SurfacePanel>
      </motion.div>

      {/* Pioneer Level: Interactive Axis Weighting Console + ISRU Assessment */}
      {level === 'pioneer' && (
        <div className="space-y-6">
          <SurfacePanel elevated className="p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="font-display text-base font-semibold text-tt-ink dark:text-tt-paper">
                {t.compare.pioneerWeightsTitle}
              </h3>
              <button
                type="button"
                onClick={() => setWeights(DEFAULT_WEIGHTS)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-tt-teal-deep dark:text-tt-teal hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.compare.resetWeights}</span>
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {(Object.keys(weights) as (keyof ComparisonWeights)[]).map((key) => (
                <label key={key} className="space-y-1.5 block">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-tt-ink dark:text-tt-paper">
                      {t.compare.axisNames[key]}
                    </span>
                    <span className="font-mono-tabular text-tt-teal-deep dark:text-tt-teal">
                      {weights[key].toFixed(1)}×
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={2}
                    step={0.1}
                    value={weights[key]}
                    onChange={(e) =>
                      setWeights((prev) => ({
                        ...prev,
                        [key]: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-[#2A9D9F] cursor-pointer"
                  />
                </label>
              ))}
            </div>
          </SurfacePanel>

          <SurfacePanel className="p-6 border-tt-teal-deep/25 dark:border-tt-teal/30 space-y-2">
            <h3 className="font-display text-sm font-semibold text-tt-teal-deep dark:text-tt-teal">
              {t.location.pioneerSectionTitle}
            </h3>
            <p className="text-sm text-tt-slate dark:text-[#CBD5E1] leading-relaxed">
              {selectedSite.pioneerIsruNotes[locale]}
            </p>
          </SurfacePanel>
        </div>
      )}

      {/* Student Level: Interactive Scientific Terminology Glossary */}
      {level === 'student' && (
        <SurfacePanel elevated className="p-5 flex flex-wrap items-center justify-between gap-4">
          <span className="text-xs font-semibold text-tt-teal-deep dark:text-tt-teal">
            {t.compare.studentGlossaryTitle}:
          </span>
          <div className="flex flex-wrap items-center gap-5 text-xs text-tt-ink dark:text-tt-paper">
            {t.compare.glossaryTerms.map((item) => (
              <ScientificTooltip
                key={item.term}
                term={item.term}
                explanation={item.definition}
              />
            ))}
          </div>
        </SurfacePanel>
      )}

      {/* Multi-Chart Data Visualization Grid (Radar + Bar + Line) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <SurfacePanel className="lg:col-span-5 p-6 space-y-4">
          <h3 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
            {t.compare.radarTitle}
          </h3>
          <RadarComparisonChart
            axes={comparison.axes}
            axisLabels={t.compare.axisNames}
            earthLabel={selectedSite.name[locale]}
            planetLabel={selectedRegion.name[locale]}
            planetType={selectedRegion.planet}
          />
        </SurfacePanel>

        <div className="lg:col-span-7 space-y-8">
          <SurfacePanel className="p-6 space-y-4">
            <h3 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
              {t.compare.barChartTitle}
            </h3>
            <AxisAlignmentBarChart
              axes={comparison.axes}
              axisLabels={t.compare.axisNames}
              nullLabel={t.compare.nullIncompleteLabel}
            />
          </SurfacePanel>

          {level !== 'explorer' && (
            <SurfacePanel className="p-6 space-y-4">
              <h3 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
                {t.compare.thermalLineTitle}
              </h3>
              <ThermalLineChart
                primarySeries={selectedSite.thermalProfile24h}
                primaryLabel={selectedSite.name[locale]}
                secondarySeries={selectedRegion.thermalProfile24h}
                secondaryLabel={selectedRegion.name[locale]}
                secondaryAccent={selectedRegion.planet}
              />
            </SurfacePanel>
          )}
        </div>
      </div>

      {/* Side-by-Side Mineralogy & Geological Features Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <SurfacePanel className="p-6 space-y-5">
          <h3 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
            {t.compare.mineralComparisonTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-tt-teal-deep dark:text-tt-teal">
                {selectedSite.name[locale]}
              </p>
              {selectedSite.minerals.map((m) => (
                <div key={m.formula} className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-tt-ink dark:text-tt-paper">{m.name[locale]}</span>
                    <span className="font-mono-tabular text-tt-slate dark:text-tt-mist" dir="ltr">
                      {m.percentage !== null ? `${m.percentage}%` : t.location.notQuantified}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-tt-ink/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-tt-teal-deep dark:bg-tt-teal"
                      style={{ width: `${m.percentage ?? 100}%`, opacity: m.percentage === null ? 0.25 : 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <p className={`text-xs font-semibold ${accentPlanetColor}`}>
                {selectedRegion.name[locale]}
              </p>
              {selectedRegion.minerals.map((m) => (
                <div key={m.formula} className="space-y-1">
                  <div className="flex items-center justify-between text-xs gap-2">
                    <span className="text-tt-ink dark:text-tt-paper">{m.name[locale]}</span>
                    <span className="font-mono-tabular text-tt-slate dark:text-tt-mist" dir="ltr">
                      {m.percentage !== null ? `${m.percentage}%` : t.location.notQuantified}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-tt-ink/10 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${planetBarColor}`}
                      style={{ width: `${m.percentage ?? 100}%`, opacity: m.percentage === null ? 0.25 : 1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SurfacePanel>

        <SurfacePanel className="p-6 space-y-5">
          <h3 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
            {t.compare.geologyComparisonTitle}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2.5">
              <p className="text-xs font-semibold text-tt-teal-deep dark:text-tt-teal">
                {selectedSite.name[locale]}
              </p>
              <ul className="space-y-2 text-sm text-tt-slate dark:text-tt-mist">
                {selectedSite.geologicalFeatures.map((feat) => (
                  <li
                    key={feat.en}
                    className="pb-2 border-b border-tt-ink/8 dark:border-white/8 last:border-0 last:pb-0"
                  >
                    {feat[locale]}
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2.5">
              <p className={`text-xs font-semibold ${accentPlanetColor}`}>
                {selectedRegion.name[locale]}
              </p>
              <ul className="space-y-2 text-sm text-tt-slate dark:text-tt-mist">
                {selectedRegion.geologicalFeatures.map((feat) => (
                  <li
                    key={feat.en}
                    className="pb-2 border-b border-tt-ink/8 dark:border-white/8 last:border-0 last:pb-0"
                  >
                    {feat[locale]}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </SurfacePanel>
      </div>

      {/* Scientific Parameter Comparison Table (Scientist & Pioneer Density) */}
      {(level === 'scientist' || level === 'pioneer') && (
        <SurfacePanel className="overflow-hidden">
          <div className="p-6 border-b border-tt-ink/10 dark:border-white/10">
            <h3 className="font-display text-lg font-semibold text-tt-ink dark:text-tt-paper">
              {t.compare.tableTitle}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse">
              <thead>
                <tr className="border-b border-tt-ink/10 dark:border-white/10 text-xs text-tt-slate dark:text-tt-mist bg-[#EEF2F6]/60 dark:bg-[#04070D]/60">
                  <th className="py-3.5 px-6 text-start font-medium">{t.compare.axisLabel}</th>
                  <th className="py-3.5 px-6 text-start font-medium">{t.compare.earthValueLabel}</th>
                  <th className="py-3.5 px-6 text-start font-medium">{t.compare.targetValueLabel}</th>
                  <th className="py-3.5 px-6 text-start font-medium">{t.compare.varianceLabel}</th>
                  <th className="py-3.5 px-6 text-start font-medium">{t.compare.qualityLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tt-ink/8 dark:divide-white/8 text-sm">
                {comparison.axes.map((ax) => {
                  const { glyph: qualityGlyph, tone: qualityClass } = qualityPresentation(ax.quality);

                  return (
                    <tr key={ax.key} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-4 px-6 font-medium text-tt-ink dark:text-tt-paper">
                        <div>{t.compare.axisNames[ax.key]}</div>
                        <div className="text-xs font-normal text-tt-slate dark:text-tt-mist mt-0.5">
                          {ax.note[locale]}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-mono-tabular text-tt-teal-deep dark:text-tt-teal" dir="ltr">
                        {ax.earthDisplay[locale]}
                      </td>
                      <td className={`py-4 px-6 font-mono-tabular ${accentPlanetColor}`} dir="ltr">
                        {ax.planetDisplay[locale]}
                      </td>
                      <td className="py-4 px-6 font-mono-tabular text-tt-slate dark:text-[#CBD5E1]" dir="ltr">
                        {ax.deltaDisplay[locale]}
                      </td>
                      <td className={`py-4 px-6 text-xs font-mono-tabular whitespace-nowrap ${qualityClass}`}>
                        <span title={t.compare.qualityHelp[ax.quality]}>
                          {qualityGlyph} {t.compare.qualityNames[ax.quality]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </SurfacePanel>
      )}

      {level === 'explorer' && (
        <p className="text-xs text-tt-slate dark:text-tt-mist text-center py-2">
          {t.compare.explorerModeNote}
        </p>
      )}

      {/* Similarities, Divergences & Sources */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <SurfacePanel className="p-6 space-y-3">
          <h3 className="font-display text-base font-semibold text-tt-teal-deep dark:text-tt-teal">
            {t.compare.similaritiesHeading}
          </h3>
          <ul className="space-y-2.5 text-sm text-tt-slate dark:text-tt-mist">
            {comparison.keySimilarities.map((item) => (
              <li key={item.en} className="leading-relaxed">
                {item[locale]}
              </li>
            ))}
          </ul>
        </SurfacePanel>

        <SurfacePanel className="p-6 space-y-3">
          <h3 className="font-display text-base font-semibold text-tt-mars-deep dark:text-tt-mars">
            {t.compare.divergencesHeading}
          </h3>
          <ul className="space-y-2.5 text-sm text-tt-slate dark:text-tt-mist">
            {comparison.keyDivergences.map((item) => (
              <li key={item.en} className="leading-relaxed">
                {item[locale]}
              </li>
            ))}
          </ul>
        </SurfacePanel>

        <SurfacePanel className="p-6 space-y-3">
          <h3 className="font-display text-base font-semibold text-tt-ink dark:text-tt-paper">
            {t.compare.sourcesHeading}
          </h3>
          <div className="space-y-3 text-xs">
            {[...selectedSite.sources, ...selectedRegion.sources].map((src) => (
              <div key={src.id}>
                <p className="font-medium text-tt-ink dark:text-tt-paper">{src.title}</p>
                <p className="text-tt-slate dark:text-tt-mist">
                  {src.institution} · {src.year} ·{' '}
                  <span className="font-mono-tabular text-tt-teal-deep dark:text-tt-teal" dir="ltr">
                    {src.identifier}
                  </span>
                </p>
              </div>
            ))}
          </div>
        </SurfacePanel>
      </div>

      {/* Methodology Modal */}
      <ModalDialog
        open={methodologyOpen}
        onClose={() => setMethodologyOpen(false)}
        title={t.compare.methodologyModalTitle}
      >
        <div className="space-y-4">
          <p className="text-sm text-tt-slate dark:text-tt-mist leading-relaxed">
            {t.compare.methodologyBody}
          </p>
          <div className="flex justify-end">
            <ActionButton variant="primary" size="sm" onClick={() => setMethodologyOpen(false)}>
              {t.compare.closeModal}
            </ActionButton>
          </div>
        </div>
      </ModalDialog>
    </div>
  );
};
