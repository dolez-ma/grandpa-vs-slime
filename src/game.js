
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
        
        // Colonne de slime
        game.load.image('slime1', 'assets/img/slime1.png');
        game.load.image('slime2', 'assets/img/slime2.png');
        game.load.image('slime-weapon1', 'assets/img/slime-weapon1.png');
        game.load.image('slime-weapon2', 'assets/img/slime-weapon2.png');
        game.load.image('slime-base', 'assets/img/slime-base.png');
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
        
        // Colonne de slime
        // Base de slime
        this.slimeBase = game.add.sprite(0, 0, 'slime-base');
        this.slimeBase.x = 352;
        this.slimeBase.y = 1394;
        // Construction de la colonne
        this.HEIGHT_SLIME_COLUMN = 243;
        this.constructSlimeColumn();
        this.canCut = true;
        
        // Création du hero
        this.oldman = game.add.sprite(0, 1070, 'oldman');
        this.oldman.animations.add('idle', [0,1,2,3]);
        this.oldman.animations.add('hit', [4,5,4]);
        this.oldman.animations.play('idle', 3, true);
        // Position du hero
        this.oldmanPosition = 'left';
        
        
    },
    update: function () {
        // Animations
    },
    
    constructSlimeColumn: function () {
        // On construit le groupe this.slimeColumn qui va contenir tous les slimes
        this.slimeColumn = game.add.group();
        // Les deux premiers slime sont des slimes simple
        this.slimeColumn.create(37, 1151, 'slime1');
        this.slimeColumn.create(37, 1151 - this.HEIGHT_SLIME_COLUMN, 'slime2');
        
        // On construit le reste de la colonne
        for(var i = 0; i < 4; i++){
            this.addSlime();
        }
    },
    
    addSlime: function () {
        var slimes = ['slime1', 'slime2'];
        var slimeWithWeapon = ['slime-weapon1', 'slime-weapon2'];
        // Si le dernier slime du groupe n'a pas d'arme
        if(slimeWithWeapon.indexOf(this.slimeColumn.getAt(this.slimeColumn.length - 1).key) == -1){
            // 1 chance sur 4 de placer un slime sans arme
            if(Math.random() * 4 <= 1){
                this.slimeColumn.create(
                    37,
                    this.slimeBase.y - this.HEIGHT_SLIME_COLUMN * (this.slimeColumn.length + 1),
                    slimes[Math.floor(Math.random() * 2)]
                );
            } else {
                this.slimeColumn.create(
                    37,
                    this.slimeBase.y - this.HEIGHT_SLIME_COLUMN * (this.slimeColumn.length + 1),
                    slimeWithWeapon[Math.floor(Math.random() * 2)]
                );
            }
            
        } else {
            this.slimeColumn.create(
                37,
                this.slimeBase.y - this.HEIGHT_SLIME_COLUMN * (this.slimeColumn.length + 1),
                slimes[Math.floor(Math.random() * 2)]
            );
        }
    }
};

// Ajout de ces fonctions à l'objet Phaser
game.state.add('load', gameState.load);
game.state.add('main', gameState.main);

// Lancement du jeu
game.state.start('load');