//PLAYER OBJECT
var player = {name: "player", cards: [], cardCount: 0, aceCount: 0, nextCardIndex: 0, canHit: true, canStay: true};

//DEALER OBJECT
var dealer = {name: "dealer", cards: [], cardCount: 0, aceCount: 0, nextCardIndex: 0};

//CARD STACK OBJECT
var cardStack;

//HTML ELEMENTS OBJECT
var htmlElements = {hitButton: null, stayButton: null, configPanel: null, roundEndPanel: null, startGameButton: null, restartButton: null, replayButton: null, resultText: null};

//GAME CONFIGURATION OBJECT
var gameConfig = {numberOfDecks: 2};

//GAME STATS OBJECT
var gameStats = {wins: 0, losses: 0, draws: 0, roundsPlayed: 0};

//START APP WHEN DOCUMENT IS READY
$(document).ready(function(){
    blackjackFSM.dispatch("startGame");
});

//GENERATE 52-CARD DECK (returns an array)
function generateDeck(){

    //13 POSSIBLE CARD VALUES
    const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];

    //4 POSSIBLE SUITS
    const suits = ["C", "D", "H", "S"];

    let deck = [];

    for(let i = 0; i < values.length; i++){
        for(let j = 0; j < suits.length; j++){
            deck.push(values[i] + "_" + suits[j]);
        }
    }

    return deck;
}

//GENERATE A CARD STACK OF n 52-CARD DECKS (returns an array)
function generateCardStack(deck, n){
    let stack = [];

    for(let k = 0; k < n; k++){
        stack = stack.concat(deck);
    }

    return stack;
}

//SHUFFLE cardStack USING THE FISHER-YATES ALGORITHM (returns an array)
function shuffleCardStack(cardStack){
    //WORSE SHUFFLE
    //return cardStack.sort((a,b) => Math.random() - 0.5);
    
    //BETTER SHUFFLE (https://www.tutorialspoint.com/what-is-fisher-yates-shuffle-in-javascript)
    for(let i = cardStack.length - 1; i > 0; i--){
        let temp = Math.floor(Math.random() * (i + 1));
        [cardStack[temp], cardStack[i]] = [cardStack[i], cardStack[temp]];
    }

    return cardStack;
}

//DEAL ONE CARD TO person (returns nothing)
function dealCard(person){
    //ADDS ONE CARD FROM cardStack TO THE person CARDS AND REMOVES IT FROM cardStack
    let dealtCard = cardStack.pop();
    person.cards[person.nextCardIndex] = dealtCard;
    //UPDATE person cardCount
    person.cardCount += readCardValue(dealtCard);
    //UPDATE person aceCount
    person.aceCount += isAnAce(dealtCard);
    //CHECKS IF THE CARD IS THE dealer FIRST CARD
    //IF NOT ADDS THE IMAGE TO THE UI
    if(!(person.name === "dealer" && person.nextCardIndex === 0)) addCardImage(person, dealtCard);
    //UPDATE person nextCardIndex
    person.nextCardIndex++;
    //UPDATE GAME STATS
    updateGameStats();
}

//DEAL INITIAL CARDS FOR BOTH THE player AND THE dealer (returns nothing)
function dealInitialCards(){
    dealCard(player);
    dealCard(dealer);
    dealCard(player);
    dealCard(dealer);
}

//READS THE VALUE OF card (returns an integer)
function readCardValue(card){
    let temp = card.split("_"); //example: "A_S" --> ["A", "S"]
    switch(temp[0]){
        case "A": return 11;
        case "J":
        case "Q":
        case "K": return 10;
        default: return parseInt(temp[0]);
    }
}

//CHECKS IF card IS AN ACE (returns an integer)
function isAnAce(card){
    let temp = card.split("_");
    if(temp[0] === "A") return 1;
    else return 0;
}

//DEAL WITH ACE LOGIC OF person (returns nothing)
function dealWithAce(person){
        person.cardCount -= 10;
        person.aceCount--;
}

//ADDS THE card IMAGE TO THE person HAND UI (returns nothing)
function addCardImage(person, card){
    //CREATE img ELEMENT USING JQUERY
    let cardImage = $("<img>");
    //ASSIGN THE img SOURCE
    cardImage.attr("src", ("./cards/" + card + ".png"));
    //IF card IS "BACK" ADD IT'S ID
    if(card === "BACK") cardImage.attr("id", "hidden-card");
    //APPEND IMAGE TO THE CORRESPONDING person div
    if(person.name === "player") cardImage.appendTo("#player-cards");
    else cardImage.appendTo("#dealer-cards");
}

