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

          const token = localStorage.getItem('token');
          if (!token) {
            return resolve({ 
              success: false, 
              error: 'User is not authenticated' 
            });
          }

          // call new endpoint route in server.js to import cards
          const response = await fetch(`/api/decks/${deckId}/import`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
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
