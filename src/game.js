// Permet de savoir quand le jeu commence et quand il s'arrete
let GAME_START = false;
let GAME_OVER  = false;

// Taille du jeu
const width  = 1080;
const height = 1775;

// Phaser
let game = new Phaser.Game(width, height, Phaser.AUTO, 'game');

// On rend le background transparent
game.transparent = true;

// On déclare un objet qui contiendra les états load et main
let gameState = {};
gameState.load = function () {};
gameState.main = function () {};

// Chargement des ressources
gameState.load.prototype = {
    preload: function () {
        // Chargement des ressources
        // Background
        game.load.image('background', 'assets/img/background3.png');
        
        // Hero
        game.load.spritesheet('oldman','assets/img/oldman2.png', 527, 413, 6);
        
        // Colonne de slime
        game.load.image('slime1', 'assets/img/slime1.png');
        game.load.image('slime2', 'assets/img/slime2.png');
        game.load.image('slime-weapon1', 'assets/img/slime-weapon1.png');
        game.load.image('slime-weapon2', 'assets/img/slime-weapon2.png');
        game.load.image('slime-base', 'assets/img/slime-base.png');
        
        // Chiffre pour le score
        game.load.atlas('numbers', 'assets/img/numbers.png', 'assets/data/numbers.json');
    },
    create: function () {
        game.state.start('main');
    }
};

