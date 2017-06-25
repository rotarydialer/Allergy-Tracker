# Allergy Tracker
An application to track possible food allergies. It works on the simple premise of tracking two simple things: **Diet Changes** (adding or removing foods from one's diet), and **Reactions** (an outcome *possibly* linked to the addition or accidental ingestion of a food). It is meant to be used in conjuction with food allergy test results, one goal being to weed out false positives.

The application is coded [Node.js](https://nodejs.org) and [Hapi](https://hapijs.com), with [MongoDB](https://www.mongodb.com) as its database.

**Instructions:**

1. Clone this repository to the desired location. For example (Linux/Mac):
    1. `cd ~`
    2. `git clone git@github.com:rotarydialer/Allergy-Tracker.git allergy-tracker`)
2. Change to the project directory (e.g., `cd allergy-tracker`)
3. Before launching for the first time, run `npm install` from the project directory. This will initialize the node modules used by the application.
4. Start the application with `node index.js`.

**Notes:**
At present, a "Reaction" is considered a bad outcome. The assumption is if no Reaction follows the addition of a food, it is a safe food. There is no such thing as a positive (i.e., beneficial) Reaction.

**Disclaimer:**
It should go without saying, but if you decide to use this application, you do so at your own risk. I'm not a doctor
and I offer no medical advice; this application just provides me a means for keeping a contemporaneous log of foods removed from and introduced into my family's diet, and any (seeming) reactions to them.
