# Air Quality Egg CSV Downloader

A lightweight Node.js command-line utility for downloading sensor data from the [Air Quality Egg](https://airqualityegg.com/) API in CSV format.

The utility supports API key authentication, configurable date ranges, multiple devices, sensor column selection, and time-based aggregation.

Configuration can be supplied through a JSON configuration file, environment variables, or command-line arguments.

## Features

- Download Air Quality Egg sensor data directly to CSV
- Authenticate using an API key
- Specify one or more device serial numbers
- Select start and end dates
- Optionally filter sensor columns
- Optionally aggregate measurements by time interval
- Configure using JSON, environment variables, or command-line arguments
- Override individual configuration settings without modifying the configuration file
- No external npm dependencies

## Requirements

- Node.js 18 or newer
- An Air Quality Egg API key
- Access to the devices whose data you want to download

API documentation: https://airqualityegg.com/api-docs/

## Installation

Clone the repository:

```bash
git clone https://github.com/YOUR_USERNAME/airqualityegg-csv-downloader.git
cd airqualityegg-csv-downloader
```

No `npm install` is necessary. The script uses only built-in Node.js functionality.

## Configuration

The utility supports three configuration methods:

1. Command-line arguments
2. Environment variables
3. JSON configuration file

Settings are resolved in the following order of precedence:

**Command line > Environment variables > Configuration file > Built-in defaults**

This allows a configuration file to provide standard settings while individual values can be overridden as needed.

### JSON Configuration File

Create a file named `aqe-config.json` in the working directory:

```json
{
  "apiKey": "YOUR_API_KEY",
  "serial": "egg1234567890abcdef",
  "start": "2026-11-01",
  "end": "2026-11-09",
  "columns": "temperature,humidity,co2",
  "resolution": "PT1H",
  "output": "aqe-data.csv"
}
```

All settings are optional individually, provided that the required settings are supplied through another configuration method.

The required settings are:

- `apiKey` — Your Air Quality Egg API key
- `serial` — Device serial number(s)
- `start` — Beginning of the requested date range
- `end` — End of the requested date range

The default output filename is `aqe-data.csv`.

To use a different configuration file:

```bash
node download-aqe.js --config /path/to/config.json
```

### Environment Variables

Settings can also be supplied through environment variables:

```bash
export AQE_API_KEY="YOUR_API_KEY"
export AQE_SERIAL="egg1234567890abcdef"
export AQE_START="2026-11-01"
export AQE_END="2026-11-09"
export AQE_OUTPUT="aqe-data.csv"
```

### Configuration Reference

