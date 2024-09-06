//#region Dont look behind the curtain
// Do not worry about the next two lines, they just need to be there. 
import * as readlinePromises from 'node:readline/promises';
const rl = readlinePromises.createInterface({ input: process.stdin, output: process.stdout });

async function askQuestion(question) {
    return await rl.question(question);
}

//#endregion

import { ANSI } from './ansi.mjs';
import { HANGMAN_UI } from './graphics.mjs';

/*
    1. Pick a word
    2. Draw one "line" per char in the picked word.
    3. Ask player to guess one char || the word (knowledge: || is logical or)
    4. Check the guess.
    5. If guess was incorect; continue drawing 
    6. Update char display (used chars and correct)
    7. Is the game over (drawing complete or word guessed)
    8. if not game over start at 3.
    9. Game over
*/
import { promises as fs } from 'fs';

async function getRandomWordFromFile(filePath) {
    try {
        // Read the file asynchronously
        const data = await fs.readFile(filePath, 'utf8');

        // Split the content by newlines to create an array of words
        const words = data.split(/\r?\n/); // This handles both Windows (\r\n) and Unix (\n) line endings

        // Choose a random index
        const randomIndex = Math.floor(Math.random() * words.length);

        // Return the word at the random index
        return words[randomIndex];
    } catch (err) {
        console.error('Error reading the file:', err);
        return null;
    }
}
let WORDFILE = './words.txt'

let correctWord = await getRandomWordFromFile(WORDFILE);
let numberOfCharInWord = correctWord.length;
let guessedWord = "".padStart(correctWord.length, "_"); // "" is an empty string that we then fill with _ based on the number of char in the correct word.
let wordDisplay = "";
let isGameOver = false;
let wasGuessCorrect = false;
let wrongGuesses = [];
let attempts = 0;
let correct = 0;

//wordDisplay += ANSI.COLOR.GREEN;

function drawWordDisplay() {

    wordDisplay = "";

    for (let i = 0; i < numberOfCharInWord; i++) {
        //i == 0, wordDisplay == "", guessedWord[0] == "_";
        //i == 1, wordDisplay == "_ ", guessedWord[1] == "_";
        //i == 2, wordDisplay == "_ _ ", guessedWord[2] == "_";
        if (guessedWord[i] != "_") {
            wordDisplay += ANSI.COLOR.GREEN;
        }
        wordDisplay = wordDisplay + guessedWord[i] + " ";
        wordDisplay += ANSI.RESET;
        //i == 0, wordDisplay == "_ ", guessedWord[0] == "_";
        //i == 1, wordDisplay == "_ _ ", guessedWord[1] == "_";
        //i == 2, wordDisplay == "_ _ _", guessedWord[2] == "_";
    }

    return wordDisplay;
}

function drawList(list, color) {
    let output = color;
    for (let i = 0; i < list.length; i++) {
        output += list[i] + " ";
    }

    return output + ANSI.RESET;
}

function clearAndDisplayWord() {
    console.log(ANSI.CLEAR_SCREEN);
    console.log(drawWordDisplay());
    console.log(drawList(wrongGuesses, ANSI.COLOR.RED));
    console.log(HANGMAN_UI[wrongGuesses.length]);
}

function chickenDinner() {
    if (wasGuessCorrect) {
        correct++
        console.log(ANSI.COLOR.YELLOW + "Congratulation, winner winner chicken dinner");
    }
    console.log("Game Over");
}

async function playGame() {
    while (isGameOver == false) {
        clearAndDisplayWord();
    
        const answer = (await askQuestion("Guess a char or the word : ")).toLowerCase();
    
        if (answer == correctWord) {
            isGameOver = true;
            wasGuessCorrect = true;
        } else if (ifPlayerGuessedLetter(answer)) {
    
            let org = guessedWord;
            guessedWord = "";
    
            let isCorrect = false;
            for (let i = 0; i < correctWord.length; i++) {
                if (correctWord[i] == answer) {
                    guessedWord += answer;
                    isCorrect = true;
                } else {
                    // If the currents answer is not what is in the space, we should keep the char that is already in that space. 
                    guessedWord += org[i];
                }
            }
    
            let guessed = false; // Flag used to check if the letter has already been guessed
            for (let i = 0; i < wrongGuesses.length; i++) { // loop trough all wrong guesses
                if (wrongGuesses[i] == answer) {        // If answer is in wrongGuesses
                    guessed = true;                 // Set flag to true
                }       
            }
    
            if (isCorrect == false) {
                if (guessed == false) { // letter not already guessed
                    wrongGuesses.push(answer);
                }
            } else if (guessedWord == correctWord) {
                isGameOver = true;
                wasGuessCorrect = true;
            }
        }
    
        // Read as "Has the player made to many wrong guesses". 
        // This works because we cant have more wrong guesses then we have drawings. 
        if (wrongGuesses.length == HANGMAN_UI.length) {
            isGameOver = true;
        }
    }
}


// Continue playing until the game is over. 
await playGame(); // wait for game to finish
clearAndDisplayWord()
chickenDinner();
// OUR GAME HAS ENDED.


let ans = "a";
while (ans == "a") {
    attempts++;
    ans = (await askQuestion("Do you want to play again (y/n)? ")).toLowerCase();
    
    if (ans == "y") {
        console.log("Starting a new game...");
        
        // Reset game state for a new game
        isGameOver = false;
        wasGuessCorrect = false;
        
        wrongGuesses = [];

        // Fetch a new random word for the new game
        correctWord = await getRandomWordFromFile(WORDFILE);
        numberOfCharInWord = correctWord.length;  // Update the length of the new word
        guessedWord = "".padStart(correctWord.length, "_"); // Reset guessedWord to new word's length
        wordDisplay = ""; // Reset the word display

        // Call playGame to restart
        await playGame();
        clearAndDisplayWord();
        chickenDinner();
        ans = "a";
    } else if (ans == "n") {
        console.log("Number of attempts: " + attempts);
        console.log("Number of correct guesses: " + correct);
        process.exit(); // Exit the game if the player doesn't want to play again
    }
}

process.exit();


process.exit();
function ifPlayerGuessedLetter(answer) {
    return answer.length == 1
}


// answer = a
// correctWord = Catalana

