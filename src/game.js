
// Permet de savoir quand le jeu commence et quand il s'arrete
var GAME_START = false;
var GAME_OVER  = false;

// Taille du jeu
const width  = 1080;
const height = 1775;

// Phaser
var game = new Phaser.Game(width, height, Phaser.AUTO, 'game');

// On rend le background transparent
game.transparent = true;

// On déclare un objet qui contiendra les états load et main
var gameState = {};
gameState.load = function () {};
gameState.main = function () {};

// Chargement des ressources
gameState.load.prototype = {
    preload: function () {
        // Chargement des ressources
        // Background
        game.load.image('background', 'assets/img/background3.png');
        // Hero
        game.load.spritesheet('oldman','assets/img/oldman.png', 527, 413, 6);
    },
    create: function () {
        game.state.start('main');
    }
};

// Contient le coeur du jeu
gameState.main.prototype = {
    create: function () {
        // initialisation et intégration des ressources dans le canvas
        
        // On fait en sorte que le jeu se redimensionne selon la taille de l'écran (Pour les PC)
        game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        game.scale.parentIsWindow = true;
    
        // Création de l'arrière-plan dans le Canvas
        this.background = game.add.sprite(0, 0, 'background');
        this.background.width = game.width;
        this.background.height = game.height;
    },
    update: function () {
        // Animations
    }
};

// Ajout de ces fonctions à l'objet Phaser
game.state.add('load', gameState.load);
game.state.add('main', gameState.main);

// Lancement du jeu
game.state.start('load');