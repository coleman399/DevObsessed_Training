/* Main app — design canvas with three AGP Command Station options + Tweaks. */

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "role": "SoftwareEngineer",
  "assistant": "AGP Assistant"
}/*EDITMODE-END*/;

const ROLE_OPTIONS = [
  { value: 'ProductOwner',     label: 'PO' },
  { value: 'SoftwareEngineer', label: 'SE' },
  { value: 'QA',               label: 'QA' },
];

const THEME_OPTIONS = ['light', 'dark'];

/* Each option is wrapped in an AGPProvider whose state is driven by a
 * window-level CustomEvent broadcast from the Tweaks panel. We render all
 * three artboards inside one Tweaks scope so changing role/theme syncs them. */

function OptionFrame({ initial, App, viewportTag, kicker }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: '#0a0e13',
    }}>
      <AGPProvider initial={initial}>
        <App />
      </AGPProvider>
      {/* viewport tag in the corner — tiny hint */}
      <div style={{
        position: 'absolute', top: 8, left: 8,
        padding: '3px 8px',
        background: 'rgba(0,0,0,0.55)',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 10.5,
        fontFamily: 'JetBrains Mono, ui-monospace, monospace',
        letterSpacing: '.1em',
        textTransform: 'uppercase',
        borderRadius: 4,
        pointerEvents: 'none',
        zIndex: 100,
      }}>
        {viewportTag}
        {kicker && <span style={{ marginLeft: 8, color: 'rgba(255,255,255,0.55)' }}>· {kicker}</span>}
      </div>
    </div>
  );
}

function Root() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  /* Broadcast tweak changes to the prototypes' AGPProviders */
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('agp:tweaks', { detail: tweaks }));
  }, [tweaks]);

  /* Reset prototype state on demand (sign-out resets each option). */
  function resetAll() {
    /* Reload the whole iframe — simplest way to fully reset the three apps. */
    window.location.reload();
  }

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="agp-command-station"
          title="AGP Command Station"
          subtitle="Three end-to-end designs for homework_two · Microsoft sign-in → onboarding → workspace"
        >
          <DCArtboard
            id="optA"
            label="A · Command Bridge"
            width={1340}
            height={900}
          >
            <OptionFrame
              initial={tweaks}
              App={OPTA.App}
              viewportTag="1340 × 900"
              kicker="3-pane workspace · navy app bar"
            />
          </DCArtboard>

          <DCArtboard
            id="optB"
            label="B · Workbench"
            width={1340}
            height={900}
          >
            <OptionFrame
              initial={tweaks}
              App={OPTB.App}
              viewportTag="1340 × 900"
              kicker="tab-first · slide-out AI drawer"
            />
          </DCArtboard>

          <DCArtboard
            id="optC"
            label="C · Console"
            width={1340}
            height={900}
          >
            <OptionFrame
              initial={tweaks}
              App={OPTC.App}
              viewportTag="1340 × 900"
              kicker="icon rail · persistent AI dock"
            />
          </DCArtboard>
        </DCSection>

        <DCPostIt x={40} y={40} width={260}>
          <strong>Read me</strong><br /><br />
          Each artboard is fully interactive — sign in with Microsoft, walk the onboarding,
          and use the chat, work-item builder, PR review, and compose modals.<br /><br />
          <strong>Tweaks</strong> (bottom right) syncs role + theme across all three options
          so you can compare side-by-side. Click an artboard's expand icon to focus it.
        </DCPostIt>
      </DesignCanvas>

      <TweaksPanel title="AGP Tweaks" noDeckControls>
        <TweakSection label="Theme & role" />
        <TweakRadio
          label="Theme"
          value={tweaks.theme}
          options={['light', 'dark']}
          onChange={(v) => setTweak('theme', v)}
        />
        <TweakRadio
          label="Role"
          value={tweaks.role}
          options={[
            { value: 'ProductOwner',     label: 'PO' },
            { value: 'SoftwareEngineer', label: 'SE' },
            { value: 'QA',               label: 'QA' },
          ]}
          onChange={(v) => setTweak('role', v)}
        />

        <TweakSection label="Assistant" />
        <TweakText
          label="Name"
          value={tweaks.assistant}
          placeholder="AGP Assistant"
          onChange={(v) => setTweak('assistant', v)}
        />

        <TweakSection label="Demo" />
        <TweakButton label="Reset all three prototypes" onClick={resetAll} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
