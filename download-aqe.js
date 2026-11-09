const fs = require('node:fs');
const path = require('node:path');
const { Readable } = require('node:stream');
const { pipeline } = require('node:stream/promises');

const DEFAULT_CONFIG = 'aqe-config.json';

const OPTIONS = {
  apiKey:     { cli: 'api-key',    env: 'AQE_API_KEY' },
  serial:     { cli: 'serial',     env: 'AQE_SERIAL' },
  start:      { cli: 'start',      env: 'AQE_START' },
  end:        { cli: 'end',        env: 'AQE_END' },
  columns:    { cli: 'columns',    env: 'AQE_COLUMNS' },
  resolution: { cli: 'resolution', env: 'AQE_RESOLUTION' },
  output:     { cli: 'output',     env: 'AQE_OUTPUT' }
};

function parseArgs(argv) {
  const args = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
      continue;
    }

    if (!arg.startsWith('--')) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    const eq = arg.indexOf('=');
    let key, value;

    if (eq !== -1) {
      key = arg.slice(2, eq);
      value = arg.slice(eq + 1);
    } else {
      key = arg.slice(2);
      value = argv[++i];
    }

    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }

    args[key] = value;
  }

  return args;
}

function printHelp() {
  console.log(`
Air Quality Egg CSV Downloader

Usage:
  node download-aqe.js [options]

Options:
  --api-key       API key
  --serial        Device serial number(s), comma-separated
  --start         Start date (YYYY-MM-DD)
  --end           End date (YYYY-MM-DD)
  --columns       Comma-separated sensor columns
  --resolution    Aggregation interval (e.g. PT1H)
  --output        Output CSV filename
  --config        Configuration JSON file
  --help, -h      Show this help

Configuration precedence:
  Command line > Environment > JSON file > Defaults

Default configuration file:
  aqe-config.json

Environment variables:
  AQE_API_KEY
  AQE_SERIAL
  AQE_START
  AQE_END
  AQE_COLUMNS
  AQE_RESOLUTION
  AQE_OUTPUT
`);
}

function loadConfig(filename, required = false) {
  const configPath = path.resolve(filename);

  if (!fs.existsSync(configPath)) {
    if (required) {
      throw new Error(`Config file not found: ${configPath}`);
    }
    return {};
  }

  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Unable to read config file ${configPath}: ${error.message}`
    );
  }
}

function resolveConfig(args) {
  const configFile = args.config || DEFAULT_CONFIG;
  const fileConfig = loadConfig(configFile, !!args.config);

  const config = {
    output: 'aqe-data.csv'
  };

  for (const [key, option] of Object.entries(OPTIONS)) {
    if (fileConfig[key] !== undefined) {
      config[key] = fileConfig[key];
    }

    if (process.env[option.env] !== undefined) {
      config[key] = process.env[option.env];
    }

    if (args[option.cli] !== undefined) {
      config[key] = args[option.cli];
    }
  }

  return config;
}

async function downloadCSV(config) {
  const { apiKey, serial, start, end, columns, resolution, output } = config;

  if (!apiKey) {
    throw new Error('API key is required');
  }

  if (!serial) {
    throw new Error('Device serial number is required');
  }

  if (!start || !end) {
    throw new Error('Start and end dates are required');
  }

  const url = new URL(
    `https://airqualityegg.com/api/v2/messages/device/${encodeURIComponent(serial)}`
  );

  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('format', 'csv');
  url.searchParams.set('start-date', start);
  url.searchParams.set('end-date', end);

  if (columns) {
    url.searchParams.set(
      'columns',
      Array.isArray(columns) ? columns.join(',') : columns
    );
  }

  if (resolution) {
    url.searchParams.set('resolution', resolution);
  }

  console.log(`Downloading data for: ${serial}`);
  console.log(`Date range: ${start} to ${end}`);
  console.log(`Output file: ${output}`);

  const response = await fetch(url, {
    headers: {
      Accept: 'text/csv'
    },
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    const body = await response.text();

    throw new Error(
      `API request failed (HTTP ${response.status}): ${body}`
    );
  }

  if (!response.body) {
    throw new Error('API returned an empty response');
  }

  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('application/json')) {
    const body = await response.text();
    throw new Error(`Unexpected JSON response: ${body}`);
  }

  const outputPath = path.resolve(output);

  await pipeline(
    Readable.fromWeb(response.body),
    fs.createWriteStream(outputPath)
  );

  console.log(`CSV saved successfully: ${outputPath}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.help) {
    printHelp();
    return;
  }

  const config = resolveConfig(args);
  await downloadCSV(config);
}

main().catch(error => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});