//REVEAL dealer HIDDEN CARD TO THE PLAYER (returns nothing)
function revealHiddenDealerCard(){
    //GET ACCESS TO THE dealer HIDDEN CARD THROUGH JQUERY
    let hiddenCard = $("#hidden-card");
    //CHANGE hiddenCard SOURCE TO REVEAL IT TO THE PLAYER
    hiddenCard.attr("src", ("./cards/" + dealer.cards[0] + ".png"));
}

//RESOLVE dealer HAND (returns nothing)
function resolveDealerHand(){
    //FIRST REVEAL dealer HIDDEN CARD
    revealHiddenDealerCard();
    //CHECK IN CASE DEALER GOT 2 ACES
    if(dealer.cardCount > 21 && dealer.aceCount !== 0) dealWithAce(dealer);
    //RESOLVE BY DEALING CARDS UNTIL dealer cardCount >= 17
    while(dealer.cardCount < 17){
        //FIRST DEAL A NEW CARD TO dealer
        dealCard(dealer);
        //THEN DEAL WITH ACES IN dealer HAND
        if(dealer.cardCount > 21 && dealer.aceCount !== 0) dealWithAce(dealer);
    }
    //REVEAL TO THE PLAYER THE dealer CARD COUNT
    revealDealerCardCount();
}

//UPDATE THE NUMBER OF DECK THE PLAYER HAS CHOSEN (returns nothing)
function updateGameConfig(){
    gameConfig.numberOfDecks = $("#deck-number").val();
}

//UPDATE GAME STATS (returns nothing)
function updateGameStats(){
    $("#cards-left").text(cardStack.length);
    $("#total-wins").text(gameStats.wins);
    $("#total-losses").text(gameStats.losses);
    $("#total-draws").text(gameStats.draws);
    $("#rounds-played").text(gameStats.roundsPlayed);
}

//UPDATE PLAYER CARD COUNT (returns nothing)
function updatePlayerCardCount(){
    $("#player-card-count").text(player.cardCount);
}

//REVEAL DEALER CARD COUNT TO THE PLAYER (returns nothing)
function revealDealerCardCount(){
    $("#dealer-card-count").text(dealer.cardCount);
}

//RESETS PLAYER, DEALER AND UI ELEMENTS TO ITS DEFAULT STATE FOR A NEW ROUND (returns nothing)
function resetPlayerAndDealer(){
    player.cards = [];
    player.cardCount = 0;
    player.aceCount = 0;
    player.nextCardIndex = 0;
    player.canHit = true;
    player.canStay = true;

    dealer.cards = [];
    dealer.cardCount = 0;
    dealer.aceCount = 0;
    dealer.nextCardIndex = 0;

    $("#dealer-cards").empty();
    $("#player-cards").empty();
    addCardImage(dealer, "BACK");
    $("#dealer-card-count").text("???");
}

//GET ALL HTML ELEMENTS NEEDED (returns nothing)
function getHTMLElements(){
    //I HAD TO USE getElementByID SINCE JQUERY.on("click", function(){}) WAS TRIGERRING function(){} MORE THAN ONCE AT A TIME (EVEN WITH JQUERY.one())
    htmlElements.hitButton = document.getElementById("hit-button");
    htmlElements.stayButton = document.getElementById("stay-button");
    htmlElements.configPanel = $("#config-panel");
    htmlElements.roundEndPanel = $("#round-end-panel");
    htmlElements.startGameButton = $("#start-game-button");
    htmlElements.restartButton = $("#restart-button");
    htmlElements.replayButton = $("#replay-button");
    htmlElements.resultText = $("#result-text");
}

//DEAL CARD TO PLAYER IF canHit == true (returns nothing)
function hitAction(){
    if(player.canHit){
        dealCard(player);
        updatePlayerCardCount();
        blackjackFSM.changeState("CHECKROUNDSTATE");
        blackjackFSM.dispatch("checkRoundState", [player]);
    }
}

//END PLAYER TURN (returns nothing)
function stayAction(){
    if(player.canStay){
        player.canStay = false;
        player.canHit = false;
        blackjackFSM.changeState("DEALERTURN");
        blackjackFSM.dispatch("resolveDealerHand");
    }
}

//START A NEW ROUND (returns nothing)
function replayAction(){
    htmlElements.roundEndPanel.hide();
    resetPlayerAndDealer();
    gameStats.roundsPlayed++;
    blackjackFSM.changeState("ROUNDSTART");
    blackjackFSM.dispatch("dealInitialCards");
}

//RELOAD THE PAGE TO RESTART THE GAME (returns nothing)
function restartAction(){
    location.reload(true);
}

