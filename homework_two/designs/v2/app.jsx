/* Main app — design canvas with three AGP Command Station options + Tweaks. */

const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "light",
  "role": "SoftwareEngineer",
  "assistant": "AGP Assistant"
}/*EDITMODE-END*/;

function OptionFrame({ initial, App, viewportTag, kicker, tagTone = 'dark', hideTag }) {
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
      {!hideTag && (
        <div style={{
          position: 'absolute', top: 8, left: 8,
          padding: '3px 8px',
          background: tagTone === 'amber' ? 'rgba(235,182,59,0.92)' : 'rgba(0,0,0,0.55)',
          color: tagTone === 'amber' ? '#1a1306' : 'rgba(255,255,255,0.85)',
          fontSize: 10.5,
          fontFamily: 'JetBrains Mono, ui-monospace, monospace',
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          borderRadius: 4,
          pointerEvents: 'none',
          zIndex: 100,
          fontWeight: 600,
        }}>
          {viewportTag}
          {kicker && <span style={{ marginLeft: 8, opacity: 0.8 }}>· {kicker}</span>}
        </div>
      )}
    </div>
  );
}

/* Standalone Profile Settings screen rendered in its own artboard. We wrap it
 * in a tiny shell that locks the screen on 'profile' so it renders directly. */
function ProfileFrame({ initial }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', background: '#0a0e13' }}>
      <AGPProvider initial={initial}>
        <ProfileShell />
      </AGPProvider>
    </div>
  );
}

function ProfileShell() {
  const { theme } = useAGP();
  return (
    <div className={`agp-app theme-${theme}`} style={{ position: 'absolute', inset: 0 }}>
      <OPTB2.ProfileSettings onBack={() => {}} />
    </div>
  );
}

function Root() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('agp:tweaks', { detail: tweaks }));
  }, [tweaks]);

  function resetAll() { window.location.reload(); }

  return (
    <>
      <DesignCanvas>
        <DCSection
          id="agp-command-station-v2"
          title="AGP Command Station"
          subtitle="Option B v2 with the revision brief applied · A & C kept for reference"
        >
          <DCArtboard
            id="optB2"
            label="B v2 · Workbench (revised)"
            width={1340}
            height={900}
          >
            <OptionFrame
              initial={tweaks}
              App={OPTB2.App}
              hideTag
            />
          </DCArtboard>

          <DCArtboard
            id="optA"
            label="A · Command Bridge"
            width={1340}
            height={900}
          >
            <OptionFrame
              initial={tweaks}
              App={OPTA.App}
              hideTag
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
              hideTag
            />
          </DCArtboard>
        </DCSection>

        <DCSection
          id="profile-and-states"
          title="Profile Settings (new screen in v2)"
          subtitle="Accessible from the user menu in the workbench. Direct view here for review."
        >
          <DCArtboard
            id="profile"
            label="Profile Settings"
            width={1100}
            height={900}
          >
            <ProfileFrame initial={tweaks} />
          </DCArtboard>
        </DCSection>

        <DCPostIt x={40} y={40} width={300}>
          <strong>B v2 — what changed</strong><br /><br />
          1. Assistant name removed (auto-read from local config)<br />
          2. Work Item Builder: all roles · type defaults by role<br />
          3. Test connection on Anthropic / ADO / GitHub<br />
          4. Teams channel picker (no more manual entry)<br />
          5. ChannelMessage.Send scope warning<br />
          6. Error / empty / credential states everywhere<br />
          7. New Profile Settings page<br />
          8. AI ops: skeleton → result → error → retry<br />
          9. Bell dropdown with grouped notifications<br />
          10. ⌘K command palette · ⌘/ shortcuts<br />
          12. Role pill in nav<br /><br />
          <em>Hover the corner panel inside B v2 to toggle error / scope / credential states. Try ⌘K, ⌘/, the bell, and the user menu.</em>
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

        <TweakSection label="Demo" />
        <TweakButton label="Reset all prototypes" onClick={resetAll} />
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root />);
