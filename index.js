const axios = require("axios");
const express = require("express");
const app = express();
const cheerio = require("cheerio");
const PORT = 4000

const date = new Date();
const maxYear = date.getFullYear() + 2;

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Welcome to the Date Formatter API!" });
});

async function apiCall(d, m, year) {
  const months = [ "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const engZodic = [ "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  const hinZodic = [ "Mesha", "Vrishabha", "Mithuna", "Karka", "Simha", "Kanya", "Tula", "Vrischika", "Dhanu", "Makara", "Kumbha", "Meena"];

  const month = months[m - 1];
  const formattedDate = d < 10 ? `0${d}` : d;

  function convertZodiac(hinSign) {
    const index = hinZodic.indexOf(hinSign);
    if (index === -1) {
      return "Invalid zodiac sign";
    }
    return engZodic[index];
  }

  try {
    const response = await axios.get(`https://www.prokerala.com/astrology/panchang/${year}-${month}-${formattedDate}.html`);
    const html = response.data;
    const $ = cheerio.load(html);

    function getRasi(selector, id) {
      const element = $(selector);
      const text = element.text();      
      let cleanedInput = text.replace(/\n\s*\n/g, "\n").replace(/\s{2,}/g, " ");

      if (id == 2) {
        function extractChandraRasi(input) {
          if (input.includes("rashi")) {
            const regex = /(\w+) rashi(?:.*?upto (\w+ \d+), (\d{1,2}:\d{2} [APM]{2}) before entering (\w+) rashi)?/;
            const match = input.match(regex);
            if (match) {
              return `${convertZodiac(match[1])} (After ${match[3]} - (${convertZodiac(match[4])}))`;
            } else {
              return "No match found";
            }
          }
          else {
            const regex = /Moon travels through (\w+) \(/;
            const match = input.match(regex);
            if (match) {
              return convertZodiac(match[1]);
            } else {
              return "No match found";
            }
          }
        }
        return element ? extractChandraRasi(cleanedInput) : null;
    }
    else {
      function extractSooryaRasi(input) {
        if (input.includes("rashi")) {
          const regex = /Sun travels through (\w+)(?:.*?upto (\w+ \d+), (\d{1,2}:\d{2} [APM]{2}) before entering (\w+) rashi)?/;
          const match = input.match(regex);
          if (match) {
            return `${convertZodiac(match[1])} (After ${match[3]} - (${convertZodiac(match[4])}))`;
          } else {
            return "No match found";
          }
        }
        else {
          const regex = /Sun in (\w+) \(/;
          const match = input.match(regex);
          if (match) {
            return convertZodiac(match[1]);
          } else {
            return "No match found";
          }
        }
      }
      return element ? extractSooryaRasi(cleanedInput) : null;
    }
  }
  return { sunSign: getRasi(".panchang-box-data-block.panchang-data-soorya-rasi.panchang-data-additional-info",1), moonSign: getRasi(".panchang-box-data-block.panchang-data-chandra-rasi.panchang-data-additional-info",2)};
  }
  catch (error) {
    throw new Error("Error fetching data from the API");
  }
}

function isDateValid(d, m, y) {
  const daysInMonth = [ 31, y % 4 === 0 ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return ( m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth[m - 1] && y >= 1901 &&  y <= maxYear);
}

app.get("/:date-:month-:year", async (req, res) => {
  const { date, month, year } = req.params;
  const d = parseInt(date, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);

  if (isDateValid(d, m, y)) {
    try {
      const data = await apiCall(d, m, y);
      res.status(200).json({ status: 200, data });
    } catch (error) {
      res.status(500).json({ status: 500, err: error.message });
    }
  } else {
    res.status(400).json({ status: 400, err: "Invalid date, month, or year" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port 5000");
});

module.exports = app
