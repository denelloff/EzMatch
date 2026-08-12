const { Card, CardHeader, CardBody, Field, Input, Select, Checkbox, Button, Notice } = window.EZMatchDesignSystem_ab9a05;

const TEAMS = [
  { value: 'navi', label: 'NAVI' }, { value: 'faze', label: 'FaZe' }, { value: 'vitality', label: 'Vitality' },
  { value: 'spirit', label: 'Spirit' }, { value: 'g2', label: 'G2' }, { value: 'mouz', label: 'MOUZ' },
];
const MAPS = [
  { value: 'de_ancient', label: 'Ancient' }, { value: 'de_anubis', label: 'Anubis' }, { value: 'de_dust2', label: 'Dust II' },
  { value: 'de_inferno', label: 'Inferno' }, { value: 'de_mirage', label: 'Mirage' }, { value: 'de_nuke', label: 'Nuke' },
  { value: 'de_overpass', label: 'Overpass' }, { value: 'de_train', label: 'Train' }, { value: 'de_vertigo', label: 'Vertigo' },
];

function CreateMatchScreen({ onCreate }) {
  const [created, setCreated] = React.useState(false);
  return (
    <div style={{ maxWidth: 880, display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <div>
        <h1 style={{ margin: 0, font: 'var(--type-h1)', color: 'var(--text-strong)' }}>Create a match</h1>
        <p style={{ margin: '2px 0 0', font: 'var(--type-body)', color: 'var(--text-faint)' }}>Pick CT and T from your teams, choose MR / knife, and assign a free server.</p>
      </div>

      {created ? <Notice tone="info">Match created as a draft. Start it from “My matches” to push settings to the server.</Notice> : null}

      <Card>
        <CardHeader title="Teams" description="Left side starts CT." />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
            <Field label="Team CT (left)"><Select placeholder="Select a team" options={TEAMS} defaultValue="navi" /></Field>
            <Field label="Team T (right)"><Select placeholder="Select a team" options={TEAMS} defaultValue="faze" /></Field>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Match config" />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-12)' }}>
            <Field label="Map"><Select placeholder="Select a map" options={MAPS} defaultValue="de_mirage" /></Field>
            <Field label="Max rounds" hint="MR12 = 24 total rounds (12 per half)."><Input type="number" defaultValue={24} /></Field>
            <Field label="Freezetime" hint="Seconds before each LIVE round (Valve competitive = 15)."><Input type="number" defaultValue={15} /></Field>
            <Field label="Tactical pause" hint="!pause length in seconds."><Input type="number" defaultValue={30} /></Field>
            <Field label="Pauses / team" hint="!pause uses per team in regulation."><Input type="number" defaultValue={4} /></Field>
            <Field label="Tech pause budget" hint="Shared !tech seconds for the match (default 600)."><Input type="number" defaultValue={600} /></Field>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-16)', marginTop: 'var(--space-12)' }}>
            <Checkbox label="Knife round" defaultChecked />
            <Checkbox label="Overtime on a tie" defaultChecked />
            <Checkbox label="Wait for GOTV delay" />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Server" description="Only running servers without an open match." />
        <CardBody>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-12)' }}>
            <Field label="Server"><Select placeholder="Select a server" options={[{ value: 'ams-02', label: 'ams-02 · retake' }, { value: 'fra-03', label: 'fra-03 · main' }]} /></Field>
            <Field label="Server password" hint="Optional. Applied as sv_password when the match starts."><Input type="password" placeholder="optional" /></Field>
          </div>
        </CardBody>
      </Card>

      <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
        <Button onClick={() => { setCreated(true); onCreate && onCreate(); }}>Create match</Button>
        <Button variant="secondary">Cancel</Button>
      </div>
    </div>
  );
}
Object.assign(window, { CreateMatchScreen });