//FINITE STATE MACHINE TO CONTROL THE FLOW AND STATE OF THE APP (inspired by links below)
//https://www.youtube.com/watch?v=WRWavNQwk6c (CrossComm Inc.)
//https://www.youtube.com/watch?v=0NkfCi-hKCc (Steve Griffith - Prof3ssorSt3v3)
const blackjackFSM = {
    state: "IDLE",
    transitions: {
        IDLE: {
            startGame: function(){
                getHTMLElements();
                this.changeState("GAMELOAD");
                blackjackFSM.dispatch("enableConfigPanel");
            }
        },
        GAMELOAD: {
            enableConfigPanel: function(){
                htmlElements.configPanel.show();
                this.changeState("CONFIGPANEL");
                blackjackFSM.dispatch("waitForGameConfigSelection");
            },
            generateCardStack: function(){
                let tempDeck = generateDeck();
                let tempCardStack = generateCardStack(tempDeck, gameConfig.numberOfDecks);
                let tempShuffledCardStack = shuffleCardStack(tempCardStack);
                cardStack = tempShuffledCardStack;
                this.changeState("ROUNDSTART");
                blackjackFSM.dispatch("dealInitialCards");
            }
        },
        CONFIGPANEL: {
            waitForGameConfigSelection: function(){
                htmlElements.startGameButton.on("click", function(){
                    blackjackFSM.dispatch("disableConfigPanel");
                });
            },
            disableConfigPanel: function(){
                updateGameConfig();
                htmlElements.configPanel.hide();
                this.changeState("GAMELOAD");
                blackjackFSM.dispatch("generateCardStack");
            }
        },
        ROUNDSTART: {
            dealInitialCards: function(){
                updateGameStats();
                dealInitialCards();
                updatePlayerCardCount();
                this.changeState("CHECKROUNDSTATE");
                blackjackFSM.dispatch("checkRoundState", [player]);
            }
        },
        CHECKROUNDSTATE: {
            checkRoundState: function(p){
                if(p.cardCount >= 21 && p.aceCount === 0){
                    p.canHit = false;
                    this.changeState("DEALERTURN");
                    blackjackFSM.dispatch("resolveDealerHand");
                }
                else if(p.cardCount > 21 && p.aceCount !== 0){
                    dealWithAce(p);
                    updatePlayerCardCount();
                    this.changeState("PLAYERTURN");
                    blackjackFSM.dispatch("waitForPlayerDecision");
                }
                else{
                    this.changeState("PLAYERTURN");
                    blackjackFSM.dispatch("waitForPlayerDecision");
                }
            }
        },
        PLAYERTURN: {
            waitForPlayerDecision: function(){
                htmlElements.hitButton.addEventListener("click", hitAction);
                htmlElements.stayButton.addEventListener("click", stayAction);
            }
        },
        DEALERTURN: {
            resolveDealerHand: function(){
                resolveDealerHand();
                this.changeState("ROUNDEND");
                blackjackFSM.dispatch("checkWinLose", [player, dealer]);
            }
        },
        ROUNDEND: {
            checkWinLose: function(p, d){
                if((d.cardCount > 21 && p.cardCount > 21) || (d.cardCount === p.cardCount)){
                    gameStats.draws++;
                    blackjackFSM.dispatch("enableRoundEndPanel", ["IT'S A DRAW!"]);
                }
                else if((d.cardCount > 21) || (p.cardCount > d.cardCount && p.cardCount <= 21)){
                    gameStats.wins++;
                    blackjackFSM.dispatch("enableRoundEndPanel", ["PLAYER WINS!"]);
                }
                else if((p.cardCount > 21) || (d.cardCount > p.cardCount && d.cardCount <=21)){
                    gameStats.losses++;
                    blackjackFSM.dispatch("enableRoundEndPanel", ["DEALER WINS!"]);
                }
            },
            enableRoundEndPanel: function(roundResult){
                htmlElements.resultText.text(roundResult);
                htmlElements.roundEndPanel.show();
                this.changeState("ROUNDENDPANEL");
                blackjackFSM.dispatch("waitForEndOfRoundDecision");
            }
        },
        ROUNDENDPANEL: {
            waitForEndOfRoundDecision: function(){
                htmlElements.replayButton.one("click", function(){
                    replayAction();
                });
                htmlElements.restartButton.on("click", function(){
                    restartAction();
                });
            }
        }
    },
    dispatch(actionName, ...parameters){
        const action = this.transitions[this.state][actionName];

        if(action) action.apply(blackjackFSM, ...parameters);
    },
    changeState(newState){
        this.state = newState;
    }
};