// Contient le coeur du jeu
gameState.main.prototype = {
    create: function () {
        // initialisation et intégration des ressources dans le canvas
        
        // Physique du jeu
        game.physics.startSystem(Phaser.Physics.ARCADE);
        
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
        this.canKill = true;
        
        // Création du hero
        this.oldman = game.add.sprite(0, 1070, 'oldman');
        this.oldman.animations.add('idle', [0,1,0,0,0,0,0]);
        this.oldman.animations.add('hit', [4,5,4]);
        this.oldman.animations.play('idle', 3, true);
        // Position du hero
        this.oldmanPosition = 'left';
        
        // Au click, on appelle la fonction "listener()"
        game.input.onDown.add(this.listener, this);
        
        // Score
        this.currentScore = 0;
        // On crée le sprite du score
        let spriteScoreNumber = game.add.sprite(game.width / 2, 440, 'numbers');
        // On affiche le score à 0 en ajoutant le JSON "number" aux animations de spriteScoreNumber
        spriteScoreNumber.animations.add('number');
        spriteScoreNumber.animations.frame = this.currentScore;
        // On centre le score
        spriteScoreNumber.x -= spriteScoreNumber.width / 2;
        this.spritesScoreNumbers = [];
        this.spritesScoreNumbers.push(spriteScoreNumber);
    },
    update: function () {
        // Animations
        // Si la partie n'est pas fini
        if(!GAME_OVER){
            // Detection des touches gauche et droite
            if(game.input.keyboard.isDown(Phaser.Keyboard.LEFT)){
                this.listener('left');
            } else if(game.input.keyboard.isDown(Phaser.Keyboard.RIGHT)){
                this.listener('right');
            }
        }
    },
    
    constructSlimeColumn: function () {
        // On construit le groupe this.slimeColumn qui va contenir tous les slimes
        this.slimeColumn = game.add.group();
        // Les deux premiers slime sont des slimes simple
        this.slimeColumn.create(37, 1151, 'slime1');
        this.slimeColumn.create(37, 1151 - this.HEIGHT_SLIME_COLUMN, 'slime2');
        
        // On construit le reste de la colonne
        for(let i = 0; i < 4; i++){
            this.addSlime();
        }
    },
    
    addSlime: function () {
        let slimes = ['slime1', 'slime2'];
        let slimeWithWeapon = ['slime-weapon1', 'slime-weapon2'];
        // Si le dernier slime du groupe n'a pas d'arme
        if(slimeWithWeapon.indexOf(this.slimeColumn.getAt(this.slimeColumn.length - 1).key) === -1){
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
    },
    
    listener: function (action) {
        if(this.canKill){
            // La premiere action de l'utilisateur déclenche le début de la partie
            if(!GAME_START){
                GAME_START = true;
            }
            
            // On vérifie si l'action du joueur est un clic
            let isClick = action instanceof Phaser.Pointer;
            
            // Si la touche directionnelle gauche est pressée ou s'il y a un click dans la moitié gauche du jeu
            if(action === 'left' || (isClick && game.input.activePointer.x <= game.width / 2)) {
                // On remet le personnage a gauche de l'arbre et dans le sens de départ
                this.oldman.anchor.setTo(0, 0);
                this.oldman.scale.x = 1;
                this.oldman.x = 0;
                this.oldmanPosition = 'left';
            }
            // Si la touche directionnelle droite est pressée ou s'il y a un click dans la moitié droite du jeu
            else {
                // On inverse le sens du personnage pour le mettre a droite
                this.oldman.anchor.setTo(1, 0);
                this.oldman.scale.x = -1;
                this.oldman.x = game.width - Math.abs(this.oldman.width);
                this.oldmanPosition = 'right';
            }
            
            // On stop l'animation "idle"
            this.oldman.animations.stop('idle', true);
            // On démarre l'animation "hit", une seule fois et avec 3 images par secondes
            let animationKill = this.oldman.animations.play('hit', 15);
            // Une fois l'animation finie, on reprend l'animation de respiration
            animationKill.onComplete.add(function () {
                this.oldman.animations.play('idle', 3, true);
            }, this);
            
            this.killSlime();
        }
    },
    
    killSlime: function () {
        // On incrémente le score
        this.increaseScore();
        
        // On ajoute un slime simple ou un slime armé
        this.addSlime();
        
        // on crée une copie du slime qui doit être tué
        let killedSlime = game.add.sprite(37, 1151, this.slimeColumn.getAt(0).key);
        // Et on supprime le slime
        this.slimeColumn.remove(this.slimeColumn.getAt(0));
        // On active le systeme de physique sur ce sprite
        game.physics.enable(killedSlime, Phaser.Physics.ARCADE);
        // On déplace le centre de gravité du sprite en son milieu
        killedSlime.anchor.setTo(0.5, 0.5);
        killedSlime.x += killedSlime.width / 2;
        killedSlime.y += killedSlime.height / 2;
        
        let angle = 0;
        // Si le personnage se trouve à gauche, on envoi le slime a droite
        if(this.oldmanPosition === 'left'){
            killedSlime.body.velocity.x = 1300;
            angle = -400;
        }
        else {
            killedSlime.body.velocity.x = -1300;
            angle = 400;
        }
        
        // Permet de creer un effet de gravité
        // Dans un premier temps, le slime est propulsé en l'air
        killedSlime.body.velocity.y = -800;
        // Et dans un second temps, il retombe
        killedSlime.body.gravity.y = 2000;
        
        // On ajoute une animation de rotation sur le slime tué
        game.add.tween(killedSlime).to({angle: killedSlime.angle + angle}, 1000, Phaser.Easing.Cubic.Out, true);
        
        // On empèche un nouveau kill
        this.canKill = false;
        
        let self = this;
        
        // Pour chaque slime encore présent, on ajoute une animation de chute
        // pour boucher le trou laissé par le slime tué
        this.slimeColumn.forEach(function (slime) {
            let tween = game.add.tween(slime).to({y: slime.y + self.HEIGHT_SLIME_COLUMN}, 100, Phaser.Easing.Bounce.Out, true);
            tween.onComplete.add(function () {
                // Une fois que l'animation est finie, on redonne la possibilité de tué au héro
                self.canKill = true;
            }, self);
        });
        
    },
    
    increaseScore: function () {
        this.currentScore++;
        
        // On kill chaque sprite qui compose le score
        for(let j = 0; j < this.spritesScoreNumbers.length; j++){
            this.spritesScoreNumbers[j].kill();
        }
        this.spritesScoreNumbers = [];
        
        this.spritesScoreNumbers = this.createSpritesNumbers(this.currentScore, 'numbers', 440, 1);
    },
    
    createSpritesNumbers: function (number, imgRef, posY, alpha) {
        // On découpe le nombre en chiffre individuel
        let digits = number.toString().split('');
        let widthNumbers = 0;
        
        let arraySpritesNumbers = [];
        
        // On met en forme le nombre avec les sprites
        for(let i = 0; i < digits.length; i++){
            let spaceBetweenNumbers = 0;
            if(i > 0){
                spaceBetweenNumbers = 5;
            }
            
            let spriteNumber = game.add.sprite(widthNumbers + spaceBetweenNumbers, posY, imgRef);
            spriteNumber.alpha = alpha;
            
            // On ajoute le JSON des nombres dans l'animation de "spriteNumber"
            spriteNumber.animations.add('number');
            // On selectionne la frame n° "digits[i]" dans le JSON
            spriteNumber.animations.frame = +digits[i];
            arraySpritesNumbers.push(spriteNumber);
            // On calcul la width totale du sprite du score
            widthNumbers += spriteNumber.width + spaceBetweenNumbers;
        }
        
        // On ajoute les sprites du score dans le groupe numbersGroup afin de centrer le tout
        let numbersGroup = game.add.group();
        for(let i = 0; i < arraySpritesNumbers.length; i++){
            numbersGroup.add(arraySpritesNumbers[i]);
        }
        // On centre horizontalement
        numbersGroup.x = game.width / 2 - numbersGroup.width / 2;
        
        return arraySpritesNumbers;
    }
};

// Ajout de ces fonctions à l'objet Phaser
game.state.add('load', gameState.load);
game.state.add('main', gameState.main);

// Lancement du jeu
game.state.start('load');