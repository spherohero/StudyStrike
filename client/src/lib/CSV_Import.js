import Papa from 'papaparse';

/** parse csv to json then OVERWRITE current deck with cards.
 *  add warning sign to users saying that it will overwrite the current deck
 *  add below for intellisense
 * @param {File} file - file to parse
 * @param {string|number} deckId - deck id
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const importCardsFromCSV = async (file, deckId) => {
  return new Promise((resolve) => {
    Papa.parse(file, {
      // no title header just term definition
      header: false,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedData = results.data;

          // term definition -> front back
          // array of strings [term, def]
          const cards = parsedData.map(row => {
              return {
              front: row[0] ? row[0].trim() : '',
              back: row[1] ? row[1].trim() : '',
              };
              // only use cards with front/back, or else throw error in server.js
          }).filter(card => card.front && card.back); 

          // call new endpoint route in server.js to import cards
          // no need for header, cookie is persistent
          const response = await fetch(`/api/decks/${deckId}/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ cards })
          });

          const data = await response.json();

          if (response.ok) {
            resolve({
              success: true,
              message: data.message 
            });
          } else {
            resolve({
              success: false,
              error: data.error || 'Failed to import CSV' 
            });
          }
        } catch (error) {
          console.error("CSV Import API Error:", error);
          resolve({
            success: false,
            error: 'API error during import' 
          });
        }
      },
      error: (error) => {
        console.error("PapaParse error:", error);
        resolve({
          success: false,
          error: 'Failed parse of CSV' 
        });
      }
    });
  });
};

/**
 * export back from online only deck -> csv saved on device
 * @param {Array<{front: string, back: string}>} cards - array of cards
 * @param {string} deckTitle - name of the downloaded file
 */
export const exportCardsToCSV = (cards, deckTitle = "Deck") => {
  if (!cards || cards.length === 0) {
    console.warn("No cards to export.");
    return false;
  }
  // must be set back to an array of strings again or else a header row will be made (we want same as import format)
  const dataToExport = cards.map((card) => [card.front, card.back]);
  
  // thank u unparse
  const csvString = Papa.unparse(dataToExport);

  // decided on using blob downloads to create file than fs as it doesn't require file to be saved on backend
  // basic blob stuff: https://dev.to/nombrekeff/download-file-from-blob-21ho
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // connect link to blob
  const link = document.createElement("a");
  link.href = url;

  // regex docs: https://stackoverflow.com/questions/11794144/regular-expression-for-valid-filename
  const fileName = `${deckTitle.replace(/[\s/\\:]+/g, "_")}_StudyStrike.csv`;
  // force a click to be download not a navigation to it
  link.setAttribute("download", fileName);

  // create the TEMPORARY LINK, force user to click, then remove it again
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
};
