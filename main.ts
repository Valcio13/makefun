// Deterministic no-model baseline for photo-geolocator-01.
// This prior is a single global point estimated from the public practice references;
// it contains no photo lookup table, training data, network access, or credentials.
const PRIOR = Object.freeze({ lat: 56.785, lon: 27.01 });

interface Photo {
  id: string;
  url: string;
  answered: boolean;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value.replace(/\/+$/, '');
}

async function request(url: string, options: RequestInit = {}): Promise<string> {
  const response = await fetch(url, options);
  const body = await response.text();
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}: ${body.slice(0, 300)}`);
  return body;
}

async function main() {
  const envUrl = required('MAKEFUN_ENV_URL');
  const listing = JSON.parse(await request(`${envUrl}/photos`)) as { photos: Photo[] };
  if (!Array.isArray(listing.photos)) throw new Error('environment returned no photos array');

  const answers = listing.photos
    .filter((photo) => !photo.answered)
    .map((photo) => ({ id: photo.id, lat: PRIOR.lat, lon: PRIOR.lon }));
  if (answers.length === 0) {
    process.stdout.write('No unanswered photos.\n');
    return;
  }

  const result = JSON.parse(await request(`${envUrl}/answers`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ answers }),
  })) as { accepted: string[] };
  process.stdout.write(`Submitted ${answers.length} of ${listing.photos.length} photos; accepted ${result.accepted.length}.\n`);
}

main().catch((error) => {
  process.stderr.write(`photo-geolocator: ${error.stack ?? error}\n`);
  process.exitCode = 1;
});
