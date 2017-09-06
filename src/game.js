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
        game.load.atlas('score-numbers-font', 'assets/img/scoreFontNumbers.png', 'assets/data/numbers.json');
        
        // Chargement des niveaux
        game.load.atlas('level-numbers-font', 'assets/img/levelFontNumbers.png', 'assets/data/numbers.json');
        game.load.image('level-title', 'assets/img/levelTitle.png');
        
        // Chargement des images de gestion du temps
        game.load.image('time-box', 'assets/img/time-box.png');
        game.load.image('time-fill', 'assets/img/time-fill.png');
        
        // Chargement des effet audio
        // coup de canne
        game.load.audio('hit-sound', ['assets/audio/cut.ogg']);
        // Musique
        game.load.audio('background-music', ['assets/audio/adventure-meme.mp3']);
        // Mort
        game.load.audio('death-sound', ['assets/audio/death.ogg'])
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
        this.score = 0;
        // On crée le sprite du score
        let scoreSprite = game.add.sprite(game.width / 2, 440, 'score-numbers-font');
        // On affiche le score à 0 en ajoutant le JSON "number" aux animations de spriteScoreNumber
        scoreSprite.animations.add('numbers-animation');
        scoreSprite.animations.frame = this.score;
        // On centre le score
        scoreSprite.x -= scoreSprite.width / 2;
        this.scoreSprite = [];
        this.scoreSprite.push(scoreSprite);
        
        // Niveaux
        // Premier niveau
        this.level = 1;
        let levelPositionY = 290;
        // Sprite du niveau
        this.titleLevel = game.add.sprite(0, levelPositionY, 'level-title');
        this.titleLevel.alpha = 0;
        // Le sprite du numero du niveau
        let numberLevel = game.add.sprite(0, levelPositionY, 'level-numbers-font');
        numberLevel.alpha = 0;
        // On change l'animation du sprite pour choisir le sprite du niveau actuel
        numberLevel.animations.add('numbers-animation');
        numberLevel.animations.frame = this.level;
        this.numbersLevel = [];
        this.numbersLevel.push(numberLevel);
        
        // Barre du temps
        // Box
        this.timeBox   = game.add.sprite(0, 100, 'time-box');
        this.timeBox.x = game.width / 2 - this.timeBox.width / 2;
        // Filling
        this.timeFill   = game.add.sprite(0, 130, 'time-fill');
        this.timeFill.x = game.width / 2 - this.timeFill.width / 2;
        
        this.timeFillWidth = (this.timeFill.width / 3) * 2;
        this.timeFillFullWidth = this.timeFill.width;
        
        let rect = new Phaser.Rectangle(0, 0, this.timeFillWidth, this.timeFill.height);
        this.timeFill.crop(rect);
        this.timeFill.updateCrop();
        
        // Audio
        this.hitSound = game.add.audio('hit-sound', 0.5);
        this.backgroundMusic = game.add.audio('background-music', 0.3, true);
        this.deathSound = game.add.audio('death-sound', 0.5);
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
        
        // Si la partie a débuté,
        if(GAME_START){
            // Mise a jour de la barre de temps
            if(this.timeFillWidth > 0){
                // On diminue la barre de temps en fonction du niveau
                this.timeFillWidth -= (0.6 + 0.1 * this.level);
                let rect = new Phaser.Rectangle(0, 0, this.timeFillWidth, this.timeFill.height);
                this.timeFill.crop(rect);
                this.timeFill.updateCrop();
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
                // Activation de la musique de fond
                this.backgroundMusic.play();
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
        // On active le son de la hache
        this.hitSound.play();
        
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
        this.score++;
        
        // Le niveau augmente tous les 10 points
        if(this.score % 10 === 0){
            this.increaseLevel();
        }
        
        // On kill chaque sprite qui compose le score
        for(let j = 0; j < this.scoreSprite.length; j++){
            this.scoreSprite[j].kill();
        }
        this.scoreSprite = [];
        
        this.scoreSprite = this.buildNumbersSprites(this.score, 'score-numbers-font', 440, 1);
        
        // On ajoute du temps
        if(this.timeFillWidth + 12 * 2 < this.timeFillFullWidth) {
            this.timeFillWidth += 12 * 2;
        } else {
            this.timeFillWidth = this.timeFillFullWidth;
        }
    },
    
    increaseLevel: function () {
        // On incremente le niveau
        this.level++;
    
        // On tue chaque sprite des chiffres du niveau
        for (let j = 0; j < this.numbersLevel.length; j++) {
            this.numbersLevel[j].kill();
        }
    
        this.numbersLevel = [];
    
        // On crée les sprites du niveau actuel
        this.numbersLevel = this.buildNumbersSprites(this.level, 'level-numbers-font', this.titleLevel.y, 0);
    
        // Position du numero du niveau
        this.titleLevel.x = 0;
        for (let i = 0; i < this.numbersLevel.length; i++) {
            if(i === 0) {
                this.numbersLevel[i].x = this.titleLevel.width + 20;
            } else {
                this.numbersLevel[i].x = this.titleLevel.width + 20 + this.numbersLevel[i - 1].width;
            }
        }
    
        // Pour centrer le tout, on l'ajoute à un groupe
        let levelGroup = game.add.group();
        levelGroup.add(this.titleLevel);
        for(let i = 0; i < this.numbersLevel.length; i++){
            levelGroup.add(this.numbersLevel[i]);
        }
        levelGroup.x = game.width / 2 - levelGroup.width / 2;
        
        // On affiche le sprite level et le numero du niveau
        for(let i = 0; i < this.numbersLevel.length; i++){
            game.add.tween(this.numbersLevel[i]).to({alpha: 1}, 300, Phaser.Easing.Linear.None, true);
        }
        game.add.tween(this.titleLevel).to({alpha: 1}, 300, Phaser.Easing.Linear.None, true);
        
        // On fait disparaitre le tout au bout de 2 secondes
        let self = this;
        setTimeout(function () {
            for(let i = 0; i < self.numbersLevel.length; i++){
                game.add.tween(self.numbersLevel[i]).to({alpha: 0}, 300, Phaser.Easing.Linear.None, true);
            }
            game.add.tween(self.titleLevel).to({alpha: 0}, 300, Phaser.Easing.Linear.None, true);
        }, 1500);
    },
    
    buildNumbersSprites: function (number, imageReference, positionY, opacity) {
        // On découpe le nombre en chiffre individuel
        let digits = number.toString().split('');
        let scoreWidth = 0;
        
        let sprites = [];
        
        // On met en forme le nombre avec les sprites
        for(let i = 0; i < digits.length; i++){
            let whitespace = 0;
            if(i > 0){
                whitespace = 5;
            }
            
            let sprite = game.add.sprite(scoreWidth + whitespace, positionY, imageReference);
            sprite.alpha = opacity;
            
            // On ajoute le JSON des nombres dans l'animation de "spriteNumber"
            sprite.animations.add('numbers-animation');
            // On selectionne la frame n° "digits[i]" dans le JSON
            sprite.animations.frame = +digits[i];
            sprites.push(sprite);
            // On calcul la width totale du sprite du score
            scoreWidth += sprite.width + whitespace;
        }
        
        // On ajoute les sprites du score dans le groupe group afin de centrer le tout
        let group = game.add.group();
        for(let i = 0; i < sprites.length; i++){
            group.add(sprites[i]);
        }
        // On centre horizontalement
        group.x = game.width / 2 - group.width / 2;
        
        return sprites;
    }
};

// Ajout de ces fonctions à l'objet Phaser
game.state.add('load', gameState.load);
game.state.add('main', gameState.main);

// Lancement du jeu
game.state.start('load');