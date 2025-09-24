/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {onCall} from "firebase-functions/v2/https";
import {calculateGemsWithLLM} from "./llm-parser";

// Import notification functions
export * from "./notifications";
export * from "./kitchen";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

/**
 * Firebase function to calculate gems for a task using LLM
 */
export const calculateTaskGems = onCall({
  cors: true
}, async (request) => {
  try {
    const {taskDescription, gemPrompt} = request.data;
    
    if (!taskDescription || typeof taskDescription !== 'string') {
      throw new Error('Task description is required and must be a string');
    }
    
    console.log('Calculating gems for task:', taskDescription);
    
    const gemValue = await calculateGemsWithLLM(taskDescription, gemPrompt);
    
    return {
      success: true,
      gems: gemValue
    };
  } catch (error) {
    console.error('Error in calculateTaskGems function:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
});
