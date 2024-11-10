# Fantasy Football Report API

## Overview

This project is a simple API designed to provide formatted data for a Fantasy Football league. It interacts with the [Sleeper API](https://docs.sleeper.com/) to collect data on league standings, matchups, and other relevant information, and then formats that data for use in other applications.

The website is available here: [Fantasy Football Report](https://us-central1-fifth-boulder-274618.cloudfunctions.net/sleeper-data-puller/api/v1/report)

## Features

- **Retrieve League Standings**: Fetches and processes the current standings for users in the league.
- **Matchups Breakdown**: Provides detailed analysis of current matchups between league teams.
- **Playoff Probability Simulation**: Calculates the probability of each team making the playoffs based on simulated future matchups and historical performance.

The data is exposed through a RESTful endpoint that returns JSON.

## Methodology: Calculating Overall Rating

The **Overall Rating** provides a holistic view of the team's overall strength based on multiple factors. The overall rating is calculated as follows:

1. **Data Normalization**:
    - To ensure fair comparisons, the metrics are normalized to a scale from 0 to 1. This normalization is done for both `pointsFor` and `waiverBudgetUsed`.

2. **Weighting Metrics**:
    - The overall rating is a weighted average of several normalized metrics:
        - **Points For**: Represents 60% of the overall rating. This metric indicates the team's ability to score points.
        - **Win Percentage**: Represents 35% of the overall rating. It accounts for the team's ability to win games.
        - **Waiver Budget Used**: Represents 5% of the overall rating. Teams that use their waiver budget efficiently are slightly rewarded.

## Methodology: Calculating Playoff Probabilities

We estimate each team's chances of making the playoffs by running thousands of simulated scenarios of the remainder of the season. The following steps outline the methodology used to calculate these probabilities:

1. **Data Collection**:
    - Historical performance metrics, such as `pointsFor` and `win/loss record`, are collected for each team.
    - The current league standings and matchups are obtained using the Sleeper API.

2. **Assigning Win Probabilities**:
    - Win probabilities are assigned for each future matchup using a combination of team strength metrics (e.g., historical points scored) and calculated odds of winning.

3. **Simulating Remaining Games**:
    - The remaining matchups for each team are simulated using a normal distribution, with the historical average points scored (`meanPoints`) and standard deviation (`stdDevPoints`) as parameters.
    - Each simulated matchup generates points for both teams and determines the winner accordingly.

4. **Season Simulation**:
    - The entire remaining schedule is simulated thousands of times (typically 10,000 simulations).
    - For each simulation, win/loss records and `pointsFor` are updated to reflect the outcomes of each matchup.

5. **Determining Playoff Teams**:
    - After each simulated season, teams are ranked by their win/loss records and total points scored.
    - The top 5 teams automatically qualify for the playoffs based on their win records.
    - An additional team qualifies based on the "Jordan Rule" (highest `pointsFor` among non-qualifying teams).

6. **Calculating Probabilities**:
    - After completing all simulations, the number of times each team made the playoffs is divided by the total number of simulations to determine their `madePlayoffProbability`.
    - Additionally, the probabilities of making the playoffs via record or via the "Jordan Rule" are calculated (`madePlayoffFromRecordProbability`, `madePlayoffFromJordanRuleProbability`).

This approach provides an accurate estimate of each team's chances of making the playoffs by taking into account historical performance and a large number of possible future scenarios.

## Setup Instructions

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sleeper-data-puller.git
   cd sleeper-data-puller
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```
   If you don't have Yarn installed, you can install it using npm:
   ```bash   
     npm install --global yarn
   ```

### Running the Server

To start the server locally, run the following command:
```bash
yarn start
```

The API will be accessible at `http://localhost:3000/api/v1/report`.

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

## API Endpoints

### GET `/api/v1/report`

This endpoint provides a summary of the current league standings and matchups.

- **Response**: JSON object containing:
    - `teams`: The teams in the league.
    - `matchupsBreakdown`: A breakdown of the current week's matchups between teams.

- **Example Response**:
    ```json
    {
        "teams": [
        {
          "userId": "737674610933448704",
          "rosterId": 12,
          "displayName": "jdarsinos",
          "shortName": "Jessie",
          "teamName": "Team jdarsinos",
          "wins": 7,
          "losses": 2,
          "ties": 0,
          "pointsFor": 1445,
          "pointsAgainst": 1261,
          "streak": "3W",
          "waiverBudgetUsed": 17,
          "winPercentage": 0.7777777777777778,
          "overallRating": 0.9193813131313131,
          "madePlayoffProbability": 0.9967,
          "madePlayoffFromRecordProbability": 0.983,
          "madePlayoffFromJordanRuleProbability": 0.0137
        },
        // ... other teams
        ],
          "matchupsBreakdown": [
          {
            "week": 1,
            "matchups": [
              [
                {
                  "totalPoints": 95.08,
                  // ... other data
                },
                {
                  "totalPoints": 134.08,
                  // ... other data
                }
              ],
              // ... other matchups
            ]
          },
          // ... other weeks
        ]
       }
    ``` 
