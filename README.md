# Fantasy Football Report API

## Overview

This project is a simple API designed to provide formatted data for a Fantasy Football league. It interacts with the Sleeper API to collect data on league standings, matchups, and other relevant information, and then formats that data for use in other applications.

The website is available here: [Fantasy Football Report](https://us-central1-fifth-boulder-274618.cloudfunctions.net/sleeper-data-puller/api/v1/report)

## Features

- **Retrieve League Standings**: Fetches and processes the current standings for users in the league.
- **Matchups Breakdown**: Provides detailed analysis of current matchups between league teams.

The data is exposed through a RESTful endpoint that returns JSON.

## Setup Instructions

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/fantasy-football-report-api.git
   cd fantasy-football-report-api
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

3. Configure environment variables: You may need to configure API keys or league information as environment variables. Create a `.env` file in the root directory and add the following:
   ```
   SLEEPER_API_KEY=your_sleeper_api_key_here
   LEAGUE_YEAR=current_league_year_here
   ```

### Running the Server

To start the server in development mode:
```bash
yarn start
```

The API will be accessible at `http://localhost:3000/api/v1/report`.

## API Endpoints

### GET `/api/v1/report`

This endpoint provides a summary of the current league standings and matchups.

- **Response**: JSON object containing:
    - `standings`: The current standings of all users in the league.
    - `matchupsBreakdown`: A breakdown of the current week's matchups between teams.

  - **Example Response**:
    ```json
    {
    "standings": [
      {
        "userId": "737674610933448704",
        "rosterId": 12,
        "displayName": "jdarsinos",
        "shortName": "Jessie",
        "teamName": "Team jdarsinos",
        "wins": 6,
        "losses": 2,
        "ties": 0,
        "pointsFor": 1255,
        "pointsAgainst": 1093,
        "streak": "2W",
        "waiverBudgetUsed": 17
      },
      {
        "userId": "602535346160336896",
        "rosterId": 5,
        "displayName": "ajiji3",
        "shortName": "Jiji",
        "teamName": "Prepare4TroubleNMakeIt2x",
        "wins": 6,
        "losses": 2,
        "ties": 0,
        "pointsFor": 1126,
        "pointsAgainst": 1103,
        "streak": "2L",
        "waiverBudgetUsed": 50
      },
      ...
     ],
      "matchupsBreakdown": {
        "previousMatchups": [
            {
                "week": 1,
                "matchups": [
                    [
                        {
                            "totalPoints": 95.08,
                            "startingPoints": {
                                "Evan Engram": 1.5,
                                "Gus Edwards": 3.8,
                                "Jonathan Taylor": 10.8,
                                "Michael Pittman": 7.1,
                                "Tyler Bass": 12,
                                "Jaylen Warren": 4,
                                "Anthony Richardson": 35.98,
                                "Jaxon Smith-Njigba": 3.9,
                                "Marvin Harrison": 1.4,
                                "Malik Nabers": 11.6,
                                "Baltimore Ravens": 3
                            },
                            "benchPoints": {
                                "Tyler Conklin": 1.6,
                                "Rashod Bateman": 8.3,
                                "Justin Fields": 13.04,
                                "Ty Chandler": 7.2,
                                "Blake Corum": 0,
                                "Adonai Mitchell": 1.2,
                                "Kimani Vidal": 0
                            },
                            "userId": "583434980294701056",
                            "shortName": "Steven"
                        },
                        {
                            "totalPoints": 134.08,
                            "startingPoints": {
                                "Mike Evans": 23.1,
                                "Jared Goff": 17.18,
                                "Christian McCaffrey": 0,
                                "Curtis Samuel": 3.5,
                                "Josh Jacobs": 11.4,
                                "D'Andre Swift": 5,
                                "Trey McBride": 8,
                                "Dalton Kincaid": 2.1,
                                "Brandon Aubrey": 25,
                                "Xavier Worthy": 21.8,
                                "Pittsburgh Steelers": 17
                            },
                            "benchPoints": {
                                "Hollywood Brown": 0,
                                "Gabe Davis": 9.2,
                                "Brock Purdy": 11.24,
                                "MarShawn Lloyd": 0,
                                "Luke McCaffrey": 4.8
                            },
                            "userId": "676195526546391040",
                            "shortName": "Bradley"
                        }
                    ],
                    ...
                ]
            },
        ],
        "currentMatchups": [
          ...
        ],
        "futureMatchups": [
          ...
        ]
      }
    }
    ```

## Deployment

To deploy the API as a cloud function using Yarn, follow these steps:

1. Ensure all dependencies are installed:
   ```bash
   yarn install
   ```
2. Deploy the function using Yarn:
   ```bash
   yarn deploy
   ```
   This command will deploy the cloud function based on your cloud configuration settings. Make sure that your cloud environment is properly configured to handle Node.js functions and that you have provided the appropriate permissions.
